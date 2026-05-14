/**
 * Ordered screenshot helper. Each call to `screenshot.take(name)` saves a
 * capture under `cypress/screenshots/<spec>/<TestTitle>/NNN_<name>.png`,
 * which `cypress-mochawesome-reporter` then embeds inside the HTML report
 * under the corresponding test, in execution order.
 *
 * The test title is included in the path so screenshots from different tests
 * in the same spec do not collide and overwrite each other on disk.
 */
class Screenshot {
  private counter = 0
  private currentTest = ''

  take(name: string, options: { fullPage?: boolean } = {}) {
    const title = Cypress.currentTest?.title ?? 'unnamedTest'
    if (title !== this.currentTest) {
      this.currentTest = title
      this.counter = 0
    }
    const idx = String(this.counter).padStart(3, '0')
    this.counter++
    const safeTitle = sanitize(title)
    cy.screenshot(`${safeTitle}/${idx}_${name}`, {
      capture: options.fullPage ? 'fullPage' : 'viewport',
      overwrite: true
    })
  }
}

function sanitize(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

export const screenshot = new Screenshot()
