/**
 * Constantes de datos demo seedeados por el backend cuando se levanta con
 * DEMO_SEED_ENABLED=true. Mantener sincronizado con:
 *   - travelhub_miso/services/users/src/db/seed.py
 *   - travelhub_miso/services/properties/src/db/seed.py
 *   - travelhub_miso/services/security/src/core/config.py (DEMO_HOTEL_EMAILS, DEMO_OTP_CODE)
 */

export const DEMO_OTP_CODE = '000000'
export const DEMO_HOTEL_PASSWORD = 'HotelDemo123'

export interface DemoHotel {
  id: string
  email: string
  fullName: string
  hotelName: string
  phone: string
  password: string
}

export const DEMO_HOTEL_A: DemoHotel = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email: 'hotel-a@travelhub.demo',
  fullName: 'Grand Plaza Hotel',
  hotelName: 'Grand Plaza Hotel',
  phone: '3000000001',
  password: DEMO_HOTEL_PASSWORD
}

export const DEMO_HOTEL_B: DemoHotel = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  email: 'hotel-b@travelhub.demo',
  fullName: 'Mountain Resort',
  hotelName: 'Mountain Resort',
  phone: '3000000002',
  password: DEMO_HOTEL_PASSWORD
}

export interface DemoProperty {
  id: string
  ownerId: string
  name: string
  location: string
  currency: string
  pricePerNight: number
}

export const DEMO_PROPERTY_RENAISSANCE: DemoProperty = {
  id: '11111111-1111-1111-1111-111111111111',
  ownerId: DEMO_HOTEL_A.id,
  name: 'Mansión Renacentista & Viñedo Privado',
  location: 'Fiesole, Florencia',
  currency: 'COP',
  pricePerNight: 1240.0
}

export const DEMO_PROPERTY_BEACHFRONT: DemoProperty = {
  id: '22222222-2222-2222-2222-222222222222',
  ownerId: DEMO_HOTEL_A.id,
  name: 'Penthouse Moderno Frente a la Playa',
  location: 'Playa Miami, Florida',
  currency: 'USD',
  pricePerNight: 2150.0
}

export const DEMO_PROPERTY_ALPINE: DemoProperty = {
  id: '33333333-3333-3333-3333-333333333333',
  ownerId: DEMO_HOTEL_B.id,
  name: 'Refugio Alpino de Montaña',
  location: 'Chamonix, Alpes Franceses',
  currency: 'EUR',
  pricePerNight: 890.0
}

export const DEMO_PROPERTY_TROPICAL: DemoProperty = {
  id: '44444444-4444-4444-4444-444444444444',
  ownerId: DEMO_HOTEL_B.id,
  name: 'Villa Paraíso Tropical',
  location: 'Bora Bora, Polinesia Francesa',
  currency: 'USD',
  pricePerNight: 1650.0
}

export const DEMO_PROPERTY_CIKOS: DemoProperty = {
  id: '55555555-5555-5555-5555-555555555555',
  ownerId: DEMO_HOTEL_A.id,
  name: 'Hotel Cikos Executive Suites',
  location: 'Bogotá, Colombia',
  currency: 'COP',
  pricePerNight: 180000.0
}

export const DEMO_PROPERTY_CANDELARIA: DemoProperty = {
  id: '66666666-6666-6666-6666-666666666666',
  ownerId: DEMO_HOTEL_B.id,
  name: 'Hostal Boutique La Candelaria',
  location: 'Bogotá, Colombia',
  currency: 'COP',
  pricePerNight: 95000.0
}

export const DEMO_PROPERTY_ANDINO: DemoProperty = {
  id: '77777777-7777-7777-7777-777777777777',
  ownerId: DEMO_HOTEL_B.id,
  name: 'Aparthotel Andino Premium',
  location: 'Bogotá, Colombia',
  currency: 'COP',
  pricePerNight: 320000.0
}

export const DEMO_PROPERTIES: DemoProperty[] = [
  DEMO_PROPERTY_RENAISSANCE,
  DEMO_PROPERTY_BEACHFRONT,
  DEMO_PROPERTY_ALPINE,
  DEMO_PROPERTY_TROPICAL,
  DEMO_PROPERTY_CIKOS,
  DEMO_PROPERTY_CANDELARIA,
  DEMO_PROPERTY_ANDINO
]
