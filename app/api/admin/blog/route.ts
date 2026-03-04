
// ─────────────────────────────────────────────
// app/api/admin/blog/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";
import slugify from "slugify"; 

function allowed(role?: string) {
  return role === "ADMIN" || role === "ORGANIZER";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || !allowed(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      ...(user.role !== "ADMIN" && { authorId: user.id }),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, published: true,
      coverImage: true, createdAt: true,
      author: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || !allowed(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, content, coverImage, published } = await req.json();
  if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

  // Generate a unique slug
  let slug = slugify(title, { lower: true, strict: true });
  const exists = await prisma.post.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now()}`;

  const post = await prisma.post.create({
    data: { title, slug, content, coverImage: coverImage || null, published: published ?? false, authorId: user.id },
  });

  return NextResponse.json(post, { status: 201 });
}