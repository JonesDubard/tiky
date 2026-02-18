// app/api/admin/events/route.ts - WITH IMAGE UPLOAD SUPPORT
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import { getServerSession } from 'next-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Get the user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has admin/organizer role
    if (user.role !== 'ADMIN' && user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 3. Parse form data (multipart/form-data)
    const formData = await req.formData();
    
    // 4. Get event data from form
    const eventDataJson = formData.get('eventData') as string;
    if (!eventDataJson) {
      return NextResponse.json(
        { error: 'No event data provided' },
        { status: 400 }
      );
    }

    const eventData = JSON.parse(eventDataJson);
    const { title, description, date, location, published, isFeatured, ticketTypes } = eventData;

    // Validate required fields
    if (!title || !date || !location || !ticketTypes?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 5. Handle image upload
    let imageUrl = eventData.imageUrl || '';
    const imageFile = formData.get('image') as File | null;

    if (imageFile) {
      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image must be less than 5MB' },
          { status: 400 }
        );
      }

      // OPTION A: Save locally (for development)
      // In production, you'd upload to Cloudinary/S3 instead
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create unique filename
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads/events');
      
      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });
      
      // Save file
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      // URL to access the image
      imageUrl = `/uploads/events/${fileName}`;
      
      // OPTION B: For production with Cloudinary (uncomment and configure)
      // const cloudinaryResponse = await uploadToCloudinary(imageFile);
      // imageUrl = cloudinaryResponse.secure_url;
    }

    // 6. Create event in database
    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        date: new Date(date),
        location,
        imageUrl,
        published: published || false,
        isFeatured: isFeatured || false,
        createdById: user.id,
        ticketTypes: {
          create: ticketTypes.map((ticket: any) => ({
            name: ticket.name,
            price: parseFloat(ticket.price) || 0,
            quantity: parseInt(ticket.quantity) || 0,
            maxPerOrder: ticket.maxPerOrder || 5,
            description: ticket.description || ''
          }))
        }
      },
      include: {
        ticketTypes: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      event,
      message: 'Event created successfully' 
    });

  } catch (error: any) {
    console.error('[EVENT_CREATE_ERROR]', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

