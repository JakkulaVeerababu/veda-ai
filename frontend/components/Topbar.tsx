"use client";

import React from "react";

interface TopbarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  compact?: boolean; // For when sidebar is collapsed
}

const A = "/assets/";
const assetIcon = (name: string, alt = "") => (
  <img className="asset-icon" src={`${A}${name}`} alt={alt} />
);

export default function Topbar({ title = "Exams", showBack = true, onBack, compact = false }: TopbarProps) {
  return (
    <header className={`topbar ${compact ? "compact-offset" : ""}`}>
      <div className="crumb">
        {showBack && (
          <button onClick={onBack} className="top-back" aria-label="Go back">
            ←
          </button>
        )}
        {assetIcon("breadcrumb.svg")}
        <span>{title}</span>
      </div>
      <div className="top-actions">
        <span className="help">?</span>
        <span className="notify">{assetIcon("notification.svg", "Notifications")}</span>
        <span className="sparkle-chip">{assetIcon("sparkle.svg", "AI tools")}</span>
        <img className="avatar" src={`${A}avatar.png`} alt="Madhur Rastogi" />
        <b>Madhur Rastogi</b><span>⌄</span>
      </div>
    </header>
  );
}
