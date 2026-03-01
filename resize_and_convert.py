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
import numpy as np

# Try to import trimesh
try:
    import trimesh
except ImportError:
    print("Error: 'trimesh' is required. Please install it: pip install trimesh")
    sys.exit(1)

BLENDER_PATH = "/Applications/Blender.app/Contents/MacOS/Blender"

def get_model_bounds(mesh):
    """Get the actual dimensions of the model"""
    bounds = mesh.bounds
    dimensions = bounds[1] - bounds[0]
    return dimensions

def resize_glb(input_path, target_dims_cm, output_path):
    """
    Resize GLB to target dimensions (in cm).
    target_dims_cm: tuple (width, height, depth)
    """
    print(f"Loading GLB: {input_path}")
    
    # Load mesh
    try:
        scene = trimesh.load(input_path, force='mesh')
    except Exception as e:
        # Fallback for scenes
        scene = trimesh.load(input_path)
    
    # Handle Scene vs Mesh
    if isinstance(scene, trimesh.Scene):
        # Get bounds of the scene
        bounds = scene.bounds
        current_dims = bounds[1] - bounds[0]
    else:
        mesh = scene
        bounds = mesh.bounds
        current_dims = bounds[1] - bounds[0]

    print(f"Current dimensions (m): {current_dims}")
    
    # Target in meters
    target_w_m = target_dims_cm[0] / 100.0
    target_h_m = target_dims_cm[1] / 100.0
    target_d_m = target_dims_cm[2] / 100.0
    
    # Calculate scale factors for each axis
    # Avoid division by zero
    scale_x = target_w_m / current_dims[0] if current_dims[0] > 0 else 1
    scale_y = target_h_m / current_dims[1] if current_dims[1] > 0 else 1
    scale_z = target_d_m / current_dims[2] if current_dims[2] > 0 else 1

    print(f"Target dimensions (m): {target_w_m:.2f}, {target_h_m:.2f}, {target_d_m:.2f}")
    print(f"Axis scale factors: X={scale_x:.4f}, Y={scale_y:.4f}, Z={scale_z:.4f}")
    print(f"Applying Non-Uniform Scale (exact dimensions)")

    # Apply non-uniform scaling to match exact dimensions
    matrix = np.eye(4)
    matrix[0,0] = scale_x
    matrix[1,1] = scale_y
    matrix[2,2] = scale_z
    
    if isinstance(scene, trimesh.Scene):
        scene.apply_transform(matrix)
        # Update bounds to show user the final result
        new_bounds = scene.bounds
        new_dims = new_bounds[1] - new_bounds[0]
        print(f"Final dimensions (cm): {new_dims * 100}")
        scene.export(output_path)
    else:
        mesh.apply_transform(matrix)
        new_bounds = mesh.bounds
        new_dims = new_bounds[1] - new_bounds[0]
        print(f"Final dimensions (cm): {new_dims * 100}")
        mesh.export(output_path)
        
    print(f"Saved resized GLB to: {output_path}")

def convert_glb_to_usdz_blender(glb_path, usdz_path):
    """
    Convert GLB to USDZ using Blender headless.
    """
    print("Converting to USDZ using Blender...")
    
    if not os.path.exists(BLENDER_PATH):
        print(f"Error: Blender not found at {BLENDER_PATH}")
        return False

    # Blender script to execute
    blender_script_content = f"""
import bpy
import sys
import os

def convert():
    # Clear existing data
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    glb_in = "{os.path.abspath(glb_path)}"
    usdz_out = "{os.path.abspath(usdz_path)}"
    
    print(f"Importing: {{glb_in}}")
    bpy.ops.import_scene.gltf(filepath=glb_in)
    
    print(f"Exporting: {{usdz_out}}")
    try:
        bpy.ops.wm.usd_export(filepath=usdz_out)
    except Exception as e:
        print(f"Error exporting USD: {{e}}")
        sys.exit(1)

if __name__ == "__main__":
    convert()
"""
    
    # Write temp script
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(blender_script_content)
        script_path = f.name
        
    # Run Blender
    cmd = [
        BLENDER_PATH,
        "--background",
        "--python", script_path
    ]
    
    # Suppress output unless error
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # Cleanup script
    if os.path.exists(script_path):
        os.remove(script_path)
    
    if result.returncode != 0:
        print("Blender Error:")
        print(result.stderr)
        print(result.stdout)
        return False
            
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
        print(result.stdout)
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
            raise ValueError
    except:
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