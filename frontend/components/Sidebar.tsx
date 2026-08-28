"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const A = "/assets/";
const assetIcon = (name: string, alt = "") => (
  <img className="asset-icon" src={`${A}${name}`} alt={alt} />
);

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const compact = collapsed;

  const links = [
    { icon: "nav-home.svg", label: "Home", path: "/dashboard" },
    { icon: "nav-classroom.svg", label: "My Classroom", path: "/classroom" },
    { icon: "nav-assignments.svg", label: "Assignments", path: "/assignments" },
    { icon: "nav-exams.svg", label: "Exams", path: "/exams" },
    { icon: "nav-library.svg", label: "My Library", path: "/library" },
  ];

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

      <aside 
        className={`sidebar ${compact ? "compact" : ""} ${mobileOpen ? "translate-x-0" : ""}`}
        style={mobileOpen ? { transform: 'translateX(0)', position: 'fixed', bottom: '10px' } : undefined}
      >
        {mobileOpen && (
          <button
            className="lg:hidden absolute top-4 right-4 p-1 z-50"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} className="text-veda-gray-500" />
          </button>
        )}
        
        <div>
          <div className="brand-row">
            <Link href="/dashboard" className="brand" onClick={() => setMobileOpen(false)}>
              {assetIcon("logo.svg", "VedaAI")} {!compact && <strong>VedaAI</strong>}
            </Link>
            {!compact && (
              <button onClick={onToggleCollapse} aria-label="Collapse sidebar" className="bg-transparent border-0 hover:opacity-80 transition-opacity">
                {assetIcon("sidebar-collapse.svg", "Collapse sidebar")}
              </button>
            )}
          </div>
          <button className="toolkit-button">
            {assetIcon("toolkit.svg")} {!compact && <span>AI Teacher's Toolkit</span>}
          </button>
          
          <nav className="side-nav">
            {links.map((item) => {
              const isActive = pathname === item.path || (item.label === "Exams" && pathname.startsWith("/exams"));
              return (
                <Link href={item.path} key={item.label} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  <button className={isActive ? "selected" : ""} title={compact ? item.label : undefined}>
                    {assetIcon(item.icon, item.label)} {!compact && <span>{item.label}</span>}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="sidebar-bottom">
          {!compact && (
            <button className="settings-link">
              {assetIcon("nav-settings.svg", "Settings")}<span>Settings</span>
            </button>
          )}
          <div className="school-card">
            <div className="school-mark">
              <img src={`${A}school.png`} alt="Delhi Public School" />
            </div>
            {!compact && (
              <div>
                <strong>Delhi Public School</strong>
                <span>Bokaro Steel City</span>
              </div>
            )}
          </div>
          {compact && (
             <button onClick={onToggleCollapse} className="chevrons w-full hover:bg-black/5 rounded-lg transition-colors py-1">»</button>
          )}
        </div>
      </aside>
    </>
  );
}
