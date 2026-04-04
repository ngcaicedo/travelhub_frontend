declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeClient
  }
}

export type StripeConfirmationTokenResult = {
  error?: { message?: string }
  confirmationToken?: { id: string }
}

export type StripeNextActionResult = {
  error?: { message?: string }
}

export type StripeElementsInstance = {
  submit: () => Promise<{ error?: { message?: string } }>
  create: (
    type: string,
    options?: Record<string, unknown>
  ) => {
    mount: (selector: string | HTMLElement) => void
    unmount?: () => void
    destroy?: () => void
  }
}

export type StripeClient = {
  elements: (options: Record<string, unknown>) => StripeElementsInstance
  createConfirmationToken: (options: Record<string, unknown>) => Promise<StripeConfirmationTokenResult>
  handleNextAction: (options: { clientSecret: string }) => Promise<StripeNextActionResult>
}

let stripeScriptPromise: Promise<void> | null = null

export async function loadStripeJs(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  if (window.Stripe) {
    return
  }

  if (!stripeScriptPromise) {
    stripeScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-stripe-js="true"]')

      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.async = true
      script.dataset.stripeJs = 'true'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Stripe.js'))
      document.head.appendChild(script)
    })
  }

  await stripeScriptPromise
}
