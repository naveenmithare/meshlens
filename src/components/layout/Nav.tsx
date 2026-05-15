"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { IS_AUTHORING } from "@/lib/authoring";

const links = [
  { href: "/", label: "Introduction" },
  { href: "/meshatlas", label: "MeshAtlas" },
  { href: "/semantic", label: "Semantic Layer" },
];

const THEME_PALETTE = [
  { hex: "#0f2e33", name: "Deep Teal" },
  { hex: "#dcea59", name: "Lime" },
  { hex: "#eb7a35", name: "Orange" },
  { hex: "#c7dcdb", name: "Sage" },
  { hex: "#8fcd73", name: "Green" },
  { hex: "#56B265", name: "Forest" },
  { hex: "#5b9bd5", name: "Blue" },
  { hex: "#e8a0bf", name: "Rose" },
];

const FONT_OPTIONS = [
  { name: "Inter", dataAttr: "inter", cls: "font-preview-inter" },
  { name: "DM Sans", dataAttr: "dm-sans", cls: "font-preview-dm-sans" },
  { name: "Jakarta", dataAttr: "jakarta", cls: "font-preview-jakarta" },
  { name: "Outfit", dataAttr: "outfit", cls: "font-preview-outfit" },
  { name: "Space Grotesk", dataAttr: "space-grotesk", cls: "font-preview-space-grotesk" },
];

const STORAGE_KEY = "meshlens-settings";

interface SavedSettings {
  accent: string;
  bg: string;
  font: string;
}

