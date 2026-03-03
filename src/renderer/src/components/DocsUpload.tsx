import { useState, useEffect, useCallback } from 'react'
import type { KnowledgeDoc } from '../../../shared/types'

const CATEGORIES: KnowledgeDoc['category'][] = [
  'product',
  'pricing',
  'faq',
  'competitive',
  'technical',
  'process',
  'general',
]

const CATEGORY_COLORS: Record<KnowledgeDoc['category'], { bg: string; text: string; dot: string }> = {
  product:     { bg: '#DBEAFE', text: '#1D4ED8', dot: '#2563EB' },
  pricing:     { bg: '#FEF3C7', text: '#B45309', dot: '#D97706' },
  faq:         { bg: '#D1FAE5', text: '#047857', dot: '#10B981' },
  competitive: { bg: '#FFE4E6', text: '#BE123C', dot: '#F43F5E' },
  technical:   { bg: '#EDE9FE', text: '#6D28D9', dot: '#7C3AED' },
  process:     { bg: '#CFFAFE', text: '#0E7490', dot: '#06B6D4' },
  general:     { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
}

function detectCategory(filename: string): KnowledgeDoc['category'] {
  const lower = filename.toLowerCase()
  if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost')) return 'pricing'
  if (lower.includes('faq') || lower.includes('question')) return 'faq'
  if (lower.includes('compet') || lower.includes('versus') || lower.includes('vs')) return 'competitive'
  if (lower.includes('tech') || lower.includes('api') || lower.includes('spec') || lower.includes('arch'))
    return 'technical'
  if (lower.includes('process') || lower.includes('workflow') || lower.includes('playbook')) return 'process'
  if (lower.includes('product') || lower.includes('feature') || lower.includes('readme')) return 'product'
  return 'general'
}

function detectTags(filename: string): string[] {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const tags: string[] = []
  if (ext) tags.push(ext)

  const codeLangs: Record<string, string> = {
    js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
    py: 'python', java: 'java', go: 'golang', rs: 'rust', rb: 'ruby',
    php: 'php', cs: 'csharp', swift: 'swift', kt: 'kotlin', sql: 'sql',
    html: 'html', css: 'css', vue: 'vue', svelte: 'svelte', md: 'markdown',
    json: 'config', yaml: 'config', yml: 'config', toml: 'config',
  }
  if (codeLangs[ext]) tags.push(codeLangs[ext])
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'rs', 'rb', 'php', 'cs', 'swift', 'kt'].includes(ext))
    tags.push('code')

  return tags
}

function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

interface UploadProgress {
  id: string
  filename: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export default function DocsUpload() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadDocs = useCallback(async () => {
    try {
      const data = await window.api.getKnowledge()
      setDocs(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  const showStatus = useCallback((msg: string, durationMs = 4000) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(''), durationMs)
  }, [])

  const ingestFiles = useCallback(
    async (files: Array<{ name: string; content: string; path: string }>) => {
      const progressItems: UploadProgress[] = files.map((f, i) => ({
        id: `upload-${Date.now()}-${i}`,
        filename: f.name,
        status: 'pending' as const,
      }))
      setUploadProgress(progressItems)

      let count = 0
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: 'uploading' } : p))
        )

        try {
          if (!file.content) {
            setUploadProgress((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, status: 'error', error: 'Empty file' } : p
              )
            )
            continue
          }

          await window.api.saveKnowledge({
            id: '',
            title: file.name.replace(/\.[^/.]+$/, ''),
            category: detectCategory(file.name),
            content: file.content,
            tags: detectTags(file.name),
            createdAt: '',
            updatedAt: '',
          })

