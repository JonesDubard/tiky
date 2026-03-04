// app/api/admin/blog/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

function allowed(role?: string) {
  return role === "ADMIN" || role === "ORGANIZER";
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || !allowed(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: {
      id: true, title: true, slug: true, content: true,
      coverImage: true, published: true, createdAt: true,
      author: { select: { name: true, email: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || !allowed(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post || post.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "ORGANIZER" && post.authorId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.content && { content: body.content }),
      ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
      ...(body.published !== undefined && { published: body.published }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || !allowed(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post || post.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "ORGANIZER" && post.authorId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.post.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}