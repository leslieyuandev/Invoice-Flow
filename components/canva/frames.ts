// Clip-frame catalog for the Canva editor.
// Each frame is a shaped clip container — empty frames show a placeholder,
// filled frames display the image clipped to the shape.

export interface FrameDef {
  id: string;
  label: string;
  group: "Party Arch" | "Basic" | "Shapes" | "Stars" | "Special";
  clipPath: string; // CSS clip-path value; "" = plain rectangle (no clip)
}

export const FRAME_GROUPS: FrameDef["group"][] = ["Party Arch", "Basic", "Shapes", "Stars", "Special"];

// Generate a smooth arch polygon using many small steps so the curve is
// visually round rather than having visible straight-line segments.
// rx/ry are percentage radii; cy is the y-position of the arch base (% from top).
function smoothArch(ry: number, rx = 50, cy = ry, steps = 72): string {
  const pts: string[] = ["0% 100%"];
  for (let i = 0; i <= steps; i++) {
    const theta = Math.PI * (1 - i / steps); // 180° → 0°
    const x = 50 + rx * Math.cos(theta);
    const y = cy - ry * Math.sin(theta);
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  pts.push("100% 100%");
  return `polygon(${pts.join(", ")})`;
}

// A "long body" arch: a semicircular dome on top with straight vertical sides
// running down to the base. `domeH` is the dome height in % of total height; the
// rest is the straight body. Larger body = smaller domeH.
function archWithBody(domeH: number, rx = 50, steps = 72): string {
  const pts: string[] = ["0% 100%", `0% ${domeH.toFixed(2)}%`];
  for (let i = 0; i <= steps; i++) {
    const theta = Math.PI * (1 - i / steps); // 180° (left) → 0° (right)
    const x = 50 + rx * Math.cos(theta);
    const y = domeH - domeH * Math.sin(theta); // apex at y=0, sides meet body at y=domeH
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  pts.push(`100% ${domeH.toFixed(2)}%`, "100% 100%");
  return `polygon(${pts.join(", ")})`;
}

export const FRAMES: FrameDef[] = [
  // Party Arch — smooth elliptical arches (parametric, 72 steps = 2.5° per segment)
  { id: "arch",       label: "Standard Arch", group: "Party Arch", clipPath: smoothArch(60) },
  { id: "arch-tall",  label: "Tall Arch",     group: "Party Arch", clipPath: smoothArch(70) },
  { id: "arch-wide",  label: "Wide Arch",     group: "Party Arch", clipPath: smoothArch(50) },
  { id: "arch-oval",  label: "Oval Arch",     group: "Party Arch", clipPath: "ellipse(50% 55% at 50% 55%)" },
  // Long-body arches — rounded dome on top, straight vertical sides for the body
  { id: "arch-long",  label: "Long Arch",     group: "Party Arch", clipPath: archWithBody(45) },
  { id: "arch-xlong", label: "Extra Long Arch", group: "Party Arch", clipPath: archWithBody(32) },
  { id: "arch-pillar", label: "Pillar Arch",  group: "Party Arch", clipPath: archWithBody(24) },

  // Basic
  { id: "rect",      label: "Rectangle",  group: "Basic",   clipPath: "" },
  { id: "circle",    label: "Circle",     group: "Basic",   clipPath: "ellipse(50% 50% at 50% 50%)" },
  { id: "rounded",   label: "Rounded",    group: "Basic",   clipPath: "inset(0% round 20%)" },
  { id: "squircle",  label: "Squircle",   group: "Basic",   clipPath: "inset(0% round 40%)" },

  // Shapes
  { id: "diamond",   label: "Diamond",    group: "Shapes",  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { id: "triangle",  label: "Triangle",   group: "Shapes",  clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" },
  { id: "pentagon",  label: "Pentagon",   group: "Shapes",  clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" },
  { id: "hexagon",   label: "Hexagon",    group: "Shapes",  clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
  { id: "octagon",   label: "Octagon",    group: "Shapes",  clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" },
  { id: "parallelogram", label: "Parallelogram", group: "Shapes", clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)" },

  // Stars
  { id: "star4",     label: "4-Point",    group: "Stars",   clipPath: "polygon(50% 0%, 56% 44%, 100% 50%, 56% 56%, 50% 100%, 44% 56%, 0% 50%, 44% 44%)" },
  { id: "star5",     label: "5-Point",    group: "Stars",   clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" },
  { id: "star6",     label: "6-Point",    group: "Stars",   clipPath: "polygon(50% 0%, 56% 38%, 93% 25%, 63% 50%, 93% 75%, 56% 62%, 50% 100%, 44% 62%, 7% 75%, 37% 50%, 7% 25%, 44% 38%)" },
  { id: "star12",    label: "Burst",      group: "Stars",   clipPath: "polygon(50% 0%,53% 16%,62% 6%,61% 22%,74% 16%,68% 31%,84% 29%,73% 41%,90% 44%,75% 53%,90% 59%,74% 64%,83% 76%,66% 77%,70% 91%,55% 87%,55% 100%,45% 87%,30% 91%,34% 77%,17% 76%,26% 64%,10% 59%,25% 53%,10% 44%,27% 41%,16% 29%,32% 31%,26% 16%,39% 22%,38% 6%,47% 16%)" },

  // Special
  { id: "cross",     label: "Cross",      group: "Special", clipPath: "polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)" },
  { id: "arrow",     label: "Arrow",      group: "Special", clipPath: "polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)" },
  { id: "chevron",   label: "Chevron",    group: "Special", clipPath: "polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)" },
  { id: "message",   label: "Message",    group: "Special", clipPath: "polygon(0% 0%, 100% 0%, 100% 75%, 60% 75%, 50% 100%, 40% 75%, 0% 75%)" },
];
