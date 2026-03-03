import { useState, useEffect, useCallback } from 'react'
import type { KnowledgeDoc } from '../../../shared/types'

const CATEGORIES: KnowledgeDoc['category'][] = ['product', 'pricing', 'faq', 'competitive', 'technical', 'process', 'general']

function detectCategory(filename: string): KnowledgeDoc['category'] {
  const lower = filename.toLowerCase()
  if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost')) return 'pricing'
  if (lower.includes('faq') || lower.includes('question')) return 'faq'
  if (lower.includes('compet') || lower.includes('versus') || lower.includes('vs')) return 'competitive'
  if (lower.includes('tech') || lower.includes('api') || lower.includes('spec') || lower.includes('arch')) return 'technical'
  if (lower.includes('process') || lower.includes('workflow') || lower.includes('playbook')) return 'process'
  if (lower.includes('product') || lower.includes('feature') || lower.includes('readme')) return 'product'
  return 'general'
}

function detectTags(filename: string): string[] {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const tags: string[] = []
  if (ext) tags.push(ext)

  // Detect language/type from extension
  const codeLangs: Record<string, string> = {
    js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
    py: 'python', java: 'java', go: 'golang', rs: 'rust', rb: 'ruby',
    php: 'php', cs: 'csharp', swift: 'swift', kt: 'kotlin',
    sql: 'sql', html: 'html', css: 'css', vue: 'vue', svelte: 'svelte',
  }
  if (codeLangs[ext]) tags.push(codeLangs[ext], 'code')

  return tags
}

