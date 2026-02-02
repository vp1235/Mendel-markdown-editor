from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
PURPLE = (167, 74, 199)       # #A74AC7 - Mendel's pea flower purple
WHITE = (255, 255, 255)
DARK_BG = (22, 12, 42)        # very dark purple
CELL_COLORS = {
    2: (70, 35, 110),          # 2 dominant alleles - rich purple
    1: (45, 22, 72),           # 1 dominant - medium
    0: (30, 15, 55),           # 0 dominant - near background
}
GRID_LINE_COLOR = (255, 255, 255, 120)

img = Image.new('RGBA', (SIZE, SIZE), DARK_BG)
draw = ImageDraw.Draw(img)

# Fonts
font_cell = ImageFont.truetype('/Library/Fonts/Arial Bold.ttf', 130)
font_header = ImageFont.truetype('/Library/Fonts/Arial Bold.ttf', 100)

# Layout — centered with even margins
pad = 100
header_w = 110                 # width of axis label area
grid_size = SIZE - 2 * pad - header_w
cell = grid_size // 2
grid_x0 = pad + header_w
grid_y0 = pad + header_w
grid_x1 = grid_x0 + 2 * cell
grid_y1 = grid_y0 + 2 * cell

# Punnett square data: rows = M,m  cols = D,d
rows = [('M', True), ('m', False)]   # (letter, is_dominant)
cols = [('D', True), ('d', False)]

# Draw cell backgrounds
for r, (_, r_dom) in enumerate(rows):
    for c, (_, c_dom) in enumerate(cols):
        dom_count = int(r_dom) + int(c_dom)
        x0 = grid_x0 + c * cell
        y0 = grid_y0 + r * cell
        draw.rectangle([x0, y0, x0 + cell, y0 + cell], fill=CELL_COLORS[dom_count])

# Grid lines
lw = 3
# outer border
draw.rectangle([grid_x0, grid_y0, grid_x1, grid_y1], outline=WHITE + (100,), width=lw)
# inner cross
draw.line([(grid_x0 + cell, grid_y0), (grid_x0 + cell, grid_y1)], fill=WHITE + (100,), width=lw)
draw.line([(grid_x0, grid_y0 + cell), (grid_x1, grid_y0 + cell)], fill=WHITE + (100,), width=lw)

# Axis header line separators (subtle)
draw.line([(grid_x0, grid_y0 - 8), (grid_x1, grid_y0 - 8)], fill=WHITE + (40,), width=2)
draw.line([(grid_x0 - 8, grid_y0), (grid_x0 - 8, grid_y1)], fill=WHITE + (40,), width=2)

# Column headers: D, d
for c, (letter, is_dom) in enumerate(cols):
    cx = grid_x0 + c * cell + cell // 2
    cy = pad + header_w // 2
    color = PURPLE if is_dom else WHITE
    draw.text((cx, cy), letter, fill=color, font=font_header, anchor='mm')

# Row headers: M, m
for r, (letter, is_dom) in enumerate(rows):
    cx = pad + header_w // 2
    cy = grid_y0 + r * cell + cell // 2
    color = PURPLE if is_dom else WHITE
    draw.text((cx, cy), letter, fill=color, font=font_header, anchor='mm')

# Cell contents
for r, (r_letter, r_dom) in enumerate(rows):
    for c, (c_letter, c_dom) in enumerate(cols):
        cx = grid_x0 + c * cell + cell // 2
        cy = grid_y0 + r * cell + cell // 2
        r_color = PURPLE if r_dom else WHITE
        c_color = PURPLE if c_dom else WHITE
        # Two letters side by side with spacing
        gap = 55
        draw.text((cx - gap, cy), r_letter, fill=r_color, font=font_cell, anchor='mm')
        draw.text((cx + gap, cy), c_letter, fill=c_color, font=font_cell, anchor='mm')

img = img.convert('RGBA')
img.save('/Users/victor/Code/markdowneditor/app-icon.png')
print(f'Saved {SIZE}x{SIZE} icon')
