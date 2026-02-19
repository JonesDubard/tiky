import { prisma } from "lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> } // params is a Promise
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Poll ID missing" }, { status: 400 });
    }

    await prisma.poll.update({
      where: { id },
      data: { deletedAt: null }, // restore
    });

    return NextResponse.json({ success: true, message: "Poll restored" });
  } catch (err) {
    console.error("[Poll_RESTORE]", err);
    return NextResponse.json({ error: "Failed to restore Poll" }, { status: 500 });
  }
}
