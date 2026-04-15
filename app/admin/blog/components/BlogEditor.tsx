// app/admin/blog/components/BlogEditor.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RefreshCw, Eye, ArrowLeft, Upload, X, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

interface Props {
  postId?: string
}

export default function BlogEditor({ postId }: Props) {
  const router = useRouter()
  const isEditing = !!postId

  const [form, setForm] = useState({
    title: '',
    content: '',
    coverImage: '',   // always a permanent URL (Vercel Blob or external)
    published: false,
  })
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)

  // ── Image state ────────────────────────────────────────────────────────────
  const [imageMode, setImageMode] = useState<'drop' | 'url'>('drop')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load existing post ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return
    fetch(`/api/admin/blog/${postId}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          title: data.title,
          content: data.content,
          coverImage: data.coverImage || '',
          published: data.published,
        })
        setLoading(false)
      })
  }, [postId, isEditing])

  const set = (k: keyof typeof form, v: any) =>
    setForm(f => ({ ...f, [k]: v }))

  // ── Upload to Vercel Blob via /api/admin/upload ────────────────────────────
  // The file is sent as multipart/form-data. The API route calls put() from
  // @vercel/blob and returns { url } — a permanent public CDN URL.
  // We store that URL in form.coverImage so the blog POST/PATCH body only ever
  // contains a plain URL string, never a base64 blob.
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are accepted.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB.')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
        // Do NOT set Content-Type — the browser sets it with the correct boundary
      })

      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error || 'Upload failed.')
        return
      }

      set('coverImage', data.url)
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // ── Drag & drop handlers ───────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const clearCoverImage = () => {
    set('coverImage', '')
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Save post ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch(
      isEditing ? `/api/admin/blog/${postId}` : '/api/admin/blog',
      {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }
    )
    if (res.ok) {
      router.push('/admin/blog')
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save.')
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blog" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isEditing ? 'Update your blog post' : 'Write and publish a new blog post'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(p => !p)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50"
            title={uploading ? 'Wait for image upload to finish' : undefined}
          >
            {saving
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Save'}</>}
          </button>
        </div>
      </div>

      {/* ── Global save error ── */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* ── Preview ── */}
      {preview ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {form.coverImage && (
            <img
              src={form.coverImage}
              alt="Cover"
              className="w-full h-56 object-cover rounded-xl mb-6"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {form.title || 'Untitled'}
          </h1>
          <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {form.content || <span className="text-gray-400 italic">No content yet…</span>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── Title ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-brand-primary">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Your post title..."
              className="w-full px-3.5 py-2.5 text-lg font-semibold bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>

          {/* ── Cover image ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">

            {/* Label + Upload / URL toggle */}
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Cover Image</label>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => { setImageMode('drop'); setUploadError('') }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all ${
                    imageMode === 'drop'
                      ? 'bg-white text-gray-800 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
                <button
                  onClick={() => { setImageMode('url'); setUploadError('') }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all ${
                    imageMode === 'url'
                      ? 'bg-white text-gray-800 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  URL
                </button>
              </div>
            </div>

            {/* Preview strip — shown whenever coverImage is set */}
            {form.coverImage && (
              <div className="relative mb-3 group">
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  className="w-full h-44 object-cover rounded-xl border border-gray-100"
                />
                <button
                  onClick={clearCoverImage}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
                {/* Badge confirms the image is stored on Vercel Blob */}
                {form.coverImage.includes('blob.vercel-storage.com') && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
                    Uploaded ✓
                  </span>
                )}
              </div>
            )}

            {/* Per-image upload error */}
            {uploadError && (
              <p className="mb-2 text-xs text-red-600">{uploadError}</p>
            )}

            {imageMode === 'drop' ? (
              /* ── Drop zone ── */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragOver(false)}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border-2 border-dashed transition-all select-none
                  ${uploading
                    ? 'cursor-wait border-brand-primary/40 bg-brand-primary/5'
                    : dragOver
                      ? 'cursor-copy border-brand-primary bg-brand-primary/5 scale-[0.99]'
                      : 'cursor-pointer border-gray-200 hover:border-brand-primary/50 hover:bg-gray-50'
                  }`}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-brand-primary animate-spin" />
                    <p className="text-xs text-gray-500">Uploading to Vercel Blob…</p>
                  </>
                ) : (
                  <>
                    <Upload className={`w-5 h-5 transition-colors ${dragOver ? 'text-brand-primary' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-brand-primary">Click to upload</span>{' '}
                      or drag & drop
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF, WEBP · max 5 MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="sr-only"
                />
              </div>
            ) : (
              /* ── URL input ── */
              <input
                type="url"
                value={form.coverImage}
                onChange={e => set('coverImage', e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400"
              />
            )}
          </div>

          {/* ── Content ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Content <span className="text-brand-primary">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="Write your post content here..."
              rows={18}
              className="w-full px-3.5 py-2.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400 resize-none font-mono leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1.5">{form.content.length} characters</p>
          </div>

          {/* ── Publish toggle ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Publish post</p>
              <p className="text-xs text-gray-400 mt-0.5">
                When enabled, this post will be visible to the public.
              </p>
            </div>
            <button
              onClick={() => set('published', !form.published)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
                form.published ? 'bg-brand-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.published ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>
      )}
    </div>
  )
}