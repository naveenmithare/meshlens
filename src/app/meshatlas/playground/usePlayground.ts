"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { PlaygroundConfig } from "./types";
import { DEFAULTS } from "./types";

export const LS_KEY_ARC = "meshatlas-pg-arc";
export const LS_KEY_GLOBAL_BG = "meshatlas-global-bg";
const LS_KEY_THEMES = "meshatlas-color-themes";
export const LS_KEY_ACTIVE_THEME = "meshatlas-active-theme";

export type ColorTheme = {
  id: string;
  name: string;
  builtIn?: boolean;
  colors: {
    layerColors: Record<string, string>;
    appTypeColors: Record<string, string>;
    green: string;
    red: string;
    warning: string;
    text: string;
    bg: string;
    domainColors: Record<string, string>;
    panelBg: string;
    panelGradient: { enabled: boolean; type: "linear" | "radial"; color1: string; color2: string; color3: string; midStop: number; angle: number; opacity: number };
    arrowColor: string;
    separator: { color: string };
    paneBorder: { color: string };
    costPanel: { widgetBg: string; widgetBorder: string; dotFill: string; mutedColor: string; posColor: string; negColor: string; chartLineColor: string; chartAreaColor: string; chartGridColor: string; chartAxisColor: string; chartMonthColor: string; chartDotStrokeColor: string; tableHeaderBg: string; tableHeaderColor: string; catIngestionColor: string; catProcessingColor: string; catOrchestrationColor: string; catStorageColor: string };
    overviewPanel: { cardBg: string; cardBorder: string; tabBg: string; tabTextColor: string; tabInactiveColor: string; domainLabelColor: string; kpiNumberColor: string; kpiLabelColor: string };
    cataloguePanel: { widgetBg: string; widgetBorder: string; headerTextColor: string; headerSubColor: string; tabActiveTextColor: string; tabInactiveTextColor: string; cardBg: string; cardBorder: string; cardHoverBg: string; cardNameColor: string; descColor: string; metaColor: string; tagBg: string; tagColor: string; searchBg: string; searchBorder: string; searchTextColor: string; searchPlaceholderColor: string; separatorColor: string; infoIconBg: string; infoIconActiveBg: string; infoIconColor: string; infoIconActiveColor: string };
    qualityPanel: { widgetBg: string; widgetBorder: string; headerTextColor: string; headerSubColor: string; radarGridColor: string; radarLabelColor: string; qualityHighColor: string; qualityMidColor: string; qualityLowColor: string; dimIconColor: string; cardBg: string; cardBorder: string; methodTextColor: string; insightsBg: string; insightsBorder: string; insightsPassingBg: string; insightsAttentionBg: string };
    pipelinePanel: { widgetBg: string; widgetBorder: string; headerTextColor: string; headerSubColor: string; tabActiveTextColor: string; tabInactiveTextColor: string; cardBg: string; cardBorder: string; searchBg: string; searchBorder: string };
  };
};

