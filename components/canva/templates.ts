import type { CanvaElement, CanvaPage } from "@/types/canva";
import { uid } from "@/types/canva";

// Element specs without ids — ids are assigned when a template is instantiated
type ElSpec = Omit<CanvaElement, "id">;

interface PageSpec {
  background: string;
  elements: ElSpec[];
}

export interface CanvaTemplate {
  id: string;
  label: string;
  category: string;
  formatId: string;
  width: number;
  height: number;
  pages: PageSpec[];
}

function txt(p: Partial<ElSpec> & { text: string; x: number; y: number; w: number; fontSize: number }): ElSpec {
  return {
    type: "text",
    h: p.h ?? Math.round(p.fontSize * 1.4),
    rotation: 0,
    opacity: 1,
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    textAlign: "left",
    lineHeight: 1.3,
    color: "#1a1a1a",
    ...p,
  };
}

function shape(type: "rect" | "ellipse" | "triangle", p: Partial<ElSpec> & { x: number; y: number; w: number; h: number; fill: string }): ElSpec {
  return { type, rotation: 0, opacity: 1, radius: 0, ...p };
}

const POPPINS = "'Poppins', sans-serif";
const PLAYFAIR = "'Playfair Display', serif";
const BEBAS = "'Bebas Neue', sans-serif";
const DANCING = "'Dancing Script', cursive";
const ZCOOL = "'ZCOOL KuaiLe', sans-serif";

