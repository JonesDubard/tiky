// // app/api/polls/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "lib/auth";
// import { prisma } from "lib/prisma";

// // GET /api/polls — public listing
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const status = searchParams.get("status") ?? "ACTIVE";
//     const limit = parseInt(searchParams.get("limit") ?? "20");
//     const cursor = searchParams.get("cursor");

//     const polls = await prisma.poll.findMany({
//       where: {
//         deletedAt: null,
//         ...(status !== "ALL" && { status }),
//       },
//       include: {
//         options: {
//           include: { _count: { select: { votes: true } } },
//           orderBy: { createdAt: "asc" },
//         },
//         _count: { select: { votes: true } },
//         event: { select: { id: true, title: true } },
//         creator: { select: { name: true, email: true } },
//       },
//       orderBy: { createdAt: "desc" },
//       take: limit,
//       ...(cursor && {
//         skip: 1,
//         cursor: { id: cursor },
//       }),
//     });

//     return NextResponse.json({ polls });
//   } catch (error) {
//     console.error("Polls fetch error:", error);
//     return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
//   }
// }

// // POST /api/polls — create (admin/organizer only)
// export async function POST(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { email: session.user.email },
//       select: { id: true, role: true },
//     });

//     if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const body = await req.json();
//     const { title, description, pollType, status, endDate, eventId, isFeatured, options } = body;

//     if (!title?.trim()) {
//       return NextResponse.json({ error: "Title is required" }, { status: 400 });
//     }

//     const validOptions = (options ?? []).filter((o: { text: string }) => o.text?.trim());
//     if (validOptions.length < 2) {
//       return NextResponse.json(
//         { error: "At least 2 options are required" },
//         { status: 400 }
//       );
//     }

//     const poll = await prisma.poll.create({
//       data: {
//         title: title.trim(),
//         description: description?.trim() || null,
//         pollType: pollType ?? "FREE",
//         status: status ?? "ACTIVE",
//         endDate: endDate ? new Date(endDate) : null,
//         eventId: eventId || null,
//         isFeatured: isFeatured ?? false,
//         createdById: user.id,
//         options: {
//           create: validOptions.map((o: { text: string }) => ({
//             text: o.text.trim(),
//           })),
//         },
//       },
//       include: {
//         options: true,
//         _count: { select: { votes: true } },
//       },
//     });

//     return NextResponse.json({ poll, id: poll.id }, { status: 201 });
//   } catch (error) {
//     console.error("Poll create error:", error);
//     return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
//   }
// }

// app/api/polls/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "ACTIVE";
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const cursor = searchParams.get("cursor");

    const polls = await prisma.poll.findMany({
      where: {
        deletedAt: null,
        ...(status !== "ALL" && { status }),
      },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { votes: true } },
        event: { select: { id: true, title: true } },
        creator: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });

    return NextResponse.json({ polls });
  } catch (error) {
    console.error("Polls fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, pollType, status, endDate, eventId, isFeatured, options } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate pollType
    if (pollType && !["PUBLIC", "TOKEN_GATED"].includes(pollType)) {
      return NextResponse.json({ error: "Invalid poll type" }, { status: 400 });
    }

    const validOptions = (options ?? []).filter(
      (o: { text: string; imageUrl?: string | null }) => o.text?.trim()
    );

    if (validOptions.length < 2) {
      return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
    }

    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        pollType: pollType ?? "PUBLIC",
        status: status ?? "ACTIVE",
        endDate: endDate ? new Date(endDate) : null,
        eventId: pollType === "TOKEN_GATED" ? (eventId || null) : null,
        isFeatured: isFeatured ?? false,
        createdById: user.id,
        options: {
          create: validOptions.map(
            (o: { text: string; imageUrl?: string | null }) => ({
              text: o.text.trim(),
              imageUrl: o.imageUrl ?? null,
            })
          ),
        },
      },
      include: { options: true, _count: { select: { votes: true } } },
    });

    return NextResponse.json({ poll, id: poll.id }, { status: 201 });
  } catch (error) {
    console.error("Poll create error:", error);
    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
  }
}