// Balloon graphic templates for the party design editor.
// Colors are substituted at insert time from the selected preset.
// ##PRI## = primary balloon color  ##SEC## = secondary  ##ACC## = accent/third

export interface BalloonPreset {
  label: string;
  pri: string;
  sec: string;
  acc: string;
}

export interface BalloonTemplate {
  id: string;
  label: string;
  svg: string;
}

export const BALLOON_PRESETS: BalloonPreset[] = [
  { label: "Gold & Cream",   pri: "#D4A843", sec: "#F5EDD3", acc: "#C9965A" },
  { label: "Pink & White",   pri: "#F4A0BE", sec: "#FFFFFF", acc: "#F7C6D9" },
  { label: "Blush & Rose",   pri: "#E8637A", sec: "#F4A0BE", acc: "#FFFFFF" },
  { label: "Blue & White",   pri: "#5B9BD5", sec: "#FFFFFF", acc: "#A8CBE8" },
  { label: "Navy & Gold",    pri: "#2C3E6B", sec: "#D4A843", acc: "#FFFFFF" },
  { label: "Green & Gold",   pri: "#7A9E7E", sec: "#F5EDD3", acc: "#D4A843" },
  { label: "Red White Blue", pri: "#C42B2B", sec: "#FFFFFF", acc: "#3A5FC4" },
  { label: "Purple & White", pri: "#9B59B6", sec: "#FFFFFF", acc: "#D7BDE2" },
  { label: "Sage & Cream",   pri: "#7FA383", sec: "#F5EDD3", acc: "#FFFFFF" },
  { label: "Peach & Gold",   pri: "#F7B685", sec: "#D4A843", acc: "#FEF0E7" },
];

