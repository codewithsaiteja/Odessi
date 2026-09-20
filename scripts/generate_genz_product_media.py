import os
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

output_dir = r"e:\Odessi Store\odessi-store\backend\odessi-api\uploads\products"
os.makedirs(output_dir, exist_ok=True)

# Load existing logo emblem image if available
logo_path = r"e:\Odessi Store\odessi-store\public\logo.png"
logo_img = None
if os.path.exists(logo_path):
    logo_img = Image.open(logo_path).convert("RGBA")

def create_apparel_canvas(bg_color_hex, apparel_type="tee"):
    width, height = 800, 1000
    # Soft studio backdrop background
    canvas = Image.new("RGBA", (width, height), (245, 245, 247, 255))
    draw = ImageDraw.Draw(canvas)
    
    # Draw soft studio shadow
    shadow_color = (0, 0, 0, 18)
    draw.ellipse([150, 820, 650, 930], fill=shadow_color)
    
    # Parse hex color
    hex_clean = bg_color_hex.lstrip("#")
    r = int(hex_clean[0:2], 16)
    g = int(hex_clean[2:4], 16)
    b = int(hex_clean[4:6], 16)
    fill_color = (r, g, b, 255)
    outline_color = (max(0, r-30), max(0, g-30), max(0, b-30), 255)
    
    if apparel_type == "tee":
        # Oversized Tee Silhouette
        points = [
            (250, 200), # Left neck
            (320, 220), # Center neck curve start
            (480, 220), # Center neck curve end
            (550, 200), # Right neck
            (710, 260), # Right shoulder
            (680, 440), # Right sleeve bottom
            (600, 410), # Right armpit
            (590, 840), # Right hem
            (210, 840), # Left hem
            (200, 410), # Left armpit
            (120, 440), # Left sleeve bottom
            (90, 260),  # Left shoulder
        ]
        draw.polygon(points, fill=fill_color, outline=outline_color)
        # Neck ribbed collar
        draw.arc([320, 180, 480, 240], 0, 180, fill=outline_color, width=4)
        # Sleeve seam lines
        draw.line([(600, 410), (710, 260)], fill=outline_color, width=2)
        draw.line([(200, 410), (90, 260)], fill=outline_color, width=2)
    else:
        # Heavyweight Hoodie Silhouette
        points = [
            (270, 170), # Left hood base
            (530, 170), # Right hood base
            (730, 250), # Right shoulder
            (700, 460), # Right sleeve cuff start
            (660, 470), # Right sleeve cuff end
            (590, 430), # Right armpit
            (580, 800), # Right ribbing top
            (580, 850), # Right ribbing bottom
            (220, 850), # Left ribbing bottom
            (220, 800), # Left ribbing top
            (210, 430), # Left armpit
            (140, 470), # Left sleeve cuff end
            (100, 460), # Left sleeve cuff start
            (70, 250),  # Left shoulder
        ]
        draw.polygon(points, fill=fill_color, outline=outline_color)
        
        # Hood outline
        hood_points = [
            (270, 170), (250, 80), (400, 50), (550, 80), (530, 170),
            (460, 220), (400, 230), (340, 220)
        ]
        draw.polygon(hood_points, fill=fill_color, outline=outline_color)
        # Kangaroo pocket
        draw.polygon([(280, 620), (520, 620), (550, 790), (250, 790)], outline=outline_color, width=3)
        # Drawstrings
        draw.line([(360, 220), (360, 310)], fill=(220, 220, 220, 255) if r < 100 else (40, 40, 40, 255), width=4)
        draw.line([(440, 220), (440, 310)], fill=(220, 220, 220, 255) if r < 100 else (40, 40, 40, 255), width=4)
        
    return canvas, draw, (r, g, b)