function loadSettings(): SavedSettings {
  if (typeof window === "undefined") return { accent: "#000000", bg: "#fffef5", font: "dm-sans" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { accent: "#000000", bg: "#fffef5", font: "dm-sans" };
}

function saveSettings(s: SavedSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function normalizePathname(pathname: string | null): string {
  if (!pathname) return "/";
  const noQuery = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (noQuery === "" || noQuery === "/") return "/";
  return noQuery.endsWith("/") ? noQuery.slice(0, -1) || "/" : noQuery;
}

export default function Nav() {
  const pathname = usePathname();
  const routerPath = normalizePathname(pathname);
  const [popPath, setPopPath] = useState<string | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    function onPopState() {
      setPendingHref(null);
      setPopPath(normalizePathname(window.location.pathname));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const activePath = popPath && popPath !== routerPath ? popPath : routerPath;
  const pendingNorm = pendingHref ? normalizePathname(pendingHref) : null;
  const path =
    pendingNorm && pendingNorm !== routerPath ? pendingNorm : activePath;

  const [showSettings, setShowSettings] = useState(false);
  const [activeFont, setActiveFont] = useState(() => {
    const s = loadSettings();
    const font = FONT_OPTIONS.find((f) => f.dataAttr === s.font) ?? FONT_OPTIONS[0];
    return font.name;
  });
  const [accentHex, setAccentHex] = useState(() => loadSettings().accent);
  const [bgHex, setBgHex] = useState(() => loadSettings().bg);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const persist = useCallback((partial: Partial<SavedSettings>) => {
    const prev = loadSettings();
    saveSettings({ ...prev, ...partial });
  }, []);

  const applyAccent = useCallback((hex: string, save = true) => {
    setAccentHex(hex);
    if (save) persist({ accent: hex });
  }, [persist]);

  const applyBgColor = useCallback((hex: string, save = true) => {
    setBgHex(hex);
    if (save) persist({ bg: hex });
  }, [persist]);

  const applyFont = useCallback((font: (typeof FONT_OPTIONS)[number], save = true) => {
    setActiveFont(font.name);
    if (save) persist({ font: font.dataAttr });
  }, [persist]);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--color-mesh-accent", accentHex);
    document.documentElement.style.setProperty("--color-mesh-accent-dim", `${accentHex}1a`);
    document.body.style.background = bgHex;
    document.documentElement.style.setProperty("--nav-bg", bgHex);
    const font = FONT_OPTIONS.find((f) => f.name === activeFont) ?? FONT_OPTIONS[0];
    document.documentElement.setAttribute("data-font", font.dataAttr);
  }, [accentHex, bgHex, activeFont]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (settingsPanelRef.current?.contains(t)) return;
      if ((e.target as HTMLElement).closest?.("[data-meshlens-settings-trigger]")) return;
      setShowSettings(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const onNavLinkClick = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    setPendingHref(href);
    setMobileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="absolute inset-x-0 top-0 min-h-[56px] h-full" style={{ background: "var(--nav-bg, #fffef5)" }} />
      <div className="relative flex justify-center px-3 sm:px-6 pt-3 sm:pt-4 pb-2">
        {/* Desktop */}
        <div className="hidden md:grid w-full max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center px-3 py-2 bg-white shadow-[0_2px_24px_rgba(0,0,0,0.06)] rounded-t-2xl">
          <Link href="/" className="flex items-center gap-2.5 pl-3 group">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-mesh-accent shrink-0">
              <circle cx="12" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="5" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="19" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="8.5" x2="6.5" y2="15.5" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
              <line x1="12" y1="8.5" x2="17.5" y2="15.5" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
              <line x1="7.5" y1="18" x2="16.5" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight text-mesh-text group-hover:text-mesh-accent transition-colors">
              MeshLens
            </span>
          </Link>

          <div className="flex items-center gap-0.5 flex-wrap justify-center">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? path === "/"
                  : path === link.href || path.startsWith(`${link.href}/`);
              return (
                <Link key={link.href} href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  prefetch
                  onClick={onNavLinkClick(link.href)}
                  className={`px-4 py-2 rounded-full text-[14px] font-medium ${
                    isActive
                      ? ""
                      : "text-gray-500 hover:text-mesh-text hover:bg-gray-100/80 transition-colors duration-100"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: "#1a1a1a", color: "#ffffff" }
                      : undefined
                  }>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex justify-end">
            {IS_AUTHORING ? (
              <div className="relative pr-2">
                <button type="button" data-meshlens-settings-trigger onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] text-gray-500 hover:text-mesh-text hover:bg-gray-100/80 transition-all duration-200"
                  title="Customize appearance">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden w-full max-w-[1200px] flex items-center justify-between gap-2 px-3 py-2.5 bg-white shadow-[0_2px_24px_rgba(0,0,0,0.06)] rounded-t-2xl">
          <Link href="/" onClick={onNavLinkClick("/")} className="flex items-center gap-2 min-w-0 group">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-mesh-accent shrink-0">
              <circle cx="12" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="5" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="19" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="8.5" x2="6.5" y2="15.5" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
              <line x1="12" y1="8.5" x2="17.5" y2="15.5" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
              <line x1="7.5" y1="18" x2="16.5" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
            </svg>
            <span className="text-[14px] font-semibold tracking-tight text-mesh-text truncate group-hover:text-mesh-accent transition-colors">
              MeshLens
            </span>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            {IS_AUTHORING ? (
              <button type="button" data-meshlens-settings-trigger onClick={() => setShowSettings(!showSettings)}
                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-mesh-text hover:bg-gray-100/80 transition-all"
                title="Customize appearance">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
            ) : null}
            <button type="button" aria-expanded={mobileOpen} aria-controls="meshlens-mobile-nav"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-mesh-text hover:bg-gray-50 transition-colors"
              title={mobileOpen ? "Close menu" : "Open menu"}>
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {showSettings && IS_AUTHORING && (
          <div ref={settingsPanelRef}
            className="fixed z-[80] left-3 right-3 top-[calc(env(safe-area-inset-top)+4.5rem)] max-h-[min(80vh,560px)] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] md:absolute md:left-auto md:right-6 md:top-14 md:w-80 md:max-h-[80vh]">
              {/* Font picker */}
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">Typography</p>
              <div className="space-y-0.5 mb-5">
                {FONT_OPTIONS.map((font) => (
                  <button key={font.name} onClick={() => applyFont(font)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                      activeFont === font.name ? "bg-gray-50 ring-1 ring-gray-200" : "hover:bg-gray-50"
                    }`}>
                    <span className={`text-lg font-semibold w-8 text-center text-mesh-text ${font.cls}`}>Aa</span>
                    <div className="flex-1">
                      <span className={`text-[13px] font-medium text-mesh-text ${font.cls}`}>{font.name}</span>
                      <span className={`block text-[10px] text-gray-400 ${font.cls}`}>The quick brown fox</span>
                    </div>
                    {activeFont === font.name && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-mesh-accent shrink-0">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Theme palette — 8 swatches */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">Theme Palette</p>
                <div className="grid grid-cols-8 gap-2 mb-3">
                  {THEME_PALETTE.map((c) => (
                    <button key={c.hex} onClick={() => applyAccent(c.hex)}
                      className="group flex flex-col items-center gap-1" title={c.name}>
                      <div className={`w-7 h-7 rounded-lg border-2 transition-all ${
                        accentHex === c.hex ? "border-mesh-text scale-110 shadow-sm" : "border-gray-200 hover:scale-105"
                      }`} style={{ backgroundColor: c.hex }} />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentHex} onChange={(e) => applyAccent(e.target.value)}
                    className="w-10 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0" />
                  <input type="text" value={accentHex} onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) applyAccent(v);
                      else setAccentHex(v);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] font-mono text-mesh-text
                      focus:outline-none focus:ring-1 focus:ring-gray-300"
                    placeholder="#56B265" />
                </div>
              </div>

              {/* Background color */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">Background</p>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[
                    { name: "Warm", hex: "#f4f4f4" },
                    { name: "Cool", hex: "#f0f2f5" },
                    { name: "Snow", hex: "#fafafa" },
                    { name: "White", hex: "#ffffff" },
                  ].map((bg) => (
                    <button key={bg.hex} onClick={() => applyBgColor(bg.hex)}
                      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors ${
                        bgHex === bg.hex ? "ring-1 ring-gray-300 bg-gray-50" : "hover:bg-gray-50"
                      }`}>
                      <div className="w-6 h-6 rounded-lg border border-gray-200" style={{ backgroundColor: bg.hex }} />
                      <span className="text-[9px] text-gray-500 font-medium">{bg.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgHex} onChange={(e) => applyBgColor(e.target.value)}
                    className="w-10 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0" />
                  <input type="text" value={bgHex} onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) applyBgColor(v);
                      else setBgHex(v);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] font-mono text-mesh-text
                      focus:outline-none focus:ring-1 focus:ring-gray-300"
                    placeholder="#f4f4f4" />
                </div>
              </div>
            </div>
        )}

        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-[70] bg-black/40 pt-[env(safe-area-inset-top)]" role="presentation" onClick={() => setMobileOpen(false)}>
            <div
              id="meshlens-mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className="absolute top-0 right-0 bottom-0 w-[min(100%,320px)] bg-white shadow-2xl flex flex-col pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">Navigate</div>
              <nav className="flex flex-col gap-1">
                {links.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? path === "/"
                      : path === link.href || path.startsWith(`${link.href}/`);
                  return (
                    <Link key={link.href} href={link.href} prefetch
                      aria-current={isActive ? "page" : undefined}
                      onClick={onNavLinkClick(link.href)}
                      className={`rounded-xl px-4 py-3 text-[15px] font-semibold ${
                        isActive ? "bg-mesh-text text-white" : "text-mesh-text hover:bg-gray-50"
                      }`}>
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
