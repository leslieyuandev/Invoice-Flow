"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Upload, Check, Loader2, X } from "lucide-react";
import {
  GOOGLE_FONTS, POPULAR_FONTS, CJK_FONTS, FONT_ALIASES,
  fontCss, familyFromCss, ensureGoogleFont,
} from "./fonts";
import { cn } from "@/lib/utils/cn";

interface FontBrowserPanelProps {
  value: string | undefined;
  onChange: (css: string) => void;
  customFonts: { family: string }[];
  onUploadFont: () => void;
  uploadingFont: boolean;
  onClose: () => void;
}

// One row — lazy-loads its font when scrolled into view, then previews in that font.
function FontRow({
  family, label, selected, isCustom, onPick,
}: {
  family: string;
  label?: string;
  selected: boolean;
  isCustom: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          if (!isCustom) ensureGoogleFont(family);
          setVisible(true);
          io.disconnect();
        }
      },
      { root: el.closest("[data-font-scroll]"), rootMargin: "160px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [family, isCustom]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onPick}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2.5 text-left rounded-lg hover:bg-surface-100",
        selected && "bg-brand-50"
      )}
    >
      <span
        className="text-lg leading-tight text-surface-800 truncate"
        style={{ fontFamily: visible ? fontCss(family) : undefined }}
      >
        {label ?? family}
      </span>
      {selected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
    </button>
  );
}

const CATEGORY_CHIPS = ["Popular", "Serif", "Display", "Handwriting", "Mono"];
const SERIF = new Set(["Playfair Display", "Merriweather", "Lora", "PT Serif", "Bitter", "Cormorant", "Cormorant Garamond", "EB Garamond", "Libre Baskerville", "Crimson Text", "Crimson Pro", "Domine", "Spectral", "Vollkorn", "Bodoni Moda", "DM Serif Display", "DM Serif Text", "Frank Ruhl Libre", "Fraunces", "Old Standard TT", "Prata", "Marcellus", "Cinzel", "Noticia Text", "Rokkitt", "Zilla Slab", "Source Serif 4", "IBM Plex Serif", "Noto Serif", "Alegreya", "Arvo", "Bree Serif", "Gelasio", "Quattrocento", "Sansita", "Tenor Sans", "Unna", "Yeseva One", "Abril Fatface"]);
const DISPLAY = new Set(["Bebas Neue", "Anton", "Oswald", "Alfa Slab One", "Lobster", "Lobster Two", "Righteous", "Staatliches", "Titan One", "Bangers", "Bungee", "Fjalla One", "Archivo Black", "Passion One", "Paytone One", "Patua One", "Concert One", "Fredoka", "Luckiest Guy", "Monoton", "Press Start 2P", "Rampart One", "Shrikhand", "Squada One", "Teko", "Yanone Kaffeesatz", "Six Caps", "Calistoga", "Knewave", "Chewy", "Acme", "Carter One", "Changa One", "Bowlby One SC", "Bungee Shade", "Faster One", "Frijole", "Megrim", "Vast Shadow", "Wallpoet", "Trade Winds", "Yatra One", "Unica One", "Vampiro One", "Yellowtail", "Baloo 2"]);
const HAND = new Set(["Dancing Script", "Pacifico", "Caveat", "Satisfy", "Great Vibes", "Sacramento", "Kaushan Script", "Indie Flower", "Shadows Into Light", "Permanent Marker", "Amatic SC", "Gloria Hallelujah", "Patrick Hand", "Cookie", "Courgette", "Allura", "Damion", "Homemade Apple", "Gochi Hand", "Italianno", "Leckerli One", "Marck Script", "Mr Dafoe", "Neucha", "Niconne", "Nothing You Could Do", "Parisienne", "Pinyon Script", "Reenie Beanie", "Rock Salt", "Sedgwick Ave", "Sue Ellen Francisco", "Tangerine", "Walter Turncoat", "Zeyada", "Kalam", "Fredericka the Great", "Mountains of Christmas"]);
const MONO = new Set(["Roboto Mono", "Space Mono", "IBM Plex Mono", "Source Code Pro", "Fira Code", "Inconsolata", "Ubuntu Mono", "Nova Mono", "Silkscreen"]);

