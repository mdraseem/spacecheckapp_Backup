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

def resize_glb(input_path, target_dims_cm, output_path):
    import trimesh
    print(f"Loading GLB for resize: {input_path}")
    try:
        scene = trimesh.load(input_path, force='mesh')
    except Exception as e:
        scene = trimesh.load(input_path)
    
    if isinstance(scene, trimesh.Scene):
        bounds = scene.bounds
        current_dims = bounds[1] - bounds[0]
    else:
        mesh = scene
        bounds = mesh.bounds
        current_dims = bounds[1] - bounds[0]

    print(f"Original Dims: {current_dims}")
    
    # Target in meters
    target_w_m = target_dims_cm[0] / 100.0
    target_h_m = target_dims_cm[1] / 100.0
    target_d_m = target_dims_cm[2] / 100.0
    
    # Handle zero dimension edge cases
    cur_x = current_dims[0] if current_dims[0] > 0 else 1.0
    cur_y = current_dims[1] if current_dims[1] > 0 else 1.0
    cur_z = current_dims[2] if current_dims[2] > 0 else 1.0

    scale_x = target_w_m / cur_x
    scale_y = target_h_m / cur_y
    scale_z = target_d_m / cur_z

    print(f"Scaling to: {target_w_m:.2f}, {target_h_m:.2f}, {target_d_m:.2f}")

    matrix = np.eye(4)
    matrix[0,0] = scale_x
    matrix[1,1] = scale_y
    matrix[2,2] = scale_z
    
    if isinstance(scene, trimesh.Scene):
        scene.apply_transform(matrix)
        scene.export(output_path)
    else:
        mesh.apply_transform(matrix)
        mesh.export(output_path)

def convert_to_usdz(glb_path, usdz_path):
    blender_script = f"""
import bpy
import sys
import os

def convert():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    glb_in = "{os.path.abspath(glb_path)}"
    usdz_out = "{os.path.abspath(usdz_path)}"
    
    try:
        bpy.ops.import_scene.gltf(filepath=glb_in)
    except Exception as e:
        sys.exit(1)
        
    try:
        bpy.ops.wm.usd_export(filepath=usdz_out)
    except Exception as e:
        sys.exit(1)

if __name__ == "__main__":
    convert()
"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(blender_script)
        script_path = f.name
        
    cmd = [BLENDER_PATH, "--background", "--python", script_path]
    result = subprocess.run(cmd, check=False, capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Blender Error:", result.stderr)
        print("Blender Stdout:", result.stdout)
    
    if os.path.exists(script_path):
        os.remove(script_path)
    
    return os.path.exists(usdz_path)


# --- API Worker (CPU is fine, calling external API) ---

@app.function(timeout=1800, secrets=[modal.Secret.from_name("spacecheck-secrets")])
def process_generation(item: dict):
    import requests
    from supabase import create_client, Client
    import replicate

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

        # Generate 3D model using the working Hunyuan3D-2.1 version with user-provided parameters
        print(f"Generating 3D model from image: {image_url}")

        output = replicate.run(
            "ndreca/hunyuan3d-2.1:895e514f953d39e8b5bfb859df9313481ad3fa3a8631e5c54c7e5c9c85a6aa9f",
            input={
                "seed": 1234,
                "image": image_url,
                "steps": 50,
                "num_chunks": 8000,
                "max_facenum": 20000,
                "guidance_scale": 7.5,
                "generate_texture": True,
                "octree_resolution": 256,
                "remove_background": True
            }
        )

        print(f"Hunyuan3D-2.1 output: {output}")

        # Extract GLB URL from output
        if isinstance(output, str):
            generated_glb_url = output
        elif isinstance(output, dict):
            generated_glb_url = output.get('glb') or output.get('model') or output.get('mesh')
        elif isinstance(output, list):
            generated_glb_url = output[0]
        else:
            raise Exception(f"Unexpected output format: {output}")

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
