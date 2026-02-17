// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../../../../auth/[...nextauth]/route"; // Fixed import path
// import { prisma } from "lib/prisma";

// export async function PATCH(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await getServerSession(authOptions);
    
//     if (!session?.user) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     // Verify admin status
//     if (session.user.role !== "ADMIN") {
//       return new NextResponse("Forbidden", { status: 403 });
//     }

//     const { status } = await req.json();

//     // Validate status
//     if (!["active", "suspended"].includes(status)) {
//       return new NextResponse("Invalid status", { status: 400 });
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id: params.id },
//       data: { status },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         status: true,
//         image: true,
//         createdAt: true,
//         updatedAt: true,
//       }
//     });

//     return NextResponse.json(updatedUser);
//   } catch (error) {
//     console.error("Error updating user status:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { prisma } from "lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify admin status
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { status } = await req.json();

    // Validate status
    if (!["active", "suspended"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Add image field for frontend consistency
    const responseUser = {
      ...updatedUser,
      image: null,
    };

    return NextResponse.json(responseUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}