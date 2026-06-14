// 200+ Google Fonts plus a few web-safe families and CJK fonts for the Canva editor.
// Fonts are loaded on demand (one <link> per family) the first time they're shown or applied.

export const SYSTEM_FONTS = new Set([
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Tahoma",
]);

// Curated "popular / recently used" set surfaced at the top of the picker.
export const POPULAR_FONTS = [
  "Poppins", "Roboto", "Open Sans", "Montserrat", "Lato", "Playfair Display",
  "Oswald", "Raleway", "Bebas Neue", "Dancing Script", "Inter", "Nunito",
];

// CJK families (Chinese) — kept separate so they always work for 中文 text.
export const CJK_FONTS = [
  "ZCOOL KuaiLe", "Noto Sans SC", "Noto Serif SC", "Ma Shan Zheng",
  "ZCOOL XiaoWei", "ZCOOL QingKe HuangYou", "Liu Jian Mao Cao", "Long Cang",
  "Zhi Mang Xing", "Noto Sans TC", "Noto Serif TC",
];

// The full Latin Google Fonts catalogue subset (alphabetical).
export const GOOGLE_FONTS = [
  "Abril Fatface", "Alegreya", "Alegreya Sans", "Alfa Slab One", "Amatic SC",
  "Anton", "Archivo", "Archivo Black", "Archivo Narrow", "Arial", "Arimo",
  "Arvo", "Asap", "Assistant", "Barlow", "Barlow Condensed", "Bebas Neue",
  "Bitter", "Bodoni Moda", "Bree Serif", "Cabin", "Cairo", "Caveat",
  "Cinzel", "Comfortaa", "Cookie", "Cormorant", "Cormorant Garamond",
  "Courgette", "Courier New", "Crimson Pro", "Crimson Text", "DM Sans",
  "DM Serif Display", "DM Serif Text", "Dancing Script", "Domine", "EB Garamond",
  "Exo", "Exo 2", "Figtree", "Fira Sans", "Fira Code", "Fjalla One",
  "Frank Ruhl Libre", "Fraunces", "Gelasio", "Georgia", "Great Vibes",
  "Heebo", "Hind", "IBM Plex Mono", "IBM Plex Sans", "IBM Plex Serif",
  "Inconsolata", "Indie Flower", "Inter", "Josefin Sans", "Jost", "Kalam",
  "Kanit", "Karla", "Lato", "League Spartan", "Lexend", "Libre Baskerville",
  "Libre Franklin", "Lobster", "Lobster Two", "Lora", "Luckiest Guy",
  "Manrope", "Marcellus", "Merriweather", "Merriweather Sans", "Montserrat",
  "Montserrat Alternates", "Mukta", "Mulish", "Nanum Gothic", "Nanum Myeongjo",
  "Noticia Text", "Noto Sans", "Noto Serif", "Nunito", "Nunito Sans",
  "Old Standard TT", "Oleo Script", "Open Sans", "Orbitron", "Oswald",
  "Outfit", "Overpass", "Pacifico", "Padauk", "Patrick Hand", "Permanent Marker",
  "Petit Formal Script", "Philosopher", "Play", "Playfair Display",
  "Plus Jakarta Sans", "Poiret One", "Poppins", "Prata", "Prompt", "PT Sans",
  "PT Serif", "Quattrocento", "Quattrocento Sans", "Questrial", "Quicksand",
  "Rajdhani", "Raleway", "Recursive", "Red Hat Display", "Righteous",
  "Roboto", "Roboto Condensed", "Roboto Flex", "Roboto Mono", "Roboto Slab",
  "Rokkitt", "Rubik", "Sacramento", "Saira", "Saira Condensed", "Sansita",
  "Satisfy", "Sawarabi Mincho", "Shadows Into Light", "Signika", "Six Caps",
  "Sora", "Source Code Pro", "Source Sans 3", "Source Serif 4", "Space Grotesk",
  "Space Mono", "Spectral", "Staatliches", "Tangerine", "Teko", "Tenor Sans",
  "Times New Roman", "Titan One", "Titillium Web", "Ubuntu", "Ubuntu Mono",
  "Unna", "Urbanist", "Vollkorn", "Work Sans", "Yanone Kaffeesatz",
  "Yellowtail", "Yeseva One", "Zilla Slab",
  // Display & handwriting
  "Abel", "Acme", "Allura", "Bangers", "Baloo 2", "Bungee", "Calistoga",
  "Carter One", "Changa One", "Cherry Cream Soda", "Chewy", "Concert One",
  "Creepster", "Damion", "Economica", "Fredoka", "Fredericka the Great",
  "Gloria Hallelujah", "Gochi Hand", "Homemade Apple", "Italianno", "Kaushan Script",
  "Knewave", "Leckerli One", "Marck Script", "Monoton", "Mountains of Christmas",
  "Mr Dafoe", "Neucha", "Niconne", "Nothing You Could Do", "Nova Mono",
  "Parisienne", "Passion One", "Patua One", "Paytone One", "Pinyon Script",
  "Press Start 2P", "Pridi", "Rampart One", "Reenie Beanie", "Rock Salt",
  "Rye", "Sancreek", "Sedgwick Ave", "Shrikhand", "Special Elite", "Squada One",
  "Sue Ellen Francisco", "Unica One", "Vampiro One", "Vast Shadow", "Wallpoet",
  "Walter Turncoat", "Yatra One", "Zeyada", "Bowlby One SC", "Bungee Shade",
  "Cabin Sketch", "Codystar", "Faster One", "Frijole", "Hanalei", "Lacquer",
  "Megrim", "Nabla", "Ribeye", "Sail", "Silkscreen", "Spicy Rice",
  "Trade Winds", "Warnes",
  // Signature / calligraphy / monoline scripts (event-friendly)
  "Sacramento", "Yellowtail", "Parisienne", "Pinyon Script", "Tangerine", "Allura",
  "Alex Brush", "Great Vibes", "Kaushan Script", "Mr Dafoe", "Mr De Haviland",
  "Herr Von Muellerhoff", "Monsieur La Doulaise", "Petit Formal Script", "Clicker Script",
  "Grand Hotel", "Niconne", "Marck Script", "Rouge Script", "Norican", "League Script",
  "Qwigley", "Romanesco", "Stalemate", "Felipa", "Ruthie", "Engagement",
  "Cedarville Cursive", "Bilbo", "Bilbo Swash Caps", "Birthstone", "Birthstone Bounce",
  "Carattere", "Dr Sugiyama", "Ephesis", "Imperial Script", "Lovers Quarrel", "Meddon",
  "Mrs Saint Delafield", "Redressed", "Yesteryear", "Calligraffitti", "Cherish",
  "Style Script", "Square Peg", "WindSong", "Moon Dance", "Hurricane", "Praise",
  "Lavishly Yours", "Mea Culpa", "Babylonica", "Bonheur Royale", "MonteCarlo",
  // Mono / typewriter
  "Courier Prime", "Cousine", "JetBrains Mono", "Overpass Mono", "Spline Sans Mono",
  // Tall condensed
  "Oswald", "Archivo Narrow", "Six Caps", "Fjalla One", "Pathway Gothic One",
  "Saira Condensed", "Barlow Semi Condensed",
  // Classic / inscriptional serif
  "Cinzel Decorative", "Cormorant SC", "Caudex", "Sorts Mill Goudy", "Gilda Display",
].filter((f, i, arr) => arr.indexOf(f) === i);

