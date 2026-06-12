#!/usr/bin/env python3
"""Generate simple PNG icons for PWA."""

import struct
import zlib
import os

def create_png(width, height, pixels):
    """Create a PNG file from raw RGB pixel data."""
    def chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'

    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = chunk(b'IHDR', ihdr)

    # IDAT - raw pixel data with filter byte (0) per row
    raw = b''
    for y in range(height):
        raw += b'\x00'  # filter byte (none)
        for x in range(width):
            idx = (y * width + x) * 3
            raw += bytes(pixels[idx:idx+3])

    compressed = zlib.compress(raw)
    idat_chunk = chunk(b'IDAT', compressed)

    # IEND
    iend_chunk = chunk(b'IEND', b'')

    return sig + ihdr_chunk + idat_chunk + iend_chunk

def make_icon(size):
    """Create a football-themed icon."""
    pixels = bytearray(size * size * 3)
    cx = cy = size // 2
    r = size // 2 - 2

    # Primary color (dark blue)
    bg = (15, 23, 42)
    # Secondary (slightly lighter)
    bg2 = (30, 41, 59)
    # Accent color for ball
    ball_color = (245, 245, 245)
    # Stripe color
    stripe = (200, 200, 200)

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 3
            dx, dy = x - cx, y - cy
            dist = (dx*dx + dy*dy) ** 0.5

            # Checkerboard pattern for background
            checker_x = x // (size // 8)
            checker_y = y // (size // 8)
            is_checker = (checker_x + checker_y) % 2 == 0

            if is_checker:
                pixels[idx:idx+3] = bg
            else:
                pixels[idx:idx+3] = bg2

            # Draw a simple football (circle with pentagon pattern)
            if dist <= r:
                if dx < 0 and dy < 0 and dx < dy:
                    pixels[idx:idx+3] = ball_color
                elif dx > 0 and dy > 0 and dx > dy:
                    pixels[idx:idx+3] = ball_color
                elif abs(dx) < r * 0.15 and abs(dy) < r:
                    pixels[idx:idx+3] = ball_color
                elif abs(dy) < r * 0.15 and abs(dx) < r:
                    pixels[idx:idx+3] = ball_color
                else:
                    pixels[idx:idx+3] = stripe

    return pixels

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, '..', 'public', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    for size in [192, 512]:
        pixels = make_icon(size)
        png_data = create_png(size, size, pixels)
        path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
        with open(path, 'wb') as f:
            f.write(png_data)
        print(f'Created {path} ({size}x{size})')

if __name__ == '__main__':
    main()
