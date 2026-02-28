// app/api/tickets/pdf/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params

    const ticket = await prisma.ticketInstance.findUnique({
      where: { id: ticketId },
      include: {
        ticketType: {
          include: {
            event: true,
          },
        },
        order: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            payments: {
              select: { paymentMethod: true, amount: true, currency: true },
            },
          },
        },
      },
    })

    if (!ticket) {
      return new NextResponse("Ticket not found", { status: 404 })
    }

    const event = ticket.ticketType.event
    const eventDate = new Date(event.date)
    const holder = ticket.order?.user?.name || ticket.guestName || "Guest"
    const email = ticket.order?.user?.email || ticket.guestEmail || ""
    const payment = ticket.order?.payments[0]

    const methodLabel: Record<string, string> = {
      card: "Credit / Debit Card",
      mtn_momo: "MTN Mobile Money",
      orange_money: "Orange Money",
    }

    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Generate HTML that renders as a printable ticket
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tiky Ticket - ${event.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .ticket {
      background: white;
      width: 420px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .ticket-header {
      background: linear-gradient(135deg, #f97316, #f59e0b);
      padding: 28px 24px 24px;
      color: white;
    }
    .ticket-brand {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      opacity: 0.85;
      margin-bottom: 16px;
    }
    .ticket-type {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0.75;
      margin-bottom: 6px;
    }
    .event-title {
      font-size: 22px;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 16px;
    }
    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      opacity: 0.9;
    }
    .meta-icon { width: 14px; flex-shrink: 0; opacity: 0.8; }
    .divider {
      display: flex;
      align-items: center;
      position: relative;
      background: white;
    }
    .divider::before {
      content: '';
      position: absolute;
      left: 0; right: 0;
      border-top: 2px dashed #e5e7eb;
      z-index: 0;
    }
    .divider-circle-left {
      width: 20px; height: 20px;
      background: #f5f5f5;
      border-radius: 50%;
      margin-left: -10px;
      flex-shrink: 0;
      z-index: 1;
    }
    .divider-circle-right {
      width: 20px; height: 20px;
      background: #f5f5f5;
      border-radius: 50%;
      margin-right: -10px;
      margin-left: auto;
      flex-shrink: 0;
      z-index: 1;
    }
    .ticket-body { padding: 24px; }
    .qr-section { text-align: center; margin-bottom: 20px; }
    .qr-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 12px;
    }
    .qr-image {
      width: 160px;
      height: 160px;
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: white;
    }
    .ticket-id-box {
      background: #f9fafb;
      border-radius: 10px;
      padding: 10px 14px;
      margin-top: 12px;
      text-align: center;
    }
    .ticket-id-label { font-size: 10px; color: #9ca3af; margin-bottom: 4px; }
    .ticket-id-value {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #374151;
      font-weight: 600;
      letter-spacing: 1px;
      word-break: break-all;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 16px;
    }
    .info-box {
      background: #f9fafb;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .info-label { font-size: 10px; color: #9ca3af; font-weight: 500; margin-bottom: 3px; }
    .info-value { font-size: 13px; color: #1f2937; font-weight: 600; }
    .info-box.full { grid-column: span 2; }
    .ticket-footer {
      background: #1f2937;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-brand { color: #9ca3af; font-size: 12px; }
    .footer-brand span { color: #f97316; font-weight: 700; }
    .footer-valid {
      background: #065f46;
      color: #6ee7b7;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
    }
    @media print {
      body { background: white; padding: 0; }
      .ticket { box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <!-- Header -->
    <div class="ticket-header">
      <div class="ticket-brand">🎟 Tiky Events</div>
      <div class="ticket-type">${ticket.ticketType.name}</div>
      <div class="event-title">${event.title}</div>
      <div class="event-meta">
        <div class="meta-row">
          <svg class="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          ${formattedDate} · ${formattedTime}
        </div>
        <div class="meta-row">
          <svg class="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          ${event.location || "Venue TBA"}
        </div>
      </div>
    </div>

    <!-- Dashed divider -->
    <div class="divider" style="height:20px;">
      <div class="divider-circle-left"></div>
      <div class="divider-circle-right"></div>
    </div>

    <!-- Body -->
    <div class="ticket-body">
      <!-- QR Code -->
      <div class="qr-section">
        <div class="qr-label">Scan to verify entry</div>
        ${ticket.qrImage
          ? `<img src="${ticket.qrImage}" class="qr-image" alt="QR Code" />`
          : `<div class="qr-image" style="display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">QR unavailable</div>`
        }
        <div class="ticket-id-box">
          <div class="ticket-id-label">Ticket ID</div>
          <div class="ticket-id-value">${ticket.id}</div>
        </div>
      </div>

      <!-- Info grid -->
      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Ticket holder</div>
          <div class="info-value">${holder}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Price paid</div>
          <div class="info-value">$${ticket.ticketType.price.toFixed(2)} USD</div>
        </div>
        ${email ? `
        <div class="info-box full">
          <div class="info-label">Email</div>
          <div class="info-value">${email}</div>
        </div>` : ""}
        ${payment ? `
        <div class="info-box full">
          <div class="info-label">Payment method</div>
          <div class="info-value">${methodLabel[payment.paymentMethod ?? ""] ?? payment.paymentMethod ?? "—"}</div>
        </div>` : ""}
      </div>
    </div>

    <!-- Footer -->
    <div class="ticket-footer">
      <div class="footer-brand">Powered by <span>Tiky</span></div>
      <div class="footer-valid">✓ Valid Ticket</div>
    </div>
  </div>

  <!-- Auto-print trigger -->
  <script>
    window.onload = () => {
      // Small delay to ensure QR image loads
      setTimeout(() => window.print(), 800)
    }
  </script>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="tiky-ticket-${ticketId}.html"`,
      },
    })
  } catch (error: any) {
    console.error("PDF ticket error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}