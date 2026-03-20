#!/usr/bin/env python3
"""
Resize and Convert Script
Resizes a GLB model to specific dimensions and generates a USDZ version.
"""

import os
import sys
import argparse
import subprocess
import tempfile
import shutil
import json
import numpy as np

# Try to import trimesh
try:
    import trimesh
except ImportError:
    print("Error: 'trimesh' is required. Please install it: pip install trimesh")
    sys.exit(1)

BLENDER_PATH = "/Applications/Blender.app/Contents/MacOS/Blender"

# Minimum bounding box dimension (meters) to consider a model valid
MIN_DIMENSION_M = 1e-6
# Scale factor bounds — anything outside this range suggests a unit mismatch
MAX_SCALE_FACTOR = 500.0
MIN_SCALE_FACTOR = 0.002


def get_model_bounds(mesh):
    """Get the actual dimensions of the model"""
    bounds = mesh.bounds
    dimensions = bounds[1] - bounds[0]
    return dimensions


def resize_glb(input_path, target_dims_cm, output_path):
    """
    Resize GLB to target dimensions (width, height, depth in cm).

    Uses axis-aware scaling: the model's bounding-box axes are matched to the
    target dimensions by size (largest-to-largest, smallest-to-smallest) so that
    AI-generated models with unpredictable orientation are handled correctly.
    """
    print(f"Loading GLB: {input_path}")

    # Load as scene to preserve materials, textures, and multi-object structure.
    # Do NOT use force='mesh' — it merges sub-meshes and can destroy materials.
    scene = trimesh.load(input_path)

    # Normalise to Scene so all downstream code has one path
    if not isinstance(scene, trimesh.Scene):
        scene = trimesh.Scene(geometry={'mesh': scene})

    bounds = scene.bounds
    if bounds is None:
        raise ValueError("Model has no geometry (bounds is None)")

    current_dims = bounds[1] - bounds[0]
    print(f"Current dimensions (model units): {current_dims}")

    # --- Degenerate model check ---
    for i, dim in enumerate(current_dims):
        if dim < MIN_DIMENSION_M:
            raise ValueError(
                f"Model has near-zero extent on axis {i} ({dim:.2e}). "
                "The generated 3D model is degenerate and cannot be resized."
            )

    # --- Convert target from cm to meters (glTF standard unit) ---
    target = np.array([
        target_dims_cm[0] / 100.0,
        target_dims_cm[1] / 100.0,
        target_dims_cm[2] / 100.0,
    ])

    # --- Axis-aware scaling ---
    # Sort both current and target dims, map largest-to-largest, etc.
    current_sorted_indices = np.argsort(current_dims)
    target_sorted_indices = np.argsort(target)

    scale_factors = np.ones(3)
    for rank in range(3):
        model_axis = current_sorted_indices[rank]
        target_axis = target_sorted_indices[rank]
        scale_factors[model_axis] = target[target_axis] / current_dims[model_axis]

    print(f"Target dimensions (m): {target}")
    print(f"Scale factors: {scale_factors}")

    # --- Scale factor sanity check ---
    for i, sf in enumerate(scale_factors):
        if sf > MAX_SCALE_FACTOR or sf < MIN_SCALE_FACTOR:
            print(
                f"WARNING: Scale factor on axis {i} is {sf:.4f} "
                f"(allowed range {MIN_SCALE_FACTOR}–{MAX_SCALE_FACTOR}). "
                "This may indicate a unit mismatch in the generated model."
            )

    # --- Apply transform ---
    matrix = np.eye(4)
    matrix[0, 0] = scale_factors[0]
    matrix[1, 1] = scale_factors[1]
    matrix[2, 2] = scale_factors[2]

    scene.apply_transform(matrix)

    # --- Post-resize validation ---
    new_bounds = scene.bounds
    if new_bounds is None:
        raise ValueError("Model has no geometry after transform")
    new_dims = new_bounds[1] - new_bounds[0]
    print(f"Final dimensions (m): {new_dims}")
    print(f"Final dimensions (cm): {new_dims * 100}")

    # Verify the output dimensions match the target within 1% tolerance
    sorted_new = np.sort(new_dims)
    sorted_target = np.sort(target)
    for i in range(3):
        if sorted_target[i] > 0:
            error_pct = abs(sorted_new[i] - sorted_target[i]) / sorted_target[i] * 100
            if error_pct > 1.0:
                print(
                    f"WARNING: Dimension mismatch after resize — "
                    f"expected {sorted_target[i]:.4f} m, got {sorted_new[i]:.4f} m "
                    f"({error_pct:.1f}% error)"
                )

    # --- Export ---
    scene.export(output_path)

    # Final output file check
    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise IOError(f"Resize failed: output file missing or empty at {output_path}")

    print(f"Saved resized GLB to: {output_path}")


