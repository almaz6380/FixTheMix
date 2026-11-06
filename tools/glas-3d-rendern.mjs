// Rendert die Glaeser in 3D und zerlegt sie in zwei Bildebenen.
//
// Josef wollte am 06.11.2026 „3D-Glaeser". Echtzeit-3D (WebGL im Spiel) haette
// Fluessigkeit, Giessen, Strahl und Tests neu verlangt und auf billigen Androids
// bei 14 Glaesern geruckelt. Deshalb wird das Glas EINMAL echt in 3D gerendert,
// hier im Werkzeug, und das Spiel bekommt nur zwei Bilder je Form:
//
//   glas-<form>-hinten.webp  Rueckwand und Glasboden — liegt UNTER dem Saft
//   glas-<form>-vorn.webp    Vorderwand, Rand, Spiegelungen — liegt DARUEBER
//
// Dazwischen zeichnet `GlasKoerper` die Fluessigkeit wie bisher, maskiert mit dem
// Innenumriss, den dieses Skript AUS DEM PROFIL RECHNET (`formen.json`). Damit
// sitzt der Saft pixelgenau in der Innenwand — bei einem KI-Netz (Tripo) waere
// der Umriss nur geschaetzt, und ein leicht schiefes Netz passt zu keiner Maske.
//
// Ein Glas ist ein Drehkoerper: ein Profil, einmal um die Achse gedreht
// (`LatheGeometry`). Das Material ist ein eigener Shader statt
// `MeshPhysicalMaterial` mit `transmission`: Transmission bricht, was HINTER dem
// Glas liegt — vor einem durchsichtigen Hintergrund ist das Schwarz, und das
// Glas wird dunkel. Hier ist die Deckkraft Fresnel (Kanten fast deckend, Mitte
// fast klar), dazu die Spiegelung einer Barlampe und zweier Lichtleisten. Das
// Licht kommt von oben links, wie die Lampen der Rueckwand.
//
// three.js ist nur devDependency — es landet nie im App-Bundle.
// Aufruf: node tools/glas-3d-rendern.mjs [--nur pint,tumbler]

import { chromium } from 'playwright';
import sharp from 'sharp';
import http from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const wurzel = new URL('..', import.meta.url).pathname;
const ziel = join(wurzel, 'src/assets/glas');
mkdirSync(ziel, { recursive: true });

/** Das Feld: 60 x 156 Einheiten — dasselbe Seitenverhaeltnis wie GLAS_SEITEN. */
const FELD_B = 60;
const FELD_H = 156;
/** Aufsicht in Grad: man sieht leicht in die Oeffnung. */
const NEIGUNG = 7;
/** Pixel des Renders (2,5x die groesste Anzeigebreite von ~96 px). */
const PX_B = 240;
const PX_H = 624;
/** Wandstaerke in Einheiten. */
const WAND = 1.5;

/*
  Die Formen. `r(u)` ist der AEUSSERE Radius als Anteil der halben Feldbreite,
  u = 0 unten, 1 oben. `boden` ist die Dicke des massiven Bodens als Anteil der
  Glashoehe, `ecke` der Radius der unteren Aussenkante in Einheiten.
*/
const lerp = (a, b, t) => a + (b - a) * t;
const FORMEN = {
  pint: {
    name: 'Pint',
    r: (u) => (u < 0.18 ? 0.66 : lerp(0.66, 0.97, (u - 0.18) / 0.82)),
    boden: 0.13, ecke: 2.5,
  },
  tumbler: {
    name: 'Tumbler',
    r: (u) => lerp(0.9, 0.97, u),
    boden: 0.07, ecke: 9,
  },
  becher: {
    name: 'Becher',
    r: (u) => lerp(0.76, 0.97, u),
    boden: 0.035, ecke: 12,
  },
  highball: {
    name: 'Highball',
    r: () => 0.8,
    boden: 0.1, ecke: 2,
  },
  smoothie: {
    name: 'Smoothie',
    r: (u) => 0.8 + 0.16 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (u < 0.55 ? 1 : 0.65 + 0.35 * (1 - (u - 0.55) / 0.45)) + 0.06 * u,
    boden: 0.08, ecke: 7,
  },
  kelch: {
    name: 'Kelch',
    r: (u) => {
      // Bauchig: unten schmal, die weiteste Stelle bei 40 %, oben etwas enger.
      if (u < 0.4) return lerp(0.6, 0.97, Math.sin((u / 0.4) * Math.PI / 2));
      return lerp(0.97, 0.8, ((u - 0.4) / 0.6) ** 1.4);
    },
    boden: 0.06, ecke: 10,
  },
};