export default function KnowledgeBase() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [editing, setEditing] = useState<KnowledgeDoc | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [importStatus, setImportStatus] = useState('')

  useEffect(() => { loadDocs() }, [])

  const loadDocs = async () => setDocs(await window.api.getKnowledge())

  const startNew = () => setEditing({
    id: '', title: '', category: 'general', content: '', tags: [],
    createdAt: '', updatedAt: '',
  })

  const save = async () => {
    if (!editing) return
    await window.api.saveKnowledge(editing)
    setEditing(null)
    loadDocs()
  }

  const remove = async (id: string) => {
    await window.api.deleteKnowledge(id)
    loadDocs()
  }

  const ingestFiles = async (files: { name: string; content: string; path: string }[]) => {
    let count = 0
    for (const file of files) {
      if (!file.content) continue
      await window.api.saveKnowledge({
        id: '',
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: detectCategory(file.name),
        content: file.content,
        tags: detectTags(file.name),
        createdAt: '',
        updatedAt: '',
      })
      count++
    }
    return count
  }

  const handleUpload = async () => {
    setUploading(true)
    setImportStatus('')
    try {
      const files = await window.api.uploadFiles()
      const count = await ingestFiles(files)
      if (count > 0) setImportStatus(`Imported ${count} file${count !== 1 ? 's' : ''}`)
      loadDocs()
    } finally {
      setUploading(false)
      setTimeout(() => setImportStatus(''), 3000)
    }
  }

  const handleImportFolder = async () => {
    setImporting(true)
    setImportStatus('')
    try {
      const files = await window.api.importFolder()
      const count = await ingestFiles(files)
      if (count > 0) setImportStatus(`Imported ${count} file${count !== 1 ? 's' : ''} from repo`)
      loadDocs()
    } finally {
      setImporting(false)
      setTimeout(() => setImportStatus(''), 4000)
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    setUploading(true)
    setImportStatus('')
    try {
      let count = 0
      for (const file of files) {
        try {
          const text = await file.text()
          if (text && !text.includes('\0')) {
            await window.api.saveKnowledge({
              id: '',
              title: file.name.replace(/\.[^/.]+$/, ''),
              category: detectCategory(file.name),
              content: text,
              tags: detectTags(file.name),
              createdAt: '',
              updatedAt: '',
            })
            count++
          }
        } catch {
          // Skip unreadable files
        }
      }
      if (count > 0) setImportStatus(`Dropped ${count} file${count !== 1 ? 's' : ''}`)
      loadDocs()
    } finally {
      setUploading(false)
      setTimeout(() => setImportStatus(''), 3000)
    }
  }, [])

  const filtered = filter === 'all' ? docs : docs.filter(d => d.category === filter)
  const totalChars = docs.reduce((sum, d) => sum + d.content.length, 0)

  return (
    <div
      className="h-full flex flex-col relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-blue-950/80 border-4 border-dashed border-blue-400 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-blue-300 uppercase tracking-widest">DROP FILES</div>
            <div className="text-sm font-mono text-blue-400 mt-2">Release to import into knowledge base</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-zinc-700 bg-black">
        <button onClick={startNew} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black font-mono uppercase tracking-widest border-2 border-blue-400 transition-colors">
          + DOC
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-black font-mono uppercase tracking-widest border-2 border-emerald-400 transition-colors"
        >
          {uploading ? '...' : 'UPLOAD'}
        </button>
        <button
          onClick={handleImportFolder}
          disabled={importing}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-[11px] font-black font-mono uppercase tracking-widest border-2 border-orange-400 transition-colors"
        >
          {importing ? 'SCANNING...' : 'IMPORT REPO'}
        </button>
        <div className="flex gap-1 ml-3">
          <button onClick={() => setFilter('all')} className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border-2 ${filter === 'all' ? 'bg-zinc-700 text-zinc-200 border-zinc-500' : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>All</button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border-2 ${filter === cat ? 'bg-zinc-700 text-zinc-200 border-zinc-500' : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {importStatus && (
            <span className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">{importStatus}</span>
          )}
          <span className="text-[10px] font-mono text-zinc-500 font-bold">{docs.length} DOCS &middot; {(totalChars / 1000).toFixed(1)}K</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="px-4 py-1.5 bg-blue-950/30 border-b-2 border-blue-900/50 text-blue-300 text-[10px] font-mono">
        Everything here feeds directly into the AI. Upload files, import entire repos, or drag & drop. Supports code, docs, configs, and more.
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-zinc-950">
        {/* Edit form */}
        {editing && (
          <div className="mb-6 p-4 bg-zinc-900 border-2 border-zinc-700">
            <h3 className="text-[11px] font-black font-mono uppercase tracking-widest text-zinc-400 mb-3">
              {editing.id ? 'EDIT DOCUMENT' : 'NEW KNOWLEDGE DOCUMENT'}
            </h3>
            <div className="space-y-3">
              <input
                value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                placeholder="Document title"
                className="w-full px-3 py-2 bg-zinc-800 border-2 border-zinc-700 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
              <select
                value={editing.category}
                onChange={e => setEditing({ ...editing, category: e.target.value as KnowledgeDoc['category'] })}
                className="w-full px-3 py-2 bg-zinc-800 border-2 border-zinc-700 text-sm font-mono focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
              <input
                value={editing.tags.join(', ')}
                onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Tags (comma separated)"
                className="w-full px-3 py-2 bg-zinc-800 border-2 border-zinc-700 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
              <textarea
                value={editing.content}
                onChange={e => setEditing({ ...editing, content: e.target.value })}
                placeholder="Paste knowledge content here. This gets fed directly to the AI during calls."
                rows={12}
                className="w-full px-3 py-2 bg-zinc-800 border-2 border-zinc-700 text-sm focus:outline-none focus:border-blue-500 resize-y font-mono"
              />
              <div className="flex items-center gap-3">
                <button onClick={save} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm font-black font-mono uppercase tracking-wider border-2 border-blue-400 transition-colors">Save</button>
                <button onClick={() => setEditing(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-mono border-2 border-zinc-700 transition-colors">Cancel</button>
                <span className="text-[10px] text-zinc-500 font-mono">{editing.content.length.toLocaleString()} chars</span>
              </div>
            </div>
          </div>
        )}

        {/* Doc list */}
        <div className="grid gap-2">
          {filtered.map(doc => (
            <div key={doc.id} className="p-3 bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-medium text-sm text-zinc-200 font-mono">{doc.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-2 py-0.5 bg-zinc-800 text-zinc-400 capitalize font-mono font-bold uppercase border border-zinc-700">{doc.category}</span>
                    {doc.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-zinc-800/50 text-zinc-500 font-mono">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(doc)} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono font-bold uppercase">Edit</button>
                  <button onClick={() => remove(doc.id)} className="text-[10px] text-zinc-500 hover:text-red-400 font-mono font-bold uppercase">Del</button>
                </div>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 font-mono mt-1">{doc.content}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[9px] text-zinc-600 font-mono">
                <span>{doc.content.length.toLocaleString()} chars</span>
                <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !editing && (
            <div className="text-center py-16">
              <div className="text-xl font-black font-mono text-zinc-700 uppercase tracking-widest mb-2">NO KNOWLEDGE LOADED</div>
              <div className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider mb-6">
                Add docs so the AI can answer any question during calls
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={startNew} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-mono border-2 border-zinc-700 transition-colors">
                  Create manually
                </button>
                <button onClick={handleUpload} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-sm font-mono border-2 border-emerald-400 transition-colors">
                  Upload files
                </button>
                <button onClick={handleImportFolder} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-sm font-mono border-2 border-orange-400 transition-colors">
                  Import repo
                </button>
              </div>
              <div className="text-[10px] font-mono text-zinc-700 mt-4">or drag & drop files anywhere</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
