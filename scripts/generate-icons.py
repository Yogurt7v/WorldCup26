#!/usr/bin/env python3
"""Generate PWA icons with a modern football + '26' design."""

from PIL import Image, ImageDraw, ImageFont
import os

FONT_PATH = '/System/Library/Fonts/HelveticaNeue.ttc'
DARK = (15, 23, 42)
LIGHT = (248, 250, 252)
ACCENT = (37, 99, 235)
BALL_SHADOW = (200, 200, 200)
PENTAGON_COLOR = (30, 41, 59)


def draw_pentagon(draw, cx, cy, radius, fill):
    """Draw a regular pentagon centered at (cx, cy)."""
    import math
    points = []
    for i in range(5):
        angle = math.radians(-90 + i * 72)
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)
        points.append((x, y))
    draw.polygon(points, fill=fill)


def draw_ball(draw, cx, cy, radius):
    """Draw a soccer ball pattern."""
    outer_r = radius
    inner_r = radius * 0.42

    # outer circle
    draw.ellipse(
        [cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r],
        fill=LIGHT
    )

    # central pentagon
    draw_pentagon(draw, cx, cy, inner_r, PENTAGON_COLOR)

    # lines from pentagon vertices to edge
    import math
    for i in range(5):
        angle = math.radians(-90 + i * 72)
        ex = cx + outer_r * math.cos(angle)
        ey = cy + outer_r * math.sin(angle)
        vx = cx + inner_r * math.cos(angle)
        vy = cy + inner_r * math.sin(angle)
        draw.line([(vx, vy), (ex, ey)], fill=PENTAGON_COLOR, width=max(2, outer_r // 25))

    # outer ring stroke
    draw.ellipse(
        [cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r],
        outline=PENTAGON_COLOR, width=max(2, outer_r // 20)
    )


def make_icon(size):
    """Create a 192/512 icon with football + '26'."""
    img = Image.new('RGBA', (size, size), DARK)
    draw = ImageDraw.Draw(img)

    cx = cy = size // 2
    ball_radius = int(size * 0.38)
    font_size = int(size * 0.42)

    # subtle background radial gradient effect
    for y in range(size):
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            if dist < size * 0.45:
                factor = dist / (size * 0.45)
                r = int(DARK[0] + (ACCENT[0] - DARK[0]) * (1 - factor) * 0.15)
                g = int(DARK[1] + (ACCENT[1] - DARK[1]) * (1 - factor) * 0.15)
                b = int(DARK[2] + (ACCENT[2] - DARK[2]) * (1 - factor) * 0.15)
                img.putpixel((x, y), (r, g, b, 255))

    # draw the soccer ball
    draw_ball(draw, cx, cy, ball_radius)

    # "26" text overlay
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "26"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1]

    # text shadow
    shadow_offset = max(2, size // 64)
    draw.text((tx + shadow_offset, ty + shadow_offset), text,
              font=font, fill=(0, 0, 0, 100))
    # main text
    draw.text((tx, ty), text, font=font, fill=DARK)

    return img


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, '..', 'public', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    for size in [192, 512]:
        img = make_icon(size)
        path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
        img.save(path, 'PNG')
        print(f'Created {path} ({size}x{size})')


if __name__ == '__main__':
    main()
