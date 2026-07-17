import os
import shutil
from PIL import Image

brain_dir = "/Users/makaelaharrell/.gemini/antigravity-ide/brain/f7c1bd93-b792-4038-90d7-5a55cdad8761"
output_dir = "/Users/makaelaharrell/frog-self-care/app/public/assets/fishing"
os.makedirs(output_dir, exist_ok=True)

bg_file = "media__1784251141397.jpg"
fish_file = "media__1784251141392.jpg"
rod_file = "media__1784251141383.jpg"

# 1. Background
shutil.copy(os.path.join(brain_dir, bg_file), os.path.join(output_dir, "pond_bg.jpg"))
print("Saved pond_bg.jpg")

def remove_bg(img, bg_color_threshold=230):
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size
    to_visit = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    visited = set()
    while to_visit:
        x, y = to_visit.pop()
        if (x, y) in visited: continue
        visited.add((x, y))
        if x < 0 or x >= width or y < 0 or y >= height: continue
        r, g, b, a = pixels[x, y]
        if r > bg_color_threshold and g > bg_color_threshold and b > bg_color_threshold:
            pixels[x, y] = (255, 255, 255, 0)
            to_visit.extend([(x+1, y), (x-1, y), (x, y+1), (x, y-1)])
    return img

# 2. Rod
rod = Image.open(os.path.join(brain_dir, rod_file))
rod = remove_bg(rod)
rod.save(os.path.join(output_dir, "rod.png"))
print("Saved rod.png")

# 3. Fish
fish_grid = Image.open(os.path.join(brain_dir, fish_file))
cell_w = fish_grid.width // 4
cell_h = fish_grid.height // 4

def extract_fish(row, col, name):
    left = col * cell_w
    top = row * cell_h
    right = left + cell_w
    bottom = top + cell_h
    fish = fish_grid.crop((left, top, right, bottom))
    fish = remove_bg(fish, 230)
    fish.save(os.path.join(output_dir, f"{name}.png"))
    print(f"Saved {name}.png")

# Let's just grab 3 distinct fish
extract_fish(0, 0, "fish_common") # top left
extract_fish(1, 1, "fish_rare")   # middle
extract_fish(2, 3, "fish_epic")   # third row, right side
