"use client";

import React from "react";
import {
  ArrowLeft,
  FileText,
  CircleHelp,
  Bell,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface TopbarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function Topbar({ title = "Exams", showBack = true, onBack }: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-veda-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-veda-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-veda-gray-600" />
          </button>
        )}
        <div className="flex items-center gap-2 text-veda-gray-500">
          <FileText size={16} />
          <span className="text-sm font-medium">{title}</span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-veda-gray-100 transition-colors">
          <CircleHelp size={20} className="text-veda-gray-500" />
        </button>
        <button className="p-2 rounded-lg hover:bg-veda-gray-100 transition-colors relative">
          <Bell size={20} className="text-veda-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-veda-orange rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-veda-gray-100 transition-colors">
          <Sparkles size={20} className="text-veda-gray-500" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-veda-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-veda-orange to-amber-400 flex items-center justify-center">
            <span className="text-white text-xs font-bold">MR</span>
          </div>
          <span className="text-sm font-medium text-veda-dark hidden sm:block">
            Madhur Rastogi
          </span>
          <ChevronDown size={14} className="text-veda-gray-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
