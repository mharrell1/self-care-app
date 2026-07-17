import os
import numpy as np
from PIL import Image

brain_dir = "/Users/makaelaharrell/.gemini/antigravity-ide/brain/f7c1bd93-b792-4038-90d7-5a55cdad8761"
output_dir = "/Users/makaelaharrell/frog-self-care/app/public/assets/cooking"
img_path = os.path.join(brain_dir, "media__1784249780948.jpg")

img = Image.open(img_path).convert("RGBA")
datas = img.getdata()
new_data = []
for item in datas:
    # remove white background (it looks white in the thumbnail)
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)
img.putdata(new_data)
img.save(os.path.join(output_dir, "frog_frowning.png"))
print("Saved frog_frowning.png")
