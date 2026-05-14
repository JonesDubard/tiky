"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Loader2, CalendarDays,
  Link2, ImagePlus, X, Upload,
} from "lucide-react";

interface Event { id: string; title: string }

interface PollOption {
  id?: string;
  text: string;
  imageUrl?: string | null;
}

interface PollFormProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    status: string;
    endDate?: string | null;
    eventId?: string | null;
    isFeatured?: boolean;
    votePrice?: number | null;
    options: PollOption[];
  };
  mode?: "create" | "edit";
}

export default function PollForm({ initialData, mode = "create" }: PollFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    status: initialData?.status ?? "ACTIVE",
    endDate: initialData?.endDate
      ? new Date(initialData.endDate).toISOString().slice(0, 16)
      : "",
    eventId: initialData?.eventId ?? "",
    isFeatured: initialData?.isFeatured ?? false,
    votePrice: initialData?.votePrice ?? "",
  });

  const [options, setOptions] = useState<PollOption[]>(
    initialData?.options?.length
      ? initialData.options
      : [{ text: "", imageUrl: null }, { text: "", imageUrl: null }]
  );

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch events for dropdown
  useEffect(() => {
    fetch("/api/admin/events?published=true")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const addOption = () => {
    if (options.length >= 20) return showToast("Maximum 20 candidates allowed", "error");
    setOptions([...options, { text: "", imageUrl: null }]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return showToast("At least 2 options are required", "error");
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const updateOption = (i: number, field: keyof PollOption, value: string) => {
    const updated = [...options];
    updated[i] = { ...updated[i], [field]: value };
    setOptions(updated);
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/poll-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Upload failed", "error");
      updateOption(index, "imageUrl", data.url);
    } catch {
      showToast("Image upload failed", "error");
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (i: number) => {
    updateOption(i, "imageUrl", "");
    if (fileInputRefs.current[i]) fileInputRefs.current[i]!.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast("Poll title is required", "error");
    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length < 2) return showToast("At least 2 options are required", "error");

    setLoading(true);
    try {
      const payload = {
        ...form,
        votePrice: form.votePrice ? parseFloat(form.votePrice as string) : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        eventId: form.eventId || null,
        options: validOptions,
      };

      const url = mode === "edit" && initialData?.id
        ? `/api/admin/polls/${initialData.id}`
        : "/api/admin/polls";

      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed to save poll", "error");

      showToast(mode === "edit" ? "Poll updated!" : "Poll created!", "success");
      setTimeout(() => {
        router.push(`/admin/polls/${data.id ?? data.poll?.id ?? ""}`);
        router.refresh();
      }, 800);
    } catch {
      showToast("Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Poll Question <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Who should headline Monrovia Afrobeats Fest 2026?"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Add context or instructions for voters..."
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      </div>

      {/* Options with image upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Candidates / Options <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-400">Photos optional — great for contests</span>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {/* Image slot */}
              <div className="shrink-0">
                {option.imageUrl ? (
                  <div className="relative w-16 h-16">
                    <img
                      src={option.imageUrl}
                      alt={option.text || `Option ${index + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={uploadingIndex === index}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-orange-400 hover:bg-orange-50 transition-colors group"
                  >
                    {uploadingIndex === index ? (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                        <span className="text-[10px] text-gray-400 group-hover:text-orange-500 leading-tight text-center">
                          Add photo
                        </span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={(el) => { fileInputRefs.current[index] = el; }}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(index, file);
                  }}
                />
              </div>

              {/* Name input */}
              <div className="flex-1 flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(index, "text", e.target.value)}
                  placeholder={`Candidate ${index + 1} name`}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="self-center p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          {options.length < 20 ? (
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Candidate
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">Maximum 20 candidates reached</span>
          )}
          <span className="text-xs text-gray-400 font-medium">
            {options.filter(o => o.text.trim()).length} / 20 candidates
          </span>
        </div>
      </div>

      {/* Link to Event (optional) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          <span className="flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5" />
            Link to Event
          </span>
        </label>
        <select
          value={form.eventId}
          onChange={(e) => setForm({ ...form, eventId: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="">— Select an event (optional) —</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          This poll will appear on the linked event’s page.
        </p>
      </div>

      {/* Status + Close Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Close Date <span className="text-gray-400 font-normal">(optional)</span>
            </span>
          </label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Featured */}
      <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
        <input
          id="isFeatured"
          type="checkbox"
          checked={form.isFeatured}
          onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
        />
        <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
          Feature this poll{" "}
          <span className="text-gray-400 font-normal">— highlighted on the public polls page</span>
        </label>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
        <Upload className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>JPEG, PNG, WebP accepted. Max 5MB each.</span>
      </div>

      {/* Vote Price */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          <span className="flex items-center gap-1">
            Vote Price (optional)
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.votePrice}
            onChange={(e) => setForm({ ...form, votePrice: e.target.value })}
            placeholder="0.00 (free if empty)"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-orange-400"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Set a price per vote. Leave empty or 0 for free voting.
        </p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
          ) : mode === "edit" ? "Save Changes" : "Create Poll"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}