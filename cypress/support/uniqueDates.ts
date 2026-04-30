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
 *  - El minuto-epoca actual define un offset base que rota cada minuto.
 *  - El testIndex (0-based) suma para que tests dentro del mismo run usen
 *    slots distintos.
 *  - El slot final es ((minuto * 3) + testIndex) % 36 → garantiza 3 slots
 *    distintos por minuto y cobertura completa cada 12 minutos.
 *
 * Limite: si la DB persiste y se corre la suite >36 veces sin reset, los
 * slots se llenan. Para CI con DB ephemeral no aplica. Para dev local
 * intensivo, reiniciar el contenedor postgres.
 */

export interface DateRange {
  checkIn: string
  checkOut: string
}

const TOTAL_SLOTS = 36
const RANGES_PER_MONTH = 3 // 10-12, 12-14, 14-16

export function uniqueDateRange(testIndex: number): DateRange {
  const minute = Math.floor(Date.now() / 60_000)
  const slot = ((minute * RANGES_PER_MONTH) + testIndex) % TOTAL_SLOTS
  const month = Math.floor(slot / RANGES_PER_MONTH) + 1 // 1-12
  const dayStart = 10 + (slot % RANGES_PER_MONTH) * 2 // 10, 12 o 14
  const dayEnd = dayStart + 2
  const mm = String(month).padStart(2, '0')
  const ddIn = String(dayStart).padStart(2, '0')
  const ddOut = String(dayEnd).padStart(2, '0')
  return {
    checkIn: `2026-${mm}-${ddIn}`,
    checkOut: `2026-${mm}-${ddOut}`
  }
}
