import { readCompanyJSON, writeCompanyJSON, getCompanyDataDir } from './store'
import { readdirSync } from 'fs'
import { join } from 'path'
import type { CallRecap } from '../shared/types'

export function saveRecap(companyId: string, recap: CallRecap): void {
  writeCompanyJSON(companyId, `recaps/${recap.id}.json`, { ...recap, companyId })
}

export function getRecap(companyId: string, id: string): CallRecap | null {
  return readCompanyJSON<CallRecap | null>(companyId, `recaps/${id}.json`, null)
}

export function getRecaps(companyId: string): CallRecap[] {
  const recapsDir = join(getCompanyDataDir(companyId), 'recaps')
  try {
    const files = readdirSync(recapsDir).filter(f => f.endsWith('.json'))
    return files.map(f => {
      return readCompanyJSON<CallRecap | null>(companyId, `recaps/${f}`, null)
    }).filter((r): r is CallRecap => r !== null && typeof r.date === 'string').sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  } catch {
    return []
  }
}
