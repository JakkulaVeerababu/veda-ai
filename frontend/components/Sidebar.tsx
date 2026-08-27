"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  GraduationCap,
  ClipboardList,
  FileText,
  Clock,
  Settings,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { icon: LayoutGrid, label: "Home", path: "/dashboard" },
  { icon: GraduationCap, label: "My Classroom", path: "/classroom" },
  { icon: ClipboardList, label: "Assignments", path: "/assignments" },
  { icon: FileText, label: "Exams", path: "/exams" },
  { icon: Clock, label: "My Library", path: "/library" },
];

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white rounded-xl shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} className="text-veda-dark" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 bg-white
          flex flex-col
          transition-all duration-300 ease-in-out
          border-r border-veda-gray-200
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative
        `}
      >
        {/* Header */}
        <div className={`flex items-center ${collapsed ? "justify-center px-3" : "justify-between px-5"} pt-6 pb-4`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              {/* VedaAI Logo */}
              <div className="w-10 h-10 bg-veda-dark rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-veda-dark tracking-tight">VedaAI</span>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-veda-dark rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          <button
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-veda-gray-100 transition-colors"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={16} className="text-veda-gray-500" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="5" height="10" rx="1" stroke="#737373" strokeWidth="1.5" fill="none"/>
                <rect x="9" y="3" width="5" height="10" rx="1" stroke="#737373" strokeWidth="1.5" fill="none"/>
              </svg>
            )}
          </button>

          {/* Mobile close button */}
          <button
            className="lg:hidden p-1"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} className="text-veda-gray-500" />
          </button>
        </div>

        {/* AI Teacher's Toolkit Button */}
        <div className={`${collapsed ? "px-3" : "px-4"} mb-6`}>
          <button
            className={`
              w-full flex items-center gap-2.5 
              bg-veda-dark text-white rounded-full
              border-2 border-veda-orange
              hover:bg-veda-gray-800 transition-colors
              ${collapsed ? "justify-center p-3" : "px-5 py-3"}
            `}
          >
            <Sparkles size={18} className="text-veda-orange shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap">
                AI Teacher&apos;s Toolkit
              </span>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.label}>
                  <Link href={item.path} onClick={() => setMobileOpen(false)}>
                    <div
                      className={`
                        w-full flex items-center gap-3 rounded-xl transition-colors cursor-pointer
                        ${collapsed ? "justify-center p-3" : "px-4 py-3"}
                        ${
                          isActive
                            ? "bg-veda-gray-100 text-veda-dark font-semibold"
                            : "text-veda-gray-500 hover:bg-veda-gray-50 hover:text-veda-gray-700"
                        }
                      `}
                    >
                      <item.icon size={20} className="shrink-0" />
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-4 mt-auto space-y-2">
          {/* Settings */}
          <button
            className={`
              w-full flex items-center gap-3 rounded-xl transition-colors
              text-veda-gray-500 hover:bg-veda-gray-50 hover:text-veda-gray-700
              ${collapsed ? "justify-center p-3" : "px-4 py-3"}
            `}
          >
            <Settings size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </button>

          {/* School Card */}
          <div
            className={`
              bg-veda-gray-50 rounded-xl p-3 flex items-center gap-3
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {/* School Logo */}
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-veda-gray-200 overflow-hidden">
              <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
                <path d="M14 0L28 8V20C28 26.627 21.732 32 14 32C6.268 32 0 26.627 0 20V8L14 0Z" fill="#15803d" opacity="0.15"/>
                <path d="M14 2L26 9V20C26 25.523 20.627 30 14 30C7.373 30 2 25.523 2 20V9L14 2Z" fill="#15803d" opacity="0.25"/>
                <text x="14" y="19" textAnchor="middle" fill="#15803d" fontSize="8" fontWeight="700" fontFamily="serif">DPS</text>
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-veda-dark truncate">
                  Delhi Public School
                </p>
                <p className="text-xs text-veda-gray-500 truncate">
                  Bokaro Steel City
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
