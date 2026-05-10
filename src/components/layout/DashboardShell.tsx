"use client";

import { ReactNode } from "react";

interface DashboardShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen pt-28 px-8 pb-20">
      <header className="max-w-[1200px] mx-auto pb-8 mb-10">
        <h1 className="heading-display">{title}</h1>
        <p className="text-[16px] text-mesh-text-muted mt-4">{subtitle}</p>
      </header>
      <main className="max-w-[1200px] mx-auto">{children}</main>
    </div>
  );
}
