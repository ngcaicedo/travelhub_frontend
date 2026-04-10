/**
 * Renders a fake cursor inside the application-under-test so that screenshots
 * (and the live test runner) show where each click/type/hover lands.
 *
 * Cypress does not paint the real OS cursor into screenshots, so we overwrite
 * the mouse-related commands and reposition a small dot on the target element
 * just before the original command runs.
 */

const CURSOR_ID = '__cy-fake-cursor'
const CURSOR_SIZE = 18

type CyEl = HTMLElement | SVGElement

function ensureCursor(doc: Document): HTMLElement {
  let cursor = doc.getElementById(CURSOR_ID)
  if (cursor) return cursor

  cursor = doc.createElement('div')
  cursor.id = CURSOR_ID
  cursor.style.cssText = [
    'position: fixed',
    `width: ${CURSOR_SIZE}px`,
    `height: ${CURSOR_SIZE}px`,
    'border-radius: 50%',
    'background: rgba(255, 0, 80, 0.55)',
    'border: 2px solid #ff0050',
    'box-shadow: 0 0 6px rgba(255, 0, 80, 0.9)',
    'pointer-events: none',
    'z-index: 2147483647',
    'transform: translate(-50%, -50%)',
    'transition: top 80ms linear, left 80ms linear',
    'top: 0',
    'left: 0'
  ].join('; ')
  doc.body.appendChild(cursor)
  return cursor
}

function moveCursorTo(el: CyEl) {
  const doc = el.ownerDocument
  if (!doc || !doc.body) return
  const cursor = ensureCursor(doc)
  const rect = el.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  cursor.style.left = `${x}px`
  cursor.style.top = `${y}px`
}

function withCursor<T extends CyEl>($subject: JQuery<T> | undefined) {
  if ($subject && $subject.length > 0) {
    moveCursorTo($subject[0]!)
  }
}

const MOUSE_COMMANDS = ['click', 'dblclick', 'rightclick', 'type', 'trigger', 'check', 'uncheck', 'select'] as const

MOUSE_COMMANDS.forEach((name) => {
  Cypress.Commands.overwrite(
    name as Parameters<typeof Cypress.Commands.overwrite>[0],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (originalFn: any, subject: any, ...args: any[]) => {
      withCursor(subject)
      return originalFn(subject, ...args)
    }
  )
})
