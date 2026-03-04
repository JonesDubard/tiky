'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  published: boolean
  coverImage: string | null
  createdAt: string
  author: { name: string | null; email: string }
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/blog')
    if (res.ok) setPosts(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const togglePublish = async (post: Post) => {
    setTogglingId(post.id)
    await fetch(`/api/admin/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    })
    await fetchPosts()
    setTogglingId(null)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setDeletingId(id)
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    await fetchPosts()
    setDeletingId(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
    </div>
  )

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage blog content.</p>
        </div>
        <Link
          href="/admin/blog/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400 mb-4">No blog posts yet.</p>
          <Link href="/admin/blog/create" className="btn-primary text-sm">
            Write your first post
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{post.title}</p>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  By {post.author.name || post.author.email} · {new Date(post.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2 border-t border-gray-50 pt-3">
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => togglePublish(post)}
                    disabled={togglingId === post.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {togglingId === post.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : post.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {post.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    disabled={deletingId === post.id}
                    className="inline-flex items-center justify-center p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === post.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Title', 'Author', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</p>
                        <p className="text-xs text-gray-400">/{post.slug}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {post.author.name || post.author.email}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          post.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => togglePublish(post)}
                            disabled={togglingId === post.id}
                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                            title={post.published ? 'Unpublish' : 'Publish'}
                          >
                            {togglingId === post.id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            disabled={deletingId === post.id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === post.id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}