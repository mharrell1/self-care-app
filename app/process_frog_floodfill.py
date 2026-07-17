import os
from PIL import Image

output_dir = "/Users/makaelaharrell/frog-self-care/app/public/assets"
img_path = os.path.join(output_dir, "frog_naked_white_bg.jpeg")

img = Image.open(img_path).convert("RGBA")
pixels = img.load()
width, height = img.size

# Tolerance for "white"
def is_bg(r, g, b):
    return r > 220 and g > 220 and b > 220

# Flood fill from the four corners
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
        pixels[x, y] = (255, 255, 255, 0) # Make transparent
        # Add neighbors
        to_visit.extend([(x+1, y), (x-1, y), (x, y+1), (x, y-1)])

img.save(os.path.join(output_dir, "frog_naked_transparent.png"))
print("Saved frog_naked_transparent.png")
