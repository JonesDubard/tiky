'use client';

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  id: string;
  type: 'poll';
  title: string;
}

export default function DeleteButton({ id, type, title }: DeleteButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/polls/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      alert('Error deleting');
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Delete"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}