def convert_glb_to_usdz_blender(glb_path, usdz_path):
    """
    Convert GLB to USDZ using Blender headless.
    """
    print("Converting to USDZ using Blender...")

    if not os.path.exists(BLENDER_PATH):
        print(f"Error: Blender not found at {BLENDER_PATH}")
        return False

    # Use json.dumps to safely escape file paths
    safe_glb = json.dumps(os.path.abspath(glb_path))
    safe_usdz = json.dumps(os.path.abspath(usdz_path))

    blender_script_content = f"""
import bpy
import sys

def convert():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    glb_in = {safe_glb}
    usdz_out = {safe_usdz}

    print(f"Importing: {{glb_in}}")
    try:
        bpy.ops.import_scene.gltf(filepath=glb_in)
    except Exception as e:
        print(f"Import error: {{e}}")
        sys.exit(1)

    print(f"Exporting: {{usdz_out}}")
    try:
        bpy.ops.wm.usd_export(filepath=usdz_out)
    except Exception as e:
        print(f"Export error: {{e}}")
        sys.exit(1)

if __name__ == "__main__":
    convert()
"""

    script_path = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(blender_script_content)
            script_path = f.name

        cmd = [BLENDER_PATH, "--background", "--python", script_path]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print("Blender Error:")
            print(result.stderr)
            print(result.stdout)
            return False
    finally:
        if script_path and os.path.exists(script_path):
            os.remove(script_path)

    # Check if output file exists
    if os.path.exists(usdz_path):
        print(f"USDZ created at: {usdz_path}")
        return True
    else:
        # Check for .usdc
        usdc_path = usdz_path.replace('.usdz', '.usdc')
        if os.path.exists(usdc_path):
             print(f"Blender exported .usdc instead. Renaming/Zipping might be needed.")
             return False
        print("Error: Output file not found after Blender run.")
        return False


def main():
    parser = argparse.ArgumentParser(description="Resize GLB and convert to USDZ")
    parser.add_argument("input_glb", help="Path to input GLB file")
    parser.add_argument("dimensions", help="Target dimensions in cm: width,height,depth (e.g. 152,144,30)")

    args = parser.parse_args()

    # Parse dimensions
    try:
        dims = [float(x) for x in args.dimensions.split(',')]
        if len(dims) != 3:
            raise ValueError("Need exactly 3 dimensions")
    except Exception:
        print("Error: Dimensions must be comma-separated numbers: width,height,depth")
        sys.exit(1)

    input_path = args.input_glb
    if not os.path.exists(input_path):
        print(f"Error: File {input_path} not found")
        sys.exit(1)

    # Create output directory
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    output_dir = os.path.join(os.path.dirname(os.path.abspath(input_path)), f"{base_name}_resized")

    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    print(f"Output directory: {output_dir}")

    # 1. Resize
    resized_glb_name = f"{base_name}_resized.glb"
    resized_glb_path = os.path.join(output_dir, resized_glb_name)

    resize_glb(input_path, dims, resized_glb_path)

    # 2. Convert to USDZ
    usdz_name = f"{base_name}_resized.usdz"
    usdz_path = os.path.join(output_dir, usdz_name)

    success = convert_glb_to_usdz_blender(resized_glb_path, usdz_path)

    if success:
        print("\nSuccess! Files created:")
        print(f"- {resized_glb_path}")
        print(f"- {usdz_path}")
    else:
        print("\nWarning: USDZ conversion failed. Only GLB is available.")

if __name__ == "__main__":
    main()
