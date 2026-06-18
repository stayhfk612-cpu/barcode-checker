from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('/home/claude/pwa-barcode/icons', exist_ok=True)

def make_icon(size):
    img = Image.new('RGB', (size, size), '#0a0a0f')
    draw = ImageDraw.Draw(img)
    
    # Background circle
    margin = size * 0.08
    draw.ellipse([margin, margin, size-margin, size-margin], fill='#1a1a2e')
    
    # Barcode lines (decorative)
    bar_y1 = size * 0.28
    bar_y2 = size * 0.58
    bars = [0.22, 0.26, 0.30, 0.35, 0.38, 0.42, 0.46, 0.50, 0.54, 0.58, 0.62, 0.66, 0.70, 0.74, 0.78]
    widths = [2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 1, 3, 1, 2, 1]
    
    for i, (x_frac, w) in enumerate(zip(bars, widths)):
        x = size * x_frac
        bar_w = max(1, size * 0.01 * w)
        draw.rectangle([x, bar_y1, x + bar_w, bar_y2], fill='#00d4ff')
    
    # Check mark
    cx, cy = size * 0.5, size * 0.72
    r = size * 0.10
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill='#00ff88')
    
    # Check symbol
    stroke = max(2, size//48)
    pts = [
        (cx - r*0.5, cy),
        (cx - r*0.1, cy + r*0.45),
        (cx + r*0.55, cy - r*0.45)
    ]
    for i in range(len(pts)-1):
        draw.line([pts[i], pts[i+1]], fill='#0a0a0f', width=stroke)
    
    return img

for sz in [192, 512]:
    img = make_icon(sz)
    img.save(f'/home/claude/pwa-barcode/icons/icon-{sz}.png')
    print(f'Generated icon-{sz}.png')
