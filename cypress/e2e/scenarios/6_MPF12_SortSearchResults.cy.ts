import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'

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
  })

  it('ordena por precio ascendente', () => {
    // When
    whenSteps.whenISelectSort('Precio: menor a mayor')

    // Then
    thenSteps.thenTheLastSearchRequestUsedOrder('price', 'asc')
    thenSteps.thenTheURLQueryIncludes('sort=price_asc')
    thenSteps.thenTheSortLabelIs('Precio: menor a mayor')
  })

  it('ordena por precio descendente', () => {
    // When
    whenSteps.whenISelectSort('Precio: mayor a menor')

    // Then
    thenSteps.thenTheLastSearchRequestUsedOrder('price', 'desc')
    thenSteps.thenTheURLQueryIncludes('sort=price_desc')
    thenSteps.thenTheSortLabelIs('Precio: mayor a menor')
  })

  it('ordena por calificacion', () => {
    // When
    whenSteps.whenISelectSort('Calificación')

    // Then
    thenSteps.thenTheLastSearchRequestUsedOrder('rating', 'asc')
    thenSteps.thenTheURLQueryIncludes('sort=rating')
    thenSteps.thenTheSortLabelIs('Calificación')
  })
})
