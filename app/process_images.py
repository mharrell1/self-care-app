import os
from PIL import Image

brain_dir = "/Users/makaelaharrell/.gemini/antigravity-ide/brain/f7c1bd93-b792-4038-90d7-5a55cdad8761"
output_dir = "/Users/makaelaharrell/frog-self-care/app/public/assets/cooking"

images = [
    ("1784248712579.jpg", "cutting_board.png"),
    ("1784248716635.jpg", "carrots_all.png"),
    ("1784248721530.jpg", "bowl.png"),
    ("1784248726792.jpg", "unknown_1.png"), # maybe knife?
    ("1784248733225.jpg", "spatula.png"),
    ("1784248758548.png", "frying_pan.png"),
    ("1784248758550.png", "knife.png"),
    ("1784248758558.jpg", "whisk.png"),
    ("1784248758576.png", "bg_stove.png"),
    ("1784248758589.png", "bg_counter.png"),
]

def remove_white(img):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        # change all white (also shades of whites)
        # to transparent
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

for f, out in images:
    path = os.path.join(brain_dir, f"media__{f}")
    if os.path.exists(path):
        try:
            img = Image.open(path)
            if not out.startswith("bg_"):
                img = remove_white(img)
            img.save(os.path.join(output_dir, out))
            print(f"Processed {out}")
        except Exception as e:
            print(f"Failed {out}: {e}")
