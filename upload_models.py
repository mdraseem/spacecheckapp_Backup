import os
import requests
import sys

# --- CONFIGURATION ---
# usage: python3 upload_models.py <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>

if len(sys.argv) < 3:
    print("Usage: python3 upload_models.py <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>")
    print("NOTE: Use the SERVICE_ROLE_KEY (secret) to bypass Row Level Security for uploads, ")
    print("      or ensure your 'models' bucket has an 'INSERT' policy for public users.")
    sys.exit(1)

SUPABASE_URL = sys.argv[1]
SUPABASE_KEY = sys.argv[2]
BUCKET_NAME = "models"
ASSETS_DIR = "assets"

def upload_file(filename):
    file_path = os.path.join(ASSETS_DIR, filename)
    
    # Read file binary
    with open(file_path, 'rb') as f:
        file_data = f.read()

    # Determine content type
    content_type = "model/gltf-binary" if filename.endswith(".glb") else "application/octet-stream"

    # Supabase Storage API Endpoint
    # POST /storage/v1/object/{bucket}/{path}
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true" # Overwrite if exists
    }

    print(f"Uploading {filename}...")
    response = requests.post(url, data=file_data, headers=headers)

    if response.status_code == 200:
        print(f"✅ Success: {filename}")
    else:
        print(f"❌ Failed: {filename}")
        print(response.text)

def main():
    if not os.path.exists(ASSETS_DIR):
        print(f"Error: Directory '{ASSETS_DIR}' not found.")
        return

    files = [f for f in os.listdir(ASSETS_DIR) if f.lower().endswith('.glb')]
    
    if not files:
        print("No .glb files found in assets/ directory.")
        return

    print(f"Found {len(files)} models. Starting upload to bucket '{BUCKET_NAME}'...")
    
    for file in files:
        upload_file(file)

    print("\nDone! Don't forget to update your viewer.html with your Project ID.")

if __name__ == "__main__":
    main()
