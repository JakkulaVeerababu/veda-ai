import React from "react";
import { CheckCircle2, AlertCircle, HelpCircle, XCircle } from "lucide-react";
import { MappingStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: MappingStatus | "unmatched";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "answered":
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
          <CheckCircle2 size={14} className="text-green-600" />
          <span>Answered</span>
        </div>
      );
    case "unanswered":
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
          <XCircle size={14} className="text-gray-500" />
          <span>Unanswered</span>
        </div>
      );
    case "needs_review":
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-200">
          <AlertCircle size={14} className="text-orange-600" />
          <span>Needs Review</span>
        </div>
      );
    case "unmatched":
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <HelpCircle size={14} className="text-blue-600" />
          <span>Unmatched</span>
        </div>
      );
    default:
      return null;
  }
}
