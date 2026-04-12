import { spawn } from 'node:child_process'

const child = spawn(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'nuxt', 'dev'],
  {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      NUXT_DEVTOOLS: 'false'
    }
  }
)

child.on('exit', (code) => {
  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
