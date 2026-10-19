// Genera las ilustraciones de demostración (portadas, móviles y ofertas) en
// public/demo. Son ilustraciones vectoriales neutras, no fotografías: se
// sustituyen desde el panel por imágenes reales con derechos de uso.
//   node scripts/generate-demo-images.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/demo");
const INK = "#171717";

const defs = (id, from, to) => `
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <filter id="sh-${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#000" flood-opacity="0.18"/>
    </filter>
    <pattern id="grid-${id}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="${from === INK ? "#ffffff" : "#000000"}" stroke-opacity="0.05"/>
    </pattern>
  </defs>`;

const frame = (id, light, body) => {
  const [a, b] = light ? ["#f7f7f7", "#e6e6e6"] : ["#1c1c1c", "#0d0d0d"];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  ${defs(id, a, b)}
  <rect width="1600" height="1000" fill="url(#bg-${id})"/>
  <rect width="1600" height="1000" fill="url(#grid-${id})"/>
  ${body}
</svg>`;
};

const covers = {
  "usb-c-ue": frame("u", true, `
    <g filter="url(#sh-u)" transform="translate(800 500) rotate(-12)">
      <rect x="-420" y="-110" width="840" height="220" rx="110" fill="${INK}"/>
      <rect x="-330" y="-46" width="660" height="92" rx="46" fill="#3a3a3a"/>
      <rect x="-250" y="-14" width="500" height="28" rx="14" fill="#cfcfcf"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${-232 + i * 40}" y="-8" width="18" height="16" rx="3" fill="#9a9a9a"/>`).join("")}
    </g>
    <circle cx="1330" cy="210" r="80" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="4 10"/>`),
  "ai-act-calendario": frame("a", false, (() => {
    const pts = [[220, 640], [420, 420], [610, 560], [800, 300], [990, 520], [1180, 380], [1380, 600]];
    const lines = pts.slice(1).map((p, i) => `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${p[0]}" y2="${p[1]}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>`).join("");
    const extra = pts.map((p, i) => pts.slice(i + 2, i + 4).map((q) => `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1.5"/>`).join("")).join("");
    const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 3 ? 34 : 14}" fill="${i === 3 ? "#ffffff" : "#1c1c1c"}" stroke="#ffffff" stroke-width="2"/>`).join("");
    return `${extra}${lines}${dots}<line x1="160" y1="800" x2="1440" y2="800" stroke="#ffffff" stroke-opacity="0.2"/>${pts.map((p) => `<line x1="${p[0]}" y1="790" x2="${p[0]}" y2="810" stroke="#ffffff" stroke-opacity="0.5"/>`).join("")}`;
  })()),
  passkeys: frame("p", true, `
    <g filter="url(#sh-p)" transform="translate(800 500) rotate(-30)">
      <circle cx="-260" cy="0" r="170" fill="${INK}"/>
      <circle cx="-260" cy="0" r="62" fill="#ededed"/>
      <rect x="-110" y="-38" width="520" height="76" rx="8" fill="${INK}"/>
      <rect x="250" y="38" width="44" height="90" rx="6" fill="${INK}"/>
      <rect x="330" y="38" width="44" height="60" rx="6" fill="${INK}"/>
    </g>`),
  npu: frame("n", false, `
    <g transform="translate(800 500)">
      ${Array.from({ length: 9 }, (_, i) => `<line x1="${-360 + i * 90}" y1="-330" x2="${-360 + i * 90}" y2="-250" stroke="#8a8a8a" stroke-width="6"/><line x1="${-360 + i * 90}" y1="250" x2="${-360 + i * 90}" y2="330" stroke="#8a8a8a" stroke-width="6"/>`).join("")}
      ${Array.from({ length: 5 }, (_, i) => `<line x1="-460" y1="${-180 + i * 90}" x2="-380" y2="${-180 + i * 90}" stroke="#8a8a8a" stroke-width="6"/><line x1="380" y1="${-180 + i * 90}" x2="460" y2="${-180 + i * 90}" stroke="#8a8a8a" stroke-width="6"/>`).join("")}
      <rect x="-380" y="-250" width="760" height="500" rx="24" fill="#2a2a2a" stroke="#4a4a4a" stroke-width="2"/>
      ${Array.from({ length: 6 }, (_, r) => Array.from({ length: 10 }, (_, c) => `<rect x="${-320 + c * 64}" y="${-190 + r * 64}" width="48" height="48" rx="6" fill="${(r * 3 + c) % 7 === 0 ? "#f2f2f2" : "#3b3b3b"}"/>`).join("")).join("")}
    </g>`),
  "etiqueta-energetica-moviles": frame("e", true, `
    <g filter="url(#sh-e)"><rect x="520" y="110" width="560" height="780" rx="14" fill="#ffffff"/></g>
    ${["A", "B", "C", "D", "E", "F", "G"].map((l, i) => `<rect x="580" y="${190 + i * 84}" width="${200 + i * 42}" height="62" rx="4" fill="${["#171717", "#2e2e2e", "#474747", "#626262", "#7d7d7d", "#9a9a9a", "#b8b8b8"][i]}"/><text x="602" y="${232 + i * 84}" font-family="Helvetica, Arial" font-weight="700" font-size="34" fill="#fff">${l}</text>`).join("")}
    <rect x="910" y="190" width="110" height="62" rx="4" fill="none" stroke="${INK}" stroke-width="3"/>`),
  "movil-300": frame("m", true, [-300, 0, 300].map((x, i) => `
    <g filter="url(#sh-m)" transform="translate(${800 + x} ${520 + (i === 1 ? -30 : 20)})">
      <rect x="-130" y="-270" width="260" height="540" rx="38" fill="${["#2b2b2b", INK, "#d9d9d9"][i]}"/>
      <rect x="-118" y="-258" width="236" height="516" rx="28" fill="${["#3a3a3a", "#262626", "#efefef"][i]}"/>
      <circle cx="0" cy="-232" r="7" fill="${i === 2 ? "#bdbdbd" : "#111"}"/>
    </g>`).join("")),
  "carga-rapida": frame("c", false, `
    <circle cx="800" cy="500" r="300" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
    <circle cx="800" cy="500" r="220" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="2"/>
    <path d="M840 230 L660 530 H790 L750 770 L950 450 H815 Z" fill="#ffffff"/>`),
  wifi7: frame("w", true, `
    ${[460, 360, 260, 160].map((r, i) => `<path d="M${800 - r} ${700} A${r} ${r} 0 0 1 ${800 + r} 700" fill="none" stroke="${INK}" stroke-opacity="${0.25 + i * 0.25}" stroke-width="${26 - i * 2}" stroke-linecap="round"/>`).join("")}
    <circle cx="800" cy="700" r="34" fill="${INK}"/>`),
  "backup-movil": frame("b", true, `
    <g filter="url(#sh-b)">
      <path d="M560 470 a150 150 0 0 1 290 -60 a120 120 0 0 1 200 110 a100 100 0 0 1 -30 196 H600 a125 125 0 0 1 -40 -246 Z" fill="${INK}"/>
    </g>
    <path d="M770 560 a70 70 0 1 1 20 60" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
    <path d="M760 600 l30 26 l18 -40" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`),
  "ray-tracing": frame("r", false, `
    <defs><radialGradient id="sph" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#8f8f8f"/><stop offset="1" stop-color="#202020"/></radialGradient></defs>
    <ellipse cx="800" cy="800" rx="640" ry="60" fill="#000" opacity="0.5"/>
    <circle cx="620" cy="560" r="210" fill="url(#sph)"/>
    <circle cx="1040" cy="640" r="130" fill="url(#sph)"/>
    ${[[160, 80, 560, 420], [160, 80, 980, 560], [1500, 120, 1080, 540], [1500, 120, 700, 400]].map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#ffffff" stroke-opacity="0.45" stroke-width="2"/>`).join("")}`),
  reacondicionado: frame("re", true, `
    <g filter="url(#sh-re)" transform="translate(720 500) rotate(-8)">
      <rect x="-150" y="-310" width="300" height="620" rx="44" fill="${INK}"/>
      <rect x="-136" y="-296" width="272" height="592" rx="32" fill="#2d2d2d"/>
    </g>
    <circle cx="1010" cy="360" r="120" fill="#ffffff" stroke="${INK}" stroke-width="4"/>
    <path d="M950 360 l42 42 l76 -84" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`),
  "ia-en-el-movil": frame("i", false, `
    <g transform="translate(560 520)">
      <rect x="-140" y="-290" width="280" height="580" rx="40" fill="#e9e9e9"/>
      <rect x="-126" y="-276" width="252" height="552" rx="30" fill="#262626"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="-90" y="${-180 + i * 60}" width="${180 - i * 30}" height="14" rx="7" fill="#5a5a5a"/>`).join("")}
    </g>
    <path d="M1000 330 a90 90 0 0 1 175 -36 a72 72 0 0 1 120 66 a60 60 0 0 1 -18 118 H1024 a75 75 0 0 1 -24 -148 Z" fill="none" stroke="#ffffff" stroke-width="3"/>
    ${[0, 1, 2].map((i) => `<path d="M700 ${430 + i * 80} C 850 ${430 + i * 80}, 900 ${460}, 1080 ${480}" fill="none" stroke="#ffffff" stroke-opacity="${0.6 - i * 0.18}" stroke-width="2" stroke-dasharray="6 8"/>`).join("")}`),
  "portatil-estudiar": frame("l", true, `
    <g filter="url(#sh-l)">
      <path d="M430 690 L1170 690 L1250 740 L350 740 Z" fill="${INK}"/>
      <rect x="470" y="250" width="660" height="440" rx="18" fill="#262626"/>
      <rect x="494" y="274" width="612" height="392" rx="6" fill="#efefef"/>
    </g>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="540" y="${320 + i * 56}" width="${[420, 360, 480, 300, 380][i]}" height="16" rx="8" fill="#cfcfcf"/>`).join("")}`),
  esim: frame("s", false, `
    <rect x="460" y="200" width="680" height="600" rx="20" fill="#202020" stroke="#3a3a3a" stroke-width="2"/>
    ${Array.from({ length: 14 }, (_, i) => `<path d="M${500 + i * 44} 200 V ${150 - (i % 3) * 20}" stroke="#4d4d4d" stroke-width="3"/>`).join("")}
    <g transform="translate(800 500)">
      <path d="M-150 -190 H90 L150 -130 V190 H-150 Z" fill="#e8e8e8"/>
      <rect x="-100" y="-80" width="200" height="190" rx="12" fill="#bdbdbd"/>
      <path d="M-100 -15 H100 M-100 45 H100 M0 -80 V110" stroke="#8d8d8d" stroke-width="5"/>
    </g>`),
};