          setUploadProgress((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'done' } : p))
          )
          count++
        } catch {
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: 'error', error: 'Failed to save' } : p
            )
          )
        }
      }

      setTimeout(() => setUploadProgress([]), 5000)
      return count
    },
    []
  )

  const handleUploadFiles = useCallback(async () => {
    setUploading(true)
    try {
      const files = await window.api.uploadFiles()
      if (files.length === 0) {
        setUploading(false)
        return
      }
      const count = await ingestFiles(files)
      if (count > 0) showStatus(`Imported ${count} file${count !== 1 ? 's' : ''} successfully`)
      await loadDocs()
    } catch {
      showStatus('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [ingestFiles, loadDocs, showStatus])

  const handleImportFolder = useCallback(async () => {
    setImporting(true)
    try {
      const files = await window.api.importFolder()
      if (files.length === 0) {
        setImporting(false)
        return
      }
      const count = await ingestFiles(files)
      if (count > 0)
        showStatus(`Imported ${count} file${count !== 1 ? 's' : ''} from repository`)
      await loadDocs()
    } catch {
      showStatus('Folder import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }, [ingestFiles, loadDocs, showStatus])

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

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length === 0) return

      setUploading(true)
      try {
        const parsed: Array<{ name: string; content: string; path: string }> = []
        for (const file of droppedFiles) {
          try {
            const text = await file.text()
            if (text && !text.includes('\0')) {
              parsed.push({ name: file.name, content: text, path: file.name })
            }
          } catch {
            // Skip unreadable files
          }
        }

        if (parsed.length > 0) {
          const count = await ingestFiles(parsed)
          if (count > 0)
            showStatus(`Dropped ${count} file${count !== 1 ? 's' : ''} into knowledge base`)
          await loadDocs()
        } else {
          showStatus('No readable text files were found in the drop')
        }
      } finally {
        setUploading(false)
      }
    },
    [ingestFiles, loadDocs, showStatus]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await window.api.deleteKnowledge(id)
      setDeleteConfirm(null)
      await loadDocs()
      showStatus('Document deleted')
    },
    [loadDocs, showStatus]
  )

  const filtered = docs
    .filter((d) => (filter === 'all' ? true : d.category === filter))
    .filter((d) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        d.title.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        d.category.toLowerCase().includes(q)
      )
    })

  const totalChars = docs.reduce((sum, d) => sum + d.content.length, 0)
  const categoryCounts = docs.reduce(
    (acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div
      className="h-full flex flex-col relative"
      style={{ background: 'var(--bg-primary)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full-screen drag overlay */}
      {dragOver && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(255, 229, 0, 0.88)' }}
        >
          <div
            style={{
              border: '2px dashed #000',
              padding: '64px',
              textAlign: 'center',
              background: 'rgba(255,229,0,0.6)',
            }}
          >
            <svg
              style={{ width: 64, height: 64, margin: '0 auto 16px', color: '#000' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#000',
                marginBottom: 4,
              }}
            >
              Drop Files Here
            </div>
            <div style={{ fontSize: '0.875rem', color: '#333', fontFamily: 'var(--font-body)' }}>
              Release to import into your knowledge base
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="px-8 py-6 flex-shrink-0"
        style={{
          borderBottom: '2px solid #000',
          background: 'var(--bg-surface)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.375rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--color-text)',
                lineHeight: 1.2,
              }}
            >
              Knowledge Base
            </h1>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-muted)',
                marginTop: 4,
                fontFamily: 'var(--font-body)',
              }}
            >
              Upload files, import repos, or drag &amp; drop. Everything here feeds the AI during calls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary: Upload Files */}
            <button
              onClick={handleUploadFiles}
              disabled={uploading}
              className="neo-btn inline-flex items-center gap-2"
              style={{
                background: 'var(--color-accent)',
                color: '#000',
                padding: '8px 16px',
                fontSize: '0.75rem',
              }}
            >
              <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>

            {/* Secondary: Import Folder */}
            <button
              onClick={handleImportFolder}
              disabled={importing}
              className="neo-btn inline-flex items-center gap-2"
              style={{
                background: 'var(--bg-surface)',
                color: '#000',
                padding: '8px 16px',
                fontSize: '0.75rem',
              }}
            >
              <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              {importing ? 'Scanning...' : 'Import Folder'}
            </button>
          </div>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div
            className="mt-3 fade-in"
            style={{
              padding: '8px 12px',
              background: '#D1FAE5',
              border: '2px solid #000',
              boxShadow: 'var(--shadow-sm)',
              color: '#000',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4">
          <span
            style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              color: 'var(--color-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {docs.length} doc{docs.length !== 1 ? 's' : ''}
          </span>
          <span style={{ width: 2, height: 12, background: '#000', display: 'inline-block' }} />
          <span
            style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              color: 'var(--color-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {formatBytes(totalChars)}
          </span>
          <span style={{ width: 2, height: 12, background: '#000', display: 'inline-block' }} />
          <span
            style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              color: 'var(--color-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {CATEGORIES.filter((c) => categoryCounts[c]).length} categories
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div className="px-8 pt-6 flex-shrink-0">
        <div
          className="group flex flex-col items-center justify-center py-10 cursor-pointer"
          onClick={handleUploadFiles}
          style={{
            border: '2px dashed #000',
            background: 'var(--bg-surface)',
            transition: 'background 0.1s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--color-accent)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface)'
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              border: '2px solid #000',
              background: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <svg
              style={{ width: 22, height: 22, color: '#000' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#000',
            }}
          >
            Drop files here or click to upload
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-muted)',
              marginTop: 4,
              fontFamily: 'var(--font-body)',
            }}
          >
            Supports code, docs, configs, markdown, and more
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploadProgress.length > 0 && (
        <div className="px-8 mt-3 flex-shrink-0">
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid #000',
              boxShadow: 'var(--shadow-sm)',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-muted)',
                marginBottom: 8,
              }}
            >
              Upload Progress
            </div>
            <div className="space-y-1.5">
              {uploadProgress.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {/* Status dot */}
                  <div className="flex-shrink-0" style={{ width: 10, height: 10 }}>
                    {item.status === 'pending' && (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          border: '2px solid #000',
                          background: '#E2E8F0',
                        }}
                      />
                    )}
                    {item.status === 'uploading' && (
                      <div
                        className="animate-pulse"
                        style={{
                          width: 10,
                          height: 10,
                          border: '2px solid #000',
                          background: 'var(--color-accent)',
                        }}
                      />
                    )}
                    {item.status === 'done' && (
                      <svg style={{ width: 14, height: 14, color: '#10B981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {item.status === 'error' && (
                      <svg style={{ width: 14, height: 14, color: 'var(--color-danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>

                  <span
                    className="truncate"
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color:
                        item.status === 'done'
                          ? '#000'
                          : item.status === 'error'
                          ? 'var(--color-danger)'
                          : 'var(--color-muted)',
                      flex: 1,
                    }}
                  >
                    {item.filename}
                  </span>

                  {item.error && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-danger)',
                        flexShrink: 0,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="px-8 mt-4 flex items-center gap-3 flex-shrink-0 flex-wrap">
        {/* Search */}
        <div className="relative" style={{ flex: '1 1 200px', maxWidth: 280 }}>
          <svg
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 14,
              height: 14,
              color: 'var(--color-muted)',
              pointerEvents: 'none',
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docs..."
            className="neo-input w-full"
            style={{
              paddingLeft: 32,
              paddingRight: 10,
              paddingTop: 6,
              paddingBottom: 6,
              fontSize: '0.8125rem',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* All */}
          <button
            onClick={() => setFilter('all')}
            className="neo-btn-sm"
            style={{
              padding: '4px 10px',
              fontSize: '0.6875rem',
              background: filter === 'all' ? 'var(--color-accent)' : 'var(--bg-surface)',
              color: '#000',
            }}
          >
            All
          </button>

          {CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat]
            const count = categoryCounts[cat] || 0
            const isActive = filter === cat
            return (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? 'all' : cat)}
                className="neo-btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.6875rem',
                  background: isActive ? 'var(--color-accent)' : colors.bg,
                  color: '#000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {cat}
                {count > 0 && (
                  <span
                    style={{
                      marginLeft: 4,
                      opacity: 0.7,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Doc List */}
      <div className="flex-1 overflow-y-auto px-8 mt-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              style={{
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-muted)',
              }}
            >
              Loading knowledge base...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {/* Empty state icon box */}
            <div
              style={{
                width: 64,
                height: 64,
                border: '2px solid #000',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <svg
                style={{ width: 32, height: 32, color: '#000', opacity: 0.25 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>

            {docs.length === 0 ? (
              <>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-muted)',
                    marginBottom: 6,
                  }}
                >
                  No Documents Uploaded
                </div>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-muted)',
                    maxWidth: 340,
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-body)',
                    marginBottom: 24,
                  }}
                >
                  Drag files here or click Upload to add product docs, FAQs, and pricing info for AI coaching.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUploadFiles}
                    className="neo-btn"
                    style={{
                      background: 'var(--color-accent)',
                      color: '#000',
                      padding: '8px 16px',
                      fontSize: '0.75rem',
                    }}
                  >
                    Upload Files
                  </button>
                  <button
                    onClick={handleImportFolder}
                    className="neo-btn"
                    style={{
                      background: 'var(--bg-surface)',
                      color: '#000',
                      padding: '8px 16px',
                      fontSize: '0.75rem',
                    }}
                  >
                    Import Folder
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--color-muted)',
                    marginBottom: 6,
                  }}
                >
                  No Matches
                </div>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-muted)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Try a different search term or filter category.
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((doc) => {
              const colors = CATEGORY_COLORS[doc.category]
              const isConfirmingDelete = deleteConfirm === doc.id

              return (
                <div
                  key={doc.id}
                  className="group"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '2px solid #000',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '14px 16px',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translate(-1px, -1px)'
                    el.style.boxShadow = '4px 4px 0px 0px #000'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = ''
                    el.style.boxShadow = 'var(--shadow-sm)'
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Title */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className="truncate"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: 'var(--color-text)',
                            letterSpacing: '0.01em',
                          }}
                        >
                          {doc.title}
                        </h3>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Category badge */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: colors.bg,
                            border: '2px solid #000',
                            padding: '2px 8px',
                            fontSize: '0.6875rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#000',
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              background: colors.dot,
                              border: '1px solid #000',
                              flexShrink: 0,
                            }}
                          />
                          {doc.category}
                        </span>

                        {/* Tag badges */}
                        {doc.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              background: 'var(--bg-primary)',
                              border: '2px solid #000',
                              padding: '1px 6px',
                              fontSize: '0.6875rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 500,
                              color: 'var(--color-text)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 5 && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--color-muted)',
                            }}
                          >
                            +{doc.tags.length - 5}
                          </span>
                        )}
                      </div>

                      {/* Content preview */}
                      <p
                        className="line-clamp-2"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-muted)',
                          marginTop: 8,
                          lineHeight: 1.5,
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {doc.content}
                      </p>

                      {/* Meta row */}
                      <div
                        className="flex items-center gap-3 mt-2"
                        style={{
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-muted)',
                        }}
                      >
                        <span>{formatBytes(doc.content.length)}</span>
                        <span
                          style={{
                            width: 2,
                            height: 10,
                            background: '#000',
                            display: 'inline-block',
                          }}
                        />
                        <span>{relativeTime(doc.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Delete controls */}
                    <div
                      className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100"
                      style={{ transition: 'opacity 0.15s ease' }}
                    >
                      {isConfirmingDelete ? (
                        <>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="neo-btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.6875rem',
                              background: 'var(--color-danger)',
                              color: '#fff',
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="neo-btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.6875rem',
                              background: 'var(--bg-surface)',
                              color: '#000',
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(doc.id)}
                          className="neo-btn-sm"
                          style={{
                            padding: '6px',
                            background: 'var(--bg-surface)',
                            color: 'var(--color-muted)',
                            lineHeight: 0,
                          }}
                          title="Delete document"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#FFE4E6'
                            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)'
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'
                            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'
                          }}
                        >
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
