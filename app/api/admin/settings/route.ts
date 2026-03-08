import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

// This would typically be stored in a Settings model
// For now, we'll use environment variables or a config file
let settings = {
  siteName: process.env.SITE_NAME || "Tiky",
  supportEmail: process.env.SUPPORT_EMAIL || "support@tiky.com",
  momoEnvironment: process.env.MOMO_ENVIRONMENT || "sandbox",
  maintenanceMode: process.env.MAINTENANCE_MODE === "true",
  currency: process.env.CURRENCY || "USD",
  timezone: process.env.TIMEZONE || "Africa/Monrovia",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    
    // Update settings (in a real app, save to database)
    settings = {
      ...settings,
      ...body,
    };

    // You could also update environment variables here
    // But that's not recommended for production

    return NextResponse.json({ 
      message: "Settings updated successfully",
      settings 
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}