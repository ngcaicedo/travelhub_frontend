import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import {
  DEMO_PROPERTY_ALPINE,
  DEMO_PROPERTY_ANDINO,
  DEMO_PROPERTY_CANDELARIA,
  DEMO_PROPERTY_CIKOS
} from '../../support/demoData'

const CHECK_IN = '2026-12-10'
const CHECK_OUT = '2026-12-12'

describe('Busqueda de hospedaje | filtros ciudad/fechas/capacidad', () => {
  beforeEach(() => {
    // Given
    givenSteps.givenIAmOnSearch()
  })

  it('devuelve las tres propiedades seedeadas en Bogota cuando los filtros son validos', () => {
    // When
    whenSteps.whenISearchProperties({
      city: 'Bogota',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2
    })

    // Then: las 3 propiedades de Bogota aparecen (orden por defecto = name asc)
    thenSteps.thenISeeSearchResultCount(3)
    thenSteps.thenTheSearchResultsContain([
      DEMO_PROPERTY_ANDINO.id,
      DEMO_PROPERTY_CANDELARIA.id,
      DEMO_PROPERTY_CIKOS.id
    ])
    thenSteps.thenTheSearchSummaryContains('3')
  })

  it('respeta el filtro de ciudad al cambiar a Chamonix', () => {
    // When
    whenSteps.whenISearchProperties({
      city: 'Chamonix',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2
    })

    // Then
    thenSteps.thenISeeSearchResultCount(1)
    thenSteps.thenTheFirstSearchResultIs(DEMO_PROPERTY_ALPINE.id, DEMO_PROPERTY_ALPINE.name)
  })

  it('aplica el filtro de capacidad y excluye las propiedades pequeñas en Bogota', () => {
    // When: el Hostal Candelaria (8) y el Aparthotel Andino (6) quedan fuera
    //       solo Cikos (24) admite 10 huespedes
    whenSteps.whenISearchProperties({
      city: 'Bogota',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 10
    })

    // Then
    thenSteps.thenISeeSearchResultCount(1)
    thenSteps.thenTheFirstSearchResultIs(DEMO_PROPERTY_CIKOS.id, DEMO_PROPERTY_CIKOS.name)
  })

  it('muestra empty state cuando los huespedes superan la capacidad disponible', () => {
    // When
    whenSteps.whenISearchProperties({
      city: 'Bogota',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 100
    })

    // Then
    thenSteps.thenISeeTheSearchEmptyState()
    thenSteps.thenISeeSearchResultCount(0)
  })
})
