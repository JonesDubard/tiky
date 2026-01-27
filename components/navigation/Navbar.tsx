"use client";

import Link from "next/link";
import { Home, Bell, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  return (
    <>
      {/* Desktop Top Nav */}
      <nav className="hidden md:flex fixed top-0 inset-x-0 z-50 h-16 items-center justify-between px-6 border-b bg-white">
        <Link href="/" className="font-bold text-lg">
          Tiky
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/polls">
            <Bell className="w-5 h-5" />
          </Link>

          <Link href="/admin/dashboard">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 border-t bg-white flex justify-around items-center">
        <Link href="/">
          <Home className="w-6 h-6" />
        </Link>

        <Link href="/polls">
          <Bell className="w-6 h-6" />
        </Link>

        <Link href="/admin/dashboard">
          <LayoutDashboard className="w-6 h-6" />
        </Link>
      </nav>
    </>
  );
}