// Requested premium / named fonts mapped to the closest freely-embeddable Google font.
// (Commercial fonts like "Brittany Signature" can't be legally embedded — these are
// look-alikes. Users who own the originals can upload them via "Upload a font".)
export const FONT_ALIASES: { label: string; family: string }[] = [
  { label: "Brittany Signature", family: "Sacramento" },
  { label: "Amsterdam Signature", family: "Yellowtail" },
  { label: "Hello Paris", family: "Parisienne" },
  { label: "Magnolia Script", family: "Pinyon Script" },
  { label: "Samantha Script", family: "Tangerine" },
  { label: "Billion Dreams", family: "Allura" },
  { label: "Better Together", family: "Kaushan Script" },
  { label: "Brielle", family: "Mr Dafoe" },
  { label: "Belinda", family: "Petit Formal Script" },
  { label: "Playlist Script", family: "Clicker Script" },
  { label: "Brusher", family: "Permanent Marker" },
  { label: "Buffalo", family: "Yellowtail" },
  { label: "The Skinny", family: "Six Caps" },
  { label: "Hello Honey", family: "Grand Hotel" },
  { label: "Autumn Chant", family: "Allura" },
  { label: "Histeria Script", family: "Monsieur La Doulaise" },
  { label: "Signatura Monoline", family: "Niconne" },
  { label: "Bintang", family: "Sacramento" },
  { label: "Brotherhood Script", family: "Herr Von Muellerhoff" },
  { label: "Bukhari Script", family: "Yellowtail" },
  { label: "Ballpark", family: "Rock Salt" },
  { label: "Sweet Pea", family: "Caveat" },
  { label: "Milkshake", family: "Grand Hotel" },
  { label: "Lemon Tuesday", family: "Sacramento" },
  { label: "Edwardian Script", family: "Mr De Haviland" },
  { label: "Bickham Script", family: "Pinyon Script" },
  { label: "Great Vibes", family: "Great Vibes" },
  { label: "Allura", family: "Allura" },
  { label: "Alex Brush", family: "Alex Brush" },
  { label: "Pinyon Script", family: "Pinyon Script" },
  { label: "Trajan Pro", family: "Cinzel" },
  { label: "Cinzel", family: "Cinzel" },
  { label: "Monoline Signature Script", family: "Mr Dafoe" },
  { label: "Modern Calligraphy / Brush", family: "Kaushan Script" },
  { label: "Classic Serif", family: "Playfair Display" },
  { label: "Tall Condensed Sans", family: "Bebas Neue" },
  { label: "Mixed Script + Thin Serif", family: "Cormorant" },
  { label: "Courier New", family: "Courier Prime" },
  { label: "Letter Gothic", family: "Cousine" },
  { label: "Consolas", family: "JetBrains Mono" },
  { label: "Special Elite", family: "Special Elite" },
  { label: "IBM Plex Mono", family: "IBM Plex Mono" },
];

