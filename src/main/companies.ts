import { randomUUID } from 'crypto'
import { rmSync, existsSync } from 'fs'
import { readJSON, writeJSON, getCompanyDataDir } from './store'
import type { CompanyProfile, AppSettings } from '../shared/types'

const COMPANIES_FILE = 'companies.json'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadAll(): CompanyProfile[] {
  return readJSON<CompanyProfile[]>(COMPANIES_FILE, [])
}

function saveAll(companies: CompanyProfile[]): void {
  writeJSON(COMPANIES_FILE, companies)
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function getCompanies(): CompanyProfile[] {
  return loadAll()
}

export function getCompany(id: string): CompanyProfile | null {
  return loadAll().find((c) => c.id === id) ?? null
}

export function saveCompany(
  profile: Partial<CompanyProfile> & { name: string }
): CompanyProfile {
  const companies = loadAll()
  const now = Date.now()

  if (profile.id) {
    // Update existing
    const idx = companies.findIndex((c) => c.id === profile.id)
    if (idx !== -1) {
      const existing = companies[idx]
      const updated: CompanyProfile = {
        ...existing,
        ...profile,
        id: existing.id, // never overwrite id
        createdAt: existing.createdAt,
        updatedAt: now
      }
      companies[idx] = updated
      saveAll(companies)
      return updated
    }
  }

  // Create new
  const created: CompanyProfile = {
    id: randomUUID(),
    name: profile.name,
    color: profile.color,
    customInstructions: profile.customInstructions ?? '',
    personas: profile.personas ?? [],
    productPitch: profile.productPitch ?? '',
    targetVertical: profile.targetVertical ?? '',
    createdAt: now,
    updatedAt: now
  }
  companies.push(created)
  saveAll(companies)
  return created
}

export function deleteCompany(id: string): void {
  const companies = loadAll().filter((c) => c.id !== id)
  saveAll(companies)

  // Clean up company data directory if it exists
  const companyDir = getCompanyDataDir(id)
  if (existsSync(companyDir)) {
    rmSync(companyDir, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------
// Active company helpers
// ---------------------------------------------------------------------------

export function getActiveCompany(settings: AppSettings): CompanyProfile | null {
  if (!settings.activeCompanyId) return null
  return getCompany(settings.activeCompanyId)
}

export function ensureDefaultCompany(): CompanyProfile {
  const companies = loadAll()
  if (companies.length > 0) return companies[0]

  return saveCompany({
    name: 'Default',
    customInstructions: ''
  })
}
