import streamlit as st
import os
import tempfile
import shutil
import time
from resize_and_convert import resize_glb, convert_glb_to_usdz_blender, BLENDER_PATH

# Set page configuration
st.set_page_config(
    page_title="3D Model Resizer & Converter",
    page_icon="📦",
    layout="centered"
)

# Title and description
st.title("📦 3D Model Resizer & Converter")
st.markdown("""
Upload a `.glb` model, specify the target dimensions, and this tool will resize it and generate a `.usdz` version for AR.
""")

# Sidebar for configuration
with st.sidebar:
    st.header("Settings")
    st.info(f"Blender Path: `{BLENDER_PATH}`")
    if not os.path.exists(BLENDER_PATH):
        st.error("⚠️ Blender not found at the specified path. USDZ conversion will fail.")
    else:
        st.success("✅ Blender found.")

# File uploader
uploaded_file = st.file_uploader("Upload GLB file", type=['glb'])

if uploaded_file is not None:
    # Check if a new file is uploaded
    if "last_uploaded_file" not in st.session_state or st.session_state.last_uploaded_file != uploaded_file.name:
        st.session_state.last_uploaded_file = uploaded_file.name
        # Clear previous results
        for key in ["processed_glb", "processed_usdz", "processed_glb_name", "processed_usdz_name", "processing_done"]:
            if key in st.session_state:
                del st.session_state[key]

    # Display file info
    st.write(f"**Filename:** `{uploaded_file.name}`")
    st.write(f"**Size:** `{uploaded_file.size / 1024:.2f} KB`")

    # Dimensions input
    st.subheader("Target Dimensions (cm)")
    col1, col2, col3 = st.columns(3)
    with col1:
        width = st.number_input("Width (cm)", min_value=1.0, value=100.0, step=1.0)
    with col2:
        height = st.number_input("Height (cm)", min_value=1.0, value=100.0, step=1.0)
    with col3:
        depth = st.number_input("Depth (cm)", min_value=1.0, value=100.0, step=1.0)

    # Process button
    if st.button("Resize & Convert", type="primary"):
        # Create a temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save uploaded file
            input_path = os.path.join(temp_dir, uploaded_file.name)
            with open(input_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            
            # Define output paths
            base_name = os.path.splitext(uploaded_file.name)[0]
            resized_glb_name = f"{base_name}_resized.glb"
            usdz_name = f"{base_name}_resized.usdz"
            
            resized_glb_path = os.path.join(temp_dir, resized_glb_name)
            usdz_path = os.path.join(temp_dir, usdz_name)
            
            # Progress tracking
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            # Step 1: Resize
            status_text.text("Step 1/2: Resizing GLB model...")
            try:
                dims = [width, height, depth]
                # Redirect stdout to capture print statements (optional, simplified here)
                resize_glb(input_path, dims, resized_glb_path)
                progress_bar.progress(50)
                st.success(f"✅ Resized to {width}x{height}x{depth} cm")
            except Exception as e:
                st.error(f"❌ Error resizing model: {e}")
                st.stop()
            
            # Step 2: Convert
            status_text.text("Step 2/2: Converting to USDZ (this may take a moment)...")
            
            # Check for Blender again before attempting
            if os.path.exists(BLENDER_PATH):
                try:
                    success = convert_glb_to_usdz_blender(resized_glb_path, usdz_path)
                    if success:
                        progress_bar.progress(100)
                        status_text.text("Processing complete!")
                        st.success("✅ Converted to USDZ")
                    else:
                        st.warning("⚠️ USDZ conversion failed (check Blender output).")
                        progress_bar.progress(100)
                except Exception as e:
                    st.error(f"❌ Error converting to USDZ: {e}")
            else:
                st.warning("⚠️ Skipping USDZ conversion (Blender not found).")
                progress_bar.progress(100)

            # Save results to session state
            if os.path.exists(resized_glb_path):
                with open(resized_glb_path, "rb") as f:
                    st.session_state.processed_glb = f.read()
                    st.session_state.processed_glb_name = resized_glb_name
            
            if os.path.exists(usdz_path):
                with open(usdz_path, "rb") as f:
                    st.session_state.processed_usdz = f.read()
                    st.session_state.processed_usdz_name = usdz_name
            
            st.session_state.processing_done = True

    # Show results and download buttons (from session state)
    if st.session_state.get("processing_done"):
        st.divider()
        st.subheader("🎉 Results")
        
        col_res1, col_res2 = st.columns(2)
        
        # GLB Download
        if "processed_glb" in st.session_state:
            col_res1.download_button(
                label="Download Resized GLB",
                data=st.session_state.processed_glb,
                file_name=st.session_state.processed_glb_name,
                mime="model/gltf-binary"
            )
        
        # USDZ Download
        if "processed_usdz" in st.session_state:
            col_res2.download_button(
                label="Download USDZ",
                data=st.session_state.processed_usdz,
                file_name=st.session_state.processed_usdz_name,
                mime="model/vnd.usdz+zip"
            )
        elif not os.path.exists(BLENDER_PATH):
             col_res2.info("USDZ not generated (Blender missing)")
        else:
             col_res2.error("USDZ generation failed")
