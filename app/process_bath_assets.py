import os
from PIL import Image

output_dir = "/Users/makaelaharrell/frog-self-care/app/public/assets"
assets = ["shampoo", "showerhead"]

def is_bg(r, g, b):
    # threshold for "white"
    return r > 200 and g > 200 and b > 200

for asset in assets:
    img_path = os.path.join(output_dir, f"{asset}.jpg")
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    # Flood fill from corners
    to_visit = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    visited = set()

    while to_visit:
        x, y = to_visit.pop()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        
        if x < 0 or x >= width or y < 0 or y >= height:
            continue
            
        r, g, b, a = pixels[x, y]
        if is_bg(r, g, b):
            pixels[x, y] = (255, 255, 255, 0)
            to_visit.extend([(x+1, y), (x-1, y), (x, y+1), (x, y-1)])

    save_path = os.path.join(output_dir, f"{asset}_transparent.png")
    img.save(save_path)
    print(f"Saved {asset}_transparent.png")
