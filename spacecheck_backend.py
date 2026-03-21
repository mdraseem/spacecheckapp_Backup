import modal
import os
import sys
import tempfile
import time
import subprocess
import numpy as np

# Image: Standard CPU image with Blender
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "libgl1-mesa-glx", 
        "libglib2.0-0", 
        "libx11-6", 
        "libxxf86vm1", 
        "libxi6", 
        "libxrender1", 
        "libxkbcommon0", 
        "libsm6", 
        "libice6",
        "wget", 
        "xz-utils",
        "git"
    )
    .run_commands(
        "wget https://download.blender.org/release/Blender3.6/blender-3.6.5-linux-x64.tar.xz",
        "tar -xvf blender-3.6.5-linux-x64.tar.xz",
        "mv blender-3.6.5-linux-x64 /usr/local/blender",
        "rm blender-3.6.5-linux-x64.tar.xz"
    )
    .pip_install(
        "trimesh", 
        "numpy", 
        "supabase", 
        "requests", 
        "Pillow", 
        "fastapi",
        "replicate" 
    )
)

app = modal.App("spacecheck-backend", image=image)

BLENDER_PATH = "/usr/local/blender/blender"

# --- Helper Functions (Resize & Convert) ---

# Minimum bounding box dimension (meters) to consider a model valid
MIN_DIMENSION_M = 1e-6
# Scale factor bounds — anything outside this range suggests a unit mismatch
MAX_SCALE_FACTOR = 500.0
MIN_SCALE_FACTOR = 0.002


def resize_glb(input_path, target_dims_cm, output_path):
    """
    Resize a GLB model to target dimensions (width, height, depth in cm).

    Uses axis-aware scaling: the model's bounding-box axes are matched to the
    target dimensions by size (largest-to-largest, smallest-to-smallest) so that
    AI-generated models with unpredictable orientation are handled correctly.
    """
    import trimesh

    print(f"Loading GLB for resize: {input_path}")

    # Load as scene to preserve materials, textures, and multi-object structure.
    # Do NOT use force='mesh' — it merges sub-meshes and can destroy materials.
    scene = trimesh.load(input_path)

    # Normalise to Scene so all downstream code has one path
    if not isinstance(scene, trimesh.Scene):
        # Wrap a bare Trimesh in a Scene
        scene = trimesh.Scene(geometry={'mesh': scene})

    bounds = scene.bounds
    if bounds is None:
        raise ValueError("Model has no geometry (bounds is None)")

    current_dims = bounds[1] - bounds[0]  # [x, y, z] extents in model units
    print(f"Original dims (model units): {current_dims}")

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
    # AI generators produce models with unpredictable axis orientation.
    # Instead of assuming X=width, Y=height, Z=depth, we match by magnitude:
    # sort both current and target dims, map largest-to-largest, etc.
    current_sorted_indices = np.argsort(current_dims)   # ascending order
    target_sorted_indices = np.argsort(target)           # ascending order

    # Build a mapping: for each model axis, which target value should it get?
    # axis_map[model_axis_rank] = target_axis_rank
    scale_factors = np.ones(3)
    for rank in range(3):
        model_axis = current_sorted_indices[rank]
        target_axis = target_sorted_indices[rank]
        scale_factors[model_axis] = target[target_axis] / current_dims[model_axis]

    print(f"Target dims (m): {target}")
    print(f"Axis mapping (model sorted indices): {current_sorted_indices}")
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
    print(f"Final dims (m): {new_dims}")
    print(f"Final dims (cm): {new_dims * 100}")

    # Verify the output dimensions match the target within 1 % tolerance
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

