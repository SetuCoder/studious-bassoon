import { useId } from 'react'

// The brand flower, drawn rather than photographed: rings of petals from the outside in,
// darker outside, lighter towards the centre, with a faint aubergine edge on each petal.
const RINGS = [
  { n: 11, d: 78, rx: 24, ry: 40, fill: '#B57E00', off: 0 },
  { n: 13, d: 62, rx: 22, ry: 36, fill: '#D99A00', off: 7 },
  { n: 13, d: 46, rx: 20, ry: 31, fill: '#EAAA00', off: 0 },
  { n: 12, d: 31, rx: 17, ry: 25, fill: '#F2BB24', off: 9 },
  { n: 10, d: 17, rx: 13, ry: 19, fill: '#F7C944', off: 4 },
] as const

function Petals() {
  return (
    <>
      {RINGS.flatMap((r) =>
        Array.from({ length: r.n }, (_, i) => (
          <ellipse
            key={`${r.d}-${i}`}
            cy={-r.d}
            rx={r.rx}
            ry={r.ry}
            transform={`rotate(${((360 / r.n) * i + r.off).toFixed(1)})`}
            fill={r.fill}
            stroke="#3A0F34"
            strokeOpacity={0.35}
            strokeWidth={1.2}
          />
        )),
      )}
      <circle r={11} fill="#E3A000" stroke="#3A0F34" strokeOpacity={0.4} strokeWidth={1.2} />
    </>
  )
}

/** The full marigold. Decorative. `smear` adds the aubergine and marigold motion trail from the board. */
export function Marigold({ size, smear = false, className = '' }: { size: number; smear?: boolean; className?: string }) {
  const filter = useId().replace(/:/g, '')
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="-130 -130 260 260" className={className} overflow="visible">
      {smear && (
        <>
          <defs>
            <filter id={filter} x="-80%" y="-10%" width="200%" height="120%">
              <feGaussianBlur stdDeviation="16 0" />
            </filter>
          </defs>
          <ellipse cx={-70} cy={10} rx={70} ry={95} fill="#3A0F34" opacity={0.5} filter={`url(#${filter})`} />
          <g transform="translate(-46 0)" opacity={0.6} filter={`url(#${filter})`}><Petals /></g>
        </>
      )}
      <Petals />
    </svg>
  )
}

/** The small brand mark: a simplified eight-petal marigold that stays crisp at 20 px. */
export function MarigoldMark({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="-26 -26 52 52">
      <g fill="#EAAA00" stroke="#3A0F34" strokeWidth={1}>
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cy={-13} rx={7} ry={11} transform={`rotate(${i * 45})`} />
        ))}
      </g>
      <circle r={7} fill="#F7C944" />
    </svg>
  )
}