export function extractColorsFromCfg(cfg: PlaygroundConfig): ColorTheme["colors"] {
  return {
    layerColors: { ...cfg.layerColors },
    appTypeColors: { ...cfg.appTypeColors },
    green: cfg.green, red: cfg.red, warning: cfg.warning, text: cfg.text, bg: cfg.bg,
    domainColors: { ...cfg.domainColors },
    panelBg: cfg.panelBg, panelGradient: { ...cfg.panelGradient }, arrowColor: cfg.arrowColor,
    separator: { color: cfg.separator.color },
    paneBorder: { color: cfg.paneBorder.color },
    costPanel: { widgetBg: cfg.costPanel.widgetBg, widgetBorder: cfg.costPanel.widgetBorder, dotFill: cfg.costPanel.dotFill, mutedColor: cfg.costPanel.mutedColor, posColor: cfg.costPanel.posColor, negColor: cfg.costPanel.negColor, chartLineColor: cfg.costPanel.chartLineColor, chartAreaColor: cfg.costPanel.chartAreaColor, chartGridColor: cfg.costPanel.chartGridColor, chartAxisColor: cfg.costPanel.chartAxisColor, chartMonthColor: cfg.costPanel.chartMonthColor, chartDotStrokeColor: cfg.costPanel.chartDotStrokeColor, tableHeaderBg: cfg.costPanel.tableHeaderBg, tableHeaderColor: cfg.costPanel.tableHeaderColor, catIngestionColor: cfg.costPanel.catIngestionColor, catProcessingColor: cfg.costPanel.catProcessingColor, catOrchestrationColor: cfg.costPanel.catOrchestrationColor, catStorageColor: cfg.costPanel.catStorageColor },
    overviewPanel: { cardBg: cfg.overviewPanel.cardBg, cardBorder: cfg.overviewPanel.cardBorder, tabBg: cfg.overviewPanel.tabBg, tabTextColor: cfg.overviewPanel.tabTextColor, tabInactiveColor: cfg.overviewPanel.tabInactiveColor, domainLabelColor: cfg.overviewPanel.domainLabelColor, kpiNumberColor: cfg.overviewPanel.kpiNumberColor, kpiLabelColor: cfg.overviewPanel.kpiLabelColor },
    cataloguePanel: { widgetBg: cfg.cataloguePanel.widgetBg, widgetBorder: cfg.cataloguePanel.widgetBorder, headerTextColor: cfg.cataloguePanel.headerTextColor, headerSubColor: cfg.cataloguePanel.headerSubColor, tabActiveTextColor: cfg.cataloguePanel.tabActiveTextColor, tabInactiveTextColor: cfg.cataloguePanel.tabInactiveTextColor, cardBg: cfg.cataloguePanel.cardBg, cardBorder: cfg.cataloguePanel.cardBorder, cardHoverBg: cfg.cataloguePanel.cardHoverBg, cardNameColor: cfg.cataloguePanel.cardNameColor, descColor: cfg.cataloguePanel.descColor, metaColor: cfg.cataloguePanel.metaColor, tagBg: cfg.cataloguePanel.tagBg, tagColor: cfg.cataloguePanel.tagColor, searchBg: cfg.cataloguePanel.searchBg, searchBorder: cfg.cataloguePanel.searchBorder, searchTextColor: cfg.cataloguePanel.searchTextColor, searchPlaceholderColor: cfg.cataloguePanel.searchPlaceholderColor, separatorColor: cfg.cataloguePanel.separatorColor, infoIconBg: cfg.cataloguePanel.infoIconBg, infoIconActiveBg: cfg.cataloguePanel.infoIconActiveBg, infoIconColor: cfg.cataloguePanel.infoIconColor, infoIconActiveColor: cfg.cataloguePanel.infoIconActiveColor },
    qualityPanel: { widgetBg: cfg.qualityPanel.widgetBg, widgetBorder: cfg.qualityPanel.widgetBorder, headerTextColor: cfg.qualityPanel.headerTextColor, headerSubColor: cfg.qualityPanel.headerSubColor, radarGridColor: cfg.qualityPanel.radarGridColor, radarLabelColor: cfg.qualityPanel.radarLabelColor, qualityHighColor: cfg.qualityPanel.qualityHighColor, qualityMidColor: cfg.qualityPanel.qualityMidColor, qualityLowColor: cfg.qualityPanel.qualityLowColor, dimIconColor: cfg.qualityPanel.dimIconColor, cardBg: cfg.qualityPanel.cardBg, cardBorder: cfg.qualityPanel.cardBorder, methodTextColor: cfg.qualityPanel.methodTextColor, insightsBg: cfg.qualityPanel.insightsBg, insightsBorder: cfg.qualityPanel.insightsBorder, insightsPassingBg: cfg.qualityPanel.insightsPassingBg, insightsAttentionBg: cfg.qualityPanel.insightsAttentionBg },
    pipelinePanel: { widgetBg: cfg.pipelinePanel.widgetBg, widgetBorder: cfg.pipelinePanel.widgetBorder, headerTextColor: cfg.pipelinePanel.headerTextColor, headerSubColor: cfg.pipelinePanel.headerSubColor, tabActiveTextColor: cfg.pipelinePanel.tabActiveTextColor, tabInactiveTextColor: cfg.pipelinePanel.tabInactiveTextColor, cardBg: cfg.pipelinePanel.cardBg, cardBorder: cfg.pipelinePanel.cardBorder, searchBg: cfg.pipelinePanel.searchBg, searchBorder: cfg.pipelinePanel.searchBorder },
  };
}