export function FontBrowserPanel({ value, onChange, customFonts, onUploadFont, uploadingFont, onClose }: FontBrowserPanelProps) {
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<string | null>(null);
  const current = familyFromCss(value);

  useEffect(() => {
    if (current) ensureGoogleFont(current);
  }, [current]);

  const customSet = useMemo(() => new Set(customFonts.map((c) => c.family)), [customFonts]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base: string[];
    if (chip === "Popular") base = POPULAR_FONTS;
    else if (chip === "Serif") base = GOOGLE_FONTS.filter((f) => SERIF.has(f));
    else if (chip === "Display") base = GOOGLE_FONTS.filter((f) => DISPLAY.has(f));
    else if (chip === "Handwriting") base = GOOGLE_FONTS.filter((f) => HAND.has(f));
    else if (chip === "Mono") base = GOOGLE_FONTS.filter((f) => MONO.has(f));
    else base = [...GOOGLE_FONTS].sort((a, b) => a.localeCompare(b));
    if (q) {
      return {
        flat: [...new Set([...customFonts.map((c) => c.family), ...GOOGLE_FONTS, ...CJK_FONTS])].filter((f) => f.toLowerCase().includes(q)),
        grouped: false as const,
      };
    }
    return { flat: base, grouped: !chip };
  }, [search, chip, customFonts]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-xs font-semibold text-surface-700 uppercase tracking-wide">Fonts</p>
        <button type="button" onClick={onClose} className="p-1 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 text-surface-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 200+ fonts"
          className="w-full rounded-lg border border-surface-200 pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <button
        type="button"
        onClick={onUploadFont}
        disabled={uploadingFont}
        className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-dashed border-surface-300 py-1.5 text-xs font-medium text-surface-600 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 mb-2"
      >
        {uploadingFont ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Upload a font
      </button>

      {!search && (
        <div className="flex gap-1 flex-wrap mb-2">
          {CATEGORY_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChip((cur) => (cur === c ? null : c))}
              className={cn(
                "text-[11px] px-2 py-1 rounded-full border",
                chip === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-200 text-surface-500 hover:bg-surface-50"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div data-font-scroll className="overflow-y-auto flex-1 -mx-1 px-1">
        {/* Custom fonts always on top when no search/chip */}
        {!search && !chip && (
          <>
            {customFonts.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide px-2 pt-1 pb-0.5">Your fonts</p>
                {customFonts.map((c) => (
                  <FontRow key={`c-${c.family}`} family={c.family} selected={c.family === current} isCustom onPick={() => { onChange(`'${c.family}', sans-serif`); }} />
                ))}
              </>
            )}
            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide px-2 pt-1 pb-0.5">Event &amp; signature</p>
            {FONT_ALIASES.map((a) => (
              <FontRow key={`alias-${a.label}`} family={a.family} label={a.label} selected={false} isCustom={false} onPick={() => { ensureGoogleFont(a.family); onChange(fontCss(a.family)); }} />
            ))}
            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide px-2 pt-2 pb-0.5">中文 Chinese</p>
            {CJK_FONTS.map((f) => (
              <FontRow key={`z-${f}`} family={f} selected={f === current} isCustom={false} onPick={() => { ensureGoogleFont(f); onChange(fontCss(f)); }} />
            ))}
            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide px-2 pt-2 pb-0.5">All fonts</p>
          </>
        )}

        {list.flat.map((f) => (
          <FontRow
            key={f}
            family={f}
            selected={f === current}
            isCustom={customSet.has(f)}
            onPick={() => {
              if (customSet.has(f)) onChange(`'${f}', sans-serif`);
              else { ensureGoogleFont(f); onChange(fontCss(f)); }
            }}
          />
        ))}
        {list.flat.length === 0 && search && (
          <p className="text-xs text-surface-400 px-3 py-4 text-center">No fonts match “{search}”.</p>
        )}
      </div>
    </div>
  );
}
