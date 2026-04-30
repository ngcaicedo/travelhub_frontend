/**
 * Genera rangos de fechas (check-in / check-out de 2 noches) que no colisionan
 * dentro de un mismo run y rotan entre runs, sin requerir cleanup de la DB.
 *
 * Backend: el search service tiene disponibilidad seedeada en los dias 10-16
 * de cada mes de 2026 (12 meses x 7 dias). Como las reservas E2E usan el
 * widget que cablea id_room = property.id, dos reservas con fechas que
 * solapan en el mismo room generan conflicto. Usamos rangos NO-overlapping
 * dentro de cada ventana mensual: 10-12, 12-14, 14-16 → 3 slots por mes
 * x 12 meses = 36 slots no-overlapping.
 *
 * Estrategia:
 *  - Filtramos los 36 slots a los que producen fechas futuras (check-in
 *    al menos MIN_DAYS_AHEAD dias despues de hoy).
 *  - El minuto-epoca actual define un offset base que rota cada minuto.
 *  - El testIndex (0-based) suma para que tests dentro del mismo run usen
 *    slots distintos. El indice se aplica sobre la lista filtrada,
 *    garantizando unicidad.
 *
 * Limite: si la DB persiste y se corre la suite muchas veces sin reset, los
 * slots vigentes se llenan. Para CI con DB ephemeral no aplica. Para dev
 * local intensivo, reiniciar el contenedor postgres.
 */

export interface DateRange {
  checkIn: string
  checkOut: string
}

const RANGES_PER_MONTH = 3 // 10-12, 12-14, 14-16
const MIN_DAYS_AHEAD = 1

interface SlotCoords {
  month: number // 1-12
  dayStart: number // 10, 12 o 14
  dayEnd: number
}

function buildAllSlots(): SlotCoords[] {
  const result: SlotCoords[] = []
  for (let month = 1; month <= 12; month++) {
    for (let i = 0; i < RANGES_PER_MONTH; i++) {
      const dayStart = 10 + i * 2
      result.push({ month, dayStart, dayEnd: dayStart + 2 })
    }
  }
  return result
}

function isFutureSlot(coords: SlotCoords, now: Date): boolean {
  const slotDate = new Date(Date.UTC(2026, coords.month - 1, coords.dayStart))
  const cutoff = new Date(now.getTime() + MIN_DAYS_AHEAD * 24 * 60 * 60 * 1000)
  return slotDate.getTime() > cutoff.getTime()
}

export function uniqueDateRange(testIndex: number): DateRange {
  const now = new Date()
  const futureSlots = buildAllSlots().filter(coords => isFutureSlot(coords, now))

  if (futureSlots.length === 0) {
    throw new Error('uniqueDateRange: no future slots available in 2026 seed window')
  }

  const minute = Math.floor(now.getTime() / 60_000)
  const index = ((minute * RANGES_PER_MONTH) + testIndex) % futureSlots.length
  const coords = futureSlots[index]!

  const mm = String(coords.month).padStart(2, '0')
  const ddIn = String(coords.dayStart).padStart(2, '0')
  const ddOut = String(coords.dayEnd).padStart(2, '0')
  return {
    checkIn: `2026-${mm}-${ddIn}`,
    checkOut: `2026-${mm}-${ddOut}`
  }
}