export function applyThemeColors(cfg: PlaygroundConfig, colors: ColorTheme["colors"]): PlaygroundConfig {
  const next = JSON.parse(JSON.stringify(cfg)) as PlaygroundConfig;
  next.layerColors = { ...next.layerColors, ...colors.layerColors };
  next.appTypeColors = { ...next.appTypeColors, ...colors.appTypeColors };
  next.green = colors.green; next.red = colors.red; next.text = colors.text; next.bg = colors.bg;
  if (Object.keys(colors.domainColors).length > 0) next.domainColors = { ...next.domainColors, ...colors.domainColors };
  next.panelBg = colors.panelBg; if (colors.panelGradient) next.panelGradient = { ...colors.panelGradient }; next.arrowColor = colors.arrowColor;
  next.separator = { ...next.separator, color: colors.separator.color };
  next.paneBorder = { ...next.paneBorder, color: colors.paneBorder.color };
  Object.assign(next.costPanel, colors.costPanel);
  Object.assign(next.overviewPanel, colors.overviewPanel);
  Object.assign(next.cataloguePanel, colors.cataloguePanel);
  Object.assign(next.qualityPanel, colors.qualityPanel);
  Object.assign(next.pipelinePanel, colors.pipelinePanel);
  return next;
}

export const CLASSIC_THEME: ColorTheme = {
  id: "classic",
  name: "MeshLens Classic",
  builtIn: true,
  colors: {
    layerColors: { APPS: "#0f2e33", SOURCE_ALIGNED: "#3d9b8f", BUSINESS: "#c5a800", CONSUMER_ALIGNED: "#d96028" },
    appTypeColors: { SaaS: "#f5a882", Database: "#5bbead", API: "#5b9bd5", Streaming: "#8fcd73" },
    green: "#8fcd73", red: "#ef4444", warning: "#f59e0b", text: "#1a1a1a", bg: "#ffffff",
    domainColors: {},
    panelBg: "#ffffff", panelGradient: { enabled: false, type: "linear", color1: "#ffffff", color2: "#faf5ef", color3: "#f5f0eb", midStop: 50, angle: 180, opacity: 100 }, arrowColor: "#78716c",
    separator: { color: "#1a1a1a" },
    paneBorder: { color: "#d1d5db" },
    costPanel: { widgetBg: "#fafaf9", widgetBorder: "#e7e5e4", dotFill: "#ffffff", mutedColor: "#a8a29e", posColor: "#22c55e", negColor: "#ef4444", chartLineColor: "", chartAreaColor: "", chartGridColor: "#e5e7eb", chartAxisColor: "#78716c", chartMonthColor: "#78716c", chartDotStrokeColor: "", tableHeaderBg: "#f5f5f4", tableHeaderColor: "#a8a29e", catIngestionColor: "#d97706", catProcessingColor: "#22c55e", catOrchestrationColor: "#ef4444", catStorageColor: "#6b7280" },
    overviewPanel: { cardBg: "#fafaf9", cardBorder: "#e7e5e4", tabBg: "#1a1a1a", tabTextColor: "#ffffff", tabInactiveColor: "#a8a29e", domainLabelColor: "#a8a29e", kpiNumberColor: "#1a1a1a", kpiLabelColor: "#a8a29e" },
    cataloguePanel: { widgetBg: "#fafaf9", widgetBorder: "#e7e5e4", headerTextColor: "#1a1a1a", headerSubColor: "#a8a29e", tabActiveTextColor: "#ffffff", tabInactiveTextColor: "#78716c", cardBg: "#ffffff", cardBorder: "#e7e5e4", cardHoverBg: "#f5f5f4", cardNameColor: "#1a1a1a", descColor: "#78716c", metaColor: "#a8a29e", tagBg: "#f5f5f4", tagColor: "#78716c", searchBg: "#ffffff", searchBorder: "#e7e5e4", searchTextColor: "#1a1a1a", searchPlaceholderColor: "#a8a29e", separatorColor: "#e7e5e4", infoIconBg: "#e7e5e4", infoIconActiveBg: "#1a1a1a", infoIconColor: "#78716c", infoIconActiveColor: "#ffffff" },
    qualityPanel: { widgetBg: "#ffffff", widgetBorder: "#e7e5e4", headerTextColor: "#1a1a1a", headerSubColor: "#78716c", radarGridColor: "#e5e7eb", radarLabelColor: "#6b7280", qualityHighColor: "#8fcd73", qualityMidColor: "#dab508", qualityLowColor: "#ef4444", dimIconColor: "#8fcd73", cardBg: "#fafaf9", cardBorder: "#f5f5f4", methodTextColor: "#78716c", insightsBg: "#ffffff", insightsBorder: "#e7e5e4", insightsPassingBg: "#8fcd7308", insightsAttentionBg: "#ef444408" },
    pipelinePanel: { widgetBg: "#ffffff", widgetBorder: "#e7e5e4", headerTextColor: "#1a1a1a", headerSubColor: "#78716c", tabActiveTextColor: "#1a1a1a", tabInactiveTextColor: "#a8a29e", cardBg: "#fafaf9", cardBorder: "#e7e5e4", searchBg: "#fafaf9", searchBorder: "#e7e5e4" },
  },
};

