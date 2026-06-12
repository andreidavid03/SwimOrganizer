// Generarea seriilor (heats) după regulile standard din înot:
//  - sportivii sunt ordonați după timpul de referință (cei fără timp la coadă);
//  - cei mai rapizi înoată în ULTIMA serie, pe culoarele din centru;
//  - prima serie poate fi incompletă.

/** Ordinea de umplere a culoarelor, din centru spre exterior: pentru 8 → [4,5,3,6,2,7,1,8]. */
export function laneOrder(lanesCount: number): number[] {
  const order: number[] = []
  let left = Math.ceil(lanesCount / 2)
  let right = left + 1
  while (order.length < lanesCount) {
    if (left >= 1) order.push(left--)
    if (right <= lanesCount && order.length < lanesCount) order.push(right++)
  }
  return order
}

export type SeedEntry<T> = { seedMs: number | null; data: T }

export type SeededHeat<T> = {
  heatNumber: number
  lanes: { laneNumber: number; entry: SeedEntry<T> }[]
}

export function buildHeats<T>(entries: SeedEntry<T>[], lanesCount: number): SeededHeat<T>[] {
  if (entries.length === 0) return []
  const sorted = [...entries].sort((a, b) => (a.seedMs ?? Infinity) - (b.seedMs ?? Infinity))
  const heatsCount = Math.ceil(sorted.length / lanesCount)
  const order = laneOrder(lanesCount)

  const heats: SeededHeat<T>[] = []
  for (let h = 0; h < heatsCount; h++) {
    const chunk = sorted.slice(h * lanesCount, (h + 1) * lanesCount)
    heats.push({
      // cel mai rapid grup (h=0) primește numărul cel mai mare de serie
      heatNumber: heatsCount - h,
      lanes: chunk.map((entry, i) => ({ laneNumber: order[i], entry })),
    })
  }
  return heats.sort((a, b) => a.heatNumber - b.heatNumber)
}
