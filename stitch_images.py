#!/usr/bin/env python3
"""
Stitch Images Script
Stitches all images in a directory horizontally with a specified margin.
"""

import os
import argparse
from PIL import Image

def stitch_images(input_dir, output_path, margin, background_color=(255, 255, 255, 0)):
    """
    Stitches images horizontally.
    
    Args:
        input_dir (str): Path to directory containing images.
        output_path (str): Path to save the stitched image.
        margin (int): Margin in pixels between images.
        background_color (tuple): RGBA tuple for background (default transparent white).
    """
    
    # Supported extensions
    valid_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'}
    
    # Get list of images
    try:
        files = [f for f in os.listdir(input_dir) if os.path.splitext(f.lower())[1] in valid_extensions]
        files.sort() # Sort alphabetically to ensure deterministic order
    except FileNotFoundError:
        print(f"Error: Directory '{input_dir}' not found.")
        return

    if not files:
        print(f"No images found in '{input_dir}'")
        return

    print(f"Found {len(files)} images. Loading...")

    images = []
    for f in files:
        try:
            img_path = os.path.join(input_dir, f)
            img = Image.open(img_path)
            images.append(img)
        except Exception as e:
            print(f"Warning: Could not load {f}: {e}")

    if not images:
        print("No valid images loaded.")
        return

    # Calculate dimensions
    # Width = sum of all widths + margins in between
    total_width = sum(img.width for img in images) + (margin * (len(images) - 1))
    
    # Height = max height of any image
    max_height = max(img.height for img in images)
    
    print(f"Creating stitched image: {total_width}x{max_height} pixels")
    
    # Create new image (RGBA for transparency support)
    # Default background is transparent if output supports it, otherwise white might be preferred depending on saving format
    # Here we default to transparent. If saved as JPG, alpha is lost (becomes black or white depending on implementation).
    new_im = Image.new('RGBA', (total_width, max_height), background_color)

    # Paste images
    current_x = 0
    for i, img in enumerate(images):
        # Calculate y_offset to center the image vertically (optional, but looks better)
        y_offset = (max_height - img.height) // 2
        
        new_im.paste(img, (current_x, y_offset))
        current_x += img.width + margin

    # Save
    try:
        # If output is JPG, convert to RGB to remove alpha channel
        if output_path.lower().endswith(('.jpg', '.jpeg')):
            new_im = new_im.convert('RGB')
            
        new_im.save(output_path)
        print(f"Successfully saved to: {output_path}")
    except Exception as e:
        print(f"Error saving image: {e}")

def main():
    parser = argparse.ArgumentParser(description="Stitch images horizontally with margins.")
    parser.add_argument("input_dir", help="Directory containing the images")
    parser.add_argument("--output", "-o", default="stitched_result.png", help="Output file path (default: stitched_result.png)")
    parser.add_argument("--margin", "-m", type=int, default=20, help="Margin between images in pixels (default: 20)")
    
    args = parser.parse_args()
    
    stitch_images(args.input_dir, args.output, args.margin)

if __name__ == "__main__":
    main()
