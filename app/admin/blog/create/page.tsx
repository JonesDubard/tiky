// 'use client'

// // ── This file is used for BOTH create and edit. ──
// // Create: app/admin/blog/create/page.tsx  (no id prop)
// // Edit:   app/admin/blog/[id]/edit/page.tsx (receives params.id)

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { Save, RefreshCw, Eye, ArrowLeft } from 'lucide-react'
// import Link from 'next/link'

// interface Props {
//   params?: { id?: string }
// }

// export default function BlogEditorPage({ params }: Props) {
//   const router = useRouter()
//   const postId = params?.id
//   const isEditing = !!postId

//   const [form, setForm] = useState({
//     title: '',
//     content: '',
//     coverImage: '',
//     published: false,
//   })
//   const [loading, setLoading] = useState(isEditing)
//   const [saving, setSaving] = useState(false)
//   const [error, setError] = useState('')
//   const [preview, setPreview] = useState(false)

//   useEffect(() => {
//     if (!isEditing) return
//     fetch(`/api/admin/blog/${postId}`)
//       .then(r => r.json())
//       .then(data => {
//         setForm({
//           title: data.title,
//           content: data.content,
//           coverImage: data.coverImage || '',
//           published: data.published,
//         })
//         setLoading(false)
//       })
//   }, [postId, isEditing])

//   const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

//   const handleSave = async () => {
//     if (!form.title.trim() || !form.content.trim()) {
//       setError('Title and content are required.')
//       return
//     }
//     setSaving(true)
//     setError('')
//     const res = await fetch(isEditing ? `/api/admin/blog/${postId}` : '/api/admin/blog', {
//       method: isEditing ? 'PATCH' : 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(form),
//     })
//     if (res.ok) {
//       router.push('/admin/blog')
//     } else {
//       const data = await res.json()
//       setError(data.error || 'Failed to save.')
//       setSaving(false)
//     }
//   }

//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
//     </div>
//   )

//   return (
//     <div className="p-4 sm:p-6 max-w-4xl mx-auto">
//       {/* Header */}
//       <div className="flex items-center gap-3 mb-6">
//         <Link href="/admin/blog" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
//           <ArrowLeft className="w-5 h-5 text-gray-500" />
//         </Link>
//         <div className="flex-1">
//           <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Post' : 'New Post'}</h1>
//           <p className="text-xs text-gray-400 mt-0.5">{isEditing ? 'Update your blog post' : 'Write and publish a new blog post'}</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setPreview(p => !p)}
//             className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
//           >
//             <Eye className="w-4 h-4" />
//             <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
//           </button>
//           <button
//             onClick={handleSave}
//             disabled={saving}
//             className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50"
//           >
//             {saving
//               ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
//               : <><Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Save'}</>}
//           </button>
//         </div>
//       </div>

//       {error && (
//         <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
//           {error}
//         </div>
//       )}

//       {preview ? (
//         /* ── Preview pane ── */
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
//           {form.coverImage && (
//             <img src={form.coverImage} alt="Cover" className="w-full h-56 object-cover rounded-xl mb-6" />
//           )}
//           <h1 className="text-3xl font-bold text-gray-900 mb-4">{form.title || 'Untitled'}</h1>
//           <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
//             {form.content || <span className="text-gray-400 italic">No content yet…</span>}
//           </div>
//         </div>
//       ) : (
//         /* ── Editor pane ── */
//         <div className="space-y-4">
//           {/* Title */}
//           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">
//               Title <span className="text-brand-primary">*</span>
//             </label>
//             <input
//               type="text"
//               value={form.title}
//               onChange={e => set('title', e.target.value)}
//               placeholder="Your post title..."
//               className="w-full px-3.5 py-2.5 text-lg font-semibold bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-300 placeholder:font-normal"
//             />
//           </div>

//           {/* Cover image */}
//           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image URL</label>
//             <input
//               type="url"
//               value={form.coverImage}
//               onChange={e => set('coverImage', e.target.value)}
//               placeholder="https://..."
//               className="w-full px-3.5 py-2.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400"
//             />
//             {form.coverImage && (
//               <img src={form.coverImage} alt="Cover preview" className="mt-3 w-full h-40 object-cover rounded-xl border border-gray-100" />
//             )}
//           </div>

//           {/* Content */}
//           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">
//               Content <span className="text-brand-primary">*</span>
//             </label>
//             <textarea
//               value={form.content}
//               onChange={e => set('content', e.target.value)}
//               placeholder="Write your post content here..."
//               rows={18}
//               className="w-full px-3.5 py-2.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400 resize-none font-mono leading-relaxed"
//             />
//             <p className="text-xs text-gray-400 mt-1.5">{form.content.length} characters</p>
//           </div>

//           {/* Publish toggle */}
//           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex items-center justify-between gap-4">
//             <div>
//               <p className="text-sm font-medium text-gray-800">Publish post</p>
//               <p className="text-xs text-gray-400 mt-0.5">When enabled, this post will be visible to the public.</p>
//             </div>
//             <button
//               onClick={() => set('published', !form.published)}
//               className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${form.published ? 'bg-brand-primary' : 'bg-gray-200'}`}
//             >
//               <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.published ? 'translate-x-5' : 'translate-x-0'}`} />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// app/admin/blog/create/page.tsx
// ─────────────────────────────────────────────────────────────
import BlogEditor from '../components/BlogEditor'

export default function CreatePostPage() {
  return <BlogEditor />
}