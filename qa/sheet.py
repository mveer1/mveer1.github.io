"""Tile screenshots into one contact sheet: python3 qa/sheet.py out.png a.png b.png ... [--cols 2] [--w 720]"""
import sys
from PIL import Image, ImageDraw
args = sys.argv[1:]
cols = 2; w = 720
if '--cols' in args: i = args.index('--cols'); cols = int(args[i+1]); del args[i:i+2]
if '--w' in args: i = args.index('--w'); w = int(args[i+1]); del args[i:i+2]
out, files = args[0], args[1:]
ims = [Image.open(f).convert('RGB') for f in files]
ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
h = max(im.height for im in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols - 1) * 6, rows * h + (rows - 1) * 6), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for k, im in enumerate(ims):
    x, y = (k % cols) * (w + 6), (k // cols) * (h + 6)
    sheet.paste(im, (x, y))
    d.rectangle([x, y, x + 150, y + 18], fill=(0, 0, 0)); d.text((x + 4, y + 3), files[k].split('/')[-1][:24], fill=(255, 255, 0))
sheet.save(out)
