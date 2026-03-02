// // /app/api/polls/[id]/vote/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "lib/prisma";
// import { getServerSession } from "next-auth";

// export async function POST(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const session = await getServerSession();
//     if (!session?.user?.email) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const { optionId } = await req.json();
//     const { id: pollId } = params;

//     // Get user from session
//     const user = await prisma.user.findUnique({
//       where: { email: session.user.email }
//     });

//     if (!user) {
//       return NextResponse.json(
//         { error: "User not found" },
//         { status: 404 }
//       );
//     }

//     // Atomic vote with conflict handling
//     const vote = await prisma.$transaction(async (tx) => {
//       // 1. Check if poll is still active
//       const poll = await tx.poll.findUnique({
//         where: { id: pollId },
//         include: { options: true }
//       });

//       if (!poll) throw new Error("POLL_NOT_FOUND");
//       if (poll.status !== "ACTIVE") throw new Error("POLL_CLOSED");
//       if (poll.endDate && poll.endDate < new Date()) {
//         await tx.poll.update({
//           where: { id: pollId },
//           data: { status: "CLOSED" }
//         });
//         throw new Error("POLL_EXPIRED");
//       }

//       // 2. Try to create vote - will fail on duplicate due to @@unique
//       // In the vote creation for guests:
//   const vote = await tx.vote.create({
//   data: {
//     pollId,
//     optionId,
//     userId: null,
//     deviceId: deviceId,  // ✅ Store device ID for guest vote tracking
//     // Remove metadata field
//   }
// });

//       // 3. Increment option vote count
//       await tx.option.update({
//         where: { id: optionId },
//         data: { 
//           votes: { 
//             connect: { id: vote.id } 
//           } 
//         }
//       });

//       return vote;
//     }, {
//       isolationLevel: "Serializable"
//     });

//     return NextResponse.json({ 
//       success: true, 
//       voteId: vote.id 
//     });

//   } catch (error: any) {
//     // Handle duplicate vote error
//     if (error.code === 'P2002' && error.meta?.target?.includes('pollId', 'userId')) {
//       return NextResponse.json(
//         { error: "You have already voted in this poll" },
//         { status: 409 }
//       );
//     }

//     console.error("[VOTE_ERROR]", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to submit vote" },
//       { status: 500 }
//     );
//   }
// }

// /app/api/polls/[id]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← change here: params is a Promise
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { optionId } = await req.json();
    const { id: pollId } = await params;  // ← await the params Promise

    // Rest of your code stays the same...
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Atomic vote with conflict handling
    const vote = await prisma.$transaction(async (tx) => {
      // 1. Check if poll is still active
      const poll = await tx.poll.findUnique({
        where: { id: pollId },
        include: { options: true }
      });

      if (!poll) throw new Error("POLL_NOT_FOUND");
      if (poll.status !== "ACTIVE") throw new Error("POLL_CLOSED");
      if (poll.endDate && poll.endDate < new Date()) {
        await tx.poll.update({
          where: { id: pollId },
          data: { status: "CLOSED" }
        });
        throw new Error("POLL_EXPIRED");
      }

      // 2. Try to create vote - will fail on duplicate due to @@unique
      // Note: deviceId is not defined in this scope – you need to pass it from request if needed
      const vote = await tx.vote.create({
        data: {
          pollId,
          optionId,
          userId: user.id,
          // If you need deviceId for guest tracking, ensure it's provided in the request body
          // deviceId: deviceId, 
        }
      });

      // 3. Increment option vote count
      await tx.pollOption.update({
        where: { id: optionId },
        data: { 
          votes: { 
            connect: { id: vote.id } 
          } 
        }
      });

      return vote;
    }, {
      isolationLevel: "Serializable"
    });

    return NextResponse.json({ 
      success: true, 
      voteId: vote.id 
    });

  } catch (error: any) {
    // Handle duplicate vote error
    if (error.code === 'P2002' && error.meta?.target?.includes('pollId', 'userId')) {
      return NextResponse.json(
        { error: "You have already voted in this poll" },
        { status: 409 }
      );
    }

    console.error("[VOTE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit vote" },
      { status: 500 }
    );
  }
}
