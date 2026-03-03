import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const dataDir = join(app.getPath('userData'), 'pitchpilot-data')

export function ensureDataDir(): void {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  const recapsDir = join(dataDir, 'recaps')
  if (!existsSync(recapsDir)) mkdirSync(recapsDir, { recursive: true })
}

export function readJSON<T>(filename: string, fallback: T): T {
  const filepath = join(dataDir, filename)
  if (!existsSync(filepath)) return fallback
  try {
    return JSON.parse(readFileSync(filepath, 'utf-8'))
  } catch {
    return fallback
  }
}

export function writeJSON(filename: string, data: unknown): void {
  ensureDataDir()
  const filepath = join(dataDir, filename)
  writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

export function getDataDir(): string {
  return dataDir
}

// ---------------------------------------------------------------------------
// Company-scoped data paths
// ---------------------------------------------------------------------------

export function getCompanyDataDir(companyId: string): string {
  // Validate UUID format to prevent path traversal
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
    throw new Error(`Invalid company ID format: ${companyId}`)
  }
  return join(dataDir, 'companies', companyId)
}

export function ensureCompanyDir(companyId: string): void {
  const companyDir = getCompanyDataDir(companyId)
  if (!existsSync(companyDir)) mkdirSync(companyDir, { recursive: true })
  const recapsDir = join(companyDir, 'recaps')
  if (!existsSync(recapsDir)) mkdirSync(recapsDir, { recursive: true })
}

export function readCompanyJSON<T>(companyId: string, filename: string, fallback: T): T {
  const filepath = join(getCompanyDataDir(companyId), filename)
  if (!existsSync(filepath)) return fallback
  try {
    return JSON.parse(readFileSync(filepath, 'utf-8'))
  } catch {
    return fallback
  }
}

export function writeCompanyJSON(companyId: string, filename: string, data: unknown): void {
  ensureCompanyDir(companyId)
  const filepath = join(getCompanyDataDir(companyId), filename)
  writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
}
