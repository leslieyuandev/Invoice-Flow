// Creative graphic elements for the Canva editor.
// Two kinds: colour emoji (inserted as text, export-safe) and decorative inline SVGs.

export interface EmojiCategory {
  id: string;
  label: string;
  items: string[];
}

export const EMOJI_GRAPHICS: EmojiCategory[] = [
  {
    id: "party",
    label: "Party & Balloons",
    items: [
      "🎈", "🎉", "🎊", "🥳", "🎁", "🎀", "🎂", "🍰", "🧁", "🎆", "🎇", "✨", "🎄", "🎃",
      "🪅", "🪩", "🎏", "🎐", "🎑", "🧨", "🎍", "🎎", "🎌", "🏮", "🪔", "🎗️", "🎟️", "🎫",
      "🥂", "🍾", "🍻", "🍷", "🍸", "🍹", "🧃", "🪄", "🌟", "💫", "⭐", "🌠", "🎯", "🎮",
      "🕯️", "💐", "🎶", "🔔", "📣", "📯", "🎺",
    ],
  },
  {
    id: "numbers",
    label: "Numbers",
    items: ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "#️⃣", "*️⃣", "💯", "🆕", "🆒", "🆓", "🔢", "➕", "➖", "✖️", "➗", "🟰"],
  },
  {
    id: "flowers",
    label: "Flowers & Nature",
    items: [
      "🌸", "🌺", "🌹", "🌷", "🌻", "🌼", "💐", "🏵️", "🌿", "🍃", "🌱", "🌾", "🍀", "☘️",
      "🌵", "🌴", "🌲", "🌳", "🪴", "🌊", "🌈", "☀️", "🌙", "⛅", "🍂", "🍁", "🌰", "🌽",
      "🪻", "🪷", "💮", "🥀", "🦋", "🐝", "🐞", "🌍", "🌎", "🌏", "🪨", "🌋", "🏔️", "⛰️",
      "🏝️", "🏖️", "🏕️", "🌅", "🌄", "🌇", "🌆", "🌃",
    ],
  },
  {
    id: "hearts",
    label: "Hearts & Love",
    items: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💖", "💗", "💓", "💞", "💕",
      "💘", "💝", "💟", "❣️", "💌", "💋", "👩‍❤️‍👨", "💑", "💏", "🫰", "🤟", "💍", "💎", "🌹",
      "🥰", "😍", "😘", "💐", "🩷", "🩵", "💔", "❤️‍🔥", "❤️‍🩹",
    ],
  },
  {
    id: "cute",
    label: "Cute & Faces",
    items: [
      "😀", "😄", "😁", "😊", "🥰", "😍", "🤩", "😎", "🥳", "😇", "🙂", "😋", "😛", "😜",
      "🤗", "🤭", "🥹", "🥺", "😺", "😸", "😻", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻",
      "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🦄", "🐝", "🦋", "🐧", "🐥", "🐣",
      "🦔", "🦦", "🦥", "🐢", "🐙", "🦕", "🌝", "⭐",
    ],
  },
  {
    id: "music",
    label: "Music",
    items: ["🎵", "🎶", "🎼", "🎤", "🎧", "🎙️", "🎚️", "🎛️", "🎷", "🎺", "🎸", "🪕", "🎻", "🥁", "🪘", "🎹", "📻", "📀", "💿", "🔊", "🔉", "🔈", "📢", "📣", "🔔", "🎚️"],
  },
  {
    id: "food",
    label: "Food & Cake",
    items: [
      "🎂", "🍰", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮", "🍯", "🍦", "🍨", "🍧", "🥧",
      "🍓", "🍒", "🍑", "🍎", "🍏", "🍊", "🍋", "🍉", "🍇", "🍈", "🥭", "🍍", "🥥", "🍌",
      "☕", "🍵", "🧋", "🥤", "🧃", "🍺", "🍻", "🥂", "🍾", "🍷", "🍸", "🍹", "🎈",
    ],
  },
  {
    id: "celebration",
    label: "Celebration & Symbols",
    items: [
      "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "👑", "💍", "💎", "🔮", "🎗️", "🎀", "🧧", "🪪",
      "📅", "📆", "🗓️", "⏰", "⌛", "🕰️", "🔆", "✅", "✔️", "☑️", "🆗", "🔝", "🎯", "🚀",
      "💥", "💢", "💦", "💨", "🔥", "🌟", "⚡", "❄️", "🎬", "📸", "📷", "🎥",
    ],
  },
  {
    id: "stars",
    label: "Stars & Sparkle",
    items: ["⭐", "🌟", "✨", "💫", "🌠", "⚡", "🔆", "🔅", "☀️", "🌞", "🌝", "🌛", "🌜", "🌚", "🪐", "🌌", "❇️", "✳️", "✴️", "❄️", "❅", "❆", "💠", "🔱", "⚜️", "🌀"],
  },
  {
    id: "arrows",
    label: "Arrows & Pointers",
    items: ["➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↔️", "↕️", "🔄", "🔁", "🔂", "🔃", "↩️", "↪️", "⤴️", "⤵️", "🔙", "🔚", "🔛", "🔜", "🔝", "👆", "👇", "👈", "👉", "☝️", "✋", "👌", "🤙", "👍", "👎", "👏", "🙌", "🤝", "🫶"],
  },
  {
    id: "weather",
    label: "Weather & Sky",
    items: ["☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "🌪️", "🌫️", "🌈", "☂️", "☔", "💧", "💦", "🌊", "🌙", "🌛", "🌜", "🌝", "🌚", "⭐", "🌟"],
  },
  {
    id: "objects",
    label: "Objects & Work",
    items: [
      "💼", "📁", "📂", "🗂️", "📊", "📈", "📉", "📋", "📌", "📍", "📎", "🖇️", "📏", "📐",
      "✂️", "🖊️", "🖋️", "✒️", "🖌️", "🖍️", "📝", "✏️", "🔍", "🔎", "🔑", "🗝️", "🔒", "🔓",
      "💡", "🔦", "🏷️", "💰", "💵", "💳", "🧾", "📱", "💻", "🖥️", "⌨️", "🖱️", "📞", "☎️",
    ],
  },
  {
    id: "travel",
    label: "Travel & Places",
    items: [
      "✈️", "🚗", "🚕", "🚙", "🚌", "🏎️", "🏍️", "🚲", "🛴", "🚁", "🚀", "🛸", "⛵", "🚤",
      "🛳️", "⚓", "🏰", "🏯", "🗽", "🗼", "🎡", "🎢", "🎠", "⛲", "🏙️", "🌉", "🗺️", "🧭",
      "🏠", "🏡", "🏢", "🏬", "🏨", "💒", "⛪", "🕌", "🛕", "🎪", "🎭", "🖼️", "🎨", "🧳",
    ],
  },
  {
    id: "symbols",
    label: "Symbols & Marks",
    items: [
      "✅", "❌", "⭕", "❎", "✔️", "✖️", "➕", "➖", "❓", "❗", "‼️", "⁉️", "💲", "💱", "®️",
      "©️", "™️", "🔰", "⚠️", "🚸", "🔱", "⚜️", "🔆", "♻️", "✳️", "❇️", "✴️", "🆚", "🉑", "㊗️",
      "㊙️", "🈵", "🅰️", "🅱️", "🆎", "🆑", "🔠", "🔡", "🔤", "🔣", "💠", "🟢", "🔴", "🟡", "🟣", "🟠", "🔵", "⚫", "⚪",
    ],
  },
  {
    id: "animals",
    label: "Animals & Bugs",
    items: [
      "🦋", "🐝", "🐞", "🐛", "🐌", "🐜", "🕷️", "🦗", "🦂", "🪲", "🪳", "🦟", "🐦", "🕊️",
      "🦢", "🦜", "🦚", "🐔", "🐓", "🐤", "🦅", "🦉", "🐺", "🦌", "🐎", "🦓", "🦒", "🐘",
      "🐳", "🐬", "🐠", "🐟", "🐡", "🦈", "🐙", "🦑", "🦀", "🦞", "🐚", "🐢", "🦎", "🐍",
    ],
  },
];

