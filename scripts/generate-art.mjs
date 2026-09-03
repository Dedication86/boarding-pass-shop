/**
 * Generates placeholder product artwork as SVG "spec sheets" into
 * frontend/public/products/<sku>.svg.
 *
 * Why SVG instead of stock photos: the demo never breaks on a dead image URL,
 * every tile is on-brand (transit ephemera / spec-sheet look), and swapping in
 * real photography later is a one-line change to `image` in the catalog.
 *
 *   node scripts/generate-art.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCTS } from "../backend/src/catalog.js";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "frontend", "public", "products");
mkdirSync(out, { recursive: true });

const C = {
  paper: "#F3F0E9", ink: "#0E0E10", orange: "#FF4F12", yellow: "#F2C230",
  red: "#C8102E", grey: "#6B6E70", sky: "#BFD3E6", line: "#D9D4C9"
};

// colorway string -> [body, accent]
function palette(colorway) {
  const c = colorway.toLowerCase();
  const body = c.startsWith("paper") ? C.paper
    : c.startsWith("tarmac") ? C.grey
    : c.startsWith("safety") ? C.orange
    : c.startsWith("signal") ? C.yellow
    : C.ink;
  const accent = c.includes("orange") && body !== C.orange ? C.orange
    : c.includes("yellow") && body !== C.yellow ? C.yellow
    : c.includes("red") ? C.red
    : c.includes("reflective") || c.includes("hi-vis") ? C.orange
    : body === C.paper ? C.ink : C.paper;
  return [body, accent];
}

const stroke = (body) => body === C.paper ? C.ink : "rgba(0,0,0,.35)";

// Garment silhouettes, drawn in a 400x400 box centred at (0,0) -> translate later.
const ART = {
  tee: (b, a) => `
    <path d="M-130 -150 L-60 -190 Q0 -160 60 -190 L130 -150 L175 -70 L120 -40 L120 190 L-120 190 L-120 -40 L-175 -70 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <path d="M-60 -190 Q0 -140 60 -190" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <rect x="40" y="-100" width="46" height="18" fill="${a}"/>
    <rect x="-100" y="150" width="200" height="14" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="4 4"/>`,
  longsleeve: (b, a) => `
    <path d="M-120 -150 L-60 -190 Q0 -160 60 -190 L120 -150 L190 40 L135 60 L120 -20 L120 190 L-120 190 L-120 -20 L-135 60 L-190 40 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <path d="M-60 -190 Q0 -140 60 -190" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <g fill="none" stroke="${a}" stroke-width="3"><circle cx="-150" cy="-40" r="22"/><circle cx="160" cy="0" r="18"/><rect x="-175" y="10" width="40" height="24" transform="rotate(-15 -155 22)"/></g>
    <rect x="-24" y="-90" width="48" height="16" fill="${a}"/>`,
  hoodie: (b, a) => `
    <path d="M-130 -130 L-70 -170 L-40 -215 Q0 -235 40 -215 L70 -170 L130 -130 L180 -40 L125 -10 L125 195 L-125 195 L-125 -10 L-180 -40 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <path d="M-40 -215 Q0 -120 40 -215" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <path d="M-70 60 L70 60 L70 150 L-70 150 Z" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <line x1="-14" y1="-130" x2="-14" y2="-40" stroke="${a}" stroke-width="4"/><line x1="14" y1="-130" x2="14" y2="-40" stroke="${a}" stroke-width="4"/>
    <text x="0" y="10" text-anchor="middle" font-family="'Barlow Condensed','Arial Narrow',sans-serif" font-weight="700" font-size="26" letter-spacing="3" fill="${a}">BPS</text>`,
  crew: (b, a) => `
    <path d="M-130 -150 L-60 -185 Q0 -165 60 -185 L130 -150 L180 -50 L125 -20 L125 195 L-125 195 L-125 -20 L-180 -50 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <path d="M-60 -185 Q0 -150 60 -185" fill="none" stroke="${stroke(b)}" stroke-width="6"/>
    <rect x="-125" y="175" width="250" height="20" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <text x="0" y="40" text-anchor="middle" font-family="'Space Mono',monospace" font-size="14" letter-spacing="2" fill="${a}">HOME → ANYWHERE</text>`,
  cap: (b, a) => `
    <path d="M-150 30 Q-150 -130 0 -130 Q150 -130 150 30 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <path d="M-150 30 L150 30 L230 70 Q0 130 -150 60 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <path d="M0 -130 L0 30" stroke="${stroke(b)}" stroke-width="2"/><path d="M-90 -95 Q-60 -40 -75 30" fill="none" stroke="${stroke(b)}" stroke-width="2"/><path d="M90 -95 Q60 -40 75 30" fill="none" stroke="${stroke(b)}" stroke-width="2"/>
    <rect x="60" y="-20" width="60" height="16" fill="${a}"/>
    <text x="90" y="-8" text-anchor="middle" font-family="'Space Mono',monospace" font-size="9" fill="${b === C.paper ? C.paper : C.ink}">STANDBY</text>`,
  beanie: (b, a) => `
    <path d="M-130 60 Q-140 -140 0 -150 Q140 -140 130 60 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <rect x="-140" y="40" width="280" height="90" rx="10" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <g stroke="${stroke(b)}" stroke-width="2">${Array.from({length:13},(_,i)=>`<line x1="${-120+i*20}" y1="45" x2="${-120+i*20}" y2="125"/>`).join("")}</g>
    <rect x="-40" y="70" width="80" height="30" fill="${a}"/>
    <text x="0" y="90" text-anchor="middle" font-family="'Space Mono',monospace" font-size="11" fill="${C.ink}">BPS-TAG</text>`,
  pant: (b, a) => `
    <path d="M-120 -210 L120 -210 L135 -120 L110 230 L20 230 L0 -40 L-20 230 L-110 230 L-135 -120 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <rect x="-120" y="-210" width="240" height="26" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <rect x="-110" y="-20" width="60" height="70" fill="none" stroke="${stroke(b)}" stroke-width="3"/><rect x="50" y="-20" width="60" height="70" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <g fill="${a}"><rect x="-116" y="-20" width="8" height="12"/><rect x="108" y="-20" width="8" height="12"/><rect x="-105" y="200" width="82" height="8"/><rect x="24" y="200" width="82" height="8"/></g>`,
  jacket: (b, a) => `
    <path d="M-140 -150 L-70 -185 L-30 -200 L0 -170 L30 -200 L70 -185 L140 -150 L190 -40 L135 -10 L135 200 L-135 200 L-135 -10 L-190 -40 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <path d="M-30 -200 L0 -170 L30 -200 L60 -160 L0 -150 L-60 -160 Z" fill="${C.grey}" stroke="${stroke(b)}" stroke-width="3"/>
    <line x1="0" y1="-150" x2="0" y2="200" stroke="${stroke(b)}" stroke-width="3"/>
    <rect x="-110" y="-90" width="70" height="60" fill="none" stroke="${stroke(b)}" stroke-width="3"/><rect x="40" y="-90" width="70" height="60" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <rect x="-110" y="60" width="80" height="90" fill="none" stroke="${stroke(b)}" stroke-width="3"/><rect x="30" y="60" width="80" height="90" fill="none" stroke="${stroke(b)}" stroke-width="3"/>
    <g fill="${a}">${[-60,-20,20,60,100].map(y=>`<circle cx="0" cy="${y}" r="5"/>`).join("")}<rect x="-118" y="-92" width="10" height="6"/><rect x="108" y="-92" width="10" height="6"/></g>`,
  vest: (b, a) => `
    <path d="M-130 -150 L-60 -185 Q0 -150 60 -185 L130 -150 L145 -60 L120 -40 L120 190 L-120 190 L-120 -40 L-145 -60 Z" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <line x1="0" y1="-150" x2="0" y2="190" stroke="${stroke(b)}" stroke-width="3"/>
    <g fill="${C.grey}" opacity=".9"><rect x="-120" y="-20" width="240" height="22"/><rect x="-120" y="40" width="240" height="22"/></g>
    <g fill="${C.paper}"><rect x="-120" y="-14" width="240" height="10"/><rect x="-120" y="46" width="240" height="10"/></g>
    <rect x="-100" y="90" width="80" height="70" fill="none" stroke="${stroke(b)}" stroke-width="3"/><rect x="20" y="90" width="80" height="70" fill="none" stroke="${stroke(b)}" stroke-width="3"/>`,
  tote: (b, a) => `
    <path d="M-70 -210 Q-70 -120 -110 -90 M70 -210 Q70 -120 110 -90" fill="none" stroke="${stroke(b)}" stroke-width="10"/>
    <path d="M-70 -210 Q0 -240 70 -210" fill="none" stroke="${stroke(b)}" stroke-width="10"/>
    <rect x="-150" y="-90" width="300" height="290" fill="${b}" stroke="${stroke(b)}" stroke-width="3"/>
    <text x="0" y="40" text-anchor="middle" font-family="'Barlow Condensed','Arial Narrow',sans-serif" font-weight="700" font-size="54" fill="${a}">EXCESS</text>
    <text x="0" y="100" text-anchor="middle" font-family="'Barlow Condensed','Arial Narrow',sans-serif" font-weight="700" font-size="54" fill="${a}">BAGGAGE</text>`
};

function barcode(x, y, w, h, seed) {
  let s = seed, out = "", cx = x;
  while (cx < x + w) {
    s = (s * 9301 + 49297) % 233280;
    const bw = 2 + (s % 5);
    if (s % 3) out += `<rect x="${cx}" y="${y}" width="${bw}" height="${h}" fill="${C.ink}"/>`;
    cx += bw + 2;
  }
  return out;
}

const LANE = { "transit-minimal": "TRANSIT MINIMAL", "destination-loud": "DESTINATION LOUD", "tarmac-utility": "TARMAC UTILITY" };

for (const p of PRODUCTS) {
  const [body, accent] = palette(p.colorway);
  const seed = [...p.sku].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <rect width="800" height="1000" fill="${C.paper}"/>
  <!-- grid paper -->
  <g stroke="${C.line}" stroke-width="1">${Array.from({length:20},(_,i)=>`<line x1="${i*40}" y1="0" x2="${i*40}" y2="1000"/>`).join("")}${Array.from({length:25},(_,i)=>`<line x1="0" y1="${i*40}" x2="800" y2="${i*40}"/>`).join("")}</g>
  <!-- header strip -->
  <rect x="0" y="0" width="800" height="70" fill="${C.ink}"/>
  <text x="40" y="46" font-family="'Barlow Condensed','Arial Narrow',sans-serif" font-weight="700" font-size="30" letter-spacing="4" fill="${C.paper}">BOARDING PASS</text>
  <text x="760" y="46" text-anchor="end" font-family="'Space Mono',monospace" font-size="18" fill="${C.orange}">${p.sku}</text>
  <!-- garment -->
  <g transform="translate(400 480) scale(1.35)">${ART[p.art](body, accent)}</g>
  <!-- footer stub -->
  <line x1="0" y1="840" x2="800" y2="840" stroke="${C.ink}" stroke-width="2" stroke-dasharray="10 8"/>
  <text x="40" y="890" font-family="'Space Mono',monospace" font-size="13" letter-spacing="2" fill="${C.grey}">LANE</text>
  <text x="40" y="925" font-family="'Barlow Condensed','Arial Narrow',sans-serif" font-weight="700" font-size="30" fill="${C.ink}">${LANE[p.collection]}</text>
  <text x="400" y="890" font-family="'Space Mono',monospace" font-size="13" letter-spacing="2" fill="${C.grey}">COLORWAY</text>
  <text x="400" y="925" font-family="'Barlow Condensed','Arial Narrow',sans-serif" font-weight="700" font-size="${p.colorway.length > 18 ? 22 : 30}" fill="${C.ink}">${p.colorway.toUpperCase()}</text>
  ${barcode(40, 950, 320, 30, seed)}
  <text x="760" y="975" text-anchor="end" font-family="'Space Mono',monospace" font-size="13" fill="${C.ink}">${p.capsule ? "CAPSULE 001 · E.A.R.T.H." : "PLACEHOLDER ART — SWAP FOR PHOTO"}</text>
</svg>`;
  writeFileSync(join(out, `${p.sku.toLowerCase()}.svg`), svg);
}
console.log(`Wrote ${PRODUCTS.length} product tiles to ${out}`);
