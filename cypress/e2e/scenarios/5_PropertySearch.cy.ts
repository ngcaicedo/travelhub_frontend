import { SearchPage } from '../../pages/SearchPage'
import { DEMO_PROPERTY_ALPINE, DEMO_PROPERTY_RENAISSANCE } from '../../support/demoData'

const searchPage = new SearchPage()

// Las disponibilidades del search service estan seedeadas para los dias 10-16
// de cada mes de 2026 (ver travelhub_miso/services/search/src/db/seed.py).
const CHECK_IN = '2026-12-10'
const CHECK_OUT = '2026-12-12'

describe('Busqueda de hospedaje | filtros ciudad/fechas/capacidad', () => {
  beforeEach(() => {
    searchPage.visit()
  })

  it('devuelve la propiedad seedeada en Bogota cuando los filtros son validos', () => {
    searchPage.search({
      city: 'Bogota',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2
    })

    searchPage.resultsContainer().should('be.visible')
    searchPage.resultCards().should('have.length', 1)
    searchPage.resultCards()
      .first()
      .should('have.attr', 'data-cy-property-id', DEMO_PROPERTY_RENAISSANCE.id)
      .and('contain.text', DEMO_PROPERTY_RENAISSANCE.name)

    searchPage.summary().should('contain.text', '1')
  })

  it('respeta el filtro de ciudad al cambiar a Cali', () => {
    searchPage.search({
      city: 'Cali',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2
    })

    searchPage.resultCards().should('have.length', 1)
    searchPage.resultCards()
      .first()
      .should('have.attr', 'data-cy-property-id', DEMO_PROPERTY_ALPINE.id)
      .and('contain.text', DEMO_PROPERTY_ALPINE.name)
  })

  it('muestra empty state cuando los huespedes superan la capacidad disponible', () => {
    searchPage.search({
      city: 'Bogota',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 20
    })

    searchPage.emptyState().should('be.visible')
    searchPage.resultCards().should('not.exist')
  })
})
