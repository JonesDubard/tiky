// app/(public)/blog/page.tsx
import { prisma } from 'lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getPosts() {
  return prisma.post.findMany({
    where: { published: true, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, coverImage: true, content: true, createdAt: true,
      author: { select: { name: true, email: true } },
    },
  })
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent py-14 sm:py-20 overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
        <div className="section-container relative text-center text-white">
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            Tiky Blog
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight">
            Stories, Tips &amp; Updates
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-xl mx-auto">
            Insights on events, ticketing, and everything happening in Liberia.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 40 960 60 720 50C480 40 240 10 0 30Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      <section className="section-container py-10 sm:py-14">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-lg">No posts published yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            <div className="mb-8 sm:mb-10">
              <Link href={`/blog/${posts[0].slug}`} className="group block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="grid md:grid-cols-2">
                  <div className="relative h-56 md:h-auto bg-gradient-to-br from-brand-primary to-brand-accent">
                    {posts[0].coverImage ? (
                      <Image src={posts[0].coverImage} alt={posts[0].title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-6xl font-black opacity-30">
                          {posts[0].title[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-brand-primary text-xs font-bold px-3 py-1 rounded-full">
                      Featured
                    </span>
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col justify-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-brand-primary transition-colors leading-snug">
                      {posts[0].title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-5 line-clamp-3">
                      {posts[0].content.slice(0, 200)}…
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{posts[0].author.name || posts[0].author.email}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(posts[0].createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary group-hover:gap-2 transition-all">
                        Read <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Rest of posts */}
            {posts.length > 1 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {posts.slice(1).map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <div className="relative h-44 bg-gradient-to-br from-brand-primary to-brand-accent">
                      {post.coverImage ? (
                        <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white text-5xl font-black opacity-30">
                            {post.title[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                        {post.content.slice(0, 120)}…
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author.name || post.author.email}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}