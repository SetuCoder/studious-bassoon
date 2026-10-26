// Draws the app icons from the marigold in src/ui/Marigold.tsx and writes them to public/.
// Run after changing the flower or the palette: npm run icons
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const AUBERGINE = '#3A0F34'
const AUBERGINE_RAISED = '#4B1A44'

// Same rings as src/ui/Marigold.tsx. The flower reaches radius 118 in its own units.
const RINGS = [
  { n: 11, d: 78, rx: 24, ry: 40, fill: '#B57E00', off: 0 },
  { n: 13, d: 62, rx: 22, ry: 36, fill: '#D99A00', off: 7 },
  { n: 13, d: 46, rx: 20, ry: 31, fill: '#EAAA00', off: 0 },
  { n: 12, d: 31, rx: 17, ry: 25, fill: '#F2BB24', off: 9 },
  { n: 10, d: 17, rx: 13, ry: 19, fill: '#F7C944', off: 4 },
]
const FLOWER_RADIUS = 118

const petals = RINGS.flatMap((r) =>
  Array.from({ length: r.n }, (_, i) =>
    `<ellipse cy="${-r.d}" rx="${r.rx}" ry="${r.ry}" transform="rotate(${((360 / r.n) * i + r.off).toFixed(1)})" fill="${r.fill}" stroke="${AUBERGINE}" stroke-opacity="0.35" stroke-width="1.2"/>`,
  ),
).join('') + `<circle r="11" fill="#E3A000" stroke="${AUBERGINE}" stroke-opacity="0.4" stroke-width="1.2"/>`

/**
 * An aubergine tile with the marigold in the middle and a soft raised glow behind it.
 * `reach` is the flower's radius as a share of the tile; `corner` rounds the tile (0 for full bleed).
 */
function tile({ reach, corner = 0 }) {
  const size = 512
  const scale = (reach * size) / FLOWER_RADIUS
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><radialGradient id="g"><stop offset="0" stop-color="${AUBERGINE_RAISED}"/><stop offset="1" stop-color="${AUBERGINE}"/></radialGradient></defs>
  <rect width="${size}" height="${size}" rx="${corner * size}" fill="${AUBERGINE}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.48}" fill="url(#g)"/>
  <g transform="translate(${size / 2} ${size / 2}) scale(${scale.toFixed(3)})">${petals}</g>
</svg>`
}

// The tab favicon: the eight-petal mark from MarigoldMark, which stays readable at 16 px.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-26 -26 52 52">
  <rect x="-26" y="-26" width="52" height="52" rx="12" fill="${AUBERGINE}"/>
  <g fill="#EAAA00" stroke="${AUBERGINE}" stroke-width="1" transform="scale(0.82)">${Array.from({ length: 8 }, (_, i) => `<ellipse cy="-13" rx="7" ry="11" transform="rotate(${i * 45})"/>`).join('')}</g>
  <circle r="5.8" fill="#F7C944"/>
</svg>
`

// Installed icon: a rounded tile, flower large. Maskable: full bleed, flower inside the 40% safe circle.
// Apple: full bleed (iOS rounds the corners itself), never transparent.
const any = tile({ reach: 0.38, corner: 0.22 })
const fullBleed = tile({ reach: 0.31 })

const png = (svg, size, file) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/${file}`)

await writeFile('public/favicon.svg', favicon)
await Promise.all([
  png(any, 192, 'pwa-192.png'),
  png(any, 512, 'pwa-512.png'),
  png(fullBleed, 512, 'maskable-512.png'),
  png(fullBleed, 180, 'apple-touch-icon.png'),
  png(favicon, 32, 'favicon-32.png'),
])
console.log('Icons written to public/')
