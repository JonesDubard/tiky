import { NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { hash } from "bcryptjs";

export async function POST() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: "Admin already exists" },
        { status: 400 }
      );
    }

    // Create admin user
    const hashedPassword = await hash("Admin123!", 10);
    
    const admin = await prisma.user.create({
      data: {
        email: "admin@Tiky.com",
        name: "Admin User",
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    return NextResponse.json({
      message: "Admin created successfully",
      email: admin.email,
      password: "Admin123!"
    });
  } catch (error) {
    console.error("[SETUP_ERROR]", error);
    return NextResponse.json(
      { error: "Setup failed" },
      { status: 500 }
    );
  }
}