export const TOTAL_EMOJI = EMOJI_GRAPHICS.reduce((n, c) => n + c.items.length, 0);

// ── Decorative inline-SVG graphics ───────────────────────────────────────────
// Each `svg` is a complete <svg> sized to fill its element box.
export interface SvgGraphic {
  id: string;
  label: string;
  group: string;
  w: number;
  h: number;
  svg: string;
}

const wrap = (vb: string, body: string) =>
  `<svg viewBox="${vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const SVG_GRAPHICS: SvgGraphic[] = [
  // Blobs
  { id: "blob-1", label: "Blob", group: "Blobs", w: 200, h: 200, svg: wrap("0 0 200 200", `<path fill="#f6b6cd" d="M44,-58C56,-49,62,-32,66,-14C70,4,71,24,62,38C53,52,34,60,14,64C-7,68,-29,68,-46,58C-63,48,-74,28,-75,8C-76,-13,-67,-34,-52,-46C-37,-58,-18,-61,1,-62C20,-63,41,-67,44,-58Z" transform="translate(100 100)"/>`) },
  { id: "blob-2", label: "Blob", group: "Blobs", w: 200, h: 200, svg: wrap("0 0 200 200", `<path fill="#f7c948" d="M48,-58C61,-48,68,-30,69,-12C70,6,65,24,54,38C43,52,26,62,7,66C-13,70,-35,68,-50,57C-66,46,-75,26,-75,6C-76,-15,-67,-37,-52,-48C-37,-59,-18,-58,1,-59C20,-60,40,-63,48,-58Z" transform="translate(100 100)"/>`) },
  { id: "blob-3", label: "Blob", group: "Blobs", w: 200, h: 200, svg: wrap("0 0 200 200", `<path fill="#a7d8c9" d="M40,-52C54,-42,68,-31,71,-17C74,-3,67,13,57,28C47,43,34,56,17,62C0,68,-21,67,-38,58C-55,49,-68,32,-71,14C-74,-5,-67,-25,-55,-37C-43,-49,-26,-53,-8,-55C9,-57,27,-62,40,-52Z" transform="translate(100 100)"/>`) },
  { id: "blob-4", label: "Blob", group: "Blobs", w: 200, h: 200, svg: wrap("0 0 200 200", `<path fill="#c3b1e1" d="M43,-54C56,-45,67,-32,70,-17C73,-2,68,15,58,29C48,43,33,53,16,59C-1,65,-20,67,-36,59C-52,51,-65,33,-69,14C-73,-5,-68,-25,-56,-37C-44,-50,-25,-54,-6,-56C13,-58,30,-63,43,-54Z" transform="translate(100 100)"/>`) },
  // Sparkles
  { id: "sparkle-1", label: "Sparkle", group: "Sparkles", w: 120, h: 120, svg: wrap("0 0 120 120", `<path fill="#f7c948" d="M60 6 L70 50 L114 60 L70 70 L60 114 L50 70 L6 60 L50 50 Z"/>`) },
  { id: "sparkle-2", label: "4-point", group: "Sparkles", w: 120, h: 120, svg: wrap("0 0 120 120", `<path fill="#e8559a" d="M60 10 C62 42 78 58 110 60 C78 62 62 78 60 110 C58 78 42 62 10 60 C42 58 58 42 60 10 Z"/>`) },
  { id: "sparkle-3", label: "Stars", group: "Sparkles", w: 160, h: 120, svg: wrap("0 0 160 120", `<path fill="#f7c948" d="M40 20 L46 40 L66 46 L46 52 L40 72 L34 52 L14 46 L34 40 Z"/><path fill="#e8559a" d="M110 50 L115 66 L131 71 L115 76 L110 92 L105 76 L89 71 L105 66 Z"/>`) },
  // Hearts
  { id: "heart-1", label: "Heart", group: "Hearts", w: 120, h: 110, svg: wrap("0 0 120 110", `<path fill="#e8559a" d="M60 100 C20 70 6 48 6 30 C6 14 18 4 32 4 C44 4 54 12 60 24 C66 12 76 4 88 4 C102 4 114 14 114 30 C114 48 100 70 60 100 Z"/>`) },
  { id: "heart-2", label: "Heart outline", group: "Hearts", w: 120, h: 110, svg: wrap("0 0 120 110", `<path fill="none" stroke="#e8559a" stroke-width="6" d="M60 100 C20 70 6 48 6 30 C6 14 18 4 32 4 C44 4 54 12 60 24 C66 12 76 4 88 4 C102 4 114 14 114 30 C114 48 100 70 60 100 Z"/>`) },
  // Speech bubbles
  { id: "speech-1", label: "Speech", group: "Bubbles", w: 160, h: 120, svg: wrap("0 0 160 120", `<path fill="#f4978e" d="M20 10 H140 a14 14 0 0 1 14 14 V74 a14 14 0 0 1 -14 14 H58 L34 110 V88 H20 a14 14 0 0 1 -14 -14 V24 a14 14 0 0 1 14 -14 Z"/>`) },
  { id: "speech-2", label: "Thought", group: "Bubbles", w: 160, h: 130, svg: wrap("0 0 160 130", `<ellipse cx="84" cy="50" rx="68" ry="42" fill="#f4978e"/><circle cx="44" cy="104" r="12" fill="#f4978e"/><circle cx="26" cy="120" r="7" fill="#f4978e"/>`) },
  { id: "speech-3", label: "Burst", group: "Bubbles", w: 150, h: 130, svg: wrap("0 0 150 130", `<path fill="#f7c948" d="M75 4 L88 28 L116 18 L110 47 L140 54 L116 70 L134 94 L104 92 L100 122 L78 102 L54 120 L50 90 L20 94 L36 68 L8 56 L36 46 L26 18 L56 28 Z"/>`) },
  // Dividers
  { id: "divider-1", label: "Divider", group: "Dividers", w: 240, h: 30, svg: wrap("0 0 240 30", `<path fill="none" stroke="#b08968" stroke-width="3" stroke-linecap="round" d="M10 15 H90 M150 15 H230"/><path fill="#b08968" d="M120 6 l8 9 -8 9 -8 -9 Z"/>`) },
  { id: "divider-2", label: "Swirl line", group: "Dividers", w: 240, h: 40, svg: wrap("0 0 240 40", `<path fill="none" stroke="#b08968" stroke-width="3" stroke-linecap="round" d="M10 20 C40 4 60 36 90 20 S150 4 180 20 220 36 232 20"/>`) },
  { id: "divider-3", label: "Dotted", group: "Dividers", w: 240, h: 20, svg: wrap("0 0 240 20", `<line x1="10" y1="10" x2="230" y2="10" stroke="#d4a373" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 14"/>`) },
  // Curvy arrows
  { id: "arrow-curl", label: "Curvy arrow", group: "Arrows", w: 160, h: 120, svg: wrap("0 0 160 120", `<path fill="none" stroke="#5c5c5c" stroke-width="5" stroke-linecap="round" d="M20 100 C30 40 80 20 130 30"/><path fill="#5c5c5c" d="M130 30 l-22 -8 6 22 Z"/>`) },
  { id: "arrow-loop", label: "Loop arrow", group: "Arrows", w: 160, h: 120, svg: wrap("0 0 160 120", `<path fill="none" stroke="#5c5c5c" stroke-width="5" stroke-linecap="round" d="M20 90 C20 30 120 30 120 70 C120 95 70 95 80 60"/><path fill="#5c5c5c" d="M80 60 l-14 -16 22 -2 Z"/>`) },
  { id: "arrow-scribble", label: "Scribble circle", group: "Arrows", w: 160, h: 140, svg: wrap("0 0 160 140", `<path fill="none" stroke="#e8559a" stroke-width="4" stroke-linecap="round" d="M120 30 C40 10 20 80 70 100 C130 120 140 50 80 40 C40 32 40 70 70 78"/>`) },
  // Frames
  { id: "frame-1", label: "Frame", group: "Frames", w: 200, h: 150, svg: wrap("0 0 200 150", `<rect x="8" y="8" width="184" height="134" rx="6" fill="none" stroke="#b08968" stroke-width="4"/><rect x="18" y="18" width="164" height="114" rx="3" fill="none" stroke="#b08968" stroke-width="1.5"/>`) },
  { id: "frame-2", label: "Dashed frame", group: "Frames", w: 200, h: 150, svg: wrap("0 0 200 150", `<rect x="10" y="10" width="180" height="130" rx="10" fill="none" stroke="#e8559a" stroke-width="3" stroke-dasharray="10 8"/>`) },
  { id: "frame-corner", label: "Corner deco", group: "Frames", w: 120, h: 120, svg: wrap("0 0 120 120", `<path fill="none" stroke="#d4a373" stroke-width="4" stroke-linecap="round" d="M16 60 C16 30 30 16 60 16 M24 24 C40 8 70 12 84 26"/>`) },
  { id: "banner-1", label: "Banner", group: "Frames", w: 220, h: 90, svg: wrap("0 0 220 90", `<path fill="#e8559a" d="M20 20 H200 L186 45 L200 70 H20 L34 45 Z"/>`) },
  { id: "banner-2", label: "Ribbon", group: "Frames", w: 220, h: 80, svg: wrap("0 0 220 80", `<rect x="30" y="20" width="160" height="40" fill="#f7c948"/><path fill="#d4a017" d="M30 20 L10 40 L30 60 Z M190 20 L210 40 L190 60 Z"/>`) },

  // Scribbles & doodles
  { id: "scribble-circle", label: "Scribble circle", group: "Doodles", w: 180, h: 150, svg: wrap("0 0 180 150", `<path fill="none" stroke="#c08552" stroke-width="2.5" stroke-linecap="round" d="M120 28 C56 8 24 56 36 90 C48 124 120 132 140 96 C158 64 120 36 78 40 C44 43 38 78 64 90 C92 103 120 80 104 58"/>`) },
  { id: "scribble-oval", label: "Loose oval", group: "Doodles", w: 180, h: 130, svg: wrap("0 0 180 130", `<path fill="none" stroke="#d98c8c" stroke-width="2" d="M90 16 C140 16 168 44 166 70 C164 100 124 118 86 116 C44 114 14 92 16 62 C18 34 52 18 92 18 C128 18 156 40 156 66"/>`) },
  { id: "corner-organic", label: "Organic corner", group: "Doodles", w: 150, h: 150, svg: wrap("0 0 150 150", `<path fill="#b08968" d="M150 0 V150 C120 140 130 96 108 84 C84 71 70 96 58 74 C47 54 78 44 84 22 C88 8 96 4 110 0 Z"/>`) },
  { id: "rounded-black", label: "Rounded block", group: "Doodles", w: 160, h: 130, svg: wrap("0 0 160 130", `<rect x="8" y="8" width="144" height="114" rx="26" fill="#16181d"/>`) },
  { id: "blob-orange", label: "Paint blob", group: "Blobs", w: 200, h: 160, svg: wrap("0 0 200 160", `<path fill="#f59e0b" d="M30 40 C50 18 150 10 176 40 C198 66 188 120 160 138 C128 158 44 152 24 124 C6 98 12 62 30 40 Z"/>`) },

  // 3D balloon
  { id: "balloon-3d", label: "3D balloon", group: "Balloons", w: 120, h: 180, svg: wrap("0 0 120 180", `<defs><radialGradient id="bg3d" cx="38%" cy="32%" r="70%"><stop offset="0%" stop-color="#9ad0ff"/><stop offset="55%" stop-color="#3b9eff"/><stop offset="100%" stop-color="#1f6fd6"/></radialGradient></defs><path d="M60 132 C30 132 16 96 16 70 C16 36 36 12 60 12 C84 12 104 36 104 70 C104 96 90 132 60 132 Z" fill="url(#bg3d)"/><path d="M60 132 l-7 12 h14 Z" fill="#1f6fd6"/><path d="M60 144 C66 156 54 164 60 178" fill="none" stroke="#9aa0a6" stroke-width="2"/><ellipse cx="44" cy="42" rx="9" ry="14" fill="#ffffff" opacity="0.45"/>`) },
  { id: "balloon-pair", label: "Balloon pair", group: "Balloons", w: 150, h: 190, svg: wrap("0 0 150 190", `<defs><radialGradient id="bgp1" cx="38%" cy="30%" r="70%"><stop offset="0%" stop-color="#ff9ec4"/><stop offset="100%" stop-color="#e8559a"/></radialGradient><radialGradient id="bgp2" cx="38%" cy="30%" r="70%"><stop offset="0%" stop-color="#ffd98a"/><stop offset="100%" stop-color="#f7a900"/></radialGradient></defs><path d="M52 120 C28 120 18 90 18 68 C18 40 34 20 52 20 C70 20 86 40 86 68 C86 90 76 120 52 120 Z" fill="url(#bgp1)"/><path d="M104 134 C84 134 76 108 76 88 C76 64 90 46 104 46 C118 46 132 64 132 88 C132 108 124 134 104 134 Z" fill="url(#bgp2)"/><path d="M52 120 C56 150 100 150 104 134" fill="none" stroke="#9aa0a6" stroke-width="2"/><path d="M52 120 C50 160 60 170 56 188" fill="none" stroke="#9aa0a6" stroke-width="2"/>`) },

  // Network / connection
  { id: "network", label: "Network", group: "Diagrams", w: 180, h: 180, svg: wrap("0 0 180 180", `<g stroke="#e23b4e" stroke-width="3" fill="none"><line x1="90" y1="90" x2="90" y2="28"/><line x1="90" y1="90" x2="144" y2="58"/><line x1="90" y1="90" x2="144" y2="122"/><line x1="90" y1="90" x2="90" y2="152"/><line x1="90" y1="90" x2="36" y2="122"/><line x1="90" y1="90" x2="36" y2="58"/></g><g fill="#fff" stroke="#e23b4e" stroke-width="3"><circle cx="90" cy="90" r="16"/><circle cx="90" cy="24" r="11"/><circle cx="148" cy="56" r="11"/><circle cx="148" cy="124" r="11"/><circle cx="90" cy="156" r="11"/><circle cx="32" cy="124" r="11"/><circle cx="32" cy="56" r="11"/></g>`) },
  { id: "timeline", label: "Timeline", group: "Diagrams", w: 260, h: 70, svg: wrap("0 0 260 70", `<line x1="16" y1="35" x2="244" y2="35" stroke="#2dd4bf" stroke-width="3"/><circle cx="40" cy="35" r="9" fill="#2dd4bf"/><circle cx="100" cy="35" r="9" fill="#22c55e"/><circle cx="160" cy="35" r="9" fill="#a78bfa"/><circle cx="220" cy="35" r="9" fill="#f7c948"/>`) },
  { id: "steps", label: "Step arrows", group: "Diagrams", w: 260, h: 60, svg: wrap("0 0 260 60", `<g fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"><path d="M20 30 H70"/><path d="M64 22 L76 30 L64 38"/><path d="M100 30 H150"/><path d="M144 22 L156 30 L144 38"/><path d="M180 30 H230"/><path d="M224 22 L236 30 L224 38"/></g>`) },

  // Scenic frame
  { id: "scene-frame", label: "Scenic frame", group: "Frames", w: 170, h: 150, svg: wrap("0 0 170 150", `<defs><clipPath id="sc"><rect x="8" y="8" width="154" height="134" rx="20"/></clipPath></defs><g clip-path="url(#sc)"><rect x="8" y="8" width="154" height="134" fill="#cfe8f5"/><circle cx="118" cy="44" r="16" fill="#fff3b0"/><path d="M8 120 C50 92 86 120 120 100 C140 88 162 104 162 104 V142 H8 Z" fill="#9ccc81"/><path d="M8 132 C44 112 96 134 124 116 C146 102 162 118 162 118 V142 H8 Z" fill="#6fae5a"/></g><rect x="8" y="8" width="154" height="134" rx="20" fill="none" stroke="#fff" stroke-width="4"/>`) },

  // Extra dividers
  { id: "divider-swirl-sm", label: "Swirl divider", group: "Dividers", w: 200, h: 30, svg: wrap("0 0 200 30", `<path fill="none" stroke="#5c5c5c" stroke-width="2.5" stroke-linecap="round" d="M30 15 C40 5 50 25 60 15 M140 15 C150 5 160 25 170 15 M70 15 H130"/>`) },
  { id: "divider-stars", label: "Star divider", group: "Dividers", w: 220, h: 30, svg: wrap("0 0 220 30", `<line x1="10" y1="15" x2="92" y2="15" stroke="#d4a373" stroke-width="2"/><line x1="128" y1="15" x2="210" y2="15" stroke="#d4a373" stroke-width="2"/><path fill="#d4a373" d="M110 5 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z"/>`) },
];

export const SVG_GROUPS = [...new Set(SVG_GRAPHICS.map((g) => g.group))];

export const TOTAL_GRAPHICS = TOTAL_EMOJI + SVG_GRAPHICS.length;
