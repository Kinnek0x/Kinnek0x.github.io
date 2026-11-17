"""Corta a foto de perfil, redimensiona e grava em WebP SEM metadados (EXIF).

Uso: python3 scripts/tratar-foto.py
Requer: Pillow (pip install pillow)

Porquê sem EXIF: os metadados de uma foto podem revelar o telemóvel usado,
a data e até a localização GPS. Num site público, isso não deve sair.
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "_originais" / "foto-v2.jpg"
DESTINO = RAIZ / "assets" / "img" / "guilherme.webp"

# Caixa de corte (esquerda, topo, direita, fundo) no original 2000x1333.
# Quadrado apertado na cara e nos ombros, para tirar o fundo do jantar.
CORTE = (580, 10, 1420, 850)
TAMANHO = 640


def main() -> None:
    with Image.open(ORIGEM) as img:
        foto = img.convert("RGB").crop(CORTE).resize((TAMANHO, TAMANHO), Image.LANCZOS)
        # Criar uma imagem nova a partir dos píxeis garante que nenhum metadado é copiado.
        limpa = Image.new("RGB", foto.size)
        limpa.putdata(list(foto.getdata()))
        limpa.save(DESTINO, "WEBP", quality=82, method=6)

    with Image.open(DESTINO) as verif:
        assert not verif.getexif(), "A imagem final ainda tem EXIF!"
        assert "exif" not in verif.info and "xmp" not in verif.info
    print(f"OK: {DESTINO.relative_to(RAIZ)} ({DESTINO.stat().st_size // 1024} KB, sem metadados)")


if __name__ == "__main__":
    main()
