import { prisma } from "lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
   const { id } = await context.params;

    await prisma.event.update({
      where: { id },
      data: { deletedAt: null }, // restore
    });

    return NextResponse.json({ success: true, message: "Event restored" });
  } catch (err) {
    console.error("[EVENT_RESTORE]", err);
    return NextResponse.json({ error: "Failed to restore event" }, { status: 500 });
  }
}
