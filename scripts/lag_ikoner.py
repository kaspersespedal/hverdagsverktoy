"""Lager nettstedets ikoner fra H-merket: favicon.ico, apple-touch-icon og PWA-ikonene.

Kjør fra repo-roten:  python3 scripts/lag_ikoner.py   (krever Pillow)

Merket er det samme som SVG-faviconen i <head> på hver side: en mørk flis (#1a1714)
med en messingfarget H (#d8ad7e) på et 32 × 32-rutenett.

Flisa går helt ut i kantene, uten runde hjørner og uten gjennomsiktige piksler.
Safari på iPhone legger ikoner med gjennomsiktige områder på en hvit flis, og da
fikk merket en hvit ramme rundt seg i adressefeltet. iOS, Android og nettleserne
runder av hjørnene selv. H-en står godt innenfor den sikre sirkelen (40 % radius)
som Android bruker for «maskable»-ikoner, så ingenting klippes bort.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROT = Path(__file__).resolve().parent.parent
BAKGRUNN = (0x1A, 0x17, 0x14, 255)
MESSING = (0xD8, 0xAD, 0x7E, 255)
# (x, y, bredde, høyde, hjørneradius) på 32-rutenettet, likt SVG-faviconen.
H_DELER = [
    (10, 8, 4, 16, 1.0),   # venstre stolpe
    (18, 8, 4, 16, 1.0),   # høyre stolpe
    (14, 14, 4, 4, 0.6),   # tverrstrek
]
OVERSAMPLING = 8


def merke(px: int) -> Image.Image:
    """Tegner merket i px × px, først stort og så skalert ned for glatte kanter."""
    stor = px * OVERSAMPLING
    k = stor / 32
    im = Image.new("RGBA", (stor, stor), BAKGRUNN)
    d = ImageDraw.Draw(im)
    for x, y, b, h, r in H_DELER:
        d.rounded_rectangle(
            (round(x * k), round(y * k), round((x + b) * k) - 1, round((y + h) * k) - 1),
            radius=round(r * k),
            fill=MESSING,
        )
    # BOX (snitt av hver 8 × 8-rute), ikke LANCZOS: LANCZOS ga en mørk glorie rundt
    # H-en i 16 px. Med BOX blir kantene skarpe der stolpene ligger på hele piksler.
    return im.resize((px, px), Image.BOX).convert("RGB")


def main() -> None:
    ikoner = ROT / "icons"
    merke(180).save(ikoner / "apple-touch-icon.png", optimize=True)
    merke(192).save(ikoner / "icon-192.png", optimize=True)
    merke(512).save(ikoner / "icon-512.png", optimize=True)
    # Hver størrelse tegnes for seg: skalert ned fra 48 px blir 16 px-utgaven uskarp.
    merke(48).save(ROT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)],
                   append_images=[merke(16), merke(32)])
    print("Lagret icons/apple-touch-icon.png, icons/icon-192.png, icons/icon-512.png og favicon.ico")


if __name__ == "__main__":
    main()