const nur = (() => {
  const i = process.argv.indexOf('--nur');
  return i > 0 ? process.argv[i + 1].split(',') : Object.keys(FORMEN);
})();

/*
  Geometrie in Einheiten, Glas-Unterkante bei y = 0. Die Hoehe ist so gewaehlt,
  dass das geneigte Glas samt hinterer Randellipse genau ins Feld passt.
*/
const t = (NEIGUNG * Math.PI) / 180;
function masse(form) {
  const rOben = form.r(1) * (FELD_B / 2);
  const rUnten = form.r(0) * (FELD_B / 2);
  // Bildhoehe = h*cos(t) + (rOben + rUnten)*sin(t) + Rand
  const h = (FELD_H - 2 - (rOben + rUnten) * Math.sin(t)) / Math.cos(t);
  return { h, rOben, rUnten };
}

/** Profilpunkte (r, y) fuer die Drehung: aussen hoch, Lippe, innen runter. */
function profil(form) {
  const { h } = masse(form);
  const R = (u) => form.r(u) * (FELD_B / 2);
  const yb = form.boden * h;
  const pkt = [];
  const N = 60;
  // Unterseite: von der Achse nach aussen, dann die gerundete Kante.
  pkt.push([0, 0]);
  const e = Math.min(form.ecke, R(0) * 0.6);
  const r0 = R(0);
  pkt.push([r0 - e, 0]);
  for (let k = 1; k <= 8; k++) {
    const a = (k / 8) * (Math.PI / 2);
    pkt.push([r0 - e + e * Math.sin(a), e - e * Math.cos(a)]);
  }
  // Aussenwand.
  for (let k = 1; k <= N; k++) {
    const u = k / N;
    const y = u * h;
    if (y <= e) continue;
    pkt.push([R(u), y]);
  }
  // Lippe: Halbkreis ueber die Wand.
  const ro = R(1);
  for (let k = 1; k < 8; k++) {
    const a = (k / 8) * Math.PI;
    pkt.push([ro - WAND / 2 + (WAND / 2) * Math.cos(a), h + (WAND / 2) * Math.sin(a)]);
  }
  // Innenwand nach unten bis zum Boden.
  for (let k = N; k >= 0; k--) {
    const u = k / N;
    const y = u * h;
    if (y < yb) break;
    pkt.push([Math.max(0.5, R(u) - WAND), y]);
  }
  const ri = Math.max(0.5, R(form.boden) - WAND);
  pkt.push([ri * 0.92, yb]);
  pkt.push([0, yb]);
  return pkt;
}

/*
  Der Innenumriss in Bildkoordinaten (100 x 100, y nach unten) — die Maske fuer
  die Fluessigkeit. Eine waagrechte Kreisscheibe in Hoehe y erscheint bei
  orthografischer Aufsicht als Ellipse um y*cos(t) mit der Halbhoehe r*sin(t).
  Die Seiten der Maske sind die Seitenpunkte dieser Ellipsen, unten schliesst
  sie mit dem VORDEREN Bogen der Bodenellipse — dort sitzt der Saft auf.
*/
function innenumriss(form) {
  const { h, rOben } = masse(form);
  const R = (u) => form.r(u) * (FELD_B / 2);
  const yb = form.boden * h;
  // Bildoberkante: oberster Punkt der hinteren Randellipse.
  const oben = h * Math.cos(t) + rOben * Math.sin(t) + 1;
  const bx = (x) => ((x + FELD_B / 2) / FELD_B) * 100;
  const by = (Y) => ((oben - Y) / FELD_H) * 100;
  const N = 40;
  const rechts = [];
  for (let k = 0; k <= N; k++) {
    const u = form.boden + (1 - form.boden) * (k / N);
    rechts.push([R(u) - WAND, u * h]);
  }
  const pfad = [];
  // Oben links -> oben rechts (gerade, der Saft erreicht den Rand nie).
  const rTop = rechts[N][0];
  pfad.push([bx(-rTop), by(h * Math.cos(t))]);
  pfad.push([bx(rTop), by(h * Math.cos(t))]);
  // Rechte Seite nach unten.
  for (let k = N; k >= 0; k--) pfad.push([bx(rechts[k][0]), by(rechts[k][1] * Math.cos(t))]);
  // Vorderer Bogen der Bodenellipse, von rechts nach links.
  const ri = rechts[0][0];
  for (let k = 1; k < 16; k++) {
    const p = (k / 16) * Math.PI;
    pfad.push([bx(ri * Math.cos(p)), by(yb * Math.cos(t) - ri * Math.sin(p) * Math.sin(t))]);
  }
  // Linke Seite nach oben.
  for (let k = 0; k <= N; k++) pfad.push([bx(-rechts[k][0]), by(rechts[k][1] * Math.cos(t))]);
  const d = 'M' + pfad.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L') + ' Z';
  // Der Saft steht ab dem tiefsten Punkt des vorderen Bogens.
  const bodenY = by(yb * Math.cos(t) - ri * Math.sin(t));
  // Der Flaschenhals fuer den Strahl: Oeffnung auf Hoehe des Randes.
  return { umriss: d, boden: +(100 - bodenY).toFixed(2), oeffnung: +by(h * Math.cos(t)).toFixed(2) };
}

