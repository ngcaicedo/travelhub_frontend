declare module 'cypress-mochawesome-reporter/plugin' {
  const plugin: (on: Cypress.PluginEvents) => void
  export default plugin
}

declare module 'cypress-mochawesome-reporter/register'
