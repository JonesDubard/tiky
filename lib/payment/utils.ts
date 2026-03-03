import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Generate a QR code string for a ticket
export async function generateQRCode(data: string) {
  try {
    return await QRCode.toDataURL(data);
  } catch (err) {
    console.error("QR generation error:", err);
    throw err;
  }
}

// // Generate a PDF ticket with QR code and return file path
// export async function generatePDF(ticket: { id: string; qrCode: string }) {
//   return new Promise<string>((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ size: "A6", margin: 20 });
//       const filePath = path.join(process.cwd(), "public", "tickets", `${ticket.id}.pdf`);

//       // Ensure directory exists
//       fs.mkdirSync(path.dirname(filePath), { recursive: true });

//       const stream = fs.createWriteStream(filePath);
//       doc.pipe(stream);

//       doc.fontSize(18).text("Your Ticket", { align: "center" });
//       doc.moveDown();
//       doc.fontSize(14).text(`Ticket ID: ${ticket.id}`, { align: "center" });
//       doc.moveDown();
//       doc.image(ticket.qrCode, { fit: [150, 150], align: "center" });

//       doc.end();

//       stream.on("finish", () => resolve(`/tickets/${ticket.id}.pdf`));
//     } catch (err) {
//       reject(err);
//     }
//   });
// }