// Build the CSS font-family value stored on an element.
export function fontCss(family: string): string {
  const generic = /Mono|Code|Console|Courier/i.test(family) ? "monospace" : "sans-serif";
  return `'${family}', ${generic}`;
}

// Extract the family name from a stored CSS font-family value.
export function familyFromCss(css: string | undefined): string {
  if (!css) return "Poppins";
  const m = css.match(/^\s*'?([^',]+)'?/);
  return m ? m[1].trim() : "Poppins";
}

const loaded = new Set<string>();

// Inject a Google Fonts stylesheet for a family the first time it's needed.
export function ensureGoogleFont(family: string) {
  if (typeof document === "undefined") return;
  if (loaded.has(family) || SYSTEM_FONTS.has(family)) return;
  loaded.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}&display=swap`;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

// Register an uploaded custom font via @font-face so it renders + exports.
export function injectCustomFont(family: string, url: string) {
  if (typeof document === "undefined") return;
  const key = `custom:${family}`;
  if (loaded.has(key)) return;
  loaded.add(key);
  const style = document.createElement("style");
  style.dataset.canvaFont = family;
  style.textContent = `@font-face { font-family: '${family.replace(/'/g, "")}'; src: url('${url}'); font-display: swap; }`;
  document.head.appendChild(style);
}
