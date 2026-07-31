import { execSync } from 'child_process'

try {
  // Verifica se o container do postgres está rodando
  const output = execSync('docker compose ps --format json', { encoding: 'utf-8' })
  const containers = output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))

  const isRunning = containers.some(
    (c) => c.Service === 'postgres' && c.State === 'running'
  )

  if (!isRunning) {
    console.log('Banco de dados de teste parado. Iniciando container...')
    execSync('docker compose up -d postgres', { stdio: 'inherit' })
  } else {
    console.log('Container do banco de dados já está rodando.')
  }
} catch (error) {
  console.log('Iniciando container do banco de dados...')
  try {
    execSync('docker compose up -d postgres', { stdio: 'inherit' })
  } catch (err) {
    console.error('Erro ao iniciar o container:', err.message)
    process.exit(1)
  }
}