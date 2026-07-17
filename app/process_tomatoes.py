import os
import numpy as np
from PIL import Image

brain_dir = "/Users/makaelaharrell/.gemini/antigravity-ide/brain/f7c1bd93-b792-4038-90d7-5a55cdad8761"
output_dir = "/Users/makaelaharrell/frog-self-care/app/public/assets/cooking"
img_path = os.path.join(brain_dir, "media__1784249256033.jpg")

img = Image.open(img_path).convert("RGBA")
datas = img.getdata()
new_data = []
for item in datas:
    # remove white background
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)
img.putdata(new_data)
img.save(os.path.join(output_dir, "tomatoes_all.png"))

data = np.array(img)
alpha = data[:, :, 3]

# find rows where max alpha is > 0
row_has_pixels = np.max(alpha, axis=1) > 0

strips = []
start = None
for i, val in enumerate(row_has_pixels):
    if val and start is None:
        start = i
    elif not val and start is not None:
        if i - start > 10: # minimum height
            strips.append((start, i))
        start = None
if start is not None:
    strips.append((start, len(row_has_pixels)))

print("Found horizontal strips:", strips)

for idx, (top, bottom) in enumerate(strips):
    strip_img = img.crop((0, top, img.width, bottom))
    strip_img.save(os.path.join(output_dir, f"tomato_strip_{idx}.png"))
    print(f"Saved tomato_strip_{idx}.png")