def overlay_branding(canvas, rgb, front_text="", back_text="", emblem_size=120, emblem_y=320, is_front=True):
    r, g, b = rgb
    text_color = (245, 245, 245, 255) if (r*0.299 + g*0.587 + b*0.114) < 130 else (20, 20, 20, 255)
    draw = ImageDraw.Draw(canvas)
    
    # Try system fonts
    font_large = None
    font_medium = None
    font_small = None
    
    font_paths = [
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\seguiemj.ttf"
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font_large = ImageFont.truetype(fp, 36)
                font_medium = ImageFont.truetype(fp, 24)
                font_small = ImageFont.truetype(fp, 16)
                break
            except Exception:
                pass
    if not font_large:
        font_large = font_medium = font_small = ImageFont.load_default()
        
    # Draw emblem if logo exists
    if logo_img and is_front:
        resized_logo = logo_img.resize((emblem_size, emblem_size), Image.Resampling.LANCZOS)
        # Tint logo if text is light
        if text_color[0] > 200:
            # Brighten dark pixels
            r_l, g_l, b_l, a_l = resized_logo.split()
            inverted = ImageOps.invert(Image.merge("RGB", (r_l, g_l, b_l)))
            resized_logo = Image.merge("RGBA", (inverted.split()[0], inverted.split()[1], inverted.split()[2], a_l))
        
        logo_x = (800 - emblem_size) // 2
        canvas.paste(resized_logo, (logo_x, emblem_y), resized_logo)
        
    # Render front / back text
    target_text = front_text if is_front else back_text
    if target_text:
        lines = target_text.split("\n")
        start_y = emblem_y + emblem_size + 30 if (is_front and logo_img) else 380
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            bbox = font_large.getbbox(line_str)
            w = bbox[2] - bbox[0]
            x = (800 - w) // 2
            draw.text((x, start_y), line_str, fill=text_color, font=font_large)
            start_y += 50
            
    # Always add signature tag at bottom hem
    tag_text = "ODESSI.TFI • WEAR YOUR STORY"
    tag_bbox = font_small.getbbox(tag_text)
    tag_w = tag_bbox[2] - tag_bbox[0]
    draw.text(((800 - tag_w) // 2, 810), tag_text, fill=(120, 120, 120, 200), font=font_small)

# Generate 10 Products (Front & Back images)
products_spec = [
    # 1. ODESSI CORE — OVERSIZED TEE
    {"id": 1, "type": "tee", "color": "#121212", "front": "ODESSI", "back": "WEAR YOUR STORY."},
    # 2. ODESSI ARCHIVE — GRAPHIC TEE
    {"id": 2, "type": "tee", "color": "#F0EDE6", "front": "ODESSI.TFI\nARCHIVE / 001", "back": "WEAR YOUR STORY."},
    # 3. ODESSI SIGNATURE — OVERSIZED TEE
    {"id": 3, "type": "tee", "color": "#888177", "front": "ODESSI", "back": "WEAR YOUR STORY."},
    # 4. ODESSI HERO — OVERSIZED TEE
    {"id": 4, "type": "tee", "color": "#2C2C2C", "front": "ODESSI", "back": "BECOME YOUR OWN HERO."},
    # 5. ODESSI EMBLEM — HEAVYWEIGHT TEE
    {"id": 5, "type": "tee", "color": "#505050", "front": "ODESSI", "back": "ODESSI.TFI\nEST. / STORY IN MOTION"},
    # 6. ODESSI CORE — OVERSIZED HOODIE
    {"id": 6, "type": "hoodie", "color": "#121212", "front": "ODESSI", "back": "WEAR\nYOUR\nSTORY."},
    # 7. ODESSI ARCHIVE — HEAVYWEIGHT HOODIE
    {"id": 7, "type": "hoodie", "color": "#505050", "front": "ODESSI.TFI\nARCHIVE 001", "back": "WEAR YOUR STORY."},
    # 8. ODESSI HERO — STATEMENT HOODIE
    {"id": 8, "type": "hoodie", "color": "#EFE8DC", "front": "ODESSI", "back": "BECOME\nYOUR OWN\nHERO."},
    # 9. ODESSI / 001 — SIGNATURE HOODIE
    {"id": 9, "type": "hoodie", "color": "#121212", "front": "ODESSI.TFI\n001", "back": "WEAR YOUR STORY."},
    # 10. ODESSI DAILY — ESSENTIAL TEE
    {"id": 10, "type": "tee", "color": "#121212", "front": "ODESSI", "back": "ODESSI.TFI"},
]

generated_files = []
for p in products_spec:
    pid = p["id"]
    # Front Image
    canvas_front, draw_front, rgb = create_apparel_canvas(p["color"], p["type"])
    overlay_branding(canvas_front, rgb, front_text=p["front"], is_front=True)
    front_path = os.path.join(output_dir, f"genz-prod-{pid}-front.jpeg")
    canvas_front.convert("RGB").save(front_path, "JPEG", quality=92)
    generated_files.append(front_path)
    
    # Back Image
    canvas_back, draw_back, rgb = create_apparel_canvas(p["color"], p["type"])
    overlay_branding(canvas_back, rgb, back_text=p["back"], is_front=False)
    back_path = os.path.join(output_dir, f"genz-prod-{pid}-back.jpeg")
    canvas_back.convert("RGB").save(back_path, "JPEG", quality=92)
    generated_files.append(back_path)

print(f"Successfully generated {len(generated_files)} studio product images in {output_dir}")
