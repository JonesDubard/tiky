import { NextResponse } from "next/server";
import { prisma } from "lib/prisma";

export async function GET() {
  try {
    const options = await prisma.pollOption.findMany({
      include: { _count: { select: { votes: true } } },
    });

    let updated = 0;
    for (const option of options) {
      await prisma.pollOption.update({
        where: { id: option.id },
        data: { voteCount: option._count.votes },
      });
      updated++;
    }

    return NextResponse.json({ message: `Backfill complete. Updated ${updated} options.` });
  } catch (err) {
    console.error("Backfill error:", err);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}