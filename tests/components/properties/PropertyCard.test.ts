import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PropertyCard from '~/components/properties/PropertyCard.vue'
import type { Property } from '~/types/api'

describe('PropertyCard', () => {
  const mockProperty: Property = {
    id: '1',
    name: 'Test House',
    description: 'Test description',
    location: 'Test City',
    latitude: 10,
    longitude: 20,
    price_per_night: 100,
    currency: 'USD',
    rating: 4.5,
    review_count: 10,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    amenities: ['WiFi'],
    images: [{
      id: 'img-1',
      url: 'https://example.com/test.jpg',
      alt_text: 'Test image',
      position: 0
    }]
  }

  it('renders property name', async () => {
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: mockProperty }
    })
    expect(wrapper.text()).toContain('Test House')
  })

  it('renders price', async () => {
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: mockProperty }
    })
    expect(wrapper.text()).toContain('100')
  })

  it('renders rating', async () => {
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: mockProperty }
    })
    expect(wrapper.text()).toContain('4.5')
  })

  it('renders location', async () => {
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: mockProperty }
    })
    expect(wrapper.text()).toContain('Test City')
  })

  it('renders image with correct src', async () => {
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: mockProperty }
    })
    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('https://example.com/test.jpg')
  })

  it('renders image with alt text', async () => {
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: mockProperty }
    })
    const img = wrapper.find('img')
    expect(img.attributes('alt')).toBe('Test image')
  })

  it('has book now button', async () => {
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: mockProperty }
    })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('card container is clickable', async () => {
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: mockProperty }
    })
    const card = wrapper.find('.group')
    expect(card.exists()).toBe(true)
    expect(card.classes()).toContain('cursor-pointer')
  })

  it('handles property without images gracefully', async () => {
    const propertyNoImages: Property = {
      ...mockProperty,
      images: []
    }
    const wrapper = await mountSuspended(PropertyCard, {
      props: { property: propertyNoImages }
    })
    expect(wrapper.find('img').exists()).toBe(false)
  })
})
