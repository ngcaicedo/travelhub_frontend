import type { Property, Review } from '~/types/api'

type PropertyDetails = {
  property: Property
  reviews: Review[]
}

const propertyPresets = [
  {
    name: 'Renaissance Estate & Private Vineyard',
    description: 'Experience the timeless elegance of this 18th-century Renaissance estate, nestled in the heart of scenic working vineyard just outside Florence. The villa has been meticulously restored to blend historic character with ultra-modern luxury. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This historic property boasts 4 luxurious bedrooms with en-suite bathrooms, each decorated with period furnishings and modern amenities. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    location: 'Fiesole, Florence',
    latitude: 43.8047,
    longitude: 11.2844,
    price_per_night: 1240,
    bedrooms: 4,
    bathrooms: 4.5,
    max_guests: 12,
    rating: 4.98,
    review_count: 54,
    amenities: ['Private Infinity Pool', 'High-speed Fiber WiFi', 'Private Vineyard Access', 'Professional Kitchen', 'Free Valet Parking', 'Climate Control', 'Smart Home System', 'Wine Cellar'],
    images: [
      { id: '1', url: '/mock/property-1.svg', alt_text: 'Renaissance Estate Main View', position: 0 },
      { id: '2', url: '/mock/property-2.svg', alt_text: 'Bedroom', position: 1 },
      { id: '3', url: '/mock/property-3.svg', alt_text: 'Bathroom', position: 2 },
      { id: '4', url: '/mock/property-4.svg', alt_text: 'Dining Room', position: 3 },
      { id: '5', url: '/mock/property-5.svg', alt_text: 'Living Area', position: 4 }
    ]
  },
  {
    name: 'Modern Beachfront Penthouse',
    description: 'Stunning contemporary penthouse with direct beach access and panoramic ocean views. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This ultra-modern property features floor-to-ceiling windows, minimalist design, and state-of-the-art technology. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Wake up to the sound of waves while enjoying your morning coffee on the spacious terrace.',
    location: 'Miami Beach, Florida',
    latitude: 25.7907,
    longitude: -80.1300,
    price_per_night: 2150,
    bedrooms: 3,
    bathrooms: 3,
    max_guests: 8,
    rating: 4.87,
    review_count: 42,
    amenities: ['Private Beach Access', '360° Panoramic Views', 'Smart Home Automation', 'Chef Kitchen', 'Wine Cooler', 'Sauna & Steam Room', 'Concierge Service', 'Rooftop Terrace'],
    images: [
      { id: '1', url: '/mock/property-2.svg', alt_text: 'Beachfront View', position: 0 },
      { id: '2', url: '/mock/property-1.svg', alt_text: 'Master Bedroom', position: 1 },
      { id: '3', url: '/mock/property-4.svg', alt_text: 'Modern Bathroom', position: 2 },
      { id: '4', url: '/mock/property-3.svg', alt_text: 'Living Room', position: 3 },
      { id: '5', url: '/mock/property-5.svg', alt_text: 'Terrace View', position: 4 }
    ]
  },
  {
    name: 'Alpine Mountain Lodge',
    description: 'Cozy luxury mountain lodge surrounded by pristine alpine scenery and snow-capped peaks. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Perfect retreat for hiking, skiing, or simply relaxing by the fireplace. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    location: 'Chamonix, French Alps',
    latitude: 45.9237,
    longitude: 6.8694,
    price_per_night: 890,
    bedrooms: 5,
    bathrooms: 4,
    max_guests: 14,
    rating: 4.92,
    review_count: 67,
    amenities: ['Stone Fireplace', 'Mountain Views', 'Ski Storage', 'Heated Sauna', 'Ski In/Out Access', 'Game Room', 'Wine Cellar', 'Library'],
    images: [
      { id: '1', url: '/mock/property-5.svg', alt_text: 'Mountain Lodge Exterior', position: 0 },
      { id: '2', url: '/mock/property-3.svg', alt_text: 'Cozy Living Room', position: 1 },
      { id: '3', url: '/mock/property-2.svg', alt_text: 'Luxury Bathroom', position: 2 },
      { id: '4', url: '/mock/property-4.svg', alt_text: 'Dining Area', position: 3 },
      { id: '5', url: '/mock/property-1.svg', alt_text: 'Mountain View', position: 4 }
    ]
  },
  {
    name: 'Tropical Paradise Villa',
    description: 'Exotic beach villa with direct access to white sand beaches and turquoise waters. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This incredible property is surrounded by lush tropical gardens, palm trees, and exotic flowers. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Wake up to the sounds of nature and enjoy the perfect tropical escape. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    location: 'Bora Bora, French Polynesia',
    latitude: -16.5004,
    longitude: -151.7415,
    price_per_night: 1650,
    bedrooms: 4,
    bathrooms: 4,
    max_guests: 10,
    rating: 4.99,
    review_count: 89,
    amenities: ['Beach Front', 'Infinity Pool', 'Outdoor Shower', 'Water Sports Equipment', 'Tropical Gardens', 'Tiki Bar', 'Aerial Pavilion', 'Snorkel Access'],
    images: [
      { id: '1', url: '/mock/property-4.svg', alt_text: 'Tropical Beach', position: 0 },
      { id: '2', url: '/mock/property-2.svg', alt_text: 'Bedroom Bungalow', position: 1 },
      { id: '3', url: '/mock/property-1.svg', alt_text: 'Outdoor Bathroom', position: 2 },
      { id: '4', url: '/mock/property-5.svg', alt_text: 'Infinity Pool', position: 3 },
      { id: '5', url: '/mock/property-3.svg', alt_text: 'Sunset View', position: 4 }
    ]
  }
] as const

