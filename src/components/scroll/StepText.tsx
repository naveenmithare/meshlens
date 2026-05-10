"use client";

import { ReactNode } from "react";

interface StepTextProps {
  index: number;
  title: string;
  children: ReactNode;
}

export default function StepText({ index, title, children }: StepTextProps) {
  return (
    <div
      data-step={index}
      className="min-h-[80vh] lg:min-h-[90vh] flex flex-col justify-center py-8 px-8 lg:px-14 opacity-15 transition-opacity duration-500 [&.is-active]:opacity-100"
    >
      <h2 className="text-2xl lg:text-3xl font-bold text-mesh-accent mb-5 tracking-tight">{title}</h2>
      <div className="text-[15px] lg:text-[16px] leading-[1.9] text-mesh-text-muted [&_strong]:text-mesh-text [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