export function loadSavedThemes(): ColorTheme[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY_THEMES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveThemesToStorage(themes: ColorTheme[]) {
  try { localStorage.setItem(LS_KEY_THEMES, JSON.stringify(themes)); } catch {}
}

function cloneDefaultConfig(): PlaygroundConfig {
  return JSON.parse(JSON.stringify(DEFAULTS)) as PlaygroundConfig;
}

export function loadPlaygroundConfig(storageKey: string): PlaygroundConfig {
  const base = cloneDefaultConfig();
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(storageKey);
    const merged = raw ? deepMerge(base, JSON.parse(raw)) : base;
    migratePlaygroundConfig(merged);
    const globalBg = localStorage.getItem(LS_KEY_GLOBAL_BG);
    if (globalBg) merged.bg = globalBg;
    return merged;
  } catch {}
  return base;
}

function deepMerge(base: any, patch: any): any {
  if (!patch || typeof patch !== "object") return base;
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    if (typeof base[k] === "object" && typeof patch[k] === "object" && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], patch[k]);
    } else if (patch[k] !== undefined) {
      out[k] = patch[k];
    }
  }
  return out;
}

/** Normalize keys renamed in playground (localStorage may still have legacy fields). */
function migratePlaygroundConfig(cfg: PlaygroundConfig): void {
  const cat = cfg.cataloguePanel as PlaygroundConfig["cataloguePanel"] & { selStackGap?: number };
  if (typeof cat.selStackGap === "number") {
    cfg.cataloguePanel.selSectionGap = cat.selStackGap;
    delete cat.selStackGap;
  }
  const pipe = cfg.pipelinePanel as PlaygroundConfig["pipelinePanel"] & { modelTableMaxHeight?: number; logMaxHeight?: number };
  if (typeof pipe.modelTableMaxHeight === "number") {
    cfg.pipelinePanel.selModelTableMaxHeight = pipe.modelTableMaxHeight;
    delete pipe.modelTableMaxHeight;
  }
  if (typeof pipe.logMaxHeight === "number") {
    cfg.pipelinePanel.selLogMaxHeight = pipe.logMaxHeight;
    delete pipe.logMaxHeight;
  }
  const luLegacy = cfg.legendUi as PlaygroundConfig["legendUi"] & { anatomyRowDescSize?: unknown; anatomyRowDescColor?: unknown; anatomyRowDescOpacity?: unknown };
  delete (luLegacy as Record<string, unknown>).anatomyRowDescSize;
  delete (luLegacy as Record<string, unknown>).anatomyRowDescColor;
  delete (luLegacy as Record<string, unknown>).anatomyRowDescOpacity;
  for (const k of Object.keys(cfg.legendText.anatomyRows)) {
    const row = cfg.legendText.anatomyRows[k as keyof typeof cfg.legendText.anatomyRows];
    if (row && typeof row === "object" && "desc" in row) delete (row as { desc?: string }).desc;
  }
}

type RightPanelSource = "overview" | "cost" | "catalogue" | "quality" | "pipeline";

type RightPanelSyncSnapshot = {
  titleSize: number;
  subtitleSize: number;
  headerTextColor: string;
  headerSubColor: string;
  searchFontSize: number;
  tabFontSize: number;
  widgetBg: string;
  widgetBorder: string;
  widgetRadius: number;
  sectionGap: number;
};

