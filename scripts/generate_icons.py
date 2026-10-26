import os
import shutil
import math
from PIL import Image, ImageDraw, ImageFilter

def create_brand_assets():
    os.makedirs('assets', exist_ok=True)
    os.makedirs('build', exist_ok=True)
    
    # 1. Criar SVG Vetorial Moderno para Web, In-App e Documentação
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Gradiente de Fundo -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Gradiente Neon Principal (Cyan para Roxo Elétrico) -->
    <linearGradient id="wandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="40%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>

    <!-- Gradiente de Brilho da Joia / Núcleo -->
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="1"/>
      <stop offset="50%" stop-color="#818cf8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#c084fc" stop-opacity="0"/>
    </radialGradient>

    <!-- Filtro de Glow / Brilho Neon -->
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="subtleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Container com cantos arredondados (Squircle) -->
  <rect x="24" y="24" width="464" height="464" rx="100" fill="url(#bgGrad)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="4" filter="url(#subtleShadow)"/>

  <!-- Malha Hexagonal Sutil de Fundo -->
  <g stroke="rgba(255, 255, 255, 0.04)" stroke-width="2" fill="none">
    <polygon points="256,120 316,155 316,225 256,260 196,225 196,155"/>
    <polygon points="256,260 316,295 316,365 256,400 196,365 196,295"/>
    <polygon points="136,190 196,225 196,295 136,330 76,295 76,225"/>
    <polygon points="376,190 436,225 436,295 376,330 316,295 316,225"/>
  </g>

  <!-- Brilho Atmosférico Central -->
  <circle cx="256" cy="230" r="160" fill="url(#coreGlow)" opacity="0.35"/>

  <!-- Varinha Mágica Cibernética (Wand / Sword of Power) -->
  <g filter="url(#neonGlow)">
    <!-- Haste da Varinha com perspectiva angular -->
    <path d="M 170 370 L 290 250 L 310 270 L 190 390 Z" fill="url(#wandGrad)"/>
    <path d="M 155 385 L 180 360 L 200 380 L 175 405 Z" fill="#6366f1"/>
    
    <!-- Lâmina / Raio de Energia Mágico Superior -->
    <polygon points="256,90 286,210 256,245 226,210" fill="url(#wandGrad)"/>
    
    <!-- Anéis Orbitais de Potência (Mods / Hacks) -->
    <ellipse cx="256" cy="220" rx="90" ry="26" fill="none" stroke="#38bdf8" stroke-width="6" transform="rotate(-30 256 220)"/>
    <ellipse cx="256" cy="220" rx="90" ry="26" fill="none" stroke="#c084fc" stroke-width="4" stroke-dasharray="16 12" transform="rotate(35 256 220)"/>

    <!-- Cristais Flutuantes de Alta Precisão (Nódulos de Memória) -->
    <polygon points="256,60 268,85 256,110 244,85" fill="#38bdf8"/>
    <polygon points="350,150 365,170 350,190 335,170" fill="#818cf8"/>
    <polygon points="162,150 177,170 162,190 147,170" fill="#c084fc"/>
    <polygon points="330,290 345,310 330,330 315,310" fill="#38bdf8"/>
    <polygon points="182,290 197,310 182,330 167,310" fill="#818cf8"/>

    <!-- Estrela Cintilante Central (Poder Máximo) -->
    <circle cx="256" cy="220" r="14" fill="#ffffff"/>
  </g>
</svg>'''

    with open('assets/logo.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print("[OK] assets/logo.svg criado com sucesso.")

    # 2. Verificar se imagem 3D de alta qualidade gerada por IA existe
    source_ai_art = r'C:\Users\conta\.gemini\antigravity\brain\747afa1d-4865-4f21-88b1-2299bfb4a35e\app_icon_art_png_1793053606951.jpg'
    
    if os.path.exists(source_ai_art):
        shutil.copy2(source_ai_art, 'assets/app_icon_art.jpg')
        print("[OK] Copiado modelo 3D AI para assets/app_icon_art.jpg")
        
        # Abre e converte para RGBA
        raw_img = Image.open(source_ai_art).convert('RGBA')
        
        # Aplica cantos arredondados (Squircle suave estilo macOS/Windows 11 app icon)
        size = (512, 512)
        raw_img = raw_img.resize(size, Image.Resampling.LANCZOS)
        
        mask = Image.new('L', size, 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, 512, 512], radius=100, fill=255)
        
        icon_img = Image.new('RGBA', size, (0, 0, 0, 0))
        icon_img.paste(raw_img, (0, 0), mask=mask)
        
        # Adiciona borda sutil de vidro iluminado
        border_draw = ImageDraw.Draw(icon_img)
        border_draw.rounded_rectangle([0, 0, 511, 511], radius=100, outline=(88, 166, 255, 90), width=4)
        
        icon_img.save('assets/icon.png', 'PNG')
        icon_img.save('assets/logo.png', 'PNG')
        print("[OK] assets/icon.png e assets/logo.png gerados a partir do render 3D (512x512).")
        
        # Salva o arquivo .ICO com todos os tamanhos padrões do Windows
        ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
        icon_img.save('build/icon.ico', format='ICO', sizes=ico_sizes)
        icon_img.save('assets/icon.ico', format='ICO', sizes=ico_sizes)
        print("[OK] build/icon.ico e assets/icon.ico criados com sucesso.")
    else:
        # Fallback procedural com Pillow
        size = (512, 512)
        img = Image.new('RGBA', size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        for r in range(210, 0, -1):
            color = (15 + int(r*0.05), 23 + int(r*0.06), 42 + int(r*0.08), 255)
            draw.rounded_rectangle([256 - r, 256 - r, 256 + r, 256 + r], radius=int(r * 0.45), fill=color)

        glow_img = Image.new('RGBA', size, (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_img)
        glow_draw.ellipse([130, 110, 380, 360], fill=(56, 189, 248, 140))
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(35))
        img.alpha_composite(glow_img)

        symbol = Image.new('RGBA', size, (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(symbol)
        sdraw.polygon([(170, 360), (285, 245), (315, 275), (200, 390)], fill=(129, 140, 248, 255))
        sdraw.polygon([(256, 85), (295, 210), (256, 250), (217, 210)], fill=(56, 189, 248, 255))
        
        for deg in range(0, 360, 4):
            rad = math.radians(deg)
            x = 90 * math.cos(rad)
            y = 30 * math.sin(rad)
            rot_rad = math.radians(-30)
            rx = x * math.cos(rot_rad) - y * math.sin(rot_rad) + 256
            ry = x * math.sin(rot_rad) + y * math.cos(rot_rad) + 225
            sdraw.ellipse([rx - 3, ry - 3, rx + 3, ry + 3], fill=(192, 132, 252, 220))

        sdraw.ellipse([244, 213, 268, 237], fill=(255, 255, 255, 255))
        sym_glow = symbol.filter(ImageFilter.GaussianBlur(8))
        img.alpha_composite(sym_glow)
        img.alpha_composite(symbol)
        draw.rounded_rectangle([24, 24, 488, 488], radius=95, outline=(88, 166, 255, 120), width=4)

        img.save('assets/icon.png', 'PNG')
        img.save('assets/logo.png', 'PNG')
        ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
        img.save('build/icon.ico', format='ICO', sizes=ico_sizes)
        img.save('assets/icon.ico', format='ICO', sizes=ico_sizes)
        print("[OK] Assets gerados via fallback procedural.")

if __name__ == '__main__':
    create_brand_assets()
