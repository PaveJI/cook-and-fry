"""Generate simple Cook and Fry PWA icons from vector shapes."""
import os
from PIL import Image, ImageDraw

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
OUT_DIR = os.path.join(BASE_DIR, "frontend", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

SIZE = 512
PADDING = 40

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Gradient-like background using vertical stripes blended together
for y in range(SIZE):
    ratio = y / SIZE
    r = int(37 + (139 - 37) * ratio)
    g = int(99 + (92 - 99) * ratio)
    b = int(235 + (246 - 235) * ratio)
    draw.line([(0, y), (SIZE, y)], fill=(r, g, b, 255))

# Rounded mask for the icon background
mask = Image.new("L", (SIZE, SIZE), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle((0, 0, SIZE, SIZE), radius=112, fill=255)
img.putalpha(mask)

# White plate
cx, cy = SIZE // 2, SIZE // 2
plate_radius = 170
draw.ellipse((cx - plate_radius, cy - plate_radius, cx + plate_radius, cy + plate_radius), fill=(255, 255, 255, 255))

# Inner plate shadow
draw.ellipse((cx - plate_radius + 12, cy - plate_radius + 12, cx + plate_radius - 12, cy + plate_radius - 12), fill=(248, 250, 252, 255))

# Food items
draw.ellipse((cx - 70, cy - 50, cx + 10, cy + 30), fill=(217, 119, 6, 255))  # meat
# grill marks
draw.line([(cx - 55, cy - 35), (cx - 5, cy - 25)], fill=(120, 53, 15, 120), width=4)
draw.line([(cx - 60, cy - 10), (cx + 0, cy),], fill=(120, 53, 15, 120), width=4)

draw.ellipse((cx + 30, cy - 80, cx + 90, cy - 20), fill=(34, 211, 153, 255))  # greens
draw.ellipse((cx - 90, cy + 40, cx - 30, cy + 100), fill=(239, 68, 68, 255))  # tomato
draw.ellipse((cx + 40, cy + 50, cx + 100, cy + 110), fill=(250, 204, 21, 255))  # lemon

# Steam lines
draw.arc((cx - 80, cy - 180, cx - 40, cy - 120), start=200, end=340, fill=(255, 255, 255, 160), width=6)
draw.arc((cx - 20, cy - 190, cx + 20, cy - 130), start=200, end=340, fill=(255, 255, 255, 160), width=6)
draw.arc((cx + 40, cy - 180, cx + 80, cy - 120), start=200, end=340, fill=(255, 255, 255, 160), width=6)

# Save 512
img_512 = img.copy()
img_512.save(os.path.join(OUT_DIR, "icon-512x512.png"))

# 192
img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
img_192.save(os.path.join(OUT_DIR, "icon-192x192.png"))

# Apple touch icon 180 (no transparency, solid background)
bg = Image.new("RGB", (180, 180), (255, 255, 255))
icon_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
bg.paste(icon_180, (0, 0), icon_180)
bg.save(os.path.join(OUT_DIR, "apple-touch-icon.png"))

print("Icons generated in", OUT_DIR)
