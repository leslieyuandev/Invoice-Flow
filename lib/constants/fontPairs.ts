export interface FontPair {
  id: string;
  label: string;
  description: string;
  heading: string;
  body: string;
  googleFontsUrl: string;
  pdfHeadingUrl: string;
  pdfBodyUrl: string;
  pdfBodyBoldUrl: string;
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: "tenor-clear",
    label: "Elegant Classic",
    description: "Tenor Sans · Clear Sans",
    heading: "Tenor Sans",
    body: "Clear Sans",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Tenor+Sans&display=swap",
    pdfHeadingUrl: "https://fonts.gstatic.com/s/tenorsans/v19/bx6ANxqUneKx06UkIXISr3JyC22IyqI.woff2",
    pdfBodyUrl: "https://fonts.gstatic.com/s/clearsans/v2/q2sTCqbg-6-m1Hm2Y3LMRQ.ttf",
    pdfBodyBoldUrl: "https://fonts.gstatic.com/s/clearsans/v2/q2sUCqbg-6-m1Hm2Y3LMRQ.ttf",
  },
  {
    id: "playfair-lato",
    label: "Romantic",
    description: "Playfair Display · Lato",
    heading: "Playfair Display",
    body: "Lato",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&display=swap",
    pdfHeadingUrl: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff2",
    pdfBodyUrl: "https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXiWtFCc.woff2",
    pdfBodyBoldUrl: "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2",
  },
  {
    id: "cormorant",
    label: "Luxury Serif",
    description: "Cormorant Garamond",
    heading: "Cormorant Garamond",
    body: "Cormorant Garamond",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap",
    pdfHeadingUrl: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2",
    pdfBodyUrl: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2",
    pdfBodyBoldUrl: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3WmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2",
  },
  {
    id: "cinzel-raleway",
    label: "Royal",
    description: "Cinzel · Raleway",
    heading: "Cinzel",
    body: "Raleway",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Raleway:wght@400;700&display=swap",
    pdfHeadingUrl: "https://fonts.gstatic.com/s/cinzel/v23/8vIJ7ww63mVu7gt79mT7Ig.woff2",
    pdfBodyUrl: "https://fonts.gstatic.com/s/raleway/v29/1Ptrg8zYS_SKggPNwJYtWqhPAMif.woff2",
    pdfBodyBoldUrl: "https://fonts.gstatic.com/s/raleway/v29/1Ptsg8zYS_SKggPNwIouWqhPgWWB.woff2",
  },
  {
    id: "montserrat",
    label: "Modern Minimal",
    description: "Montserrat",
    heading: "Montserrat",
    body: "Montserrat",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap",
    pdfHeadingUrl: "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff2",
    pdfBodyUrl: "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff2",
    pdfBodyBoldUrl: "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtBr5A.woff2",
  },
];

export const DEFAULT_FONT_PAIR = "tenor-clear";

export function getFontPair(id: string | null | undefined): FontPair {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0];
}