export const BALLOON_TEMPLATES: BalloonTemplate[] = [
  {
    id: "b-single",
    label: "Single Balloon",
    svg: `<svg width="100%" height="100%" viewBox="0 0 60 90" xmlns="http://www.w3.org/2000/svg"><ellipse cx="30" cy="30" rx="26" ry="28" fill="##PRI##"/><ellipse cx="19" cy="18" rx="9" ry="11" fill="#fff" opacity=".35"/><ellipse cx="17" cy="16" rx="4" ry="5" fill="#fff" opacity=".5"/><circle cx="30" cy="58" r="3.5" fill="##PRI##"/><path d="M30 61Q27 72 30 85" stroke="#bbb" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "b-trio",
    label: "3-Balloon Bunch",
    svg: `<svg width="100%" height="100%" viewBox="0 0 140 105" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="44" rx="25" ry="28" fill="##SEC##"/><ellipse cx="21" cy="32" rx="8" ry="10" fill="#fff" opacity=".32"/><ellipse cx="70" cy="33" rx="28" ry="30" fill="##PRI##"/><ellipse cx="57" cy="20" rx="10" ry="12" fill="#fff" opacity=".35"/><ellipse cx="108" cy="46" rx="24" ry="27" fill="##ACC##"/><ellipse cx="97" cy="34" rx="8" ry="10" fill="#fff" opacity=".32"/><path d="M32 72Q40 86 70 93Q100 86 108 73" stroke="#bbb" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "b-flower5",
    label: "5-Balloon Flower",
    svg: `<svg width="100%" height="100%" viewBox="0 0 140 135" xmlns="http://www.w3.org/2000/svg"><ellipse cx="35" cy="40" rx="23" ry="25" fill="##SEC##"/><ellipse cx="25" cy="29" rx="7" ry="9" fill="#fff" opacity=".32"/><ellipse cx="105" cy="40" rx="23" ry="25" fill="##SEC##"/><ellipse cx="95" cy="29" rx="7" ry="9" fill="#fff" opacity=".32"/><ellipse cx="70" cy="55" rx="27" ry="29" fill="##PRI##"/><ellipse cx="57" cy="42" rx="9" ry="11" fill="#fff" opacity=".36"/><ellipse cx="38" cy="82" rx="22" ry="24" fill="##ACC##"/><ellipse cx="29" cy="72" rx="7" ry="8" fill="#fff" opacity=".3"/><ellipse cx="102" cy="82" rx="22" ry="24" fill="##ACC##"/><ellipse cx="93" cy="72" rx="7" ry="8" fill="#fff" opacity=".3"/><path d="M70 84Q65 105 68 128" stroke="#bbb" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "b-column",
    label: "Balloon Column",
    svg: `<svg width="100%" height="100%" viewBox="0 0 90 170" xmlns="http://www.w3.org/2000/svg"><ellipse cx="25" cy="18" rx="20" ry="21" fill="##SEC##"/><ellipse cx="65" cy="18" rx="20" ry="21" fill="##ACC##"/><ellipse cx="45" cy="12" rx="22" ry="24" fill="##PRI##"/><ellipse cx="33" cy="2" rx="7" ry="9" fill="#fff" opacity=".36"/><ellipse cx="22" cy="66" rx="21" ry="23" fill="##PRI##"/><ellipse cx="68" cy="66" rx="21" ry="23" fill="##SEC##"/><ellipse cx="45" cy="58" rx="23" ry="25" fill="##ACC##"/><ellipse cx="33" cy="47" rx="8" ry="9" fill="#fff" opacity=".34"/><ellipse cx="25" cy="116" rx="22" ry="24" fill="##ACC##"/><ellipse cx="65" cy="116" rx="22" ry="24" fill="##PRI##"/><ellipse cx="45" cy="108" rx="24" ry="26" fill="##SEC##"/><ellipse cx="33" cy="97" rx="8" ry="10" fill="#fff" opacity=".35"/><path d="M45 134Q44 148 45 163" stroke="#bbb" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "b-garland-left",
    label: "Left Garland",
    svg: `<svg width="100%" height="100%" viewBox="0 0 110 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="90" cy="178" rx="22" ry="24" fill="##PRI##"/><ellipse cx="80" cy="167" rx="7" ry="8" fill="#fff" opacity=".32"/><ellipse cx="74" cy="147" rx="21" ry="23" fill="##SEC##"/><ellipse cx="64" cy="136" rx="7" ry="8" fill="#fff" opacity=".3"/><ellipse cx="58" cy="115" rx="22" ry="24" fill="##ACC##"/><ellipse cx="48" cy="104" rx="7" ry="8" fill="#fff" opacity=".32"/><ellipse cx="40" cy="84" rx="21" ry="23" fill="##PRI##"/><ellipse cx="31" cy="73" rx="7" ry="8" fill="#fff" opacity=".3"/><ellipse cx="22" cy="52" rx="22" ry="24" fill="##SEC##"/><ellipse cx="12" cy="41" rx="7" ry="8" fill="#fff" opacity=".32"/><ellipse cx="8" cy="20" rx="20" ry="22" fill="##ACC##"/><ellipse cx="2" cy="11" rx="6" ry="7" fill="#fff" opacity=".3"/></svg>`,
  },
  {
    id: "b-garland-right",
    label: "Right Garland",
    svg: `<svg width="100%" height="100%" viewBox="0 0 110 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="178" rx="22" ry="24" fill="##PRI##"/><ellipse cx="30" cy="167" rx="7" ry="8" fill="#fff" opacity=".32"/><ellipse cx="36" cy="147" rx="21" ry="23" fill="##SEC##"/><ellipse cx="46" cy="136" rx="7" ry="8" fill="#fff" opacity=".3"/><ellipse cx="52" cy="115" rx="22" ry="24" fill="##ACC##"/><ellipse cx="62" cy="104" rx="7" ry="8" fill="#fff" opacity=".32"/><ellipse cx="70" cy="84" rx="21" ry="23" fill="##PRI##"/><ellipse cx="79" cy="73" rx="7" ry="8" fill="#fff" opacity=".3"/><ellipse cx="88" cy="52" rx="22" ry="24" fill="##SEC##"/><ellipse cx="98" cy="41" rx="7" ry="8" fill="#fff" opacity=".32"/><ellipse cx="102" cy="20" rx="20" ry="22" fill="##ACC##"/><ellipse cx="108" cy="11" rx="6" ry="7" fill="#fff" opacity=".3"/></svg>`,
  },
  {
    id: "b-row",
    label: "Ground Row",
    svg: `<svg width="100%" height="100%" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="48" rx="18" ry="20" fill="##SEC##"/><ellipse cx="12" cy="37" rx="6" ry="7" fill="#fff" opacity=".3"/><ellipse cx="51" cy="40" rx="22" ry="24" fill="##PRI##"/><ellipse cx="40" cy="28" rx="7" ry="9" fill="#fff" opacity=".35"/><ellipse cx="83" cy="44" rx="21" ry="23" fill="##ACC##"/><ellipse cx="72" cy="33" rx="7" ry="8" fill="#fff" opacity=".3"/><ellipse cx="116" cy="40" rx="22" ry="24" fill="##PRI##"/><ellipse cx="105" cy="28" rx="7" ry="9" fill="#fff" opacity=".35"/><ellipse cx="148" cy="44" rx="21" ry="23" fill="##ACC##"/><ellipse cx="137" cy="33" rx="7" ry="8" fill="#fff" opacity=".3"/><ellipse cx="179" cy="48" rx="18" ry="20" fill="##SEC##"/><ellipse cx="170" cy="37" rx="6" ry="7" fill="#fff" opacity=".3"/></svg>`,
  },
  {
    id: "b-arch",
    label: "Balloon Arch",
    svg: `<svg width="100%" height="100%" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg"><ellipse cx="15" cy="106" rx="18" ry="20" fill="##ACC##"/><ellipse cx="35" cy="88" rx="20" ry="22" fill="##SEC##"/><ellipse cx="25" cy="72" rx="21" ry="23" fill="##PRI##"/><ellipse cx="45" cy="57" rx="20" ry="22" fill="##ACC##"/><ellipse cx="63" cy="42" rx="21" ry="23" fill="##SEC##"/><ellipse cx="84" cy="27" rx="22" ry="24" fill="##PRI##"/><ellipse cx="107" cy="17" rx="23" ry="25" fill="##ACC##"/><ellipse cx="130" cy="27" rx="22" ry="24" fill="##SEC##"/><ellipse cx="150" cy="42" rx="21" ry="23" fill="##PRI##"/><ellipse cx="168" cy="57" rx="20" ry="22" fill="##ACC##"/><ellipse cx="185" cy="72" rx="21" ry="23" fill="##SEC##"/><ellipse cx="195" cy="88" rx="20" ry="22" fill="##PRI##"/><ellipse cx="208" cy="106" rx="18" ry="20" fill="##ACC##"/></svg>`,
  },
];

export function applyBalloonColors(svg: string, preset: BalloonPreset): string {
  return svg
    .replace(/##PRI##/g, preset.pri)
    .replace(/##SEC##/g, preset.sec)
    .replace(/##ACC##/g, preset.acc);
}
