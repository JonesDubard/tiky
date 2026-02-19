// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "lib/prisma";
// import { getServerSession } from "next-auth";

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await getServerSession();
    
//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const poll = await prisma.poll.findUnique({
//       where: { id: params.id },
//       include: {
//         options: {
//           orderBy: {
//             createdAt: 'asc',
//           },
//         },
//         creator: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         _count: {
//           select: {
//             options: true,
//             votes: true,
//           },
//         },
//       },
//     });

//     if (!poll) {
//       return NextResponse.json({ error: "Poll not found" }, { status: 404 });
//     }

//     return NextResponse.json(poll);
//   } catch (error) {
//     console.error("[POLL_GET]", error);
//     return NextResponse.json(
//       { error: "Failed to fetch poll" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await getServerSession();
    
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const { title, description, pollType, status, isFeatured, endDate, options } = body;

//     // Check permissions
//     const poll = await prisma.poll.findUnique({
//       where: { id: params.id },
//       select: { creatorId: true }
//     });

//     if (!poll) {
//       return NextResponse.json({ error: "Poll not found" }, { status: 404 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { email: session.user.email },
//       select: { id: true, role: true }
//     });

//     if (!user || (user.role !== 'ADMIN' && poll.creatorId !== user.id)) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     // Update poll with transaction
//     const updatedPoll = await prisma.$transaction(async (tx) => {
//       // Update poll basic info
//       const updated = await tx.poll.update({
//         where: { id: params.id },
//         data: {
//           title,
//           description,
//           pollType: pollType || 'FREE',
//           status: status || 'ACTIVE',
//           isFeatured: isFeatured || false,
//           endDate: endDate ? new Date(endDate) : null,
//         },
//       });

//       // Handle options if provided
//       if (options && Array.isArray(options)) {
//         // Delete existing options
//         await tx.option.deleteMany({
//           where: { pollId: params.id },
//         });

//         // Create new options
//         await tx.option.createMany({
//           data: options.map((text: string) => ({
//             text,
//             pollId: params.id,
//           })),
//         });
//       }

//       return updated;
//     });

//     return NextResponse.json(updatedPoll);
//   } catch (error) {
//     console.error("[POLL_PUT]", error);
//     return NextResponse.json(
//       { error: "Failed to update poll" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await getServerSession();
    
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Check permissions
//     const poll = await prisma.poll.findUnique({
//       where: { id: params.id },
//       select: { creatorId: true }
//     });

//     if (!poll) {
//       return NextResponse.json({ error: "Poll not found" }, { status: 404 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { email: session.user.email },
//       select: { id: true, role: true }
//     });

//     if (!user || (user.role !== 'ADMIN' && poll.creatorId !== user.id)) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     await prisma.poll.delete({
//       where: { id: params.id },
//     });

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("[POLL_DELETE]", error);
//     return NextResponse.json(
//       { error: "Failed to delete poll" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: {
        options: true,
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && poll.creatorId !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error("[POLL_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, pollType, status, isFeatured, endDate, options } = body;

    // Check poll exists and permissions
    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      select: { creatorId: true }
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && poll.creatorId !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update poll with options
    const updatedPoll = await prisma.$transaction(async (tx) => {
      const updated = await tx.poll.update({
        where: { id: params.id },
        data: {
          title,
          description,
          pollType,
          status,
          isFeatured: isFeatured ?? false,
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      // Delete existing options
      await tx.option.deleteMany({
        where: { pollId: params.id }
      });

      // Create new options
      if (options && options.length > 0) {
        await tx.option.createMany({
          data: options.map((text: string) => ({
            text,
            pollId: params.id
          }))
        });
      }

      return updated;
    });

    return NextResponse.json(updatedPoll);
  } catch (error) {
    console.error("[POLL_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update poll" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      select: { creatorId: true }
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && poll.creatorId !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.poll.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POLL_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete poll" },
      { status: 500 }
    );
  }
}