export function extractRightPanelSyncSnapshot(cfg: PlaygroundConfig, source: RightPanelSource): RightPanelSyncSnapshot {
  switch (source) {
    case "overview": {
      const o = cfg.overviewPanel;
      return {
        titleSize: o.nsPageTitleSize,
        subtitleSize: o.nsPageSubtitleSize,
        headerTextColor: o.nsPageTitleColor,
        headerSubColor: o.nsPageSubtitleColor,
        searchFontSize: o.tabFontSize,
        tabFontSize: o.tabFontSize,
        widgetBg: o.cardBg,
        widgetBorder: o.cardBorder,
        widgetRadius: o.cardRadius,
        sectionGap: o.sectionGap,
      };
    }
    case "cost": {
      const c = cfg.costPanel;
      return {
        titleSize: c.titleSize,
        subtitleSize: c.nsCaptionSize,
        headerTextColor: c.nsPageTitleColor,
        headerSubColor: c.mutedColor,
        searchFontSize: c.tabSize,
        tabFontSize: c.tabSize,
        widgetBg: c.widgetBg,
        widgetBorder: c.widgetBorder,
        widgetRadius: c.widgetRadius,
        sectionGap: c.sectionGap,
      };
    }
    case "catalogue": {
      const p = cfg.cataloguePanel;
      return {
        titleSize: p.titleSize,
        subtitleSize: p.subtitleSize,
        headerTextColor: p.headerTextColor,
        headerSubColor: p.headerSubColor,
        searchFontSize: p.searchFontSize,
        tabFontSize: p.tabFontSize,
        widgetBg: p.widgetBg,
        widgetBorder: p.widgetBorder,
        widgetRadius: p.widgetRadius,
        sectionGap: p.sectionGap,
      };
    }
    case "quality": {
      const p = cfg.qualityPanel;
      return {
        titleSize: p.titleSize,
        subtitleSize: p.subtitleSize,
        headerTextColor: p.headerTextColor,
        headerSubColor: p.headerSubColor,
        searchFontSize: p.nsEmptySearchSize,
        tabFontSize: p.dimLabelSize,
        widgetBg: p.widgetBg,
        widgetBorder: p.widgetBorder,
        widgetRadius: p.widgetRadius,
        sectionGap: p.sectionGap,
      };
    }
    case "pipeline": {
      const p = cfg.pipelinePanel;
      return {
        titleSize: p.titleSize,
        subtitleSize: p.subtitleSize,
        headerTextColor: p.headerTextColor,
        headerSubColor: p.headerSubColor,
        searchFontSize: p.searchFontSize,
        tabFontSize: p.tabFontSize,
        widgetBg: p.widgetBg,
        widgetBorder: p.widgetBorder,
        widgetRadius: p.widgetRadius,
        sectionGap: p.sectionGap,
      };
    }
  }
}

export function rightPanelSyncPathsForTarget(target: RightPanelSource, s: RightPanelSyncSnapshot, includeShell: boolean): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (target === "overview") {
    o["overviewPanel.nsPageTitleSize"] = s.titleSize;
    o["overviewPanel.nsPageSubtitleSize"] = s.subtitleSize;
    o["overviewPanel.nsPageTitleColor"] = s.headerTextColor;
    o["overviewPanel.nsPageSubtitleColor"] = s.headerSubColor;
    o["overviewPanel.tabFontSize"] = s.tabFontSize;
    if (includeShell) {
      o["overviewPanel.cardBg"] = s.widgetBg;
      o["overviewPanel.cardBorder"] = s.widgetBorder;
      o["overviewPanel.cardRadius"] = s.widgetRadius;
      o["overviewPanel.sectionGap"] = s.sectionGap;
    }
    return o;
  }
  if (target === "cost") {
    o["costPanel.titleSize"] = s.titleSize;
    o["costPanel.nsCaptionSize"] = s.subtitleSize;
    o["costPanel.nsPageTitleColor"] = s.headerTextColor;
    o["costPanel.mutedColor"] = s.headerSubColor;
    o["costPanel.tabSize"] = s.tabFontSize;
    if (includeShell) {
      o["costPanel.widgetBg"] = s.widgetBg;
      o["costPanel.widgetBorder"] = s.widgetBorder;
      o["costPanel.widgetRadius"] = s.widgetRadius;
      o["costPanel.sectionGap"] = s.sectionGap;
    }
    return o;
  }
  const base =
    target === "catalogue"
      ? "cataloguePanel"
      : target === "quality"
        ? "qualityPanel"
        : "pipelinePanel";
  o[`${base}.titleSize`] = s.titleSize;
  o[`${base}.subtitleSize`] = s.subtitleSize;
  o[`${base}.headerTextColor`] = s.headerTextColor;
  o[`${base}.headerSubColor`] = s.headerSubColor;
  if (target === "catalogue") {
    o["cataloguePanel.searchFontSize"] = s.searchFontSize;
    o["cataloguePanel.tabFontSize"] = s.tabFontSize;
  }
  if (target === "quality") {
    o["qualityPanel.nsEmptySearchSize"] = s.searchFontSize;
    o["qualityPanel.dimLabelSize"] = s.tabFontSize;
  }
  if (target === "pipeline") {
    o["pipelinePanel.searchFontSize"] = s.searchFontSize;
    o["pipelinePanel.tabFontSize"] = s.tabFontSize;
    o["pipelinePanel.nsBanTabFontSize"] = s.tabFontSize;
  }
  if (includeShell) {
    o[`${base}.widgetBg`] = s.widgetBg;
    o[`${base}.widgetBorder`] = s.widgetBorder;
    o[`${base}.widgetRadius`] = s.widgetRadius;
    o[`${base}.sectionGap`] = s.sectionGap;
  }
  return o;
}