const getPropertyPreset = (propertyId?: string) => {
  if (!propertyId) return propertyPresets[0]!

  let hash = 0
  for (let i = 0; i < propertyId.length; i++) {
    const char = propertyId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }

  const index = Math.abs(hash) % propertyPresets.length
  return propertyPresets[index]!
}

const getMockReviews = (propertyId?: string): Review[] => {
  const reviewOptions = [
    {
      author: 'Sarah Holkins',
      rating: 5,
      date: 'September 2024',
      comment: 'This was the highlight of my entire vacation! Amazing property with incredible attention to detail. Highly recommend!'
    },
    {
      author: 'Marc Thompson',
      rating: 5,
      date: 'August 2024',
      comment: 'Stunning location and exceptional service. The host went above and beyond to make our stay perfect. Will definitely return!'
    },
    {
      author: 'Emily Rodriguez',
      rating: 4,
      date: 'July 2024',
      comment: 'Beautiful views and very comfortable. Everything was exactly as described in the listing. Great experience!'
    },
    {
      author: 'James Chen',
      rating: 5,
      date: 'June 2024',
      comment: 'Exceeded all expectations. The amenities are top-notch and the location is perfect. Worth every penny!'
    },
    {
      author: 'Lucia Martini',
      rating: 4,
      date: 'May 2024',
      comment: 'Lovely property in a beautiful setting. Host was very responsive and accommodating. Highly recommended!'
    }
  ]

  let hash = 0
  if (propertyId) {
    for (let i = 0; i < propertyId.length; i++) {
      hash += propertyId.charCodeAt(i)
    }
  }

  const startIdx = Math.abs(hash) % reviewOptions.length
  const review1 = reviewOptions[startIdx]!
  const review2 = reviewOptions[(startIdx + 1) % reviewOptions.length]!

  return [
    {
      id: '1',
      author: review1.author,
      rating: review1.rating,
      date: review1.date,
      comment: review1.comment,
      verified_stay: true
    },
    {
      id: '2',
      author: review2.author,
      rating: review2.rating,
      date: review2.date,
      comment: review2.comment,
      verified_stay: true
    }
  ]
}

export const getPropertyDetails = async (propertyId?: string): Promise<PropertyDetails> => {
  const preset = getPropertyPreset(propertyId)

  return {
    property: {
      id: propertyId || 'default-property-id',
      name: preset.name,
      description: preset.description,
      location: preset.location,
      latitude: preset.latitude,
      longitude: preset.longitude,
      price_per_night: preset.price_per_night,
      currency: 'COP',
      rating: preset.rating,
      review_count: preset.review_count,
      bedrooms: preset.bedrooms,
      bathrooms: preset.bathrooms,
      max_guests: preset.max_guests,
      amenities: [...preset.amenities],
      images: preset.images.map(image => ({ ...image }))
    },
    reviews: getMockReviews(propertyId)
  }
}

export const getAllProperties = async (): Promise<Property[]> => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 300))

  const propertyIds = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  ]

  return propertyPresets.map((preset, index) => ({
    id: propertyIds[index]!,
    name: preset.name,
    description: preset.description,
    location: preset.location,
    latitude: preset.latitude,
    longitude: preset.longitude,
    price_per_night: preset.price_per_night,
    currency: 'COP',
    rating: preset.rating,
    review_count: preset.review_count,
    bedrooms: preset.bedrooms,
    bathrooms: preset.bathrooms,
    max_guests: preset.max_guests,
    amenities: Array.from(preset.amenities),
    images: preset.images.map(image => ({ ...image }))
  }))
}