export const CANVA_TEMPLATES: CanvaTemplate[] = [
  // ── Social Media ────────────────────────────────────────────────────────────
  {
    id: "ig-grand-opening",
    label: "Grand Opening",
    category: "Social Media",
    formatId: "instagram-post",
    width: 1080,
    height: 1080,
    pages: [
      {
        background: "#fde7ef",
        elements: [
          shape("ellipse", { x: 760, y: -180, w: 520, h: 520, fill: "#f6b6cd", opacity: 0.7 }),
          shape("ellipse", { x: -160, y: 760, w: 460, h: 460, fill: "#f6b6cd", opacity: 0.5 }),
          txt({ text: "WE ARE", x: 90, y: 270, w: 900, fontSize: 44, fontFamily: POPPINS, fontWeight: 600, textAlign: "center", letterSpacing: 10, color: "#b03d68" }),
          txt({ text: "Grand Opening", x: 90, y: 340, w: 900, fontSize: 110, fontFamily: PLAYFAIR, fontWeight: 700, textAlign: "center", color: "#1a1a1a" }),
          txt({ text: "Join us to celebrate our new store\nSaturday, 10:00 AM", x: 190, y: 560, w: 700, fontSize: 36, textAlign: "center", color: "#4a4a4a", lineHeight: 1.5 }),
          shape("rect", { x: 390, y: 760, w: 300, h: 80, fill: "#d24e7e", radius: 40 }),
          txt({ text: "SEE YOU THERE", x: 390, y: 784, w: 300, fontSize: 26, fontWeight: 600, textAlign: "center", color: "#ffffff", letterSpacing: 2 }),
        ],
      },
    ],
  },
  {
    id: "ig-quote",
    label: "Inspirational Quote",
    category: "Social Media",
    formatId: "instagram-post",
    width: 1080,
    height: 1080,
    pages: [
      {
        background: "#10222e",
        elements: [
          txt({ text: "“", x: 80, y: 90, w: 220, fontSize: 280, fontFamily: PLAYFAIR, fontWeight: 700, color: "#d9a64e", h: 240 }),
          txt({ text: "Great things are done by a series of small things brought together.", x: 120, y: 360, w: 840, fontSize: 60, fontFamily: PLAYFAIR, fontStyle: "italic", textAlign: "center", color: "#ffffff", lineHeight: 1.45 }),
          shape("rect", { x: 480, y: 720, w: 120, h: 4, fill: "#d9a64e" }),
          txt({ text: "— VINCENT VAN GOGH", x: 240, y: 770, w: 600, fontSize: 28, textAlign: "center", color: "#9db4c0", letterSpacing: 4 }),
        ],
      },
    ],
  },
  {
    id: "story-sale",
    label: "Flash Sale Story",
    category: "Social Media",
    formatId: "instagram-story",
    width: 1080,
    height: 1920,
    pages: [
      {
        background: "#f7c948",
        elements: [
          shape("rect", { x: 60, y: 60, w: 960, h: 1800, fill: "transparent", stroke: "#1a1a1a", strokeWidth: 6 }),
          txt({ text: "FLASH SALE", x: 90, y: 430, w: 900, fontSize: 140, fontFamily: BEBAS, textAlign: "center", color: "#1a1a1a", letterSpacing: 8 }),
          txt({ text: "50% OFF", x: 90, y: 660, w: 900, fontSize: 230, fontFamily: BEBAS, textAlign: "center", color: "#d7263d", h: 280 }),
          txt({ text: "EVERYTHING MUST GO", x: 140, y: 990, w: 800, fontSize: 48, fontWeight: 600, textAlign: "center", color: "#1a1a1a", letterSpacing: 6 }),
          shape("rect", { x: 290, y: 1250, w: 500, h: 110, fill: "#1a1a1a", radius: 55 }),
          txt({ text: "SHOP NOW", x: 290, y: 1285, w: 500, fontSize: 40, fontWeight: 600, textAlign: "center", color: "#f7c948", letterSpacing: 4 }),
          txt({ text: "This weekend only · While stocks last", x: 190, y: 1450, w: 700, fontSize: 30, textAlign: "center", color: "#5a4a10" }),
        ],
      },
    ],
  },
  {
    id: "fb-cover",
    label: "Brand Cover",
    category: "Social Media",
    formatId: "facebook-cover",
    width: 1640,
    height: 924,
    pages: [
      {
        background: "#0f3d3e",
        elements: [
          shape("ellipse", { x: 1180, y: -220, w: 700, h: 700, fill: "#145e5f", opacity: 0.8 }),
          shape("ellipse", { x: -260, y: 500, w: 640, h: 640, fill: "#145e5f", opacity: 0.6 }),
          txt({ text: "HALO BALLOON", x: 320, y: 330, w: 1000, fontSize: 96, fontFamily: BEBAS, textAlign: "center", color: "#ffffff", letterSpacing: 14 }),
          txt({ text: "Balloons · Events · Celebrations", x: 420, y: 480, w: 800, fontSize: 36, textAlign: "center", color: "#9fd8c9", letterSpacing: 3 }),
          shape("rect", { x: 720, y: 580, w: 200, h: 5, fill: "#d9a64e" }),
        ],
      },
    ],
  },

  // ── Presentations ───────────────────────────────────────────────────────────
  {
    id: "pitch-deck",
    label: "Pitch Deck",
    category: "Presentation",
    formatId: "presentation",
    width: 1920,
    height: 1080,
    pages: [
      {
        background: "#101820",
        elements: [
          shape("rect", { x: 0, y: 0, w: 24, h: 1080, fill: "#f2aa4c" }),
          txt({ text: "COMPANY NAME", x: 160, y: 300, w: 800, fontSize: 36, fontWeight: 600, color: "#f2aa4c", letterSpacing: 8 }),
          txt({ text: "The Future of\nYour Industry", x: 160, y: 380, w: 1300, fontSize: 130, fontWeight: 700, color: "#ffffff", lineHeight: 1.15, h: 340 }),
          txt({ text: "Investor Pitch · 2026", x: 160, y: 780, w: 700, fontSize: 34, color: "#8a97a3" }),
        ],
      },
      {
        background: "#ffffff",
        elements: [
          shape("rect", { x: 0, y: 0, w: 24, h: 1080, fill: "#f2aa4c" }),
          txt({ text: "The Problem", x: 160, y: 120, w: 1000, fontSize: 84, fontWeight: 700, color: "#101820" }),
          shape("rect", { x: 160, y: 320, w: 760, h: 560, fill: "#f5f6f8", radius: 24 }),
          txt({ text: "01", x: 230, y: 390, w: 200, fontSize: 64, fontWeight: 700, color: "#f2aa4c" }),
          txt({ text: "Describe the first pain point your customers face today and why existing solutions fall short.", x: 230, y: 500, w: 620, fontSize: 34, color: "#3c4650", lineHeight: 1.5, h: 280 }),
          shape("rect", { x: 1000, y: 320, w: 760, h: 560, fill: "#101820", radius: 24 }),
          txt({ text: "02", x: 1070, y: 390, w: 200, fontSize: 64, fontWeight: 700, color: "#f2aa4c" }),
          txt({ text: "Explain the cost of this problem — time, money, or missed opportunity — with a number if you have one.", x: 1070, y: 500, w: 620, fontSize: 34, color: "#cdd5dc", lineHeight: 1.5, h: 280 }),
        ],
      },
      {
        background: "#101820",
        elements: [
          txt({ text: "Thank You", x: 310, y: 380, w: 1300, fontSize: 160, fontFamily: PLAYFAIR, fontWeight: 700, textAlign: "center", color: "#ffffff" }),
          txt({ text: "hello@company.com · +60 12-345 6789", x: 460, y: 660, w: 1000, fontSize: 36, textAlign: "center", color: "#f2aa4c" }),
        ],
      },
    ],
  },
  {
    id: "minimal-deck",
    label: "Minimal Deck",
    category: "Presentation",
    formatId: "presentation",
    width: 1920,
    height: 1080,
    pages: [
      {
        background: "#fafaf7",
        elements: [
          txt({ text: "A Clean,\nMinimal Presentation", x: 160, y: 330, w: 1400, fontSize: 120, fontFamily: PLAYFAIR, fontWeight: 700, color: "#23211c", lineHeight: 1.2, h: 320 }),
          shape("rect", { x: 160, y: 720, w: 140, h: 6, fill: "#23211c" }),
          txt({ text: "Your Name · June 2026", x: 160, y: 770, w: 800, fontSize: 32, color: "#8c8678" }),
        ],
      },
      {
        background: "#fafaf7",
        elements: [
          txt({ text: "Agenda", x: 160, y: 120, w: 800, fontSize: 80, fontFamily: PLAYFAIR, fontWeight: 700, color: "#23211c" }),
          txt({ text: "1.  Introduction\n2.  Where we are today\n3.  Where we are going\n4.  How we get there\n5.  Q&A", x: 160, y: 320, w: 1200, fontSize: 48, color: "#3f3b32", lineHeight: 1.9, h: 480 }),
        ],
      },
    ],
  },

  // ── Docs ────────────────────────────────────────────────────────────────────
  {
    id: "resume-modern",
    label: "Modern Resume",
    category: "Docs",
    formatId: "resume",
    width: 794,
    height: 1123,
    pages: [
      {
        background: "#ffffff",
        elements: [
          shape("rect", { x: 0, y: 0, w: 794, h: 190, fill: "#15323d" }),
          txt({ text: "YOUR NAME", x: 56, y: 50, w: 600, fontSize: 44, fontWeight: 700, color: "#ffffff", letterSpacing: 4 }),
          txt({ text: "Marketing Manager · Kuala Lumpur · you@email.com · +60 12-345 6789", x: 56, y: 120, w: 690, fontSize: 15, color: "#a8c0ca" }),
          txt({ text: "EXPERIENCE", x: 56, y: 240, w: 300, fontSize: 18, fontWeight: 700, color: "#15323d", letterSpacing: 3 }),
          shape("rect", { x: 56, y: 270, w: 682, h: 2, fill: "#d7dee2" }),
          txt({ text: "Senior Marketing Executive — Company Sdn Bhd", x: 56, y: 295, w: 600, fontSize: 18, fontWeight: 600, color: "#1a1a1a" }),
          txt({ text: "2022 – Present", x: 580, y: 297, w: 158, fontSize: 14, textAlign: "right", color: "#7a868d" }),
          txt({ text: "• Led campaigns that grew revenue 40% year over year\n• Managed a team of 5 across content, design, and paid media\n• Launched 3 product lines with full go-to-market plans", x: 56, y: 330, w: 660, fontSize: 15, color: "#3c4650", lineHeight: 1.7, h: 110 }),
          txt({ text: "Marketing Executive — Another Co", x: 56, y: 470, w: 600, fontSize: 18, fontWeight: 600, color: "#1a1a1a" }),
          txt({ text: "2019 – 2022", x: 580, y: 472, w: 158, fontSize: 14, textAlign: "right", color: "#7a868d" }),
          txt({ text: "• Ran social media accounts reaching 100k followers\n• Coordinated 20+ events and product launches", x: 56, y: 505, w: 660, fontSize: 15, color: "#3c4650", lineHeight: 1.7, h: 80 }),
          txt({ text: "EDUCATION", x: 56, y: 630, w: 300, fontSize: 18, fontWeight: 700, color: "#15323d", letterSpacing: 3 }),
          shape("rect", { x: 56, y: 660, w: 682, h: 2, fill: "#d7dee2" }),
          txt({ text: "BBA Marketing — University of Malaya", x: 56, y: 685, w: 600, fontSize: 18, fontWeight: 600, color: "#1a1a1a" }),
          txt({ text: "2015 – 2019", x: 580, y: 687, w: 158, fontSize: 14, textAlign: "right", color: "#7a868d" }),
          txt({ text: "SKILLS", x: 56, y: 780, w: 300, fontSize: 18, fontWeight: 700, color: "#15323d", letterSpacing: 3 }),
          shape("rect", { x: 56, y: 810, w: 682, h: 2, fill: "#d7dee2" }),
          txt({ text: "Digital Marketing · SEO/SEM · Adobe Creative Suite · Canva · Google Analytics · Team Leadership · Copywriting", x: 56, y: 835, w: 660, fontSize: 15, color: "#3c4650", lineHeight: 1.7, h: 60 }),
        ],
      },
    ],
  },
  {
    id: "doc-letterhead",
    label: "Letterhead Doc",
    category: "Docs",
    formatId: "doc-a4",
    width: 794,
    height: 1123,
    pages: [
      {
        background: "#ffffff",
        elements: [
          shape("rect", { x: 0, y: 0, w: 794, h: 12, fill: "#d24e7e" }),
          txt({ text: "COMPANY NAME", x: 56, y: 56, w: 400, fontSize: 26, fontWeight: 700, color: "#1a1a1a", letterSpacing: 3 }),
          txt({ text: "123 Jalan Example, 50000 Kuala Lumpur · +60 3-1234 5678", x: 56, y: 96, w: 600, fontSize: 13, color: "#7a868d" }),
          shape("rect", { x: 56, y: 130, w: 682, h: 1, fill: "#e2e6e9" }),
          txt({ text: "12 June 2026", x: 56, y: 170, w: 300, fontSize: 15, color: "#3c4650" }),
          txt({ text: "Dear Sir/Madam,", x: 56, y: 230, w: 400, fontSize: 15, color: "#1a1a1a" }),
          txt({ text: "Start typing the body of your letter here. Double-click any text to edit it, drag to reposition, and use the toolbar to change fonts and sizes.\n\nThis document is a starting point — add headings, lists, images, or your signature as needed.", x: 56, y: 275, w: 682, fontSize: 15, color: "#3c4650", lineHeight: 1.8, h: 220 }),
          txt({ text: "Yours sincerely,", x: 56, y: 560, w: 300, fontSize: 15, color: "#1a1a1a" }),
          txt({ text: "Your Name", x: 56, y: 640, w: 300, fontSize: 17, fontWeight: 600, color: "#1a1a1a" }),
        ],
      },
    ],
  },

  // ── Marketing ───────────────────────────────────────────────────────────────
  {
    id: "event-poster",
    label: "Event Poster",
    category: "Marketing",
    formatId: "poster",
    width: 1414,
    height: 2000,
    pages: [
      {
        background: "#1c1430",
        elements: [
          shape("ellipse", { x: 920, y: -260, w: 800, h: 800, fill: "#5b2a86", opacity: 0.55 }),
          shape("ellipse", { x: -300, y: 1500, w: 900, h: 900, fill: "#5b2a86", opacity: 0.4 }),
          txt({ text: "LIVE MUSIC NIGHT", x: 107, y: 280, w: 1200, fontSize: 60, fontWeight: 600, textAlign: "center", color: "#e3b341", letterSpacing: 12 }),
          txt({ text: "SUMMER\nFESTIVAL", x: 107, y: 420, w: 1200, fontSize: 230, fontFamily: BEBAS, textAlign: "center", color: "#ffffff", lineHeight: 1.05, h: 520 }),
          shape("rect", { x: 557, y: 1030, w: 300, h: 6, fill: "#e3b341" }),
          txt({ text: "SAT 20 JUNE · 7 PM TILL LATE", x: 207, y: 1120, w: 1000, fontSize: 52, fontWeight: 600, textAlign: "center", color: "#ffffff", letterSpacing: 3 }),
          txt({ text: "Central Park Amphitheatre", x: 307, y: 1220, w: 800, fontSize: 40, textAlign: "center", color: "#b9a7d8" }),
          shape("rect", { x: 482, y: 1500, w: 450, h: 110, fill: "#e3b341", radius: 55 }),
          txt({ text: "GET TICKETS", x: 482, y: 1532, w: 450, fontSize: 42, fontWeight: 700, textAlign: "center", color: "#1c1430", letterSpacing: 3 }),
        ],
      },
    ],
  },
  {
    id: "invitation-elegant",
    label: "Elegant Invitation",
    category: "Marketing",
    formatId: "invitation",
    width: 1400,
    height: 2000,
    pages: [
      {
        background: "#fdf8f2",
        elements: [
          shape("rect", { x: 70, y: 70, w: 1260, h: 1860, fill: "transparent", stroke: "#c9a86a", strokeWidth: 3 }),
          shape("rect", { x: 95, y: 95, w: 1210, h: 1810, fill: "transparent", stroke: "#c9a86a", strokeWidth: 1 }),
          txt({ text: "You're Invited", x: 200, y: 320, w: 1000, fontSize: 110, fontFamily: DANCING, fontWeight: 600, textAlign: "center", color: "#a8743c" }),
          txt({ text: "TO CELEBRATE THE WEDDING OF", x: 300, y: 560, w: 800, fontSize: 30, textAlign: "center", color: "#8c8678", letterSpacing: 6 }),
          txt({ text: "Sarah & Daniel", x: 150, y: 680, w: 1100, fontSize: 130, fontFamily: PLAYFAIR, fontWeight: 700, textAlign: "center", color: "#3d3428" }),
          shape("rect", { x: 600, y: 920, w: 200, h: 3, fill: "#c9a86a" }),
          txt({ text: "SATURDAY, 12 SEPTEMBER 2026\nAT HALF PAST SIX IN THE EVENING", x: 250, y: 1000, w: 900, fontSize: 36, textAlign: "center", color: "#5a5142", lineHeight: 1.8, h: 160 }),
          txt({ text: "The Glasshouse Garden\nKuala Lumpur", x: 350, y: 1250, w: 700, fontSize: 40, fontFamily: PLAYFAIR, fontStyle: "italic", textAlign: "center", color: "#3d3428", lineHeight: 1.6, h: 140 }),
          txt({ text: "Dinner & dancing to follow", x: 400, y: 1560, w: 600, fontSize: 30, fontFamily: DANCING, textAlign: "center", color: "#a8743c" }),
        ],
      },
    ],
  },
  {
    id: "business-card-halo",
    label: "Business Card",
    category: "Marketing",
    formatId: "business-card",
    width: 1050,
    height: 600,
    pages: [
      {
        background: "#ffffff",
        elements: [
          shape("rect", { x: 0, y: 0, w: 360, h: 600, fill: "#f6b6cd" }),
          shape("ellipse", { x: 80, y: 200, w: 200, h: 200, fill: "#ffffff", opacity: 0.4 }),
          txt({ text: "Your Name", x: 430, y: 170, w: 540, fontSize: 56, fontWeight: 700, color: "#1a1a1a" }),
          txt({ text: "FOUNDER & CREATIVE DIRECTOR", x: 432, y: 260, w: 540, fontSize: 22, color: "#b03d68", letterSpacing: 3 }),
          shape("rect", { x: 432, y: 320, w: 80, h: 4, fill: "#f6b6cd" }),
          txt({ text: "+60 16-301 4913\nhello@yourcompany.com\nwww.yourcompany.com", x: 432, y: 370, w: 500, fontSize: 26, color: "#4a4a4a", lineHeight: 1.7, h: 140 }),
        ],
      },
    ],
  },

  // ── Whiteboard ──────────────────────────────────────────────────────────────
  {
    id: "brainstorm-board",
    label: "Brainstorm Board",
    category: "Whiteboard",
    formatId: "whiteboard",
    width: 2560,
    height: 1440,
    pages: [
      {
        background: "#f8f9fa",
        elements: [
          txt({ text: "Brainstorm: New Ideas 💡", x: 80, y: 60, w: 1200, fontSize: 64, fontWeight: 700, color: "#1a1a1a" }),
          shape("rect", { x: 80, y: 180, w: 560, h: 5, fill: "#1a1a1a" }),
          shape("rect", { x: 120, y: 280, w: 420, h: 420, fill: "#fff3b0", radius: 8, rotation: -2 }),
          txt({ text: "Idea #1\n\nWrite your first idea here…", x: 160, y: 330, w: 340, fontSize: 32, color: "#5a4a10", lineHeight: 1.5, h: 320, rotation: -2 }),
          shape("rect", { x: 620, y: 320, w: 420, h: 420, fill: "#c8e6c9", radius: 8, rotation: 1.5 }),
          txt({ text: "Idea #2\n\nWhat else could work?", x: 660, y: 370, w: 340, fontSize: 32, color: "#1d4d22", lineHeight: 1.5, h: 320, rotation: 1.5 }),
          shape("rect", { x: 1120, y: 280, w: 420, h: 420, fill: "#bbdefb", radius: 8, rotation: -1 }),
          txt({ text: "Idea #3\n\nAdd supporting notes here", x: 1160, y: 330, w: 340, fontSize: 32, color: "#0d3a66", lineHeight: 1.5, h: 320, rotation: -1 }),
          shape("rect", { x: 1620, y: 330, w: 420, h: 420, fill: "#f8bbd0", radius: 8, rotation: 2 }),
          txt({ text: "Idea #4\n\nWild card — anything goes!", x: 1660, y: 380, w: 340, fontSize: 32, color: "#7a1f42", lineHeight: 1.5, h: 320, rotation: 2 }),
          shape("rect", { x: 120, y: 820, w: 420, h: 420, fill: "#ffe0b2", radius: 8, rotation: 1 }),
          txt({ text: "To Research\n\n• Question 1\n• Question 2", x: 160, y: 870, w: 340, fontSize: 32, color: "#6b3c0a", lineHeight: 1.5, h: 320, rotation: 1 }),
          shape("rect", { x: 620, y: 860, w: 420, h: 420, fill: "#d1c4e9", radius: 8, rotation: -1.5 }),
          txt({ text: "Next Steps\n\n1. Decide\n2. Assign\n3. Ship", x: 660, y: 910, w: 340, fontSize: 32, color: "#3a2a66", lineHeight: 1.5, h: 320, rotation: -1.5 }),
        ],
      },
    ],
  },

  // ── Website ─────────────────────────────────────────────────────────────────
  {
    id: "landing-page",
    label: "Landing Page",
    category: "Website",
    formatId: "website",
    width: 1440,
    height: 2560,
    pages: [
      {
        background: "#ffffff",
        elements: [
          shape("rect", { x: 0, y: 0, w: 1440, h: 100, fill: "#ffffff", stroke: "#eceff1", strokeWidth: 1 }),
          txt({ text: "BRAND", x: 80, y: 32, w: 300, fontSize: 32, fontWeight: 700, color: "#1a1a1a", letterSpacing: 4 }),
          txt({ text: "Home      Features      Pricing      Contact", x: 760, y: 38, w: 600, fontSize: 22, textAlign: "right", color: "#4a4a4a" }),
          shape("rect", { x: 0, y: 100, w: 1440, h: 800, fill: "#0e2433" }),
          txt({ text: "Build something\npeople love", x: 120, y: 320, w: 900, fontSize: 110, fontWeight: 700, color: "#ffffff", lineHeight: 1.15, h: 280 }),
          txt({ text: "The all-in-one platform that helps your team move faster — from idea to launch.", x: 120, y: 640, w: 760, fontSize: 32, color: "#9fb3c2", lineHeight: 1.5, h: 110 }),
          shape("rect", { x: 120, y: 770, w: 280, h: 80, fill: "#22c1a3", radius: 40 }),
          txt({ text: "Get Started", x: 120, y: 794, w: 280, fontSize: 30, fontWeight: 600, textAlign: "center", color: "#ffffff" }),
          txt({ text: "Why choose us", x: 320, y: 1010, w: 800, fontSize: 64, fontWeight: 700, textAlign: "center", color: "#1a1a1a" }),
          shape("rect", { x: 120, y: 1180, w: 380, h: 420, fill: "#f5f7f8", radius: 24 }),
          shape("ellipse", { x: 270, y: 1240, w: 80, h: 80, fill: "#22c1a3" }),
          txt({ text: "Fast", x: 170, y: 1370, w: 280, fontSize: 38, fontWeight: 700, textAlign: "center", color: "#1a1a1a" }),
          txt({ text: "Launch in minutes with our intuitive tools.", x: 170, y: 1430, w: 280, fontSize: 24, textAlign: "center", color: "#5c6b76", lineHeight: 1.5, h: 110 }),
          shape("rect", { x: 530, y: 1180, w: 380, h: 420, fill: "#f5f7f8", radius: 24 }),
          shape("ellipse", { x: 680, y: 1240, w: 80, h: 80, fill: "#f2aa4c" }),
          txt({ text: "Flexible", x: 580, y: 1370, w: 280, fontSize: 38, fontWeight: 700, textAlign: "center", color: "#1a1a1a" }),
          txt({ text: "Adapts to any workflow your team prefers.", x: 580, y: 1430, w: 280, fontSize: 24, textAlign: "center", color: "#5c6b76", lineHeight: 1.5, h: 110 }),
          shape("rect", { x: 940, y: 1180, w: 380, h: 420, fill: "#f5f7f8", radius: 24 }),
          shape("ellipse", { x: 1090, y: 1240, w: 80, h: 80, fill: "#d24e7e" }),
          txt({ text: "Reliable", x: 990, y: 1370, w: 280, fontSize: 38, fontWeight: 700, textAlign: "center", color: "#1a1a1a" }),
          txt({ text: "99.9% uptime backed by a world-class team.", x: 990, y: 1430, w: 280, fontSize: 24, textAlign: "center", color: "#5c6b76", lineHeight: 1.5, h: 110 }),
          shape("rect", { x: 0, y: 1780, w: 1440, h: 460, fill: "#0e2433" }),
          txt({ text: "Ready to get started?", x: 320, y: 1880, w: 800, fontSize: 64, fontWeight: 700, textAlign: "center", color: "#ffffff" }),
          shape("rect", { x: 570, y: 2020, w: 300, h: 84, fill: "#22c1a3", radius: 42 }),
          txt({ text: "Try It Free", x: 570, y: 2046, w: 300, fontSize: 30, fontWeight: 600, textAlign: "center", color: "#ffffff" }),
          txt({ text: "© 2026 Brand. All rights reserved.", x: 420, y: 2400, w: 600, fontSize: 22, textAlign: "center", color: "#9fb3c2" }),
        ],
      },
    ],
  },

  // ── Chinese greeting (bonus, uses ZCOOL KuaiLe) ─────────────────────────────
  {
    id: "cny-greeting",
    label: "开业大吉 Greeting",
    category: "Social Media",
    formatId: "instagram-post",
    width: 1080,
    height: 1080,
    pages: [
      {
        background: "#b71c1c",
        elements: [
          shape("rect", { x: 60, y: 60, w: 960, h: 960, fill: "transparent", stroke: "#f6c453", strokeWidth: 4 }),
          shape("ellipse", { x: 390, y: 130, w: 300, h: 300, fill: "#f6c453", opacity: 0.18 }),
          txt({ text: "开业大吉", x: 140, y: 330, w: 800, fontSize: 180, fontFamily: ZCOOL, textAlign: "center", color: "#f6c453", h: 240 }),
          txt({ text: "财源广进 · 万事如意", x: 240, y: 620, w: 600, fontSize: 54, fontFamily: ZCOOL, textAlign: "center", color: "#ffffff" }),
          shape("rect", { x: 440, y: 760, w: 200, h: 4, fill: "#f6c453" }),
          txt({ text: "恭祝生意兴隆", x: 340, y: 820, w: 400, fontSize: 40, fontFamily: ZCOOL, textAlign: "center", color: "#ffd9a0" }),
        ],
      },
    ],
  },
];

export function instantiateTemplate(tpl: CanvaTemplate): CanvaPage[] {
  return tpl.pages.map((p) => ({
    id: uid(),
    background: p.background,
    elements: p.elements.map((el) => ({ ...el, id: uid() })),
  }));
}