// ---- Rendern im Browser ---------------------------------------------------

const SEITE = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js"}}</script></head><body>
<script type="module">
import * as THREE from 'three';
const B = ${PX_B}, H = ${PX_H};
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
renderer.setSize(B, H);
renderer.setClearColor(0x000000, 0);
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);

const vert = \`
  #include <clipping_planes_pars_vertex>
  varying vec3 vN; varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }\`;
const frag = \`
  #include <clipping_planes_pars_fragment>
  varying vec3 vN; varying vec3 vW;
  uniform vec3 uKamera; uniform float uDicke; uniform vec3 uTon;
  // Die Umgebung, die sich im Glas spiegelt: eine Lichtleiste links (das
  // Fenster der Bar), eine schwaechere rechts, warmes Licht von oben links.
  vec3 umgebung(vec3 r) {
    float leiste = smoothstep(0.80, 0.93, -r.x) * smoothstep(-0.25, 0.1, r.y) * smoothstep(0.9, 0.5, r.y);
    float gegen = smoothstep(0.86, 0.96, r.x) * smoothstep(-0.1, 0.2, r.y) * smoothstep(0.8, 0.5, r.y) * 0.45;
    float lampe = smoothstep(0.85, 0.98, dot(normalize(r), normalize(vec3(-0.45, 0.85, 0.3))));
    float decke = smoothstep(0.3, 1.0, r.y) * 0.18;
    return vec3(1.0, 0.97, 0.9) * leiste + vec3(0.8, 0.9, 1.0) * gegen
         + vec3(1.0, 0.86, 0.6) * lampe * 1.4 + vec3(1.0, 0.92, 0.8) * decke;
  }
  void main() {
    #include <clipping_planes_fragment>
    vec3 n = normalize(vN);
    vec3 v = normalize(uKamera - vW);
    if (!gl_FrontFacing) n = -n;
    float nv = abs(dot(n, v));
    float fres = pow(1.0 - nv, 2.6);
    vec3 r = reflect(-v, n);
    vec3 spiegel = umgebung(r);
    float glanz = max(max(spiegel.r, spiegel.g), spiegel.b);
    vec3 farbe = uTon * (0.55 + 0.6 * fres) + spiegel;
    float a = clamp(uDicke + 0.55 * fres + 0.55 * glanz, 0.0, 0.92);
    gl_FragColor = vec4(farbe, a);
  }\`;

function material(dicke, ton, ebenen, seite) {
  return new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
    side: seite, clipping: true, clippingPlanes: ebenen,
    uniforms: { uKamera: { value: new THREE.Vector3() }, uDicke: { value: dicke }, uTon: { value: new THREE.Color(ton) } },
  });
}

window.rendern = (profil, masse, schicht) => {
  const t = ${t};
  const szene = new THREE.Scene();
  const punkte = profil.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(punkte, 96);
  geo.computeVertexNormals();
  // Vorne = z > 0 (zur Kamera). Clipping-Ebenen behalten die Seite, in die
  // ihre Normale zeigt.
  const vorne = [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)];
  const hinten = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
  const ebenen = schicht === 'vorn' ? vorne : hinten;
  // Erst die Rueckseiten, dann die Vorderseiten — Transparenz in der richtigen Reihenfolge.
  const innen = new THREE.Mesh(geo, material(0.05, 0xBFDDFF, ebenen, THREE.BackSide));
  const aussen = new THREE.Mesh(geo, material(0.07, 0xD6ECFF, ebenen, THREE.FrontSide));
  innen.renderOrder = 0; aussen.renderOrder = 1;
  szene.add(innen, aussen);
  // Der massive Boden: deutlich dichter, nur in der hinteren Ebene (der Saft
  // steht darauf, vorne liegt nichts vor ihm).
  if (schicht === 'hinten') {
    const yb = masse.yb;
    const rb = masse.rb;
    const bgeo = new THREE.CylinderGeometry(rb, rb * 0.985, yb - 0.4, 96);
    bgeo.translate(0, (yb - 0.4) / 2 + 0.2, 0);
    const boden = new THREE.Mesh(bgeo, material(0.2, 0xCFE6FF, [], THREE.FrontSide));
    boden.renderOrder = 2;
    szene.add(boden);
  }
  const oben = masse.h * Math.cos(t) + masse.rOben * Math.sin(t) + 1;
  // Orthografische Kamera, leicht von oben. Das Bildfeld ist in Bildschirm-
  // einheiten 60 x 156; die Glas-Unterkante liegt so, dass oben 1 Einheit Luft bleibt.
  const kam = new THREE.OrthographicCamera(-${FELD_B / 2}, ${FELD_B / 2}, oben, oben - ${FELD_H}, -500, 500);
  // Kamera um die x-Achse geneigt: Bildschirm-Y eines Punktes (0,y,0) ist y*cos(t).
  kam.position.set(0, Math.sin(t) * 200, Math.cos(t) * 200);
  kam.up.set(0, 1, 0);
  kam.lookAt(0, 0, 0);
  // Das Bildfeld muss in den gedrehten Kamerakoordinaten liegen: der Ursprung
  // projiziert auf 0, ein Punkt (0,y,0) auf y*cos(t) — passt zu oben/unten.
  kam.updateProjectionMatrix();
  for (const m of [innen, aussen]) m.material.uniforms.uKamera.value.copy(kam.position);
  szene.traverse((o) => { if (o.material?.uniforms) o.material.uniforms.uKamera.value.copy(kam.position); });
  renderer.clear();
  renderer.render(szene, kam);
  return renderer.domElement.toDataURL('image/png');
};
window.bereit = true;
</script></body></html>`;

