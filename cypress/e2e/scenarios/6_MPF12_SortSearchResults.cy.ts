import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import {
  DEMO_PROPERTY_ANDINO,
  DEMO_PROPERTY_CANDELARIA,
  DEMO_PROPERTY_CIKOS
} from '../../support/demoData'

const CHECK_IN = '2026-12-10'
const CHECK_OUT = '2026-12-12'


describe('MPF-12 | Ordenar resultados de busqueda', () => {
  beforeEach(() => {
    // Given
    givenSteps.givenSearchRequestIsTracked()
    givenSteps.givenIAmOnSearch()

    // When: una busqueda inicial deja la pagina lista para reordenar
    whenSteps.whenISearchProperties({
      city: 'Bogota',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2
    })

    // Then: la primera peticion usa el orden por defecto (recomendado -> name asc)
    thenSteps.thenTheLastSearchRequestUsedOrder('name', 'asc')
    // El orden alfabetico real: Aparthotel -> Hostal -> Hotel Cikos
    thenSteps.thenTheSearchResultsAreOrdered([
      DEMO_PROPERTY_ANDINO.id,
      DEMO_PROPERTY_CANDELARIA.id,
      DEMO_PROPERTY_CIKOS.id
    ])
  })

  it('ordena por precio ascendente', () => {
    // When
    whenSteps.whenISelectSort('Precio: menor a mayor')

    // Then: API + URL + label
    thenSteps.thenTheLastSearchRequestUsedOrder('price', 'asc')
    thenSteps.thenTheURLQueryIncludes('sort=price_asc')
    thenSteps.thenTheSortLabelIs('Precio: menor a mayor')
    // Y el orden real de las tarjetas: Hostal (95k) -> Cikos (180k) -> Andino (320k)
    thenSteps.thenTheSearchResultsAreOrdered([
      DEMO_PROPERTY_CANDELARIA.id,
      DEMO_PROPERTY_CIKOS.id,
      DEMO_PROPERTY_ANDINO.id
    ])
  })

  it('ordena por precio descendente', () => {
    // When
    whenSteps.whenISelectSort('Precio: mayor a menor')

    // Then
    thenSteps.thenTheLastSearchRequestUsedOrder('price', 'desc')
    thenSteps.thenTheURLQueryIncludes('sort=price_desc')
    thenSteps.thenTheSortLabelIs('Precio: mayor a menor')
    // Andino (320k) -> Cikos (180k) -> Hostal (95k)
    thenSteps.thenTheSearchResultsAreOrdered([
      DEMO_PROPERTY_ANDINO.id,
      DEMO_PROPERTY_CIKOS.id,
      DEMO_PROPERTY_CANDELARIA.id
    ])
  })

  it('ordena por calificacion (mejor primero)', () => {
    // When
    whenSteps.whenISelectSort('Calificación')

    // Then
    thenSteps.thenTheLastSearchRequestUsedOrder('rating', 'desc')
    thenSteps.thenTheURLQueryIncludes('sort=rating')
    thenSteps.thenTheSortLabelIs('Calificación')
    // Mejor calificacion primero: Andino (4.95) -> Cikos (4.84) -> Hostal (4.55)
    thenSteps.thenTheSearchResultsAreOrdered([
      DEMO_PROPERTY_ANDINO.id,
      DEMO_PROPERTY_CIKOS.id,
      DEMO_PROPERTY_CANDELARIA.id
    ])
  })
})