export function buildRightPanelSyncUpdates(cfg: PlaygroundConfig, source: RightPanelSource, includeShell: boolean): Record<string, unknown> {
  const snap = extractRightPanelSyncSnapshot(cfg, source);
  const all: RightPanelSource[] = ["overview", "cost", "catalogue", "quality", "pipeline"];
  const out: Record<string, unknown> = {};
  for (const t of all) {
    if (t === source) continue;
    Object.assign(out, rightPanelSyncPathsForTarget(t, snap, includeShell));
  }
  return out;
}

export function usePlayground(storageKey: string): [PlaygroundConfig, (path: string, value: any) => void, () => void, () => void, boolean, (updates: Record<string, unknown>) => void] {
  const [cfg, setCfg] = useState<PlaygroundConfig>(() => loadPlaygroundConfig(storageKey));
  const [canUndo, setCanUndo] = useState(false);
  const historyRef = useRef<string[]>([]);
  const lastPushRef = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      historyRef.current = [raw || JSON.stringify(DEFAULTS)];
    } catch { historyRef.current = [JSON.stringify(DEFAULTS)]; }
  }, [storageKey]);

  const update = useCallback((path: string, value: any) => {
    setCfg(prev => {
      const now = Date.now();
      if (now - lastPushRef.current > 600) {
        historyRef.current.push(JSON.stringify(prev));
        if (historyRef.current.length > 50) historyRef.current.shift();
        lastPushRef.current = now;
        setCanUndo(true);
      }
      const keys = path.split(".");
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (obj[k] == null || typeof obj[k] !== "object") obj[k] = {};
        obj = obj[k];
      }
      obj[keys[keys.length - 1]] = value;
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const undo = useCallback(() => {
    if (historyRef.current.length <= 0) return;
    const prev = historyRef.current.pop()!;
    const restored = deepMerge(DEFAULTS, JSON.parse(prev));
    migratePlaygroundConfig(restored);
    setCfg(restored);
    setCanUndo(historyRef.current.length > 0);
    try { localStorage.setItem(storageKey, prev); } catch {}
  }, [storageKey]);

  const reset = useCallback(() => {
    historyRef.current.push(JSON.stringify(cfg));
    setCanUndo(true);
    localStorage.removeItem(storageKey);
    setCfg(DEFAULTS);
  }, [storageKey, cfg]);

  const batchUpdate = useCallback(
    (updates: Record<string, unknown>) => {
      const paths = Object.keys(updates);
      if (paths.length === 0) return;
      setCfg(prev => {
        historyRef.current.push(JSON.stringify(prev));
        if (historyRef.current.length > 50) historyRef.current.shift();
        lastPushRef.current = Date.now();
        setCanUndo(true);
        const next = JSON.parse(JSON.stringify(prev));
        for (const path of paths) {
          const value = updates[path];
          const keys = path.split(".");
          let obj: any = next;
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (obj[k] == null || typeof obj[k] !== "object") obj[k] = {};
            obj = obj[k];
          }
          obj[keys[keys.length - 1]] = value;
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [storageKey],
  );

  return [cfg, update, reset, undo, canUndo, batchUpdate];
}
