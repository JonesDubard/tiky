// app/(public)/blog/[slug]/page.tsx
import { prisma } from 'lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User, ArrowLeft } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: { title: true, content: true },
  })
  if (!post) return {}
  return {
    title: `${post.title} | Tiky Blog`,
    description: post.content.slice(0, 155),
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: {
      title: true, slug: true, content: true, coverImage: true,
      published: true, deletedAt: true, createdAt: true,
      author: { select: { name: true, email: true } },
    },
  })

  if (!post || !post.published || post.deletedAt) notFound()

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Cover */}
      {post.coverImage ? (
        <div className="relative w-full h-56 sm:h-72 md:h-96 bg-gray-200">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-32 sm:h-48 bg-gradient-to-br from-brand-primary to-brand-accent" />
      )}

      <div className="section-container py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">

          {/* Back */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          {/* Article */}
          <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-6 mb-6 border-b border-gray-100">
              <span className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                {post.author.name || post.author.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Content */}
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {post.content}
            </div>
          </article>

          {/* Footer CTA */}
          <div className="mt-8 bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl p-6 sm:p-8 text-center text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-2">Discover events on Tiky</h3>
            <p className="text-white/80 text-sm mb-5">Book tickets, vote in polls, and stay in the loop.</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-white text-brand-primary font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all text-sm"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}