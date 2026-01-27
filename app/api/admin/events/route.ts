// app/api/admin/events/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET HANDLER
export async function GET() {
  try {
    console.log("GET /api/admin/events called")
    
    const session = await getServerSession(authOptions)

    // Ensure user is logged in
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow admins
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all events
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(events)

  } catch (error: any) {
    console.error("EVENT FETCH ERROR:", error)
    return NextResponse.json(
      { error: "Failed to fetch events", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin (using string comparison since Role is string in your schema)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("Authenticated as:", session.user.email, "Role:", session.user.role)

    // ✅ STEP 1: Find or create the user in database
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // If user doesn't exist in database, create it
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || "Admin User",
          role: "ADMIN", // Force ADMIN role for created users
          // Note: password is optional in your schema
        }
      })
      console.log("✅ Created new user in database:", user.id, user.email)
    } else {
      console.log("✅ Found existing user:", user.id, user.email, "Role:", user.role)
    }

    // ✅ STEP 2: Parse the request
    const body = await req.json()
    const { title, description, date, location, imageUrl, tickets } = body

    console.log("Creating event with data:", { title, date, location })

    // Basic validation
    if (!title || !date || !location) {
      return NextResponse.json({ 
        error: "Missing required fields",
        required: ["title", "date", "location"] 
      }, { status: 400 })
    }

    // ✅ STEP 3: Create event with proper schema structure
    const event = await prisma.event.create({
      data: {
        title,
        description: description || "",
        date: new Date(date),
        location,
        imageUrl: imageUrl || "",
        createdById: user.id, // Use createdById field from your schema
        // organizerId is optional in your schema, so we can skip it
      }
    })

    console.log("✅ Event created with ID:", event.id)

    type CreatedTicket = {
  id: string
  type: string
  price: number
  quantity: number
  eventId: string
  userId: string
}
    // ✅ STEP 4: Create tickets if provided
    let createdTickets: CreatedTicket[] = []
    if (tickets && Array.isArray(tickets) && tickets.length > 0) {
      console.log("Creating tickets:", tickets.length)
      
      createdTickets = await Promise.all(
        tickets.map((ticket: any) =>
          prisma.ticket.create({
            data: {
              type: ticket.type || "General Admission",
              price: parseFloat(ticket.price) || 0,
              quantity: parseInt(ticket.quantity) || 0,
              userId: user.id,
              eventId: event.id
            }
          })
        )
      )
      console.log("✅ Tickets created:", createdTickets.length)
    }

    // ✅ STEP 5: Return success with proper structure
    return NextResponse.json(
      { 
        success: true,
        eventId: event.id,
        message: "Event created successfully",
        event: {
          ...event,
          createdBy: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        },
        tickets: createdTickets 
      }, 
      { status: 201 }
    )

  } catch (error: any) {
    console.error("❌ EVENT CREATE ERROR DETAILS:")
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Full error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to create event",
        details: error.message,
        hint: "Check if database is properly set up and user exists"
      },
      { status: 500 }
    )
  }
}