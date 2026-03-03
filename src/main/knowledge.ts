import { readCompanyJSON, writeCompanyJSON } from './store'
import type { KnowledgeDoc } from '../shared/types'

const KNOWLEDGE_FILE = 'knowledge.json'

export function getKnowledge(companyId: string): KnowledgeDoc[] {
  return readCompanyJSON<KnowledgeDoc[]>(companyId, KNOWLEDGE_FILE, [])
}

export function saveKnowledgeDoc(companyId: string, doc: KnowledgeDoc): KnowledgeDoc {
  const docs = getKnowledge(companyId)
  const idx = docs.findIndex(d => d.id === doc.id)
  if (idx >= 0) {
    docs[idx] = { ...doc, updatedAt: new Date().toISOString() }
  } else {
    docs.push({
      ...doc,
      id: doc.id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
  writeCompanyJSON(companyId, KNOWLEDGE_FILE, docs)
  return docs[idx >= 0 ? idx : docs.length - 1]
}

export function deleteKnowledgeDoc(companyId: string, id: string): void {
  const docs = getKnowledge(companyId).filter(d => d.id !== id)
  writeCompanyJSON(companyId, KNOWLEDGE_FILE, docs)
}

/**
 * Build a context string from knowledge docs, with optional relevance filtering.
 * If query is provided, scores docs by keyword relevance and returns top matches.
 * If no query, returns all docs (up to MAX_CONTEXT_CHARS).
 */
const MAX_CONTEXT_CHARS = 60000

export function buildKnowledgeContext(companyId: string, query?: string): string {
  const docs = getKnowledge(companyId)
  if (docs.length === 0) return ''

  let selectedDocs = docs

  // If we have a query and many docs, filter by relevance
  if (query && docs.length > 3) {
    const queryWords = extractKeywords(query)
    const scored = docs.map(doc => {
      const docWords = `${doc.title} ${doc.content} ${doc.tags.join(' ')} ${doc.category}`.toLowerCase()
      let score = 0
      for (const word of queryWords) {
        const regex = new RegExp(word, 'gi')
        const matches = docWords.match(regex)
        if (matches) score += matches.length
      }
      // Boost by category match
      if (queryWords.some(w => doc.category.includes(w))) score += 5
      // Boost by tag match
      for (const tag of doc.tags) {
        if (queryWords.some(w => tag.toLowerCase().includes(w))) score += 3
      }
      return { doc, score }
    })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)

    // If we got relevance hits, use them; otherwise fall back to all docs
    if (scored.length > 0) {
      selectedDocs = scored.map(s => s.doc)
    }
  }

  // Truncate to fit within context limit
  let totalChars = 0
  const included: typeof docs = []
  for (const doc of selectedDocs) {
    const docSize = doc.title.length + doc.content.length + 50
    if (totalChars + docSize > MAX_CONTEXT_CHARS) break
    included.push(doc)
    totalChars += docSize
  }

  if (included.length === 0) return ''

  const sections = included.map(doc =>
    `### ${doc.title} [${doc.category}]\n${doc.content}`
  ).join('\n\n')

  return `\n\n--- KNOWLEDGE BASE (${included.length}/${docs.length} docs) ---\nYou have deep knowledge loaded from uploaded documents. Use this information to answer ANY question accurately. Always reference this knowledge when relevant:\n\n${sections}\n--- END KNOWLEDGE BASE ---`
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and',
    'or', 'if', 'while', 'what', 'which', 'who', 'whom', 'this', 'that',
    'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he',
    'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
    'about', 'tell', 'give', 'say', 'get', 'make', 'know', 'think',
  ])

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
}
