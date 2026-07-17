import os
from PIL import Image

output_dir = "/Users/makaelaharrell/frog-self-care/app/public/assets"
img_path = os.path.join(output_dir, "frog_base.png")

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
img.save(os.path.join(output_dir, "frog_base_transparent.png"))
print("Saved frog_base_transparent.png")
