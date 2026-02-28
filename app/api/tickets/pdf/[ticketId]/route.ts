// import { prisma } from "lib/prisma"
// import PDFDocument from "pdfkit"
// import QRCode from "qrcode"

// export async function GET(
//   req: Request,
//   { params }: { params: { ticketId: string } }
// ) {
//   const ticket = await prisma.ticketInstance.findUnique({
//     where: { id: params.ticketId },
//     include: {
//       ticketType: true,
//       order: true,
//     },
//   })

//   if (!ticket) {
//     return new Response("Not found", { status: 404 })
//   }

//   const doc = new PDFDocument()

//   const buffers: any[] = []
//   doc.on("data", buffers.push.bind(buffers))

//   const qrImage = await QRCode.toDataURL(ticket.qrCode)

//   doc.fontSize(22).text("TIKY EVENT TICKET", { align: "center" })
//   doc.moveDown()

//   doc.fontSize(16).text(`Ticket Type: ${ticket.ticketType.name}`)
//   doc.text(`Order ID: ${ticket.orderId}`)
//   doc.moveDown()

//   const qrBuffer = Buffer.from(
//     qrImage.replace(/^data:image\/png;base64,/, ""),
//     "base64"
//   )

//   doc.image(qrBuffer, { fit: [200, 200], align: "center" })

//   doc.end()

//   const pdfBuffer = await new Promise<Buffer>((resolve) => {
//     doc.on("end", () => resolve(Buffer.concat(buffers)))
//   })

//   return new Response(pdfBuffer, {
//     headers: {
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=ticket-${ticket.id}.pdf`,
//     },
//   })
// }

import { prisma } from "lib/prisma";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { notFound } from "next/navigation";

// Next.js 15: params is a Promise
export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> } 
) {
  const { ticketId } = await params; // 1. Unwrapping params

  const ticket = await prisma.ticketInstance.findUnique({
    where: { id: ticketId },
    include: {
      ticketType: true,
      order: true,
    },
  });

  if (!ticket) {
    return new Response("Not found", { status: 404 });
  }

  // Use a promise to capture the full PDF generation
  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // PDF Content logic
    doc.fontSize(22).text("TIKY EVENT TICKET", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`Ticket Type: ${ticket.ticketType.name}`);
    doc.text(`Order ID: ${ticket.orderId}`);
    doc.moveDown();

    // QR Code logic
    QRCode.toDataURL(ticket.qrCode).then((qrImage) => {
      const qrBuffer = Buffer.from(
        qrImage.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );
      doc.image(qrBuffer, { fit: [200, 200], align: "center" as any });
      doc.end();
    }).catch(reject);
  });

  // 2. Wrap the Buffer in Uint8Array to satisfy the Response type
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${ticket.id}.pdf"`,
    },
  });
}