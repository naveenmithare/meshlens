"use client";

import { useEffect, useRef, ReactNode } from "react";
import scrollama from "scrollama";

interface ScrollySectionProps {
  onStepEnter: (index: number) => void;
  graphic: ReactNode;
  children: ReactNode;
}

export default function ScrollySection({ onStepEnter, graphic, children }: ScrollySectionProps) {
  const scrollerRef = useRef<ReturnType<typeof scrollama> | null>(null);

  useEffect(() => {
    const scroller = scrollama();
    scrollerRef.current = scroller;

    scroller
      .setup({
        step: "[data-step]",
        offset: 0.5,
        debug: false,
      })
      .onStepEnter(({ index }: { index: number }) => {
        document.querySelectorAll("[data-step]").forEach((el) => el.classList.remove("is-active"));
        document.querySelector(`[data-step="${index}"]`)?.classList.add("is-active");
        onStepEnter(index);
      });

    const handleResize = () => scroller.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      scroller.destroy();
      window.removeEventListener("resize", handleResize);
    };
  }, [onStepEnter]);

  return (
    <section className="relative flex flex-col lg:flex-row">
      <div className="sticky top-0 left-0 w-full lg:w-[55%] h-[50vh] lg:h-screen flex items-center justify-center z-10">
        {graphic}
      </div>
      <div className="relative w-full lg:w-[45%] px-6 lg:px-12 z-20">{children}</div>
    </section>
  );
}
