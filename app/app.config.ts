export default defineAppConfig({
  ui: {
    colors: {
      primary: 'travelhub',
      neutral: 'slate'
    },

    // Buttons: rounded-lg, font-bold, py-4 for primary actions
    button: {
      slots: {
        base: 'font-bold rounded-lg'
      },
      variants: {
        size: {
          xl: {
            base: 'px-6 py-4 text-base gap-2',
            leadingIcon: 'size-5',
            trailingIcon: 'size-5'
          }
        }
      },
      defaultVariants: {
        size: 'md'
      }
    },

    // Inputs: rounded-lg, bg-slate-50, border-slate-200, h-14 for large inputs
    input: {
      slots: {
        base: 'rounded-lg'
      },
      variants: {
        size: {
          xl: {
            base: 'px-4 py-4 text-base gap-2',
            leading: 'ps-4',
            trailing: 'pe-4',
            leadingIcon: 'size-5',
            trailingIcon: 'size-5'
          }
        }
      },
      defaultVariants: {
        size: 'md',
        variant: 'outline'
      }
    },

    // Cards: rounded-xl, prominent shadow
    card: {
      slots: {
        root: 'rounded-xl shadow-xl',
        header: 'p-6 sm:p-8',
        body: 'p-6 sm:p-8',
        footer: 'p-6 sm:p-8'
      },
      defaultVariants: {
        variant: 'outline'
      }
    },

    // Form group: label style matches Figma (semibold, slate-700, text-sm)
    formField: {
      slots: {
        label: 'font-semibold text-[var(--ui-text-highlighted)]'
      }
    },

    // Navigation menu / header
    navigationMenu: {
      slots: {
        root: 'gap-2'
      }
    },

    // Badges: rounded-md
    badge: {
      slots: {
        base: 'rounded-md'
      }
    },

    // Modal: rounded-xl
    modal: {
      slots: {
        content: 'rounded-xl'
      }
    }
  }
})