const MIME = { '.js': 'text/javascript', '.html': 'text/html' };
const server = http.createServer((q, a) => {
  if (q.url === '/') { a.setHeader('Content-Type', 'text/html'); a.end(SEITE); return; }
  if (q.url.startsWith('/three/')) {
    const p = join(wurzel, 'node_modules', q.url.slice(1));
    if (existsSync(p)) { a.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream'); a.end(readFileSync(p)); return; }
  }
  a.statusCode = 404; a.end();
});
await new Promise((ok) => server.listen(4611, ok));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const seite = await browser.newPage();
seite.on('console', (m) => { if (m.type() === 'error') console.error('Browser:', m.text()); });
await seite.goto('http://localhost:4611/');
await seite.waitForFunction(() => window.bereit === true);

const formenJson = {};
for (const id of nur) {
  const form = FORMEN[id];
  if (!form) throw new Error(`Unbekannte Form: ${id}`);
  const m = masse(form);
  const yb = form.boden * m.h;
  const rb = Math.max(0.5, form.r(form.boden) * (FELD_B / 2) - WAND) + WAND * 0.5;
  const pk = profil(form);
  for (const schicht of ['hinten', 'vorn']) {
    const url = await seite.evaluate(([p, mm, s]) => window.rendern(p, mm, s), [pk, { ...m, yb, rb }, schicht]);
    const png = Buffer.from(url.split(',')[1], 'base64');
    const datei = join(ziel, `glas-${id}-${schicht}.webp`);
    await sharp(png).webp({ quality: 78, alphaQuality: 80, effort: 6 }).toFile(datei);
    console.log(`  glas-${id}-${schicht}.webp  ${(statSync(datei).size / 1024).toFixed(1)} KB`);
  }
  formenJson[id] = { name: form.name, ...innenumriss(form) };
}
await browser.close();
server.close();

// formen.json fortschreiben, nicht ueberschreiben: `--nur` rendert eine Teilmenge.
const jsonDatei = join(ziel, 'formen.json');
const alt = existsSync(jsonDatei) ? JSON.parse(readFileSync(jsonDatei, 'utf8')) : {};
writeFileSync(jsonDatei, JSON.stringify({ ...alt, ...formenJson }, null, 2) + '\n');
console.log(`  formen.json  (${Object.keys({ ...alt, ...formenJson }).join(', ')})`);
