/**
 * Helpers para sembrar reservas en el backend de TravelHub via API.
 * Usado por specs E2E que necesitan precondiciones de datos.
 */

export interface SeedReservationInput {
  travelerId: string
  propertyId: string
  roomId?: string
  checkInDate: string
  checkOutDate: string
  guests: number
  currency?: string
}

export interface SeededReservation {
  id: string
  status: string
  total_price: string
  currency: string
  check_in_date: string
  check_out_date: string
}

function randomRoomId(): string {
  // El servicio de reservas no valida id_room contra una tabla de inventario;
  // sólo verifica que no exista otra reserva activa que solape fechas con ese room.
  const hex = '0123456789abcdef'
  const segments = [8, 4, 4, 4, 12].map((length) => {
    let out = ''
    for (let i = 0; i < length; i += 1) {
      out += hex[Math.floor(Math.random() * 16)]
    }
    return out
  })
  return segments.join('-')
}

export function seedReservation(input: SeedReservationInput): Cypress.Chainable<SeededReservation> {
  const body = {
    id_traveler: input.travelerId,
    id_property: input.propertyId,
    id_room: input.roomId ?? randomRoomId(),
    check_in_date: `${input.checkInDate}T00:00:00`,
    check_out_date: `${input.checkOutDate}T00:00:00`,
    number_of_guests: input.guests,
    currency: input.currency ?? 'COP'
  }

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('reservationsApiUrl')}/api/v1/reservations`,
    body,
    failOnStatusCode: true
  }).then((response) => response.body as SeededReservation)
}
