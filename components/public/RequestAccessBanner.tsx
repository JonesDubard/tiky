// components/public/RequestAccessBanner.tsx
import { Mail, Calendar, Vote } from "lucide-react";

interface RequestAccessBannerProps {
  type: "poll" | "event";
}

const SUPPORT_EMAIL = "tikyliberia@gmail.com";

export default function RequestAccessBanner({ type }: RequestAccessBannerProps) {
  const Icon = type === "poll" ? Vote : Calendar;
  const subject = encodeURIComponent(
    type === "poll"
      ? "Request: Create a Poll on Tiky"
      : "Request: Create an Event on Tiky"
  );
  const body = encodeURIComponent(
    type === "poll"
      ? `Hi Tiky team,\n\nI'd like to request access to create a poll on the platform.\n\nPoll idea:\n[Describe your poll here]\n\nMy name:\nMy email:`
      : `Hi Tiky team,\n\nI'd like to request to list an event on the platform.\n\nEvent details:\n[Describe your event here]\n\nMy name:\nMy email:\nMy organization:`
  );

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Want to create {type === "poll" ? "a poll" : "an event"}?
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {type === "poll"
              ? "Organizers and verified partners can create polls. Reach out to get access."
              : "List your event on Tiky and start selling tickets. Contact us to get started."}
          </p>
        </div>
      </div>
      <a
        href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
      >
        <Mail className="w-4 h-4" />
        Request Access
      </a>
    </div>
  );
}