function phoneSvg({ body, glass, cam }) {
  const lens = (cx, cy, r = 30) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0f0f0f" stroke="#555" stroke-width="3"/><circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.18}" fill="#ffffff" opacity="0.35"/>`;
  const cams = {
    galaxy: lens(300, 230) + lens(300, 310) + lens(300, 390),
    ultra: lens(300, 220, 28) + lens(300, 296, 28) + lens(300, 372, 28) + lens(300, 448, 28) + lens(370, 230, 10),
    pixel: `<rect x="200" y="250" width="400" height="110" rx="0" fill="${glass}" stroke="#00000022"/>` + lens(290, 305, 34) + lens(380, 305, 34),
    iphone: `<rect x="262" y="198" width="96" height="200" rx="48" fill="${glass}" stroke="#00000022"/>` + lens(310, 250, 34) + lens(310, 346, 34),
    iphonepro: `<rect x="250" y="195" width="230" height="230" rx="52" fill="${glass}" stroke="#00000022"/>` + lens(315, 262, 42) + lens(315, 360, 42) + lens(410, 311, 42),
    square: `<rect x="250" y="195" width="230" height="230" rx="40" fill="${glass}" stroke="#00000022"/>` + lens(315, 262, 40) + lens(410, 262, 40) + lens(315, 357, 40) + `<circle cx="410" cy="357" r="12" fill="#e5e5e5"/>`,
    moto: `<rect x="255" y="200" width="120" height="230" rx="30" fill="${glass}" stroke="#00000022"/>` + lens(315, 262, 38) + lens(315, 360, 30),
    nothing: lens(300, 260, 40) + lens(400, 260, 40) + `<path d="M420 640 h120 M420 680 h80 M420 720 h140" stroke="#bbb" stroke-width="6" stroke-linecap="round"/><circle cx="350" cy="260" r="110" fill="none" stroke="#cfcfcf" stroke-width="5"/>`,
  }[cam];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${body}"/><stop offset="1" stop-color="${glass}"/></linearGradient>
    <filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="30" stdDeviation="30" flood-color="#000" flood-opacity="0.22"/></filter>
  </defs>
  <rect width="800" height="1000" fill="#f5f5f5"/>
  <g filter="url(#s)"><rect x="200" y="120" width="400" height="790" rx="64" fill="url(#g)"/></g>
  <rect x="210" y="130" width="380" height="770" rx="56" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2"/>
  ${cams}
</svg>`;
}

const phones = {
  "samsung-galaxy-s25": { body: "#2b2f36", glass: "#1d2026", cam: "galaxy" },
  "samsung-galaxy-s25-ultra": { body: "#4a4a4a", glass: "#2e2e2e", cam: "ultra" },
  "samsung-galaxy-a56-5g": { body: "#d6d6d6", glass: "#bcbcbc", cam: "galaxy" },
  "samsung-galaxy-a16-5g": { body: "#3a3a3a", glass: "#262626", cam: "galaxy" },
  "google-pixel-9a": { body: "#ececec", glass: "#d0d0d0", cam: "pixel" },
  "google-pixel-9-pro": { body: "#5b5b5b", glass: "#3f3f3f", cam: "pixel" },
  "apple-iphone-16": { body: "#e8e8e8", glass: "#cdcdcd", cam: "iphone" },
  "apple-iphone-16-pro": { body: "#7a7670", glass: "#56534f", cam: "iphonepro" },
  "xiaomi-redmi-note-14-pro-5g": { body: "#2d2d2d", glass: "#1a1a1a", cam: "square" },
  "xiaomi-15": { body: "#f0f0f0", glass: "#d8d8d8", cam: "square" },
  "motorola-moto-g85-5g": { body: "#6b6b6b", glass: "#4b4b4b", cam: "moto" },
  "nothing-phone-3a": { body: "#fafafa", glass: "#e2e2e2", cam: "nothing" },
};

const deal = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#f5f5f5"/>${inner}</svg>`;
const deals = {
  movil: deal(`<rect x="210" y="90" width="180" height="420" rx="32" fill="${INK}"/><rect x="220" y="100" width="160" height="400" rx="24" fill="#3a3a3a"/>`),
  auriculares: deal(`<path d="M150 360 V300 a150 150 0 0 1 300 0 V360" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/><rect x="120" y="320" width="80" height="140" rx="30" fill="${INK}"/><rect x="400" y="320" width="80" height="140" rx="30" fill="${INK}"/>`),
  portatil: deal(`<rect x="140" y="160" width="320" height="220" rx="12" fill="#2a2a2a"/><rect x="154" y="174" width="292" height="192" rx="4" fill="#e9e9e9"/><path d="M110 390 H490 L470 420 H130 Z" fill="${INK}"/>`),
  tablet: deal(`<rect x="160" y="110" width="280" height="380" rx="26" fill="${INK}"/><rect x="176" y="126" width="248" height="348" rx="14" fill="#e6e6e6"/>`),
  reloj: deal(`<rect x="250" y="80" width="100" height="440" rx="30" fill="#bdbdbd"/><rect x="195" y="190" width="210" height="230" rx="56" fill="${INK}"/><rect x="215" y="210" width="170" height="190" rx="42" fill="#2e2e2e"/>`),
  otro: deal(`<rect x="170" y="170" width="260" height="260" rx="20" fill="${INK}"/>`),
};

async function write(svg, file, width, height) {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).resize(width, height).webp({ quality: 86 }).toFile(file);
}

