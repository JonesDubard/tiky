"use client";

// app/admin/users/components/RoleToggleButton.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserMinus } from "lucide-react";

interface RoleToggleButtonProps {
  userId: string;
  currentRole: string;
}

export default function RoleToggleButton({ userId, currentRole }: RoleToggleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const isOrganizer = currentRole === "ORGANIZER";

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggle = async () => {
    const newRole = isOrganizer ? "USER" : "ORGANIZER";
    const confirm = window.confirm(
      isOrganizer
        ? "Remove organizer access? This user will become a regular user."
        : "Grant organizer access? This user will be able to create events and polls."
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update role", "error");
        return;
      }

      showToast(
        isOrganizer
          ? "User downgraded to regular user."
          : "User promoted to Organizer!",
        "success"
      );
      router.refresh();
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}>
          {toast.msg}
        </div>
      )}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 ${
          isOrganizer
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isOrganizer ? (
          <UserMinus className="w-3.5 h-3.5" />
        ) : (
          <UserCheck className="w-3.5 h-3.5" />
        )}
        {isOrganizer ? "Remove Organizer" : "Make Organizer"}
      </button>
    </>
  );
}