def convert_to_usdz(glb_path, usdz_path):
    import json

    # Use json.dumps to safely escape file paths (handles quotes, backslashes, unicode)
    safe_glb = json.dumps(os.path.abspath(glb_path))
    safe_usdz = json.dumps(os.path.abspath(usdz_path))

    blender_script = f"""
import bpy
import sys

def convert():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    glb_in = {safe_glb}
    usdz_out = {safe_usdz}

    try:
        bpy.ops.import_scene.gltf(filepath=glb_in)
    except Exception as e:
        print(f"Import error: {{e}}")
        sys.exit(1)

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
            f.write(blender_script)
            script_path = f.name

        cmd = [BLENDER_PATH, "--background", "--python", script_path]
        result = subprocess.run(cmd, check=False, capture_output=True, text=True)

        if result.returncode != 0:
            print("Blender Error:", result.stderr)
            print("Blender Stdout:", result.stdout)
    finally:
        if script_path and os.path.exists(script_path):
            os.remove(script_path)

    return os.path.exists(usdz_path)


# --- Replicate Helper ---

# Max time to wait for Replicate prediction (seconds)
REPLICATE_POLL_TIMEOUT = 900  # 15 minutes
REPLICATE_POLL_INTERVAL = 5   # seconds between status checks
REPLICATE_MAX_RETRIES = 3     # retry on transient errors


def run_replicate_with_polling(image_url):
    """
    Create a Replicate prediction and poll until it completes.

    Uses predictions.create + manual polling instead of replicate.run()
    to avoid httpx read timeouts on long-running 3D generation jobs.
    Retries up to REPLICATE_MAX_RETRIES times on transient errors.
    """
    import replicate

    model_version = "ndreca/hunyuan3d-2.1:895e514f953d39e8b5bfb859df9313481ad3fa3a8631e5c54c7e5c9c85a6aa9f"
    model_input = {
        "seed": 1234,
        "image": image_url,
        "steps": 50,
        "num_chunks": 8000,
        "max_facenum": 20000,
        "guidance_scale": 7.5,
        "generate_texture": True,
        "octree_resolution": 256,
        "remove_background": True,
    }

    last_error = None
    for attempt in range(1, REPLICATE_MAX_RETRIES + 1):
        try:
            print(f"Creating Replicate prediction (attempt {attempt}/{REPLICATE_MAX_RETRIES})...")
            prediction = replicate.predictions.create(
                model=model_version,
                input=model_input,
            )
            print(f"Prediction created: {prediction.id} (status: {prediction.status})")

            # Poll until terminal state
            elapsed = 0
            while prediction.status not in ("succeeded", "failed", "canceled"):
                if elapsed >= REPLICATE_POLL_TIMEOUT:
                    # Cancel the prediction so it doesn't run forever
                    try:
                        prediction.cancel()
                    except Exception:
                        pass
                    raise TimeoutError(
                        f"Replicate prediction {prediction.id} did not complete "
                        f"within {REPLICATE_POLL_TIMEOUT}s (last status: {prediction.status})"
                    )

                time.sleep(REPLICATE_POLL_INTERVAL)
                elapsed += REPLICATE_POLL_INTERVAL
                prediction.reload()

                if elapsed % 30 == 0:
                    print(f"  Still waiting... {elapsed}s elapsed (status: {prediction.status})")

            if prediction.status == "failed":
                error_msg = getattr(prediction, "error", None) or "Unknown prediction error"
                raise Exception(f"Replicate prediction failed: {error_msg}")

            if prediction.status == "canceled":
                raise Exception("Replicate prediction was canceled")

            print(f"Prediction succeeded after ~{elapsed}s")
            return prediction.output

        except TimeoutError:
            raise  # don't retry timeouts — the job is still running on Replicate
        except Exception as e:
            last_error = e
            error_str = str(e)
            # Retry on transient network errors
            is_transient = any(keyword in error_str.lower() for keyword in [
                "timed out", "read timeout", "connection", "502", "503", "429"
            ])
            if is_transient and attempt < REPLICATE_MAX_RETRIES:
                wait_time = attempt * 10
                print(f"Transient error: {e}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            raise

    raise last_error


def extract_glb_url(output):
    """Extract GLB URL from various Replicate output formats."""
    if isinstance(output, str):
        return output
    elif isinstance(output, dict):
        url = output.get("glb") or output.get("model") or output.get("mesh")
        if url:
            # Handle FileOutput objects inside dicts
            return str(url)
        return None
    elif isinstance(output, list):
        return str(output[0]) if output else None
    else:
        # Handle FileOutput or other objects with a url attribute
        if hasattr(output, "url"):
            return str(output.url)
        return str(output)


# --- API Worker (CPU is fine, calling external API) ---

@app.function(timeout=1800, secrets=[modal.Secret.from_name("spacecheck-secrets")])
def process_generation(item: dict):
    import requests
    from supabase import create_client, Client

    print(f"Processing: {item.get('generationId')}")

    image_url = item.get("imageUrl")
    dims = item.get("dimensions")
    gen_id = item.get("generationId")

    # Init Supabase
    url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    if url and not url.endswith("/"): url += "/"
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    try:
        # Update status to processing
        supabase.table("generations").update({
            "status": "processing"
        }).eq("id", gen_id).execute()

        # Generate 3D model via Replicate with polling (avoids httpx timeout)
        print(f"Generating 3D model from image: {image_url}")
        output = run_replicate_with_polling(image_url)
        print(f"Hunyuan3D-2.1 output: {output}")

        # Extract GLB URL from output
        generated_glb_url = extract_glb_url(output)

        if not generated_glb_url:
            raise Exception(f"No GLB URL in output: {output}")

        print(f"GLB URL: {generated_glb_url}")

        with tempfile.TemporaryDirectory() as temp_dir:
            # Download GLB
            print("Downloading GLB...")
            glb_resp = requests.get(generated_glb_url, timeout=300)
            glb_resp.raise_for_status()

            generated_glb_path = os.path.join(temp_dir, "generated.glb")
            with open(generated_glb_path, "wb") as f:
                f.write(glb_resp.content)
            print(f"Downloaded: {len(glb_resp.content)} bytes")

            # Resize to target dimensions
            print(f"Resizing to {dims}...")
            target_dims = (float(dims['width']), float(dims['height']), float(dims['depth']))
            resized_glb_path = os.path.join(temp_dir, "resized.glb")
            resize_glb(generated_glb_path, target_dims, resized_glb_path)

            # Convert to USDZ
            print("Converting to USDZ...")
            usdz_path = os.path.join(temp_dir, "model.usdz")
            usdz_success = convert_to_usdz(resized_glb_path, usdz_path)

            # Upload GLB
            print("Uploading...")
            glb_filename = f"{gen_id}/model.glb"
            with open(resized_glb_path, "rb") as f:
                supabase.storage.from_("uploads").upload(
                    glb_filename, f, {"content-type": "model/gltf-binary", "upsert": "true"}
                )

            glb_public_url = supabase.storage.from_("uploads").get_public_url(glb_filename)

            # Upload USDZ if successful
            usdz_public_url = None
            if usdz_success and os.path.exists(usdz_path):
                usdz_filename = f"{gen_id}/model.usdz"
                with open(usdz_path, "rb") as f:
                    supabase.storage.from_("uploads").upload(
                        usdz_filename, f, {"content-type": "model/vnd.usdz+zip", "upsert": "true"}
                    )
                usdz_public_url = supabase.storage.from_("uploads").get_public_url(usdz_filename)

            # Update to completed
            supabase.table("generations").update({
                "status": "completed",
                "glb_url": glb_public_url,
                "usdz_url": usdz_public_url or glb_public_url
            }).eq("id", gen_id).execute()

            print(f"✓ Complete: {glb_public_url}")

            # Trigger Shopify auto-sync if applicable
            try:
                site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://spacecheck.app")
                webhook_secret = os.environ.get("MODAL_WEBHOOK_SECRET", "")
                sync_headers = {"Content-Type": "application/json"}
                if webhook_secret:
                    sync_headers["x-webhook-secret"] = webhook_secret
                sync_resp = requests.post(
                    f"{site_url}/api/shopify/auto-sync",
                    json={"generationId": gen_id},
                    headers=sync_headers,
                    timeout=60
                )
                print(f"Shopify auto-sync response: {sync_resp.status_code} {sync_resp.text}")
            except Exception as sync_err:
                print(f"Shopify auto-sync callback failed (non-fatal): {sync_err}")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

        supabase.table("generations").update({
            "status": "failed"
        }).eq("id", gen_id).execute()


@app.function()
@modal.fastapi_endpoint(method="POST")
def generate(item: dict):
    print(f"Queuing job: {item}")
    process_generation.spawn(item)
    return {"status": "queued"}