for (const [name, svg] of Object.entries(covers)) await write(svg, path.join(OUT, "covers", `${name}.webp`), 1600, 1000);
for (const [name, cfg] of Object.entries(phones)) await write(phoneSvg(cfg), path.join(OUT, "phones", `${name}.webp`), 800, 1000);
for (const [name, svg] of Object.entries(deals)) await write(svg, path.join(OUT, "deals", `${name}.webp`), 600, 600);

// Logotipo y tarjeta social por defecto.
const mark = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="${INK}"/><path d="M13.6 3.5 6.8 13.2h4.6l-1.1 7.3 6.9-9.9h-4.7l1.1-7.1Z" fill="#fff"/></svg>`;
await sharp(Buffer.from(mark(512))).png().toFile(path.resolve("public/logo.png"));
await sharp(Buffer.from(mark(180))).png().toFile(path.resolve("src/app/apple-icon.png"));
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <g transform="translate(96 96) scale(4)"><rect width="24" height="24" rx="3" fill="${INK}"/><path d="M13.6 3.5 6.8 13.2h4.6l-1.1 7.3 6.9-9.9h-4.7l1.1-7.1Z" fill="#fff"/></g>
  <text x="96" y="430" font-family="Helvetica, Arial" font-size="120" font-weight="700" letter-spacing="-6" fill="${INK}">voltio</text>
  <text x="100" y="500" font-family="Helvetica, Arial" font-size="36" fill="#737373">Tecnología, sin ruido.</text>
  <rect x="0" y="618" width="1200" height="12" fill="${INK}"/>
</svg>`)).png().toFile(path.resolve("public/og-default.png"));

console.log("Ilustraciones generadas en public/demo");
