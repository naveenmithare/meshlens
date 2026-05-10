"use client";

import { useState, useMemo, useRef, useEffect, useCallback, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════
   PLAYGROUND CONFIG — all tunable constants
   ═══════════════════════════════════════════════════ */

interface PlaygroundConfig {
  layout: "arc" | "horizontal";
  layerColors: Record<string, string>;
  appTypeColors: Record<string, string>;
  green: string;
  red: string;
  text: string;
  bg: string;
  radii: Record<string, number>;
  bubbleR: Record<string, number>;
  appDotR: number;
  cx: number;
  cy: number;
  pad: number;
  vw: number;
  vh: number;
  bizBubbleScale: number;
  conBubbleScale: number;
  innerDotR: number;
  bubbleGap: number;
  equalSpread: boolean;
  bubbleSizeMode: "uniform" | "upstream";
  uniformSrcR: number;
  uniformBizR: number;
  uniformConR: number;
  domainColors: Record<string, string>;
  domainBubbleOpacity: number;
  groupBubbleOpacity: number;
  outerBubbleOpacity: Record<string, number>;
  labelSize: number;
  domainNameSize: number;
  legendSize: number;
  labelOpacity: number;
  labelWeight: number;
  prodLabel: {
    srcSize: number; bizSize: number; conSize: number; offset: number; staggerGap: number; opacity: number; rotation: number;
    srcOffset: number; bizOffset: number; conOffset: number;
    srcAngle: number; bizAngle: number; conAngle: number;
    xOffset: number; yOffset: number;
    perProduct: Record<string, { radius: number; angle: number; x: number; y: number; rotation: number }>;
  };
  show: { productLabels: boolean; layerLabels: boolean; domainNames: boolean; domainLegend: boolean; pipelineLegend: boolean; dataFlowArrow: boolean; separators: boolean; arcBands: boolean; flowAnimation: boolean; searchBar: boolean; smartLabels: boolean };
  hPadX: number;
  hPadTop: number;
  hPadBot: number;
  typoOffset: { layerX: number; layerY: number; domainX: number; domainY: number; legendX: number; legendY: number };
  separator: { color: string; opacity: number; width: number; dash: number };
  arcBand: { opacity: number; width: number };
  flow: {
    width: number; opacity: number; highlightWidth: number; curveTension: number;
    anchor: { upstream: Record<string, number>; downstream: Record<string, number> };
    noodle: {
      appSourceCorridor: number;
      appSourceSpread: number;
      sourceBusinessCorridor: number;
      sameLayerGapFactor: number;
      sameLayerBase: number;
      sameLayerScale: number;
      sameLayerNearSpread: number;
      sameLayerFarSpread: number;
      businessBusinessLiftBase: number;
      businessBusinessLiftScale: number;
      businessBusinessLiftMax: number;
      businessBusinessNearSpread: number;
      businessBusinessFarSpread: number;
      farSpanThreshold: number;
      businessConsumerLiftBase: number;
      businessConsumerLiftScale: number;
      businessConsumerLiftMax: number;
      businessConsumerNearSpread: number;
      businessConsumerFarSpread: number;
    };
  };
  arrowX: number;
  arrowY: number;
  panelBg: string;
  paneBorder: { color: string; width: number; radius: number; padTop: number; padBottom: number; padSide: number };
  sortMode: "custom" | "alpha" | "appCount" | "upstream";
}

const DEFAULTS: PlaygroundConfig = {
  layout: "arc",
  layerColors: { APPS: "#0f2e33", SOURCE_ALIGNED: "#3d9b8f", BUSINESS: "#c5a800", CONSUMER_ALIGNED: "#d96028" },
  appTypeColors: { SaaS: "#f5a882", Database: "#5bbead", API: "#5b9bd5", Streaming: "#8fcd73" },
  green: "#8fcd73",
  red: "#ef4444",
  text: "#1a1a1a",
  bg: "#ffffff",
  radii: { APPS: 140, SOURCE_ALIGNED: 275, BUSINESS: 400, CONSUMER_ALIGNED: 520 },
  bubbleR: { SOURCE_ALIGNED: 12, BUSINESS: 9, CONSUMER_ALIGNED: 12 },
  appDotR: 3,
  cx: 600,
  cy: 780,
  pad: 0.12,
  vw: 1200,
  vh: 800,
  bizBubbleScale: 1,
  conBubbleScale: 1,
  innerDotR: 3.5,
  bubbleGap: 4,
  equalSpread: false,
  bubbleSizeMode: "uniform",
  uniformSrcR: 14,
  uniformBizR: 18,
  uniformConR: 20,
  domainColors: {},
  domainBubbleOpacity: 0.10,
  groupBubbleOpacity: 0.20,
  outerBubbleOpacity: { SOURCE_ALIGNED: 0.15, BUSINESS: 0.15, CONSUMER_ALIGNED: 0.15 },
  labelSize: 8,
  domainNameSize: 8.5,
  legendSize: 9,
  labelOpacity: 0.5,
  labelWeight: 700,
  prodLabel: {
    srcSize: 5, bizSize: 6, conSize: 7, offset: 4, staggerGap: 16, opacity: 0.55, rotation: 0,
    srcOffset: 10, bizOffset: 12, conOffset: 14,
    srcAngle: 0, bizAngle: 0, conAngle: 0,
    xOffset: 0, yOffset: 0,
    perProduct: {},
  },
  show: { productLabels: true, layerLabels: true, domainNames: true, domainLegend: true, pipelineLegend: true, dataFlowArrow: true, separators: true, arcBands: true, flowAnimation: true, searchBar: true, smartLabels: true },
  hPadX: 70,
  hPadTop: 50,
  hPadBot: 60,
  typoOffset: { layerX: 0, layerY: 0, domainX: 0, domainY: 0, legendX: 0, legendY: 0 },
  separator: { color: "#1a1a1a", opacity: 0.08, width: 0.5, dash: 4 },
  arcBand: { opacity: 0.08, width: 30 },
  flow: {
    width: 0.8, opacity: 0.08, highlightWidth: 2.5, curveTension: 0.5,
    anchor: {
      upstream: { APPS: 1, SOURCE_ALIGNED: 1, BUSINESS: 1, CONSUMER_ALIGNED: 1 },
      downstream: { APPS: 1, SOURCE_ALIGNED: 0, BUSINESS: 0, CONSUMER_ALIGNED: 0 },
    },
    noodle: {
      appSourceCorridor: 0.55,
      appSourceSpread: 0.33,
      sourceBusinessCorridor: 0.58,
      sameLayerGapFactor: 0.8,
      sameLayerBase: 14,
      sameLayerScale: 28,
      sameLayerNearSpread: 0.28,
      sameLayerFarSpread: 0.18,
      businessBusinessLiftBase: 36,
      businessBusinessLiftScale: 62,
      businessBusinessLiftMax: 150,
      businessBusinessNearSpread: 0.24,
      businessBusinessFarSpread: 0.16,
      farSpanThreshold: 1.2,
      businessConsumerLiftBase: 28,
      businessConsumerLiftScale: 52,
      businessConsumerLiftMax: 115,
      businessConsumerNearSpread: 0.22,
      businessConsumerFarSpread: 0.16,
    },
  },
  arrowX: 42,
  arrowY: 0,
  panelBg: "#ffffff",
  paneBorder: { color: "#d1d5db", width: 1.5, radius: 12, padTop: 6, padBottom: 6, padSide: 6 },
  sortMode: "custom",
};

const LS_KEY_ARC = "meshatlas-pg-arc";
const LS_KEY_H = "meshatlas-pg-horizontal";
const LS_KEY_LAYOUT = "meshatlas-layout";
const LS_KEY_GLOBAL_BG = "meshatlas-global-bg";

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

function usePlayground(storageKey: string): [PlaygroundConfig, (path: string, value: any) => void, () => void, () => void, boolean] {
  const [cfg, setCfg] = useState<PlaygroundConfig>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    try {
      const raw = localStorage.getItem(storageKey);
      const merged = raw ? deepMerge(DEFAULTS, JSON.parse(raw)) : { ...DEFAULTS };
      const globalBg = localStorage.getItem(LS_KEY_GLOBAL_BG);
      if (globalBg) merged.bg = globalBg;
      return merged;
    } catch {}
    return DEFAULTS;
  });
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

  return [cfg, update, reset, undo, canUndo];
}

/* ═══ Non-configurable constants ═══ */

const LAYER_LABEL: Record<string, string> = {
  APPS: "Applications", SOURCE_ALIGNED: "Source Data Products",
  BUSINESS: "Business Data Products", CONSUMER_ALIGNED: "Consumer Data Products",
};
const LAYER_SHORT: Record<string, string> = { SOURCE_ALIGNED: "Source", BUSINESS: "Business", CONSUMER_ALIGNED: "Consumer" };

const DQ_LABELS = [
  { key: "completeness", label: "Completeness", desc: "Required fields populated" },
  { key: "accuracy", label: "Accuracy", desc: "Records matching source of truth" },
  { key: "consistency", label: "Consistency", desc: "Uniform across systems" },
  { key: "timeliness", label: "Timeliness", desc: "Data freshness within SLA" },
  { key: "validity", label: "Validity", desc: "Values within accepted ranges" },
  { key: "uniqueness", label: "Uniqueness", desc: "No duplicate records" },
] as const;


const DOM_GAP = 0.018;
const PANEL_TABS = [
  { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "quality", label: "Quality", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "lineage", label: "Lineage", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { id: "cost", label: "Cost", icon: "M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-7 2a7 7 0 1114 0 7 7 0 01-14 0z" },
  { id: "catalogue", label: "Catalogue", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
] as const;

/* ═══ Types ═══ */
interface GNode { id: string; label: string; tier: string; qualityScore: number; productType: string; domainId: string; domainName: string; color: string; }
interface GEdge { id: string; source: string; target: string; edgeType: string; label: string; }
interface PNode extends GNode { x: number; y: number; r: number; upstreamIds?: string[]; }
interface PApp { id: string; name: string; app_type: string; vendor: string; description: string; domain_name: string; color_hex: string; conn_status: string; sync_frequency: string; monthly_cost_usd: number; rows_per_sync_avg: number; connector_type: string; destination_name: string; x: number; y: number; }
interface TypeGroup { type: string; color: string; apps: PApp[]; cx: number; cy: number; r: number; }
interface DCluster { domain: string; color: string; cx: number; cy: number; radius: number; groups: TypeGroup[]; }
type Sel = { kind: "product"; id: string } | { kind: "app"; id: string } | null;
interface AppProductLink { app_id: string; product_id: string; }
interface Props { graph: { nodes: GNode[]; edges: GEdge[] }; overview: any; domains: any[]; apps: any[]; products: any[]; policies: any[]; execKpis: any; appProductLinks: AppProductLink[]; }

/* ═══ Geometry helpers (parameterized) ═══ */
function tToAngle(t: number, pad: number) {
  const aLeft = Math.PI * (1 - pad);
  return aLeft - t * (aLeft - Math.PI * pad);
}
function arcXY(r: number, t: number, cx: number, cy: number, pad: number): [number, number] {
  const a = tToAngle(t, pad);
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}
function arcSvgPath(r: number, cx: number, cy: number, pad: number) {
  const [x1, y1] = arcXY(r, 0, cx, cy, pad);
  const [x2, y2] = arcXY(r, 1, cx, cy, pad);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}
function flowCurve(x1: number, y1: number, x2: number, y2: number, maxArc = 40) {
  const dy = Math.abs(y2 - y1);
  if (dy < 10) {
    const dx = Math.abs(x2 - x1);
    const arc = Math.min(Math.max(15, dx * 0.12), maxArc);
    const cy = Math.min(y1, y2) - arc;
    return `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
  }
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}
function tierColor(t: string) { return t === "GOLD" ? "#f59e0b" : t === "SILVER" ? "#94a3b8" : "#cd7f32"; }
function typeGroupR(count: number) { return count <= 1 ? 10 : count <= 2 ? 13 : count <= 3 ? 15 : count <= 5 ? 18 : 20; }

function dotsInGroup(cx: number, cy: number, count: number, groupR: number, dotR: number): [number, number][] {
  if (count === 0) return [];
  if (count === 1) return [[cx, cy]];
  const ringR = groupR - dotR - 2;
  if (count <= 6) return Array.from({ length: count }, (_, i) => { const a = (i / count) * Math.PI * 2 - Math.PI / 2; return [cx + ringR * Math.cos(a), cy + ringR * Math.sin(a)] as [number, number]; });
  const outerN = Math.ceil(count * 0.6), innerN = count - outerN, innerR = ringR * 0.5;
  const pos: [number, number][] = [];
  for (let i = 0; i < outerN; i++) { const a = (i / outerN) * Math.PI * 2 - Math.PI / 2; pos.push([cx + ringR * Math.cos(a), cy + ringR * Math.sin(a)]); }
  for (let i = 0; i < innerN; i++) { const a = (i / innerN) * Math.PI * 2 - Math.PI / 2; pos.push([cx + innerR * Math.cos(a), cy + innerR * Math.sin(a)]); }
  return pos;
}

function deriveQualityMetrics(prods: any[]): Record<string, number> {
  if (!prods.length) return { completeness: 0, accuracy: 0, consistency: 0, timeliness: 0, validity: 0, uniqueness: 100 };
  const avgQ = prods.reduce((s: number, p: any) => s + (p.quality_score || 0), 0) / prods.length;
  const withDesc = prods.filter((p: any) => p.description).length;
  const withOwner = prods.filter((p: any) => p.owner).length;
  const withSla = prods.filter((p: any) => p.sla_freshness).length;
  const completeness = Math.round((withDesc + withOwner + withSla) / (prods.length * 3) * 100);
  const seed = (s: number) => Math.round(Math.min(99, Math.max(60, avgQ * 100 + s)));
  return { completeness, accuracy: seed(0), consistency: seed(3), timeliness: seed(-4), validity: seed(5), uniqueness: seed(8) };
}

/* ═══ Hexagonal Radar DQ Chart ═══ */
function DQHexRadar({ metrics, size, layerColor, label, avgScore }: { metrics: Record<string, number>; size: number; layerColor: string; label: string; avgScore: number }) {
  const cxy = size / 2;
  const maxR = size / 2 - 36;
  const hexPt = (i: number, r: number) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [cxy + r * Math.cos(a), cxy + r * Math.sin(a)] as const;
  };
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const keys = DQ_LABELS.map(d => d.key);
  const dataPts = keys.map((k, i) => {
    const val = (metrics[k] ?? 0) / 100;
    return hexPt(i, maxR * val);
  });
  const dataPath = dataPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z";
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridLevels.map(lev => {
          const pts = Array.from({ length: 6 }, (_, i) => hexPt(i, maxR * lev));
          return <polygon key={lev} points={pts.map(p => `${p[0]},${p[1]}`).join(" ")} fill="none" stroke="#e5e7eb" strokeWidth={0.8} />;
        })}
        {keys.map((_, i) => {
          const [ex, ey] = hexPt(i, maxR);
          return <line key={i} x1={cxy} y1={cxy} x2={ex} y2={ey} stroke="#e5e7eb" strokeWidth={0.5} />;
        })}
        <polygon points={dataPts.map(p => `${p[0]},${p[1]}`).join(" ")} fill={layerColor} fillOpacity={0.18} stroke={layerColor} strokeWidth={1.5} strokeOpacity={0.7} />
        <path d={dataPath} fill="none" />
        {keys.map((k, i) => {
          const val = metrics[k] ?? 0;
          const [dx, dy] = hexPt(i, maxR * (val / 100));
          const dotCol = val >= 90 ? "#8fcd73" : val >= 75 ? "#dab508" : "#ef4444";
          return <circle key={k} cx={dx} cy={dy} r={3} fill={dotCol} stroke="white" strokeWidth={1} />;
        })}
        {DQ_LABELS.map((dq, i) => {
          const labelR = maxR + 22;
          const [lx, ly] = hexPt(i, labelR);
          const val = metrics[dq.key] ?? 0;
          const col = val >= 90 ? "#8fcd73" : val >= 75 ? "#dab508" : "#ef4444";
          return (<g key={dq.key}>
            <text x={lx} y={ly - 3} textAnchor="middle" fontSize={6.5} fontWeight={600} fill="#6b7280">{dq.label}</text>
            <text x={lx} y={ly + 6} textAnchor="middle" fontSize={7} fontWeight={800} fill={col}>{val}%</text>
          </g>);
        })}
        <text x={cxy} y={cxy - 3} textAnchor="middle" fontSize={16} fontWeight={800} fill={layerColor}>{avgScore}%</text>
        <text x={cxy} y={cxy + 10} textAnchor="middle" fontSize={8} fontWeight={600} fill="#9ca3af">{label}</text>
      </svg>
    </div>
  );
}

/* ═══ Playground UI helpers ═══ */
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10px] font-medium text-gray-700">{label}</span>
      <button onClick={() => onChange(!value)} className={`w-8 h-[18px] rounded-full cursor-pointer transition-colors relative ${value ? "bg-gray-800" : "bg-gray-200"}`}>
        <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${value ? "left-[16px]" : "left-[2px]"}`} />
      </button>
    </div>
  );
}
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] font-medium text-gray-700 flex-1 truncate">{label}</span>
      <input type="text" value={value} onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v); }}
        className="w-[62px] px-1 py-0.5 rounded border border-gray-200 text-[9px] font-mono text-gray-600 text-center focus:outline-none focus:ring-1 focus:ring-gray-300 shrink-0" placeholder="#000000" />
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-5 h-5 rounded border border-gray-200 cursor-pointer p-0 shrink-0" />
    </div>
  );
}
function SliderRow({ label, value, min, max, step, onChange, unit }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-0.5">
        <span className="text-[10px] font-medium text-gray-700">{label}</span>
        <span className="text-[10px] font-bold text-gray-500">{value}{unit ?? ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-600" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function MeshAtlasClient({ graph, overview, domains, apps, products, execKpis, appProductLinks }: Props) {
  const [layout, setLayoutRaw] = useState<"arc" | "horizontal">(() => {
    if (typeof window === "undefined") return "arc";
    try {
      const saved = localStorage.getItem(LS_KEY_LAYOUT);
      if (saved === "arc" || saved === "horizontal") return saved;
    } catch {}
    return "arc";
  });
  const [arcCfg, updateArcCfg, resetArcCfg, undoArcCfg] = usePlayground(LS_KEY_ARC);
  const [hCfg, updateHCfg, resetHCfg, undoHCfg] = usePlayground(LS_KEY_H);

  const setLayout = useCallback((m: "arc" | "horizontal") => {
    setLayoutRaw(m);
    try { localStorage.setItem(LS_KEY_LAYOUT, m); } catch {}
  }, []);

  const cfg = useMemo<PlaygroundConfig>(() => ({
    ...(layout === "arc" ? arcCfg : hCfg),
    layout,
  }), [layout, arcCfg, hCfg]);

  const updateCfg = layout === "arc" ? updateArcCfg : updateHCfg;
  const resetCfg = layout === "arc" ? resetArcCfg : resetHCfg;
  const undoCfg = layout === "arc" ? undoArcCfg : undoHCfg;

  useEffect(() => {
    document.body.style.background = cfg.bg;
    try { localStorage.setItem(LS_KEY_GLOBAL_BG, cfg.bg); } catch {}
  }, [cfg.bg]);

  const [sel, setSel] = useState<Sel>(null);
  const [tip, setTip] = useState<{ x: number; y: number; content: ReactNode } | null>(null);
  const [hovDom, setHD] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pgOpen, setPgOpen] = useState(false);
  const [pgSections, setPgSections] = useState({ display: true, colors: false, layout: false, flowLines: false, typography: false });
  const [pgProductQuery, setPgProductQuery] = useState("");
  const [pgProductId, setPgProductId] = useState<string>("");
  const [panelTab, setPanelTab] = useState<string>("overview");
  const [pgPos, setPgPos] = useState<{ x: number; y: number } | null>(null);
  const pgDrag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const labelDrag = useRef<{ id: string; grabOffsetX: number; grabOffsetY: number; origPerX: number; origPerY: number; baseLx: number; baseLy: number } | null>(null);
  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null);
  useEffect(() => { panelRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [sel, panelTab]);

  const maxArcR = useMemo(() => Math.max(cfg.radii.APPS, cfg.radii.SOURCE_ALIGNED, cfg.radii.BUSINESS, cfg.radii.CONSUMER_ALIGNED, 1), [cfg.radii]);
  const _arc = useCallback((r: number, t: number): [number, number] => {
    if (cfg.layout === "horizontal") {
      const y = cfg.vh - cfg.hPadBot - (r / maxArcR) * (cfg.vh - cfg.hPadTop - cfg.hPadBot);
      const x = cfg.hPadX + t * (cfg.vw - 2 * cfg.hPadX);
      return [x, y];
    }
    return arcXY(r, t, cfg.cx, cfg.cy, cfg.pad);
  }, [cfg.cx, cfg.cy, cfg.pad, cfg.layout, cfg.vw, cfg.vh, maxArcR, cfg.hPadX, cfg.hPadTop, cfg.hPadBot]);
  const _arcPath = useCallback((r: number) => {
    if (cfg.layout === "horizontal") {
      const [x1, y1] = _arc(r, 0);
      const [x2, y2] = _arc(r, 1);
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    return arcSvgPath(r, cfg.cx, cfg.cy, cfg.pad);
  }, [cfg.cx, cfg.cy, cfg.pad, cfg.layout, _arc]);
  const _tToAngle = useCallback((t: number) => tToAngle(t, cfg.pad), [cfg.pad]);
  const isH = cfg.layout === "horizontal";

  const domainOrder = useMemo(() => {
    const CUSTOM_DOMAIN_ORDER = ["Finance", "Sales", "Marketing", "Product", "Supply Chain", "HR", "Support"];
    const all = [...new Set(domains.map((d: any) => d.domain_name))];
    const appsByDomain: Record<string, number> = {};
    (apps as any[]).forEach(a => { appsByDomain[a.domain_name] = (appsByDomain[a.domain_name] || 0) + 1; });
    if (cfg.sortMode === "alpha") return all.sort();
    if (cfg.sortMode === "appCount") return all.sort((a, b) => (appsByDomain[b] || 0) - (appsByDomain[a] || 0));
    if (cfg.sortMode === "upstream") {
      const prodsByDomain: Record<string, number> = {};
      graph.nodes.forEach(n => { prodsByDomain[n.domainName] = (prodsByDomain[n.domainName] || 0) + 1; });
      return all.sort((a, b) => (prodsByDomain[b] || 0) - (prodsByDomain[a] || 0));
    }
    return all.sort((a, b) => {
      const ia = CUSTOM_DOMAIN_ORDER.indexOf(a), ib = CUSTOM_DOMAIN_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [domains, apps, cfg.sortMode, graph.nodes]);
  const domainColorMap = useMemo(() => { const m: Record<string, string> = {}; domains.forEach((d: any) => { m[d.domain_name] = cfg.domainColors[d.domain_name] || d.color_hex; }); return m; }, [domains, cfg.domainColors]);

  const domainSections = useMemo(() => {
    const appsByDomain: Record<string, any[]> = {};
    domainOrder.forEach(d => { appsByDomain[d] = (apps as any[]).filter(a => a.domain_name === d); });
    const totalApps = (apps as any[]).length;
    const totalGap = DOM_GAP * Math.max(0, domainOrder.length - 1);
    const available = 1 - totalGap;
    const sections: { domain: string; tStart: number; tEnd: number; color: string }[] = [];
    let t = 0;
    domainOrder.forEach((d, i) => {
      const share = (appsByDomain[d].length / totalApps) * available;
      sections.push({ domain: d, tStart: t, tEnd: t + share, color: domainColorMap[d] || "#999" });
      t += share + (i < domainOrder.length - 1 ? DOM_GAP : 0);
    });
    return sections;
  }, [domainOrder, apps, domainColorMap]);

  const upstreamMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    graph.edges.forEach(e => { if (!m[e.target]) m[e.target] = []; m[e.target].push(e.source); });
    return m;
  }, [graph.edges]);

  const pNodes = useMemo(() => {
    const out: PNode[] = [];
    const domainIdx = new Map(domainSections.map((s, i) => [s.domain, i]));
    const placedMap = new Map<string, { x: number; y: number }>();

    for (const type of ["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const) {
      const arcR = cfg.radii[type];
      const baseBr = cfg.bubbleR[type];
      const bScale = type === "BUSINESS" ? cfg.bizBubbleScale : type === "CONSUMER_ALIGNED" ? cfg.conBubbleScale : 1;
      let layer = graph.nodes.filter(n => n.productType === type);

      if (cfg.sortMode === "upstream" && type !== "SOURCE_ALIGNED") {
        layer = layer.sort((na, nb) => {
          const upsA = upstreamMap[na.id] || [];
          const upsB = upstreamMap[nb.id] || [];
          const avgT = (ids: string[]) => {
            if (!ids.length) return 0.5;
            let sum = 0, cnt = 0;
            for (const uid of ids) {
              const pos = placedMap.get(uid);
              if (pos) {
                const ang = Math.atan2(pos.y - cfg.cy, pos.x - cfg.cx);
                sum += ang; cnt++;
              }
            }
            return cnt > 0 ? sum / cnt : 0.5;
          };
          return avgT(upsA) - avgT(upsB);
        });
      } else {
        layer = layer.sort((a, b) => (domainIdx.get(a.domainName) ?? 99) - (domainIdx.get(b.domainName) ?? 99));
      }

      const bubbleRadius = (n: GNode) => {
        if (type === "SOURCE_ALIGNED") return Math.round(cfg.uniformSrcR);
        const ups = (upstreamMap[n.id] || []).length;
        if (cfg.bubbleSizeMode === "upstream") {
          const raw = ups <= 1 ? Math.max(baseBr, 14) : ups <= 3 ? Math.max(baseBr, 18) : ups <= 5 ? Math.max(baseBr, 22) : Math.max(baseBr, 26);
          return Math.round(raw * bScale);
        }
        if (type === "BUSINESS") return Math.round(cfg.uniformBizR * bScale);
        return Math.round(cfg.uniformConR * bScale);
      };

      if (cfg.equalSpread) {
        const pad = 0.04;
        const count = layer.length;
        layer.forEach((n, i) => {
          const t = count === 1 ? 0.5 : pad + (i / (count - 1)) * (1 - 2 * pad);
          const [x, y] = _arc(arcR, t);
          const ups = upstreamMap[n.id] || [];
          out.push({ ...n, x, y, r: bubbleRadius(n), upstreamIds: ups });
          placedMap.set(n.id, { x, y });
        });
      } else {
        const minGap = cfg.bubbleGap;
        const placedIds = new Set<string>();
        const placeItemsOnRange = (items: GNode[], tStart: number, tEnd: number) => {
          if (!items.length) return;
          const radii = items.map(n => bubbleRadius(n));
          const totalNeeded = radii.reduce((s, r, i) => s + r * 2 + (i < radii.length - 1 ? minGap : 0), 0);
          const arcLen = arcR * Math.abs(tToAngle(tStart, cfg.pad) - tToAngle(tEnd, cfg.pad));
          const scale = arcLen > 0 && totalNeeded > arcLen * 0.9 ? (arcLen * 0.9) / totalNeeded : 1;
          let cursor = 0;
          const tPositions: number[] = [];
          items.forEach((_, i) => {
            const br = radii[i] * scale;
            cursor += br;
            const frac = items.length === 1 ? 0.5 : cursor / (totalNeeded * scale);
            tPositions.push(tStart + (tEnd - tStart) * (0.05 + frac * 0.9));
            cursor += br + (i < items.length - 1 ? minGap * scale : 0);
          });
          items.forEach((n, i) => {
            const [x, y] = _arc(arcR, tPositions[i]);
            const ups = upstreamMap[n.id] || [];
            out.push({ ...n, x, y, r: radii[i], upstreamIds: ups });
            placedMap.set(n.id, { x, y });
            placedIds.add(n.id);
          });
        };

        for (const sec of domainSections) {
          const items = layer.filter(n => !placedIds.has(n.id) && n.domainName === sec.domain);
          placeItemsOnRange(items, sec.tStart, sec.tEnd);
        }

        const remaining = layer.filter(n => !placedIds.has(n.id));
        placeItemsOnRange(remaining, 0.02, 0.98);
      }
    }
    return out;
  }, [graph.nodes, domainSections, cfg.radii, cfg.bubbleR, _arc, upstreamMap, cfg.pad, cfg.bizBubbleScale, cfg.conBubbleScale, cfg.bubbleGap, cfg.equalSpread, cfg.uniformSrcR, cfg.uniformBizR, cfg.uniformConR, cfg.bubbleSizeMode, cfg.cx, cfg.cy, cfg.sortMode]);
  const pMap = useMemo(() => new Map(pNodes.map(n => [n.id, n])), [pNodes]);

  const clusters = useMemo<DCluster[]>(() => {
    const r = cfg.radii.APPS;
    return domainSections.map(sec => {
      const domainApps = (apps as any[]).filter(a => a.domain_name === sec.domain);
      if (!domainApps.length) return null;
      const midT = (sec.tStart + sec.tEnd) / 2;
      const [cx, cy] = _arc(r, midT);
      const typeMap = new Map<string, any[]>();
      domainApps.forEach(a => { if (!typeMap.has(a.app_type)) typeMap.set(a.app_type, []); typeMap.get(a.app_type)!.push(a); });
      const rawGroups = [...typeMap.entries()].sort((a, b) => b[1].length - a[1].length)
        .map(([type, items]) => ({ type, color: cfg.appTypeColors[type] || "#94a3b8", apps: items, r: typeGroupR(items.length) }));
      let packed: { type: string; color: string; apps: any[]; r: number; cx: number; cy: number }[];
      let domainRadius: number;
      if (rawGroups.length === 1) { packed = [{ ...rawGroups[0], cx, cy }]; domainRadius = rawGroups[0].r + 8; }
      else {
        const maxR = rawGroups[0].r;
        const ringR = rawGroups.length === 2 ? (rawGroups[0].r + rawGroups[1].r) * 0.55 : rawGroups.length <= 4 ? maxR * 1.05 + rawGroups.length : maxR * 1.2 + rawGroups.length * 1.5;
        packed = rawGroups.map((g, i) => { const angle = (i / rawGroups.length) * Math.PI * 2 - Math.PI / 2; return { ...g, cx: cx + ringR * Math.cos(angle), cy: cy + ringR * Math.sin(angle) }; });
        domainRadius = Math.max(...packed.map(g => Math.sqrt((g.cx - cx) ** 2 + (g.cy - cy) ** 2) + g.r)) + 6;
      }
      const finalGroups: TypeGroup[] = packed.map(g => {
        const dots = dotsInGroup(g.cx, g.cy, g.apps.length, g.r, cfg.appDotR);
        const posApps: PApp[] = g.apps.map((a: any, i: number) => ({ ...a, x: dots[i]?.[0] ?? g.cx, y: dots[i]?.[1] ?? g.cy }));
        return { type: g.type, color: g.color, apps: posApps, cx: g.cx, cy: g.cy, r: g.r };
      });
      return { domain: sec.domain, color: sec.color, cx, cy, radius: domainRadius, groups: finalGroups };
    }).filter(Boolean) as DCluster[];
  }, [domainSections, apps, cfg.radii, cfg.appTypeColors, cfg.appDotR, _arc]);

  const allPosApps = useMemo(() => { const out: PApp[] = []; clusters.forEach(cl => cl.groups.forEach(g => g.apps.forEach(a => out.push(a)))); return out; }, [clusters]);

  const sortedRadii = useMemo(() =>
    [cfg.radii.APPS, cfg.radii.SOURCE_ALIGNED, cfg.radii.BUSINESS, cfg.radii.CONSUMER_ALIGNED].sort((p, q) => p - q),
  [cfg.radii]);

  // Radial top (outward, away from center) and bottom (inward, toward center)
  // These vary with position on the semicircle — on the left edge "top" points left-up, at apex it points straight up, etc.
  const radPt = useCallback((px: number, py: number, r: number, out: boolean): [number, number] => {
    const a = Math.atan2(py - cfg.cy, px - cfg.cx);
    const sign = out ? 1 : -1;
    return [px + sign * Math.cos(a) * r, py + sign * Math.sin(a) * r];
  }, [cfg.cx, cfg.cy]);
  const anchorPt = useCallback((px: number, py: number, r: number, layer: string, dir: "upstream" | "downstream"): [number, number] => {
    const a = Math.atan2(py - cfg.cy, px - cfg.cx);
    const t = cfg.flow.anchor?.[dir]?.[layer];
    const pos = typeof t === "number" ? Math.max(0, Math.min(1, t)) : (dir === "upstream" ? 1 : 0);
    const sign = pos * 2 - 1; // 0 => bottom/inward (-1), 1 => top/outward (+1)
    return [px + sign * Math.cos(a) * r, py + sign * Math.sin(a) * r];
  }, [cfg.cx, cfg.cy, cfg.flow.anchor]);

  const appSourceEdges = useMemo(() => {
    const edges: { id: string; d: string; healthy: boolean; appId: string; productId: string; domain: string }[] = [];
    const appPosMap = new Map(allPosApps.map(a => [a.id, a]));
    const seen = new Set<string>();
    const isArc = cfg.layout !== "horizontal";
    for (const link of appProductLinks) {
      const app = appPosMap.get(link.app_id);
      const prod = pMap.get(link.product_id);
      if (!app || !prod || prod.productType !== "SOURCE_ALIGNED") continue;
      const key = `${link.app_id}-${link.product_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      let d: string;
      if (isArc) {
        // App→Source: configurable radial downstream(APPS) -> upstream(SOURCE)
        const [x1, y1] = anchorPt(app.x, app.y, cfg.appDotR + 2, "APPS", "downstream");
        const [x2, y2] = anchorPt(prod.x, prod.y, prod.r + 2, "SOURCE_ALIGNED", "upstream");
        // CPs at 1/3 and 2/3 interpolated angles on the corridor arc
        const angA = Math.atan2(app.y - cfg.cy, app.x - cfg.cx);
        const angB = Math.atan2(prod.y - cfg.cy, prod.x - cfg.cx);
        let delta = angB - angA;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        const rCorr = cfg.radii.APPS + (cfg.radii.SOURCE_ALIGNED - cfg.radii.APPS) * cfg.flow.noodle.appSourceCorridor;
        const sp = cfg.flow.noodle.appSourceSpread;
        const cp1a = angA + delta * sp;
        const cp2a = angA + delta * (1 - sp);
        d = `M ${x1} ${y1} C ${cfg.cx + rCorr * Math.cos(cp1a)} ${cfg.cy + rCorr * Math.sin(cp1a)}, ${cfg.cx + rCorr * Math.cos(cp2a)} ${cfg.cy + rCorr * Math.sin(cp2a)}, ${x2} ${y2}`;
      } else {
        const goingUp = app.y > prod.y;
        const ay1 = goingUp ? app.y - cfg.appDotR - 1 : app.y + cfg.appDotR + 1;
        const ay2 = goingUp ? prod.y + prod.r + 1 : prod.y - prod.r - 1;
        d = flowCurve(app.x, ay1, prod.x, ay2);
      }
      edges.push({ id: `as-${app.id}-${prod.id}`, d, healthy: app.conn_status === "ACTIVE", appId: app.id, productId: prod.id, domain: app.domain_name });
    }
    return edges;
  }, [allPosApps, pMap, appProductLinks, cfg.appDotR, cfg.layout, cfg.cx, cfg.cy, cfg.radii, cfg.flow.curveTension, cfg.flow.anchor, cfg.flow.noodle.appSourceCorridor, cfg.flow.noodle.appSourceSpread, anchorPt]);

  const lineageEdges = useMemo(() => {
    return graph.edges.map(e => {
      const a = pMap.get(e.source), b = pMap.get(e.target);
      if (!a || !b) return null;
      const sameLayer = a.productType === b.productType;
      const isArc = cfg.layout !== "horizontal";

      if (isArc) {
        const angA = Math.atan2(a.y - cfg.cy, a.x - cfg.cx);
        const angB = Math.atan2(b.y - cfg.cy, b.x - cfg.cx);
        const rA = cfg.radii[a.productType as keyof typeof cfg.radii] || 275;
        const rB = cfg.radii[b.productType as keyof typeof cfg.radii] || 275;
        let delta = angB - angA;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        const at = (t: number) => angA + delta * t;

        if (sameLayer) {
          if (a.productType === "BUSINESS") {
            // BUSINESS->BUSINESS: outer "bowl on table" arc (top -> top).
            const [x1, y1] = radPt(a.x, a.y, a.r + 2, true);
            const [x2, y2] = radPt(b.x, b.y, b.r + 2, true);
            const span = Math.abs(delta);
            const lift = Math.min(
              cfg.flow.noodle.businessBusinessLiftMax,
              cfg.flow.noodle.businessBusinessLiftBase + span * cfg.flow.noodle.businessBusinessLiftScale
            );
            const cpR = rA + lift + Math.max(a.r, b.r) * 0.7;
            const s = span > cfg.flow.noodle.farSpanThreshold ? cfg.flow.noodle.businessBusinessFarSpread : cfg.flow.noodle.businessBusinessNearSpread;
            const cp1a = at(s);
            const cp2a = at(1 - s);
            return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + cpR * Math.cos(cp1a)} ${cfg.cy + cpR * Math.sin(cp1a)}, ${cfg.cx + cpR * Math.cos(cp2a)} ${cfg.cy + cpR * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: b.qualityScore >= 0.76 };
          }
          // Other same-layer links keep inward bottom->bottom routing.
          const [x1, y1] = anchorPt(a.x, a.y, a.r + 2, a.productType, "downstream");
          const [x2, y2] = anchorPt(b.x, b.y, b.r + 2, b.productType, "downstream");
          const innerR = rA === cfg.radii.CONSUMER_ALIGNED ? cfg.radii.BUSINESS
            : rA === cfg.radii.BUSINESS ? cfg.radii.SOURCE_ALIGNED
            : rA === cfg.radii.SOURCE_ALIGNED ? cfg.radii.APPS : rA * 0.5;
          const span = Math.abs(delta);
          const gap = Math.max(12, rA - innerR);
          const pull = Math.min(gap * cfg.flow.noodle.sameLayerGapFactor, cfg.flow.noodle.sameLayerBase + span * cfg.flow.noodle.sameLayerScale);
          const cpR = Math.max(innerR + 6, rA - pull);
          const nearS = cfg.flow.noodle.sameLayerNearSpread;
          const farS = cfg.flow.noodle.sameLayerFarSpread;
          const s = span > cfg.flow.noodle.farSpanThreshold ? farS : nearS;
          const cp1a = at(s);
          const cp2a = at(1 - s);
          return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + cpR * Math.cos(cp1a)} ${cfg.cy + cpR * Math.sin(cp1a)}, ${cfg.cx + cpR * Math.cos(cp2a)} ${cfg.cy + cpR * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: b.qualityScore >= 0.76 };
        }

        const pair = `${a.productType}->${b.productType}`;

        // Source -> Business: bottom of source, top of business
        if (pair === "SOURCE_ALIGNED->BUSINESS") {
          const [x1, y1] = anchorPt(a.x, a.y, a.r + 2, "SOURCE_ALIGNED", "downstream");
          const [x2, y2] = anchorPt(b.x, b.y, b.r + 2, "BUSINESS", "upstream");
          const rCorr = rA + (rB - rA) * cfg.flow.noodle.sourceBusinessCorridor;
          const cp1a = at(0.33);
          const cp2a = at(0.67);
          return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + rCorr * Math.cos(cp1a)} ${cfg.cy + rCorr * Math.sin(cp1a)}, ${cfg.cx + rCorr * Math.cos(cp2a)} ${cfg.cy + rCorr * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: b.qualityScore >= 0.76 };
        }

        // Business -> Consumer: bottom of business, top of consumer.
        // For far links, lift controls above consumer arc so curves follow semicircle
        // and avoid dipping below/crossing consumer products.
        if (pair === "BUSINESS->CONSUMER_ALIGNED") {
          const [x1, y1] = anchorPt(a.x, a.y, a.r + 2, "BUSINESS", "downstream");
          const [x2, y2] = anchorPt(b.x, b.y, b.r + 2, "CONSUMER_ALIGNED", "upstream");
          const span = Math.abs(delta);
          // Push farther links higher so they follow the outer semicircle cleanly.
          const lift = Math.min(cfg.flow.noodle.businessConsumerLiftMax, cfg.flow.noodle.businessConsumerLiftBase + span * cfg.flow.noodle.businessConsumerLiftScale);
          const rBridge = rB + lift;
          // Wider angular spacing on controls reduces inward cutting for far links.
          const t1 = span > cfg.flow.noodle.farSpanThreshold ? cfg.flow.noodle.businessConsumerFarSpread : cfg.flow.noodle.businessConsumerNearSpread;
          const t2 = 1 - t1;
          const cp1a = at(t1);
          const cp2a = at(t2);
          return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + rBridge * Math.cos(cp1a)} ${cfg.cy + rBridge * Math.sin(cp1a)}, ${cfg.cx + rBridge * Math.cos(cp2a)} ${cfg.cy + rBridge * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: b.qualityScore >= 0.76 };
        }

        // Fallback cross-layer: bottom(inner) -> top(outer)
        const aIsInner = rA < rB;
        const [x1, y1] = radPt(a.x, a.y, a.r + 2, !aIsInner);
        const [x2, y2] = radPt(b.x, b.y, b.r + 2, aIsInner);
        const rCorr = Math.min(rA, rB) + Math.abs(rB - rA) * 0.55;
        const cp1a = at(0.33);
        const cp2a = at(0.67);
        return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + rCorr * Math.cos(cp1a)} ${cfg.cy + rCorr * Math.sin(cp1a)}, ${cfg.cx + rCorr * Math.cos(cp2a)} ${cfg.cy + rCorr * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: b.qualityScore >= 0.76 };
      }

      /* ── Horizontal layout ── */
      if (sameLayer) {
        const layerR = cfg.radii[a.productType as keyof typeof cfg.radii] || 275;
        const idx = sortedRadii.indexOf(layerR);
        const rAbove = idx < sortedRadii.length - 1 ? sortedRadii[idx + 1] : layerR + 120;
        const [, yThis] = _arc(layerR, 0.5);
        const [, yAbove] = _arc(rAbove, 0.5);
        const hGap = Math.abs(yThis - yAbove);
        const dx = Math.abs(b.x - a.x);
        const maxBulge = Math.max(12, hGap * 0.4);
        const bulge = Math.min(Math.max(10, dx * 0.18), maxBulge);
        const y1 = a.y - a.r - 1, y2 = b.y - b.r - 1;
        const cpy = Math.min(y1, y2) - bulge;
        return { ...e, a, b, d: `M ${a.x} ${y1} Q ${(a.x + b.x) / 2} ${cpy}, ${b.x} ${y2}`, healthy: b.qualityScore >= 0.76 };
      }

      const goingUp = a.y > b.y;
      const y1 = goingUp ? a.y - a.r - 1 : a.y + a.r + 1;
      const y2 = goingUp ? b.y + b.r + 1 : b.y - b.r - 1;
      return { ...e, a, b, d: flowCurve(a.x, y1, b.x, y2), healthy: b.qualityScore >= 0.76 };
    }).filter(Boolean) as (GEdge & { a: PNode; b: PNode; d: string; healthy: boolean })[];
  }, [graph.edges, pMap, cfg.layout, cfg.cx, cfg.cy, cfg.radii, sortedRadii, _arc, cfg.flow.curveTension, cfg.flow.anchor, cfg.flow.noodle, anchorPt]);

  const linked = useMemo(() => {
    if (!sel) return new Set<string>();
    const s = new Set<string>();
    if (sel.kind === "app") {
      s.add(sel.id); const app = allPosApps.find(a => a.id === sel.id); if (app) s.add(`dom-${app.domain_name}`);
      const allAe = appSourceEdges.filter(e => e.appId === sel.id);
      const q: string[] = [];
      for (const ae of allAe) { s.add(ae.id); s.add(ae.productId); q.push(ae.productId); }
      const v = new Set<string>();
      while (q.length) { const p = q.shift()!; if (v.has(p)) continue; v.add(p); lineageEdges.forEach(e => { if (e.source === p) { s.add(`le-${e.id}`); s.add(e.target); q.push(e.target); } }); }
    }
    if (sel.kind === "product") {
      s.add(sel.id); const n = graph.nodes.find(n => n.id === sel.id); if (n) s.add(`dom-${n.domainName}`);
      let q = [sel.id]; let v = new Set<string>(); while (q.length) { const p = q.shift()!; if (v.has(p)) continue; v.add(p); lineageEdges.forEach(e => { if (e.source === p) { s.add(`le-${e.id}`); s.add(e.target); q.push(e.target); } }); }
      q = [sel.id]; v = new Set<string>(); while (q.length) { const p = q.shift()!; if (v.has(p)) continue; v.add(p); lineageEdges.forEach(e => { if (e.target === p) { s.add(`le-${e.id}`); s.add(e.source); q.push(e.source); } }); }
      appSourceEdges.forEach(e => { if (s.has(e.productId)) { s.add(e.id); s.add(e.appId); s.add(`dom-${e.domain}`); } });
    }
    return s;
  }, [sel, lineageEdges, appSourceEdges, graph.nodes, allPosApps]);

  const selProduct = sel?.kind === "product" ? products.find((p: any) => p.id === sel.id) : null;
  const selApp = sel?.kind === "app" ? (apps as any[]).find(a => a.id === sel.id) : null;
  const tuneProducts = useMemo(() => ([...(products as any[])]
    .map((p: any) => ({ id: p.id as string, name: p.name as string, product_type: p.product_type as string }))
    .sort((a, b) => a.name.localeCompare(b.name))), [products]);
  const filteredTuneProducts = useMemo(() => {
    const q = pgProductQuery.trim().toLowerCase();
    if (!q) return tuneProducts;
    return tuneProducts.filter(p => p.name.toLowerCase().includes(q));
  }, [tuneProducts, pgProductQuery]);
  const activeTuneProduct = useMemo(() => {
    if (pgProductId) return (products as any[]).find((p: any) => p.id === pgProductId) || selProduct;
    return selProduct;
  }, [pgProductId, products, selProduct]);
  useEffect(() => {
    if (selProduct?.id) setPgProductId(selProduct.id);
  }, [selProduct?.id]);
  const upstream = useMemo(() => sel?.kind === "product" ? lineageEdges.filter(e => e.target === sel.id).map(e => e.a) : [], [sel, lineageEdges]);
  const downstream = useMemo(() => sel?.kind === "product" ? lineageEdges.filter(e => e.source === sel.id).map(e => e.b) : [], [sel, lineageEdges]);
  const kpi = execKpis ?? overview ?? {};
  const pipelineCounts = useMemo(() => { let a = 0, b = 0, p = 0; (apps as any[]).forEach((x: any) => { if (x.conn_status === "ACTIVE") a++; else if (x.conn_status === "BROKEN") b++; else p++; }); return { active: a, broken: b, paused: p }; }, [apps]);
  const brokenApps = useMemo(() => (apps as any[]).filter((a: any) => a.conn_status === "BROKEN"), [apps]);
  const dqByType = useMemo(() => ({ SOURCE_ALIGNED: deriveQualityMetrics(products.filter((p: any) => p.product_type === "SOURCE_ALIGNED")), BUSINESS: deriveQualityMetrics(products.filter((p: any) => p.product_type === "BUSINESS")), CONSUMER_ALIGNED: deriveQualityMetrics(products.filter((p: any) => p.product_type === "CONSUMER_ALIGNED")) }), [products]);

  const searchLower = search.toLowerCase();
  const searchMatch = (name: string) => !search || name.toLowerCase().includes(searchLower);
  const isDim = (id: string, name: string, domainName?: string) => (search && !searchMatch(name)) || (hovDom != null && domainName != null && domainName !== hovDom) || (sel != null && !linked.has(id));

  function productTip(p: any): ReactNode {
    return (<div className="space-y-1.5">
      <div className="font-bold text-[13px]" style={{ color: cfg.text }}>{p.name}</div>
      <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: cfg.layerColors[p.product_type] + "33", color: cfg.text }}>{LAYER_SHORT[p.product_type]}</span><span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: tierColor(p.tier) + "22", color: tierColor(p.tier) }}>{p.tier}</span></div>
      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color_hex }} /><span className="text-gray-600">{p.domain_name}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Quality</span><span className="font-bold" style={{ color: p.quality_score >= 0.75 ? cfg.green : cfg.red }}>{Math.round(p.quality_score * 100)}%</span></div>
      {p.description && <p className="text-gray-500 text-[10px] leading-[1.5] pt-1 border-t border-gray-100">{p.description.length > 120 ? p.description.slice(0, 118) + "\u2026" : p.description}</p>}
    </div>);
  }
  function appTip(a: any): ReactNode {
    return (<div className="space-y-1.5">
      <div className="font-bold text-[13px]" style={{ color: cfg.text }}>{a.name}</div>
      <div className="text-gray-500 text-[11px]">{a.vendor} · {a.app_type}</div>
      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.appTypeColors[a.app_type] || "#999" }} /><span className="text-gray-600">{a.domain_name}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-bold flex items-center gap-1" style={{ color: a.conn_status === "ACTIVE" ? cfg.green : a.conn_status === "BROKEN" ? cfg.red : "#9ca3af" }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: a.conn_status === "ACTIVE" ? cfg.green : a.conn_status === "BROKEN" ? cfg.red : "#9ca3af" }} />{a.conn_status}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-medium text-gray-700">${a.monthly_cost_usd}/mo</span></div>
    </div>);
  }
  function showTip(e: React.MouseEvent, content: ReactNode) { setTip({ x: e.clientX, y: e.clientY, content }); }
  function hideTip() { setTip(null); }

  const labelPos = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    for (const type of ["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const) {
      if (cfg.layout === "horizontal") {
        const [, ly] = _arc(cfg.radii[type], 0);
        out[type] = { x: 16, y: ly };
      } else {
        const [lx, ly] = _arc(cfg.radii[type], 0);
        out[type] = { x: lx - 12, y: ly };
      }
    }
    return out;
  }, [cfg.radii, _arc, cfg.layout]);
  const appTypes = useMemo(() => { const s = new Set<string>(); (apps as any[]).forEach(a => s.add(a.app_type)); return [...s].sort(); }, [apps]);
  const domainSeparators = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < domainSections.length - 1; i++) {
      const t = domainSections[i].tEnd + DOM_GAP / 2;
      if (cfg.layout === "horizontal") {
        const x = cfg.hPadX + t * (cfg.vw - 2 * cfg.hPadX);
        lines.push({ x1: x, y1: 30, x2: x, y2: cfg.vh - 30 });
      } else {
        const angle = _tToAngle(t);
        const rI = cfg.radii.APPS - 15, rO = cfg.radii.CONSUMER_ALIGNED + 30;
        lines.push({ x1: cfg.cx + rI * Math.cos(angle), y1: cfg.cy - rI * Math.sin(angle), x2: cfg.cx + rO * Math.cos(angle), y2: cfg.cy - rO * Math.sin(angle) });
      }
    }
    return lines;
  }, [domainSections, cfg.cx, cfg.cy, cfg.radii, _tToAngle, cfg.layout, cfg.vw, cfg.vh, cfg.hPadX]);

  function DQMetricRow({ label, value, desc }: { label: string; value: number; desc: string }) {
    const barColor = value >= 90 ? cfg.green : value >= 75 ? "#dab508" : cfg.red;
    return (<div className="mb-2.5"><div className="flex justify-between mb-0.5"><span className="text-[10px] font-semibold" style={{ color: cfg.text }}>{label}</span><span className="text-[11px] font-bold" style={{ color: barColor }}>{value}%</span></div><div className="h-1.5 rounded-full bg-gray-100"><div className="h-1.5 rounded-full transition-all" style={{ width: `${value}%`, background: barColor }} /></div><span className="text-[8px] text-gray-400">{desc}</span></div>);
  }

  const toggleSection = (s: keyof typeof pgSections) => setPgSections(p => ({ ...p, [s]: !p[s] }));

  const onPgDragStart = useCallback((e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest("[data-pg-handle]");
    if (!el) return;
    e.preventDefault();
    const rect = el.closest("[data-pg-panel]")!.getBoundingClientRect();
    pgDrag.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top, sx: rect.left, sy: rect.top };
    const onMove = (ev: MouseEvent) => {
      if (!pgDrag.current) return;
      setPgPos({ x: ev.clientX - pgDrag.current.ox, y: ev.clientY - pgDrag.current.oy });
    };
    const onUp = () => { pgDrag.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const screenToSvg = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const onLabelDragStart = useCallback((e: React.MouseEvent, productId: string, labelSvgX: number, labelSvgY: number) => {
    e.stopPropagation();
    e.preventDefault();
    const per = cfg.prodLabel.perProduct?.[productId] || { radius: 0, angle: 0, x: 0, y: 0, rotation: 0 };
    const svgPt = screenToSvg(e.clientX, e.clientY);
    const baseLx = labelSvgX - per.x;
    const baseLy = labelSvgY - per.y;
    labelDrag.current = {
      id: productId,
      grabOffsetX: svgPt.x - labelSvgX,
      grabOffsetY: svgPt.y - labelSvgY,
      origPerX: per.x,
      origPerY: per.y,
      baseLx,
      baseLy,
    };
    setDraggingLabelId(productId);

    const onMove = (ev: MouseEvent) => {
      if (!labelDrag.current) return;
      const cur = screenToSvg(ev.clientX, ev.clientY);
      const desiredLx = cur.x - labelDrag.current.grabOffsetX;
      const desiredLy = cur.y - labelDrag.current.grabOffsetY;
      const newPerX = desiredLx - labelDrag.current.baseLx;
      const newPerY = desiredLy - labelDrag.current.baseLy;
      updateCfg(`prodLabel.perProduct.${labelDrag.current.id}.x`, Math.round(newPerX * 10) / 10);
      updateCfg(`prodLabel.perProduct.${labelDrag.current.id}.y`, Math.round(newPerY * 10) / 10);
    };
    const onUp = () => {
      labelDrag.current = null;
      setDraggingLabelId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [screenToSvg, updateCfg, cfg.prodLabel.perProduct]);

  const visibleLabels = useMemo(() => {
    if (!cfg.show.productLabels) return [];
    const pl = cfg.prodLabel;

    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const result: { n: PNode; lx: number; ly: number; fontSize: number; label: string; rot: number; anchor: "start" | "middle" | "end"; stagger: boolean; visible: boolean }[] = [];

    const sourceNodes = pNodes.filter(n => n.productType === "SOURCE_ALIGNED");
    const bizNodes = [...pNodes.filter(n => n.productType === "BUSINESS")];
    const conNodes = [...pNodes.filter(n => n.productType === "CONSUMER_ALIGNED")];

    // --- Source layer: original algorithm (preserves user's manual drag positions) ---
    const srcTypeIdx = { count: 0 };
    for (const n of sourceNodes) {
      const idx = srcTypeIdx.count++;
      const angle = Math.atan2(n.y - cfg.cy, n.x - cfg.cx);
      const per = cfg.prodLabel.perProduct?.[n.id] || { radius: 0, angle: 0, x: 0, y: 0, rotation: 0 };
      const stagger = idx % 2 === 1;
      const labelAngle = angle + ((pl.srcAngle + per.angle) * Math.PI) / 180;
      const offset = n.r + pl.offset + pl.srcOffset + per.radius + (stagger ? pl.staggerGap : 0);
      let lx = n.x + offset * Math.cos(labelAngle);
      let ly = n.y + offset * Math.sin(labelAngle);
      if (cfg.layout === "arc") {
        let nx = Math.sin(labelAngle);
        let ny = -Math.cos(labelAngle);
        if (ny < 0) { nx = -nx; ny = -ny; }
        lx += nx * 5;
        ly += ny * 5;
      }
      lx += pl.xOffset + per.x;
      ly += pl.yOffset + per.y;
      const fontSize = pl.srcSize;
      const label = n.label.length > 12 ? n.label.slice(0, 11) + "\u2026" : n.label;
      const rot = cfg.layout === "arc" ? (labelAngle * 180) / Math.PI + pl.rotation + per.rotation : pl.rotation + per.rotation;
      const w = label.length * fontSize * 0.55;
      const h = fontSize * 1.4;
      let visible = true;
      if (cfg.show.smartLabels) {
        for (const p of placed) {
          if (Math.abs(lx - p.x) < (w + p.w) / 2 && Math.abs(ly - p.y) < (h + p.h) / 2) { visible = false; break; }
        }
      }
      if (visible) placed.push({ x: lx, y: ly, w, h });
      result.push({ n, lx, ly, fontSize, label, rot, anchor: "middle", stagger, visible });
    }

    // --- Business & Consumer: tangent-aligned on a guide arc, matching source style ---
    const arcLabel = (nodes: PNode[], layerKey: string, fontSize: number, maxLen: number, layerOff: number) => {
      const arcR = cfg.radii[layerKey as keyof typeof cfg.radii] ?? 300;
      const guideR = arcR + layerOff + pl.offset + 8;

      for (const n of nodes) {
        const per = cfg.prodLabel.perProduct?.[n.id] || { radius: 0, angle: 0, x: 0, y: 0, rotation: 0 };
        const radAngle = Math.atan2(n.y - cfg.cy, n.x - cfg.cx);
        const labelR = guideR + per.radius;

        if (cfg.layout === "arc") {
          let lx = cfg.cx + labelR * Math.cos(radAngle);
          let ly = cfg.cy + labelR * Math.sin(radAngle);
          lx += pl.xOffset + per.x;
          ly += pl.yOffset + per.y;

          const radDeg = (radAngle * 180) / Math.PI;
          const rot = radDeg + pl.rotation + per.rotation;

          const label = n.label.length > maxLen ? n.label.slice(0, maxLen - 1) + "\u2026" : n.label;
          const w = label.length * fontSize * 0.55;
          const h = fontSize * 1.4;
          let visible = true;
          if (cfg.show.smartLabels) {
            for (const p of placed) {
              if (Math.abs(lx - p.x) < (w + p.w) / 2 && Math.abs(ly - p.y) < (h + p.h) / 2) { visible = false; break; }
            }
          }
          if (visible) placed.push({ x: lx, y: ly, w, h });
          result.push({ n, lx, ly, fontSize, label, rot, anchor: "middle", stagger: false, visible });
        } else {
          const labelAngle = radAngle + ((per.angle) * Math.PI) / 180;
          const offset = n.r + pl.offset + layerOff + per.radius;
          let lx = n.x + offset * Math.cos(labelAngle) + pl.xOffset + per.x;
          let ly = n.y + offset * Math.sin(labelAngle) + pl.yOffset + per.y;
          const label = n.label.length > maxLen ? n.label.slice(0, maxLen - 1) + "\u2026" : n.label;
          const rot = pl.rotation + per.rotation;
          const w = label.length * fontSize * 0.55;
          const h = fontSize * 1.4;
          let visible = true;
          if (cfg.show.smartLabels) {
            for (const p of placed) {
              if (Math.abs(lx - p.x) < (w + p.w) / 2 && Math.abs(ly - p.y) < (h + p.h) / 2) { visible = false; break; }
            }
          }
          if (visible) placed.push({ x: lx, y: ly, w, h });
          result.push({ n, lx, ly, fontSize, label, rot, anchor: "middle", stagger: false, visible });
        }
      }
    };

    arcLabel(bizNodes, "BUSINESS", pl.bizSize, 18, pl.bizOffset);
    arcLabel(conNodes, "CONSUMER_ALIGNED", pl.conSize, 22, pl.conOffset);

    return result;
  }, [pNodes, cfg.show.productLabels, cfg.show.smartLabels, cfg.prodLabel, cfg.cy, cfg.cx, cfg.layout, cfg.radii]);

  const bdr = cfg.paneBorder;

  return (
    <div className="min-h-screen pt-[64px]" style={{ background: cfg.bg }}>
      <div className="h-[calc(100vh-64px)] flex min-w-[1024px] gap-0" style={{ background: cfg.bg, padding: `${bdr.padTop}px ${bdr.padSide}px ${bdr.padBottom}px ${bdr.padSide}px` }}>

        {/* LEFT: SVG Canvas */}
        <div className="flex-1 min-w-0 relative overflow-hidden p-3" style={{ background: cfg.bg, border: `${bdr.width}px solid ${bdr.color}`, borderRadius: `${bdr.radius}px 0 0 ${bdr.radius}px`, borderRight: "none" }} onClick={() => setSel(null)}>

          {cfg.show.searchBar && <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, applications..."
                className="w-[360px] pl-10 pr-4 py-2.5 rounded-full bg-white/95 border border-gray-200 text-[13px] text-gray-700 placeholder:text-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200" />
              {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-[15px]">&times;</button>}
            </div>
          </div>}

          <svg ref={svgRef} viewBox={`0 0 ${cfg.vw} ${cfg.vh}`} className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)]" preserveAspectRatio="xMidYMid meet">
            <defs>
              <style>{`
@keyframes flowAlong{to{stroke-dashoffset:-16}}
.fl{stroke-dasharray:3 13;animation:flowAlong 2s linear infinite}
.fl-fast{stroke-dasharray:2 10;animation:flowAlong 1s linear infinite}
@keyframes murmurDrift{
  0%{transform:translate(0,0)}
  25%{transform:translate(1.5px,-2px)}
  50%{transform:translate(-1px,1.5px)}
  75%{transform:translate(2px,1px)}
  100%{transform:translate(0,0)}
}
@keyframes murmurGlow{
  0%,100%{filter:drop-shadow(0 0 2px currentColor) drop-shadow(0 0 0px currentColor)}
  50%{filter:drop-shadow(0 0 6px currentColor) drop-shadow(0 0 12px currentColor)}
}
@keyframes murmurPulse{
  0%,100%{stroke-opacity:0.9;stroke-width:2.5px}
  50%{stroke-opacity:0.4;stroke-width:1.5px}
}
@keyframes dimShrink{
  from{opacity:1;transform:scale(1)}
  to{opacity:0.08;transform:scale(0.92)}
}
.murmur-node{animation:murmurDrift 3s ease-in-out infinite,murmurGlow 2.5s ease-in-out infinite}
.murmur-line{animation:murmurPulse 1.8s ease-in-out infinite}
.dim-out{animation:dimShrink 0.5s ease-out forwards}
`}</style>
              <marker id="arrowIn" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={cfg.text} opacity="0.3" /></marker>
            </defs>

            {cfg.show.arcBands && (["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const).map(type => (
              <g key={`band-${type}`}>
                <path d={_arcPath(cfg.radii[type])} fill="none" stroke={cfg.layerColors[type]} strokeWidth={type === "APPS" ? cfg.arcBand.width * 1.8 : cfg.arcBand.width} opacity={cfg.arcBand.opacity} strokeLinecap="round" />
                <path d={_arcPath(cfg.radii[type])} fill="none" stroke={cfg.layerColors[type]} strokeWidth={1} opacity={cfg.arcBand.opacity * 3} />
              </g>
            ))}

            {cfg.show.separators && domainSeparators.map((l, i) => <line key={`sep-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={cfg.separator.color} strokeWidth={cfg.separator.width} opacity={cfg.separator.opacity} strokeDasharray={`${cfg.separator.dash} ${Math.max(1, cfg.separator.dash - 1)}`} />)}

            {cfg.show.layerLabels && (["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const).map(type => {
              const lp = labelPos[type];
              const ox = cfg.typoOffset.layerX, oy = cfg.typoOffset.layerY;
              return (<g key={`lbl-${type}`}>
                <circle cx={(isH ? lp.x + 4 : lp.x + 4) + ox} cy={lp.y + oy} r={3.5} fill={cfg.layerColors[type]} opacity={0.7} />
                <text x={(isH ? lp.x + 12 : lp.x - 4) + ox} y={lp.y + 3.5 + oy} textAnchor={isH ? "start" : "end"} fill={cfg.text} fontSize={cfg.labelSize} fontWeight={cfg.labelWeight} letterSpacing="0.04em" opacity={cfg.labelOpacity}>{LAYER_LABEL[type].toUpperCase()}</text>
              </g>);
            })}

            {cfg.show.dataFlowArrow && (() => {
              const ax = cfg.vw - cfg.arrowX;
              const ay = cfg.arrowY;
              const [, conY] = _arc(cfg.radii.CONSUMER_ALIGNED, 0.5);
              const [, appY] = _arc(cfg.radii.APPS, 0.5);
              const topY = Math.min(appY, conY) + ay;
              const botY = Math.max(appY, conY) + ay;
              const labelY = botY + 14;
              return (<g opacity={0.2}>
                <path d={`M ${ax} ${botY} L ${ax} ${topY}`} fill="none" stroke={cfg.text} strokeWidth={1.5} markerEnd="url(#arrowIn)" />
                <text x={ax} y={labelY} textAnchor="middle" fill={cfg.text} fontSize={7} fontWeight={700} letterSpacing="0.1em">DATA FLOW</text>
              </g>);
            })()}

            {clusters.map(cl => {
              const clDim = (sel && !linked.has(`dom-${cl.domain}`)) || (hovDom != null && hovDom !== cl.domain);
              const isHov = hovDom === cl.domain;
              return (<g key={cl.domain} className={clDim && sel ? "dim-out" : ""} opacity={clDim && !sel ? 0.12 : 1} style={{ transition: "opacity 0.4s ease-out" }}>
                <circle cx={cl.cx} cy={cl.cy} r={cl.radius} fill={cl.color} fillOpacity={isHov ? cfg.domainBubbleOpacity + 0.08 : cfg.domainBubbleOpacity} stroke={cl.color} strokeWidth={isHov ? 2 : 1.2} strokeOpacity={isHov ? 0.5 : 0.25} />
                {cl.groups.map(g => {
                  return (<g key={g.type}>
                  <circle cx={g.cx} cy={g.cy} r={g.r} fill={g.color} fillOpacity={cfg.groupBubbleOpacity} stroke={g.color} strokeWidth={0.8} strokeOpacity={0.45} />
                  {g.apps.map(a => { const isSel = sel?.kind === "app" && sel.id === a.id; const appDim = isDim(a.id, a.name, a.domain_name); return (<g key={a.id} style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); setSel(isSel ? null : { kind: "app", id: a.id }); }} onMouseEnter={e => showTip(e, appTip(a))} onMouseLeave={hideTip}>
                    {isSel && <circle cx={a.x} cy={a.y} r={cfg.appDotR + 4} fill="none" stroke={cfg.layerColors.APPS} strokeWidth={1.5}><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" /></circle>}
                    <circle cx={a.x} cy={a.y} r={cfg.appDotR} fill={appDim ? "#d1d5db" : g.color} stroke={cfg.bg} strokeWidth={0.5} opacity={appDim ? 0.25 : 1} style={{ transition: "all 0.2s" }} />
                  </g>); })}
                </g>);
                })}
                {cfg.show.domainNames && (() => {
                  const domMidT = domainSections.find(s => s.domain === cl.domain);
                  const midT = domMidT ? (domMidT.tStart + domMidT.tEnd) / 2 : 0.5;
                  const [labelX, bandY] = _arc(cfg.radii.APPS, midT);
                  const labelY = bandY + 14;
                  return (<>
                    <text x={labelX + cfg.typoOffset.domainX} y={labelY + cfg.typoOffset.domainY} textAnchor="middle" fill={cfg.text} fontSize={cfg.domainNameSize} fontWeight={cfg.labelWeight} opacity={0.55}>{cl.domain}</text>
                    <text x={labelX + cfg.typoOffset.domainX} y={labelY + 10 + cfg.typoOffset.domainY} textAnchor="middle" fill={cfg.text} fontSize={7} fontWeight={500} opacity={0.3}>{cl.groups.length} types · {cl.groups.reduce((s, g) => s + g.apps.length, 0)} apps</text>
                  </>);
                })()}
              </g>);
            })}

            {/* Product bubbles with nested upstream dots */}
            {pNodes.map(n => {
              const isSel = sel?.kind === "product" && sel.id === n.id;
              const isLinked = sel != null && linked.has(n.id);
              const dim = isDim(n.id, n.label, n.domainName);
              const p = products.find((pp: any) => pp.id === n.id);
              const isSource = n.productType === "SOURCE_ALIGNED";
              const linkedApp = isSource ? appProductLinks.find(l => l.product_id === n.id) : null;
              const hasInner = isSource ? !!linkedApp : (n.upstreamIds || []).length > 0;
              const murmur = sel != null && isLinked && !isSel;
              const layerCol = cfg.layerColors[n.productType] || "#999";
              return (
                <g key={n.id}
                  className={murmur ? "murmur-node" : dim && sel ? "dim-out" : ""}
                  style={{ cursor: "pointer", transformOrigin: `${n.x}px ${n.y}px`, color: layerCol, animationDelay: murmur ? `${(n.x * 7 + n.y * 3) % 2000}ms` : undefined }}
                  onClick={e => { e.stopPropagation(); setSel(isSel ? null : { kind: "product", id: n.id }); }}
                  onMouseEnter={e => p && showTip(e, productTip(p))} onMouseLeave={hideTip}>
                  {isSel && <circle cx={n.x} cy={n.y} r={n.r + 5} fill="none" stroke={cfg.layerColors.APPS} strokeWidth={1.5}><animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" /></circle>}
                  <circle cx={n.x} cy={n.y} r={n.r}
                    fill={dim ? "#d1d5db" : layerCol}
                    fillOpacity={hasInner ? (cfg.outerBubbleOpacity[n.productType] ?? 0.15) : 1}
                    stroke={isSel ? cfg.layerColors.APPS : hasInner ? layerCol : cfg.bg}
                    strokeWidth={isSel ? 2 : hasInner ? 1 : 0.8}
                    strokeOpacity={hasInner ? 0.5 : 1}
                    opacity={dim && !sel ? 0.2 : 1}
                    style={!murmur && !(dim && sel) ? { transition: "all 0.4s ease-out" } : undefined} />
                  {hasInner && !dim && (() => {
                    if (isSource) {
                      return <circle cx={n.x} cy={n.y} r={cfg.innerDotR} fill={cfg.layerColors.APPS} opacity={0.85} stroke="white" strokeWidth={0.5} />;
                    }
                    const upLayer = n.productType === "BUSINESS" ? "SOURCE_ALIGNED" : "BUSINESS"; const dotR = cfg.innerDotR; const ups = n.upstreamIds || []; const dots = dotsInGroup(n.x, n.y, ups.length, n.r, dotR); return ups.map((uid, i) => <circle key={uid} cx={dots[i]?.[0] ?? n.x} cy={dots[i]?.[1] ?? n.y} r={dotR} fill={cfg.layerColors[upLayer]} opacity={0.75} stroke="white" strokeWidth={0.5} />);
                  })()}
                </g>
              );
            })}

            {/* Flow lines — rendered after bubbles so they're always visible */}
            {appSourceEdges.map(e => {
              const hi = sel ? linked.has(e.id) : false;
              const dim = sel && !hi;
              const op = dim ? 0.02 : hi ? 0.7 : cfg.flow.opacity;
              const w = hi ? cfg.flow.highlightWidth : cfg.flow.width;
              const col = e.healthy ? cfg.green : cfg.red;
              return (<g key={e.id} style={dim ? { transition: "opacity 0.5s ease-out" } : undefined}>
                <path d={e.d} fill="none" stroke={col} strokeWidth={w} opacity={op} strokeLinecap="round" />
                {hi && <path d={e.d} fill="none" stroke={col} strokeWidth={w + 0.5} opacity={0.9} className={cfg.show.flowAnimation ? "fl-fast" : "murmur-line"} />}
              </g>);
            })}

            {lineageEdges.map(e => {
              const hi = sel ? linked.has(`le-${e.id}`) : false;
              const dim = sel && !hi;
              const op = dim ? 0.02 : hi ? 0.7 : cfg.flow.opacity;
              const w = hi ? cfg.flow.highlightWidth : cfg.flow.width;
              const col = e.healthy ? cfg.green : cfg.red;
              return (<g key={e.id} style={dim ? { transition: "opacity 0.5s ease-out" } : undefined}>
                <path d={e.d} fill="none" stroke={col} strokeWidth={w} opacity={op} strokeLinecap="round" />
                {hi && <path d={e.d} fill="none" stroke={col} strokeWidth={w + 0.5} opacity={0.9} className={cfg.show.flowAnimation ? "fl-fast" : "murmur-line"} />}
              </g>);
            })}

            {/* Product labels — draggable */}
            {visibleLabels.map(item => {
              const dim = isDim(item.n.id, item.n.label, item.n.domainName);
              if (!item.visible) return null;
              const pl = cfg.prodLabel;
              const isDragging = draggingLabelId === item.n.id;
              const isLinkedLabel = sel != null && linked.has(item.n.id);
              return (
                <g key={`plbl-${item.n.id}`} className={dim && sel && !isLinkedLabel ? "dim-out" : ""} opacity={dim && !sel ? 0.05 : 1} style={{ transition: isDragging ? "none" : "opacity 0.4s ease-out", cursor: isDragging ? "grabbing" : "grab" }} onMouseDown={e => onLabelDragStart(e, item.n.id, item.lx, item.ly)}>
                  {item.stagger && <line x1={item.n.x + item.n.r * Math.cos(Math.atan2(item.n.y - cfg.cy, item.n.x - cfg.cx))} y1={item.n.y + item.n.r * Math.sin(Math.atan2(item.n.y - cfg.cy, item.n.x - cfg.cx))} x2={item.lx} y2={item.ly} stroke={cfg.text} strokeWidth={0.3} opacity={0.15} strokeDasharray="1 1" />}
                  <text x={item.lx} y={item.ly} textAnchor={item.anchor} dominantBaseline="central" fill={isDragging ? cfg.layerColors.APPS : cfg.text} fontSize={item.fontSize} fontWeight={isDragging ? 600 : 400} opacity={pl.opacity} transform={item.rot !== 0 ? `rotate(${item.rot}, ${item.lx}, ${item.ly})` : undefined}>{item.label}</text>
                </g>
              );
            })}

            {cfg.show.domainLegend && domainOrder.map((name, i) => { const sp = 140; const totalW = domainOrder.length * sp; const sx = (cfg.vw - totalW) / 2; const col = domainColorMap[name] || "#999"; return (<g key={name} transform={`translate(${sx + i * sp + cfg.typoOffset.legendX}, ${cfg.vh - 28 + cfg.typoOffset.legendY})`} style={{ cursor: "pointer" }} onMouseEnter={() => setHD(name)} onMouseLeave={() => setHD(null)}><circle cx={0} cy={0} r={4.5} fill={col} stroke={hovDom === name ? cfg.text : "none"} strokeWidth={1.5} /><text x={10} y={3.5} fill={cfg.text} fontSize={cfg.legendSize} fontWeight={hovDom === name ? 700 : 500} opacity={hovDom === name ? 1 : 0.5}>{name}</text></g>); })}

            {cfg.show.pipelineLegend && <g transform={`translate(${cfg.vw - 115 + cfg.typoOffset.legendX}, ${cfg.vh - 46 + cfg.typoOffset.legendY})`}>
              <line x1={0} x2={18} y1={0} y2={0} stroke={cfg.green} strokeWidth={2} /><text x={22} y={3.5} fill={cfg.text} fontSize={cfg.labelSize} opacity={0.5}>Healthy</text>
              <line x1={0} x2={18} y1={14} y2={14} stroke={cfg.red} strokeWidth={2} /><text x={22} y={17.5} fill={cfg.text} fontSize={cfg.labelSize} opacity={0.5}>Broken</text>
            </g>}

            {cfg.show.pipelineLegend && (() => {
              const types = Object.keys(cfg.appTypeColors);
              const cols = 3;
              const cellW = 68, cellH = 18;
              const sx = 14 + cfg.typoOffset.legendX;
              const sy = cfg.vh - 28 - Math.ceil(types.length / cols) * cellH + cfg.typoOffset.legendY;
              return (<g transform={`translate(${sx},${sy})`}>
                <text x={0} y={-6} fill={cfg.text} fontSize={7} fontWeight={700} opacity={0.35} letterSpacing="0.08em">APP TYPES</text>
                {types.map((type, i) => {
                  const row = Math.floor(i / cols), col = i % cols;
                  const tx = col * cellW + 6, ty = row * cellH + 8;
                  return (<g key={type} transform={`translate(${tx},${ty})`}>
                    <circle r={4} fill={cfg.appTypeColors[type] || "#94a3b8"} stroke={cfg.bg} strokeWidth={0.3} />
                    <text x={8} y={3} fill={cfg.text} fontSize={7} opacity={0.5}>{type}</text>
                  </g>);
                })}
              </g>);
            })()}
          </svg>

          {tip && <div className="fixed z-[200] pointer-events-none" style={{ left: tip.x + 16, top: tip.y - 8, transform: "translateY(-100%)" }}><div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 text-[11px] min-w-[220px] max-w-[280px]">{tip.content}</div></div>}

          {/* ═══ PLAYGROUND GEAR + PANEL ═══ */}
          <button onClick={e => { e.stopPropagation(); setPgOpen(p => !p); }}
            className="absolute bottom-5 right-5 z-30 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-transform"
            style={{ transform: pgOpen ? "rotate(60deg)" : "rotate(0deg)" }} title="Playground Controls">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {pgOpen && (
            <div data-pg-panel className="fixed z-30 w-[300px] max-h-[65vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200"
              style={pgPos ? { left: pgPos.x, top: pgPos.y } : { bottom: 80, right: 20 }}
              onClick={e => e.stopPropagation()}>
              <div className="p-4">
                <div data-pg-handle className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing select-none" onMouseDown={onPgDragStart}>
                  <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg> Playground{layout === "horizontal" ? " — Horizontal" : " — Radial"}</h3>
                  <div className="flex items-center gap-1.5">
                    <button onClick={undoCfg} className="text-[10px] font-medium text-gray-500 hover:text-gray-700 cursor-pointer px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-50 flex items-center gap-1" title="Undo last change"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H12" /><path d="M3 10l4-4M3 10l4 4" /></svg>Undo</button>
                    <button onClick={resetCfg} className="text-[10px] font-medium text-red-500 hover:text-red-700 cursor-pointer px-2 py-0.5 rounded border border-red-200 hover:bg-red-50">Reset</button>
                  </div>
                </div>

                <button onClick={() => toggleSection("display")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Display</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.display ? "\u2212" : "+"}</span>
                </button>
                {pgSections.display && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Layout Mode</div>
                    <div className="flex gap-1 mb-3">
                      {(["arc", "horizontal"] as const).map(m => (
                        <button key={m} onClick={() => setLayout(m)}
                          className={`flex-1 text-[10px] py-1.5 rounded-lg cursor-pointer border font-bold ${layout === m ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                          {m === "arc" ? "Semi-Circle" : "Horizontal"}
                        </button>
                      ))}
                    </div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Show / Hide</div>
                    <ToggleRow label="Product Labels" value={cfg.show.productLabels} onChange={v => updateCfg("show.productLabels", v)} />
                    <ToggleRow label="Smart Labels" value={cfg.show.smartLabels} onChange={v => updateCfg("show.smartLabels", v)} />
                    <ToggleRow label="Layer Labels" value={cfg.show.layerLabels} onChange={v => updateCfg("show.layerLabels", v)} />
                    <ToggleRow label="Domain Names" value={cfg.show.domainNames} onChange={v => updateCfg("show.domainNames", v)} />
                    <ToggleRow label="Domain Legend" value={cfg.show.domainLegend} onChange={v => updateCfg("show.domainLegend", v)} />
                    <ToggleRow label="Pipeline Legend" value={cfg.show.pipelineLegend} onChange={v => updateCfg("show.pipelineLegend", v)} />
                    <ToggleRow label="Data Flow Arrow" value={cfg.show.dataFlowArrow} onChange={v => updateCfg("show.dataFlowArrow", v)} />
                    <ToggleRow label="Domain Separators" value={cfg.show.separators} onChange={v => updateCfg("show.separators", v)} />
                    <ToggleRow label="Arc Bands" value={cfg.show.arcBands} onChange={v => updateCfg("show.arcBands", v)} />
                    <ToggleRow label="Flow Animation" value={cfg.show.flowAnimation} onChange={v => updateCfg("show.flowAnimation", v)} />
                    <ToggleRow label="Search Bar" value={cfg.show.searchBar} onChange={v => updateCfg("show.searchBar", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Separators</div>
                    <ColorRow label="Color" value={cfg.separator.color} onChange={v => updateCfg("separator.color", v)} />
                    <SliderRow label="Opacity" value={cfg.separator.opacity} min={0.01} max={0.5} step={0.01} onChange={v => updateCfg("separator.opacity", v)} />
                    <SliderRow label="Width" value={cfg.separator.width} min={0.2} max={3} step={0.1} onChange={v => updateCfg("separator.width", v)} unit="px" />
                    <SliderRow label="Dash Length" value={cfg.separator.dash} min={1} max={12} step={1} onChange={v => updateCfg("separator.dash", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Arc Bands</div>
                    <SliderRow label="Opacity" value={cfg.arcBand.opacity} min={0.01} max={0.3} step={0.01} onChange={v => updateCfg("arcBand.opacity", v)} />
                    <SliderRow label="Width" value={cfg.arcBand.width} min={10} max={80} step={2} onChange={v => updateCfg("arcBand.width", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Flow Lines</div>
                    <SliderRow label="Line Width" value={cfg.flow.width} min={0.3} max={4} step={0.1} onChange={v => updateCfg("flow.width", v)} unit="px" />
                    <SliderRow label="Opacity" value={cfg.flow.opacity} min={0.05} max={0.8} step={0.05} onChange={v => updateCfg("flow.opacity", v)} />
                    <SliderRow label="Highlight Width" value={cfg.flow.highlightWidth} min={1} max={6} step={0.5} onChange={v => updateCfg("flow.highlightWidth", v)} unit="px" />
                    <SliderRow label="Curve Tension" value={cfg.flow.curveTension} min={0} max={1} step={0.05} onChange={v => updateCfg("flow.curveTension", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Data Flow Arrow</div>
                    <SliderRow label="X Position" value={cfg.arrowX} min={20} max={1100} step={5} onChange={v => updateCfg("arrowX", v)} unit="px" />
                    <SliderRow label="Y Offset" value={cfg.arrowY} min={-200} max={200} step={5} onChange={v => updateCfg("arrowY", v)} unit="px" />
                  </div>
                )}

                <button onClick={() => toggleSection("colors")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Colors</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.colors ? "\u2212" : "+"}</span>
                </button>
                {pgSections.colors && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Layers</div>
                    <ColorRow label="Applications" value={cfg.layerColors.APPS} onChange={v => updateCfg("layerColors.APPS", v)} />
                    <ColorRow label="Source Products" value={cfg.layerColors.SOURCE_ALIGNED} onChange={v => updateCfg("layerColors.SOURCE_ALIGNED", v)} />
                    <ColorRow label="Business Products" value={cfg.layerColors.BUSINESS} onChange={v => updateCfg("layerColors.BUSINESS", v)} />
                    <ColorRow label="Consumer Products" value={cfg.layerColors.CONSUMER_ALIGNED} onChange={v => updateCfg("layerColors.CONSUMER_ALIGNED", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Pipelines</div>
                    <ColorRow label="Healthy" value={cfg.green} onChange={v => updateCfg("green", v)} />
                    <ColorRow label="Broken" value={cfg.red} onChange={v => updateCfg("red", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">General</div>
                    <ColorRow label="Text" value={cfg.text} onChange={v => updateCfg("text", v)} />
                    <ColorRow label="Background" value={cfg.bg} onChange={v => updateCfg("bg", v)} />
                    <ColorRow label="Right Panel" value={cfg.panelBg} onChange={v => updateCfg("panelBg", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Pane Borders</div>
                    <ColorRow label="Border Color" value={cfg.paneBorder.color} onChange={v => updateCfg("paneBorder.color", v)} />
                    <SliderRow label="Border Width" value={cfg.paneBorder.width} min={0} max={4} step={0.5} onChange={v => updateCfg("paneBorder.width", v)} unit="px" />
                    <SliderRow label="Corner Radius" value={cfg.paneBorder.radius} min={0} max={24} step={1} onChange={v => updateCfg("paneBorder.radius", v)} unit="px" />
                    <SliderRow label="Top Padding" value={cfg.paneBorder.padTop} min={0} max={24} step={1} onChange={v => updateCfg("paneBorder.padTop", v)} unit="px" />
                    <SliderRow label="Bottom Padding" value={cfg.paneBorder.padBottom} min={0} max={24} step={1} onChange={v => updateCfg("paneBorder.padBottom", v)} unit="px" />
                    <SliderRow label="Side Padding" value={cfg.paneBorder.padSide} min={0} max={24} step={1} onChange={v => updateCfg("paneBorder.padSide", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Domains</div>
                    {domainOrder.map(name => (
                      <ColorRow key={name} label={name} value={domainColorMap[name] || "#999"} onChange={v => updateCfg(`domainColors.${name}`, v)} />
                    ))}
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">App Types</div>
                    <ColorRow label="All Types" value={Object.values(cfg.appTypeColors)[0] || "#94a3b8"} onChange={v => { Object.keys(cfg.appTypeColors).forEach(t => updateCfg(`appTypeColors.${t}`, v)); }} />
                    <div className="grid grid-cols-2 gap-x-2">
                      {Object.keys(cfg.appTypeColors).map(type => (
                        <ColorRow key={type} label={type} value={cfg.appTypeColors[type]} onChange={v => updateCfg(`appTypeColors.${type}`, v)} />
                      ))}
                    </div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Sync</div>
                    <button onClick={() => {
                      const src = layout === "arc" ? arcCfg : hCfg;
                      const tgt = layout === "arc" ? updateHCfg : updateArcCfg;
                      ["layerColors.APPS","layerColors.SOURCE_ALIGNED","layerColors.BUSINESS","layerColors.CONSUMER_ALIGNED","green","red","text","bg","panelBg","paneBorder.color","paneBorder.width","paneBorder.radius","paneBorder.padTop","paneBorder.padBottom","paneBorder.padSide"].forEach(k => {
                        const keys = k.split("."); let v: any = src; for (const kk of keys) v = v?.[kk]; if (v !== undefined) tgt(k, v);
                      });
                      Object.keys(src.appTypeColors).forEach(t => tgt(`appTypeColors.${t}`, src.appTypeColors[t]));
                      Object.keys(src.domainColors).forEach(d => tgt(`domainColors.${d}`, src.domainColors[d]));
                    }} className="w-full text-[10px] py-1.5 rounded-lg cursor-pointer border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                      Copy Colors → {layout === "arc" ? "Horizontal" : "Radial"}
                    </button>
                  </div>
                )}

                <button onClick={() => toggleSection("layout")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Layout</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.layout ? "\u2212" : "+"}</span>
                </button>
                {pgSections.layout && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Canvas</div>
                    <SliderRow label="View Width" value={cfg.vw} min={800} max={2400} step={50} onChange={v => updateCfg("vw", v)} unit="px" />
                    <SliderRow label="View Height" value={cfg.vh} min={400} max={1600} step={50} onChange={v => updateCfg("vh", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Domain Sort Order</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(["custom", "alpha", "appCount", "upstream"] as const).map(m => (
                        <button key={m} onClick={() => updateCfg("sortMode", m)}
                          className={`text-[9px] py-1 px-2 rounded-lg cursor-pointer border font-bold ${cfg.sortMode === m ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                          {m === "custom" ? "Custom" : m === "alpha" ? "A–Z" : m === "appCount" ? "By App Count" : "By Upstream"}
                        </button>
                      ))}
                    </div>

                    {layout === "arc" && (<>
                      <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Arc — Position & Spread</div>
                      <SliderRow label="Center X" value={cfg.cx} min={100} max={1800} step={10} onChange={v => updateCfg("cx", v)} />
                      <SliderRow label="Center Y" value={cfg.cy} min={200} max={1200} step={5} onChange={v => updateCfg("cy", v)} />
                      <SliderRow label="Arc Spread" value={cfg.pad} min={0} max={0.45} step={0.01} onChange={v => updateCfg("pad", v)} />
                      <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Arc Radii</div>
                      <SliderRow label="Apps" value={cfg.radii.APPS} min={200} max={1200} step={10} onChange={v => updateCfg("radii.APPS", v)} />
                      <SliderRow label="Source" value={cfg.radii.SOURCE_ALIGNED} min={100} max={1000} step={10} onChange={v => updateCfg("radii.SOURCE_ALIGNED", v)} />
                      <SliderRow label="Business" value={cfg.radii.BUSINESS} min={50} max={800} step={10} onChange={v => updateCfg("radii.BUSINESS", v)} />
                      <SliderRow label="Consumer" value={cfg.radii.CONSUMER_ALIGNED} min={30} max={600} step={10} onChange={v => updateCfg("radii.CONSUMER_ALIGNED", v)} />
                    </>)}

                    {layout === "horizontal" && (<>
                      <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Horizontal — Padding</div>
                      <SliderRow label="Pad Left/Right" value={cfg.hPadX} min={10} max={300} step={5} onChange={v => updateCfg("hPadX", v)} unit="px" />
                      <SliderRow label="Pad Top" value={cfg.hPadTop} min={10} max={200} step={5} onChange={v => updateCfg("hPadTop", v)} unit="px" />
                      <SliderRow label="Pad Bottom" value={cfg.hPadBot} min={10} max={200} step={5} onChange={v => updateCfg("hPadBot", v)} unit="px" />
                      <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Layer Spacing (Radii)</div>
                      <SliderRow label="Apps" value={cfg.radii.APPS} min={200} max={1200} step={10} onChange={v => updateCfg("radii.APPS", v)} />
                      <SliderRow label="Source" value={cfg.radii.SOURCE_ALIGNED} min={100} max={1000} step={10} onChange={v => updateCfg("radii.SOURCE_ALIGNED", v)} />
                      <SliderRow label="Business" value={cfg.radii.BUSINESS} min={50} max={800} step={10} onChange={v => updateCfg("radii.BUSINESS", v)} />
                      <SliderRow label="Consumer" value={cfg.radii.CONSUMER_ALIGNED} min={30} max={600} step={10} onChange={v => updateCfg("radii.CONSUMER_ALIGNED", v)} />
                    </>)}

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Bubble Sizes</div>
                    <SliderRow label="App Dot" value={cfg.appDotR} min={2} max={8} step={0.5} onChange={v => updateCfg("appDotR", v)} unit="px" />
                    <SliderRow label="Src Bubble Radius" value={cfg.uniformSrcR} min={6} max={40} step={1} onChange={v => updateCfg("uniformSrcR", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Biz / Consumer Sizing</div>
                    <div className="flex gap-1 mb-2">
                      {(["uniform", "upstream"] as const).map(m => (
                        <button key={m} onClick={() => updateCfg("bubbleSizeMode", m)}
                          className={`flex-1 text-[10px] py-1 rounded-lg cursor-pointer border font-bold ${cfg.bubbleSizeMode === m ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                          {m === "uniform" ? "Uniform" : "By Upstream"}
                        </button>
                      ))}
                    </div>
                    {cfg.bubbleSizeMode === "uniform" && (<>
                      <SliderRow label="Biz Bubble Radius" value={cfg.uniformBizR} min={6} max={40} step={1} onChange={v => updateCfg("uniformBizR", v)} unit="px" />
                      <SliderRow label="Con Bubble Radius" value={cfg.uniformConR} min={6} max={40} step={1} onChange={v => updateCfg("uniformConR", v)} unit="px" />
                    </>)}
                    {cfg.bubbleSizeMode === "upstream" && (<>
                      <SliderRow label="Business Base" value={cfg.bubbleR.BUSINESS} min={4} max={20} step={0.5} onChange={v => updateCfg("bubbleR.BUSINESS", v)} unit="px" />
                      <SliderRow label="Consumer Base" value={cfg.bubbleR.CONSUMER_ALIGNED} min={6} max={24} step={0.5} onChange={v => updateCfg("bubbleR.CONSUMER_ALIGNED", v)} unit="px" />
                    </>)}
                    <SliderRow label="Business Scale" value={cfg.bizBubbleScale} min={0.5} max={3} step={0.1} onChange={v => updateCfg("bizBubbleScale", v)} unit="x" />
                    <SliderRow label="Consumer Scale" value={cfg.conBubbleScale} min={0.5} max={3} step={0.1} onChange={v => updateCfg("conBubbleScale", v)} unit="x" />
                    <SliderRow label="Inner Dot R" value={cfg.innerDotR} min={1} max={8} step={0.5} onChange={v => updateCfg("innerDotR", v)} unit="px" />
                    <SliderRow label="Bubble Gap" value={cfg.bubbleGap} min={0} max={20} step={1} onChange={v => updateCfg("bubbleGap", v)} unit="px" />
                    <ToggleRow label="Equal Spread" value={cfg.equalSpread} onChange={v => updateCfg("equalSpread", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Bubble Opacity</div>
                    <SliderRow label="Domain Bubble" value={cfg.domainBubbleOpacity} min={0} max={0.5} step={0.02} onChange={v => updateCfg("domainBubbleOpacity", v)} />
                    <SliderRow label="App-Type Group" value={cfg.groupBubbleOpacity} min={0} max={0.6} step={0.02} onChange={v => updateCfg("groupBubbleOpacity", v)} />
                    <SliderRow label="Biz Outer Fill" value={cfg.outerBubbleOpacity.BUSINESS ?? 0.15} min={0} max={1} step={0.05} onChange={v => updateCfg("outerBubbleOpacity.BUSINESS", v)} />
                    <SliderRow label="Con Outer Fill" value={cfg.outerBubbleOpacity.CONSUMER_ALIGNED ?? 0.15} min={0} max={1} step={0.05} onChange={v => updateCfg("outerBubbleOpacity.CONSUMER_ALIGNED", v)} />
                    <SliderRow label="Src Outer Fill" value={cfg.outerBubbleOpacity.SOURCE_ALIGNED ?? 1} min={0} max={1} step={0.05} onChange={v => updateCfg("outerBubbleOpacity.SOURCE_ALIGNED", v)} />
                  </div>
                )}

                <button onClick={() => toggleSection("flowLines")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Flow Line Controls</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.flowLines ? "\u2212" : "+"}</span>
                </button>
                {pgSections.flowLines && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Line Style</div>
                    <SliderRow label="Line Width" value={cfg.flow.width} min={0.3} max={4} step={0.1} onChange={v => updateCfg("flow.width", v)} unit="px" />
                    <SliderRow label="Opacity" value={cfg.flow.opacity} min={0.05} max={0.8} step={0.05} onChange={v => updateCfg("flow.opacity", v)} />
                    <SliderRow label="Highlight Width" value={cfg.flow.highlightWidth} min={1} max={6} step={0.5} onChange={v => updateCfg("flow.highlightWidth", v)} unit="px" />
                    <SliderRow label="Curve Tension" value={cfg.flow.curveTension} min={0} max={1} step={0.05} onChange={v => updateCfg("flow.curveTension", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Radial Anchor — Upstream</div>
                    <SliderRow label="Apps" value={cfg.flow.anchor.upstream.APPS} min={0} max={1} step={0.01} onChange={v => updateCfg("flow.anchor.upstream.APPS", v)} />
                    <SliderRow label="Source" value={cfg.flow.anchor.upstream.SOURCE_ALIGNED} min={0} max={1} step={0.01} onChange={v => updateCfg("flow.anchor.upstream.SOURCE_ALIGNED", v)} />
                    <SliderRow label="Business" value={cfg.flow.anchor.upstream.BUSINESS} min={0} max={1} step={0.01} onChange={v => updateCfg("flow.anchor.upstream.BUSINESS", v)} />
                    <SliderRow label="Consumer" value={cfg.flow.anchor.upstream.CONSUMER_ALIGNED} min={0} max={1} step={0.01} onChange={v => updateCfg("flow.anchor.upstream.CONSUMER_ALIGNED", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Radial Anchor — Downstream</div>
                    <SliderRow label="Apps" value={cfg.flow.anchor.downstream.APPS} min={0} max={1} step={0.01} onChange={v => updateCfg("flow.anchor.downstream.APPS", v)} />
                    <SliderRow label="Source" value={cfg.flow.anchor.downstream.SOURCE_ALIGNED} min={0} max={1} step={0.01} onChange={v => updateCfg("flow.anchor.downstream.SOURCE_ALIGNED", v)} />
                    <SliderRow label="Business" value={cfg.flow.anchor.downstream.BUSINESS} min={0} max={1} step={0.01} onChange={v => updateCfg("flow.anchor.downstream.BUSINESS", v)} />
                    <SliderRow label="Consumer" value={cfg.flow.anchor.downstream.CONSUMER_ALIGNED} min={0} max={1} step={0.01} onChange={v => updateCfg("flow.anchor.downstream.CONSUMER_ALIGNED", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Noodle Routing</div>
                    <SliderRow label="App→Source Corridor" value={cfg.flow.noodle.appSourceCorridor} min={0.1} max={0.9} step={0.01} onChange={v => updateCfg("flow.noodle.appSourceCorridor", v)} />
                    <SliderRow label="App→Source Spread" value={cfg.flow.noodle.appSourceSpread} min={0.1} max={0.45} step={0.01} onChange={v => updateCfg("flow.noodle.appSourceSpread", v)} />
                    <SliderRow label="Source→Business Corridor" value={cfg.flow.noodle.sourceBusinessCorridor} min={0.1} max={0.9} step={0.01} onChange={v => updateCfg("flow.noodle.sourceBusinessCorridor", v)} />
                    <SliderRow label="Same-Layer Gap Factor" value={cfg.flow.noodle.sameLayerGapFactor} min={0.1} max={1} step={0.01} onChange={v => updateCfg("flow.noodle.sameLayerGapFactor", v)} />
                    <SliderRow label="Same-Layer Base Pull" value={cfg.flow.noodle.sameLayerBase} min={0} max={80} step={1} onChange={v => updateCfg("flow.noodle.sameLayerBase", v)} unit="px" />
                    <SliderRow label="Same-Layer Span Pull" value={cfg.flow.noodle.sameLayerScale} min={0} max={100} step={1} onChange={v => updateCfg("flow.noodle.sameLayerScale", v)} />
                    <SliderRow label="Same-Layer Near Spread" value={cfg.flow.noodle.sameLayerNearSpread} min={0.1} max={0.45} step={0.01} onChange={v => updateCfg("flow.noodle.sameLayerNearSpread", v)} />
                    <SliderRow label="Same-Layer Far Spread" value={cfg.flow.noodle.sameLayerFarSpread} min={0.05} max={0.4} step={0.01} onChange={v => updateCfg("flow.noodle.sameLayerFarSpread", v)} />
                    <SliderRow label="Far Span Threshold" value={cfg.flow.noodle.farSpanThreshold} min={0.3} max={2.5} step={0.05} onChange={v => updateCfg("flow.noodle.farSpanThreshold", v)} />
                    <SliderRow label="Biz→Biz Lift Base" value={cfg.flow.noodle.businessBusinessLiftBase} min={0} max={180} step={1} onChange={v => updateCfg("flow.noodle.businessBusinessLiftBase", v)} unit="px" />
                    <SliderRow label="Biz→Biz Lift Scale" value={cfg.flow.noodle.businessBusinessLiftScale} min={0} max={180} step={1} onChange={v => updateCfg("flow.noodle.businessBusinessLiftScale", v)} />
                    <SliderRow label="Biz→Biz Lift Max" value={cfg.flow.noodle.businessBusinessLiftMax} min={20} max={260} step={1} onChange={v => updateCfg("flow.noodle.businessBusinessLiftMax", v)} unit="px" />
                    <SliderRow label="Biz→Biz Near Spread" value={cfg.flow.noodle.businessBusinessNearSpread} min={0.1} max={0.45} step={0.01} onChange={v => updateCfg("flow.noodle.businessBusinessNearSpread", v)} />
                    <SliderRow label="Biz→Biz Far Spread" value={cfg.flow.noodle.businessBusinessFarSpread} min={0.05} max={0.4} step={0.01} onChange={v => updateCfg("flow.noodle.businessBusinessFarSpread", v)} />
                    <SliderRow label="Biz→Con Lift Base" value={cfg.flow.noodle.businessConsumerLiftBase} min={0} max={120} step={1} onChange={v => updateCfg("flow.noodle.businessConsumerLiftBase", v)} unit="px" />
                    <SliderRow label="Biz→Con Lift Scale" value={cfg.flow.noodle.businessConsumerLiftScale} min={0} max={120} step={1} onChange={v => updateCfg("flow.noodle.businessConsumerLiftScale", v)} />
                    <SliderRow label="Biz→Con Lift Max" value={cfg.flow.noodle.businessConsumerLiftMax} min={20} max={220} step={1} onChange={v => updateCfg("flow.noodle.businessConsumerLiftMax", v)} unit="px" />
                    <SliderRow label="Biz→Con Near Spread" value={cfg.flow.noodle.businessConsumerNearSpread} min={0.1} max={0.45} step={0.01} onChange={v => updateCfg("flow.noodle.businessConsumerNearSpread", v)} />
                    <SliderRow label="Biz→Con Far Spread" value={cfg.flow.noodle.businessConsumerFarSpread} min={0.05} max={0.4} step={0.01} onChange={v => updateCfg("flow.noodle.businessConsumerFarSpread", v)} />
                  </div>
                )}

                <button onClick={() => toggleSection("typography")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Typography</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.typography ? "\u2212" : "+"}</span>
                </button>
                {pgSections.typography && (
                  <div className="mb-1">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">General</div>
                    <SliderRow label="Layer Label Size" value={cfg.labelSize} min={6} max={14} step={0.5} onChange={v => updateCfg("labelSize", v)} unit="px" />
                    <SliderRow label="Domain Name Size" value={cfg.domainNameSize} min={6} max={14} step={0.5} onChange={v => updateCfg("domainNameSize", v)} unit="px" />
                    <SliderRow label="Legend Font Size" value={cfg.legendSize} min={6} max={14} step={0.5} onChange={v => updateCfg("legendSize", v)} unit="px" />
                    <SliderRow label="Label Opacity" value={cfg.labelOpacity} min={0.1} max={1} step={0.05} onChange={v => updateCfg("labelOpacity", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-1 mb-1.5">Label Weight</div>
                    <div className="flex gap-1 mb-3">
                      {[400, 500, 600, 700, 800].map(w => (
                        <button key={w} onClick={() => updateCfg("labelWeight", w)}
                          className={`flex-1 text-[10px] py-1 rounded cursor-pointer border ${cfg.labelWeight === w ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                          {w}
                        </button>
                      ))}
                    </div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5 pt-2 border-t border-gray-100">Product Labels</div>
                    <SliderRow label="Source Font" value={cfg.prodLabel.srcSize} min={3} max={12} step={0.5} onChange={v => updateCfg("prodLabel.srcSize", v)} unit="px" />
                    <SliderRow label="Business Font" value={cfg.prodLabel.bizSize} min={3} max={12} step={0.5} onChange={v => updateCfg("prodLabel.bizSize", v)} unit="px" />
                    <SliderRow label="Consumer Font" value={cfg.prodLabel.conSize} min={3} max={12} step={0.5} onChange={v => updateCfg("prodLabel.conSize", v)} unit="px" />
                    <SliderRow label="Global Radius Offset" value={cfg.prodLabel.offset} min={0} max={30} step={1} onChange={v => updateCfg("prodLabel.offset", v)} unit="px" />
                    <SliderRow label="Stagger Gap" value={cfg.prodLabel.staggerGap} min={0} max={40} step={1} onChange={v => updateCfg("prodLabel.staggerGap", v)} unit="px" />
                    <SliderRow label="Opacity" value={cfg.prodLabel.opacity} min={0.1} max={1} step={0.05} onChange={v => updateCfg("prodLabel.opacity", v)} />
                    <SliderRow label="Rotation" value={cfg.prodLabel.rotation} min={-90} max={90} step={5} onChange={v => updateCfg("prodLabel.rotation", v)} unit={"\u00b0"} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Radial Position per Layer</div>
                    <SliderRow label="Source Radius" value={cfg.prodLabel.srcOffset} min={0} max={40} step={1} onChange={v => updateCfg("prodLabel.srcOffset", v)} unit="px" />
                    <SliderRow label="Business Radius" value={cfg.prodLabel.bizOffset} min={0} max={40} step={1} onChange={v => updateCfg("prodLabel.bizOffset", v)} unit="px" />
                    <SliderRow label="Consumer Radius" value={cfg.prodLabel.conOffset} min={0} max={40} step={1} onChange={v => updateCfg("prodLabel.conOffset", v)} unit="px" />
                    <SliderRow label="Source Angle" value={cfg.prodLabel.srcAngle} min={-90} max={90} step={1} onChange={v => updateCfg("prodLabel.srcAngle", v)} unit={"\u00b0"} />
                    <SliderRow label="Business Angle" value={cfg.prodLabel.bizAngle} min={-90} max={90} step={1} onChange={v => updateCfg("prodLabel.bizAngle", v)} unit={"\u00b0"} />
                    <SliderRow label="Consumer Angle" value={cfg.prodLabel.conAngle} min={-90} max={90} step={1} onChange={v => updateCfg("prodLabel.conAngle", v)} unit={"\u00b0"} />
                    <SliderRow label="Labels X Offset" value={cfg.prodLabel.xOffset} min={-120} max={120} step={1} onChange={v => updateCfg("prodLabel.xOffset", v)} unit="px" />
                    <SliderRow label="Labels Y Offset" value={cfg.prodLabel.yOffset} min={-120} max={120} step={1} onChange={v => updateCfg("prodLabel.yOffset", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Product Filter (Label Tune)</div>
                    <input
                      type="text"
                      value={pgProductQuery}
                      onChange={e => setPgProductQuery(e.target.value)}
                      placeholder="Filter product..."
                      className="w-full mb-1.5 px-2 py-1.5 rounded border border-gray-200 text-[10px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                    <div className="flex gap-1.5 mb-1.5">
                      <select
                        value={pgProductId}
                        onChange={e => setPgProductId(e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-[10px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        <option value="">Select product...</option>
                        {filteredTuneProducts.slice(0, 200).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (!pgProductId) return;
                          setSel({ kind: "product", id: pgProductId });
                        }}
                        className="px-2 py-1.5 rounded border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        Pick
                      </button>
                    </div>
                    {activeTuneProduct && (
                      <>
                        <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Selected Product Label Tune</div>
                        <div className="text-[10px] font-medium text-gray-500 mb-1 truncate">{activeTuneProduct.name}</div>
                        <SliderRow label="Radius Adj" value={cfg.prodLabel.perProduct?.[activeTuneProduct.id]?.radius ?? 0} min={-40} max={80} step={1} onChange={v => updateCfg(`prodLabel.perProduct.${activeTuneProduct.id}.radius`, v)} unit="px" />
                        <SliderRow label="Angle Adj" value={cfg.prodLabel.perProduct?.[activeTuneProduct.id]?.angle ?? 0} min={-180} max={180} step={1} onChange={v => updateCfg(`prodLabel.perProduct.${activeTuneProduct.id}.angle`, v)} unit={"\u00b0"} />
                        <SliderRow label="X Adj" value={cfg.prodLabel.perProduct?.[activeTuneProduct.id]?.x ?? 0} min={-120} max={120} step={1} onChange={v => updateCfg(`prodLabel.perProduct.${activeTuneProduct.id}.x`, v)} unit="px" />
                        <SliderRow label="Y Adj" value={cfg.prodLabel.perProduct?.[activeTuneProduct.id]?.y ?? 0} min={-120} max={120} step={1} onChange={v => updateCfg(`prodLabel.perProduct.${activeTuneProduct.id}.y`, v)} unit="px" />
                        <SliderRow label="Rotation Adj" value={cfg.prodLabel.perProduct?.[activeTuneProduct.id]?.rotation ?? 0} min={-180} max={180} step={1} onChange={v => updateCfg(`prodLabel.perProduct.${activeTuneProduct.id}.rotation`, v)} unit={"\u00b0"} />
                      </>
                    )}
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5 pt-2 border-t border-gray-100">Layer Label Position</div>
                    <SliderRow label="X Offset" value={cfg.typoOffset.layerX} min={-200} max={200} step={2} onChange={v => updateCfg("typoOffset.layerX", v)} unit="px" />
                    <SliderRow label="Y Offset" value={cfg.typoOffset.layerY} min={-200} max={200} step={2} onChange={v => updateCfg("typoOffset.layerY", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5 pt-2 border-t border-gray-100">Domain Name Position</div>
                    <SliderRow label="X Offset" value={cfg.typoOffset.domainX} min={-200} max={200} step={2} onChange={v => updateCfg("typoOffset.domainX", v)} unit="px" />
                    <SliderRow label="Y Offset" value={cfg.typoOffset.domainY} min={-200} max={200} step={2} onChange={v => updateCfg("typoOffset.domainY", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5 pt-2 border-t border-gray-100">Legend Position</div>
                    <SliderRow label="X Offset" value={cfg.typoOffset.legendX} min={-300} max={300} step={2} onChange={v => updateCfg("typoOffset.legendX", v)} unit="px" />
                    <SliderRow label="Y Offset" value={cfg.typoOffset.legendY} min={-200} max={200} step={2} onChange={v => updateCfg("typoOffset.legendY", v)} unit="px" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT PANEL (420px, always-tabbed) ═══ */}
        <div ref={panelRef} className="w-[420px] shrink-0 overflow-y-auto flex flex-col" style={{ background: cfg.panelBg, border: `${bdr.width}px solid ${bdr.color}`, borderRadius: `0 ${bdr.radius}px ${bdr.radius}px 0` }}>
          {/* Selection header */}
          {(selProduct || selApp) && (
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
              <button onClick={() => setSel(null)} className="text-[11px] font-medium text-gray-400 hover:text-gray-700 mb-2 flex items-center gap-1 cursor-pointer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg> Clear selection</button>
              {selProduct && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{ background: selProduct.color_hex }} /><h2 className="text-[15px] font-bold truncate" style={{ color: cfg.text }}>{selProduct.name}</h2><span className="px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0" style={{ background: cfg.layerColors[selProduct.product_type] + "33", color: cfg.text }}>{LAYER_SHORT[selProduct.product_type]}</span><span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0" style={{ background: tierColor(selProduct.tier) + "22", color: tierColor(selProduct.tier) }}>{selProduct.tier}</span></div>}
              {selApp && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{ background: selApp.color_hex }} /><h2 className="text-[15px] font-bold truncate" style={{ color: cfg.text }}>{selApp.name}</h2><span className="px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0" style={{ background: (cfg.appTypeColors[selApp.app_type] || "#999") + "33", color: cfg.text }}>{selApp.app_type}</span></div>}
            </div>
          )}

          {/* Tab bar — always visible */}
          <div className={`flex border-b border-gray-100 shrink-0 ${!(selProduct || selApp) ? "pt-1" : ""}`}>
            {PANEL_TABS.map(tab => (
              <button key={tab.id} onClick={() => setPanelTab(tab.id)}
                className={`flex-1 py-2.5 text-center cursor-pointer transition-colors ${panelTab === tab.id ? "border-b-2 border-gray-800" : "hover:bg-gray-50"}`}>
                <svg className="w-4 h-4 mx-auto mb-0.5" viewBox="0 0 24 24" fill="none" stroke={panelTab === tab.id ? cfg.text : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon} /></svg>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${panelTab === tab.id ? "text-gray-800" : "text-gray-400"}`}>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            {/* ── TAB: OVERVIEW ── */}
            {panelTab === "overview" && (
              <div>
                {selProduct ? (
                  <>
                    <div className="flex items-center gap-2 mb-3"><span className="text-[12px] text-gray-500">{selProduct.domain_name}</span>{selProduct.owner && <span className="text-[10px] text-gray-400 ml-auto">{selProduct.owner}</span>}</div>
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                      <div className="rounded-xl p-3 bg-gray-50"><div className="text-[18px] font-black" style={{ color: selProduct.quality_score >= 0.75 ? cfg.green : cfg.red }}>{Math.round(selProduct.quality_score * 100)}%</div><div className="text-[8px] font-semibold text-gray-400 uppercase">Quality</div></div>
                      <div className="rounded-xl p-3 bg-gray-50"><div className="text-[18px] font-black" style={{ color: tierColor(selProduct.tier) }}>{selProduct.tier}</div><div className="text-[8px] font-semibold text-gray-400 uppercase">Tier</div></div>
                    </div>
                    {selProduct.sla_freshness && <div className="flex justify-between mb-2 text-[12px]"><span className="text-gray-500">SLA Freshness</span><span className="font-medium" style={{ color: cfg.text }}>{selProduct.sla_freshness}</span></div>}
                    {selProduct.description && <div className="mb-4 pb-4 border-b border-gray-100"><p className="text-[11px] text-gray-600 leading-[1.7]">{selProduct.description}</p></div>}
                    {upstream.length > 0 && <div className="mb-3"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Upstream ({upstream.length})</div>{upstream.map(u => <button key={u.id} onClick={e => { e.stopPropagation(); setSel({ kind: "product", id: u.id }); }} className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.layerColors[u.productType] }} /><span className="text-[10px] font-medium" style={{ color: cfg.text }}>{u.label}</span><span className="text-[8px] text-gray-400 ml-auto">{LAYER_SHORT[u.productType]}</span></button>)}</div>}
                    {downstream.length > 0 && <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Downstream ({downstream.length})</div>{downstream.map(d => <button key={d.id} onClick={e => { e.stopPropagation(); setSel({ kind: "product", id: d.id }); }} className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.layerColors[d.productType] }} /><span className="text-[10px] font-medium" style={{ color: cfg.text }}>{d.label}</span><span className="text-[8px] text-gray-400 ml-auto">{LAYER_SHORT[d.productType]}</span></button>)}</div>}
                  </>
                ) : selApp ? (
                  <>
                    <div className="text-[12px] text-gray-500 mb-3">{selApp.vendor} · {selApp.domain_name}</div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-xl p-2.5 bg-gray-50 text-center"><div className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: selApp.conn_status === "ACTIVE" ? cfg.green : selApp.conn_status === "BROKEN" ? cfg.red : "#9ca3af" }} /><span className="text-[11px] font-bold" style={{ color: selApp.conn_status === "ACTIVE" ? cfg.green : selApp.conn_status === "BROKEN" ? cfg.red : "#9ca3af" }}>{selApp.conn_status}</span></div><div className="text-[7px] font-semibold text-gray-400 uppercase mt-0.5">Status</div></div>
                      <div className="rounded-xl p-2.5 bg-gray-50 text-center"><div className="text-[13px] font-bold" style={{ color: cfg.layerColors.CONSUMER_ALIGNED }}>${selApp.monthly_cost_usd}</div><div className="text-[7px] font-semibold text-gray-400 uppercase mt-0.5">Cost/mo</div></div>
                      <div className="rounded-xl p-2.5 bg-gray-50 text-center"><div className="text-[11px] font-bold" style={{ color: cfg.text }}>{selApp.sync_frequency}</div><div className="text-[7px] font-semibold text-gray-400 uppercase mt-0.5">Sync</div></div>
                    </div>
                    {selApp.description && <p className="text-[11px] text-gray-600 leading-[1.7] mb-4 pb-4 border-b border-gray-100">{selApp.description}</p>}
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Lineage Chain</div>
                    <div className="space-y-1">
                      {appSourceEdges.filter(e => e.appId === selApp.id).map(e => { const prod = pNodes.find(n => n.id === e.productId); return prod ? <button key={prod.id} onClick={ev => { ev.stopPropagation(); setSel({ kind: "product", id: prod.id }); }} className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.layerColors.SOURCE_ALIGNED }} /><span className="text-[10px] font-medium" style={{ color: cfg.text }}>{prod.label}</span><span className="text-[8px] text-gray-400 ml-auto">Source</span></button> : null; })}
                      {[...linked].filter(id => { const n = pMap.get(id); return n && (n.productType === "BUSINESS" || n.productType === "CONSUMER_ALIGNED"); }).map(id => { const node = pMap.get(id)!; return <button key={node.id} onClick={ev => { ev.stopPropagation(); setSel({ kind: "product", id: node.id }); }} className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.layerColors[node.productType] }} /><span className="text-[10px] font-medium" style={{ color: cfg.text }}>{node.label}</span><span className="text-[8px] text-gray-400 ml-auto">{LAYER_SHORT[node.productType]}</span></button>; })}
                    </div>
                  </>
                ) : (() => {
                  const srcCount = products.filter((p: any) => p.product_type === "SOURCE_ALIGNED").length;
                  const bizCount = products.filter((p: any) => p.product_type === "BUSINESS").length;
                  const conCount = products.filter((p: any) => p.product_type === "CONSUMER_ALIGNED").length;
                  const totalProducts = products.length;
                  const avgQuality = totalProducts > 0 ? Math.round(products.reduce((s: number, p: any) => s + (p.quality_score || 0), 0) / totalProducts * 100) : 0;
                  return (
                    <>
                      <h2 className="text-[17px] font-bold mb-0.5" style={{ color: cfg.text }}>MeshAtlas</h2>
                      <p className="text-[11px] text-gray-400 mb-5">Enterprise Data Mesh — Orange Co</p>
                      <div className="grid grid-cols-2 gap-2.5 mb-4">
                        <div className="rounded-xl p-3 bg-gray-50"><div className="text-[20px] font-black" style={{ color: cfg.text }}>{totalProducts}</div><div className="text-[8px] font-semibold text-gray-400 uppercase">Total Products</div></div>
                        <div className="rounded-xl p-3 bg-gray-50"><div className="text-[20px] font-black" style={{ color: cfg.text }}>{domainOrder.length}</div><div className="text-[8px] font-semibold text-gray-400 uppercase">Domains</div></div>
                        <div className="rounded-xl p-3 bg-gray-50"><div className="text-[20px] font-black" style={{ color: avgQuality >= 75 ? cfg.green : cfg.red }}>{avgQuality}%</div><div className="text-[8px] font-semibold text-gray-400 uppercase">Avg Quality</div></div>
                        <div className="rounded-xl p-3 bg-gray-50"><div className="text-[20px] font-black" style={{ color: cfg.text }}>{(apps as any[]).length}</div><div className="text-[8px] font-semibold text-gray-400 uppercase">Applications</div></div>
                      </div>
                      <div className="mb-4"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Products by Layer</div>
                        <div className="flex gap-2">
                          {[{ label: "Source", count: srcCount, color: cfg.layerColors.SOURCE_ALIGNED }, { label: "Business", count: bizCount, color: cfg.layerColors.BUSINESS }, { label: "Consumer", count: conCount, color: cfg.layerColors.CONSUMER_ALIGNED }].map(l => (
                            <div key={l.label} className="flex-1 rounded-xl p-2.5 text-center" style={{ background: l.color + "10" }}>
                              <div className="text-[18px] font-black" style={{ color: l.color }}>{l.count}</div>
                              <div className="text-[7px] font-bold uppercase" style={{ color: l.color }}>{l.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pipeline Status</div>
                        <div className="flex gap-2">
                          <div className="flex-1 rounded-xl p-2.5 text-center bg-green-50"><div className="text-[18px] font-black" style={{ color: cfg.green }}>{pipelineCounts.active}</div><div className="text-[7px] font-bold uppercase" style={{ color: cfg.green }}>Active</div></div>
                          <div className="flex-1 rounded-xl p-2.5 text-center bg-red-50"><div className="text-[18px] font-black" style={{ color: cfg.red }}>{pipelineCounts.broken}</div><div className="text-[7px] font-bold uppercase" style={{ color: cfg.red }}>Broken</div></div>
                          <div className="flex-1 rounded-xl p-2.5 text-center bg-gray-50"><div className="text-[18px] font-black text-gray-400">{pipelineCounts.paused}</div><div className="text-[7px] font-bold text-gray-300 uppercase">Paused</div></div>
                        </div>
                      </div>
                      {brokenApps.length > 0 && (
                        <div><div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Broken Pipelines ({brokenApps.length})</div>
                          <div className="space-y-1">{brokenApps.slice(0, 5).map((a: any) => (
                            <button key={a.id} onClick={ev => { ev.stopPropagation(); setSel({ kind: "app", id: a.id }); }} className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer">
                              <span className="w-2 h-2 rounded-full shrink-0 bg-red-400" />
                              <span className="text-[10px] font-medium flex-1 truncate" style={{ color: cfg.text }}>{a.name}</span>
                              <span className="text-[8px] text-gray-400">{a.domain_name}</span>
                            </button>
                          ))}{brokenApps.length > 5 && <p className="text-[9px] text-gray-400 pl-6">+{brokenApps.length - 5} more</p>}</div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── TAB: DATA QUALITY ── */}
            {panelTab === "quality" && (
              <div>
                {selProduct ? (() => {
                  const base = selProduct.quality_score || 0.8;
                  const offsets: Record<string, number> = { completeness: -5, accuracy: 0, consistency: 3, timeliness: -3, validity: 4, uniqueness: 8 };
                  const selMetrics: Record<string, number> = {};
                  DQ_LABELS.forEach(dq => { selMetrics[dq.key] = Math.round(Math.min(99, Math.max(55, base * 100 + (offsets[dq.key] ?? 0)))); });
                  const avg = Math.round(Object.values(selMetrics).reduce((s, v) => s + v, 0) / 6);
                  const chainNodes = [...linked].map(id => pMap.get(id)).filter(Boolean) as PNode[];
                  const chainProducts = chainNodes.map(n => products.find((p: any) => p.id === n.id)).filter(Boolean) as any[];
                  return (
                    <>
                      <h2 className="text-[14px] font-bold mb-1" style={{ color: cfg.text }}>Quality: {selProduct.name}</h2>
                      <p className="text-[10px] text-gray-400 mb-4">6-dimension assessment</p>
                      <DQHexRadar metrics={selMetrics} size={220} layerColor={cfg.layerColors[selProduct.product_type]} label={LAYER_SHORT[selProduct.product_type]} avgScore={avg} />
                      {chainProducts.length > 1 && (
                        <div className="mt-5 pt-4 border-t border-gray-100">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">End-to-End Quality Chain</div>
                          <div className="space-y-2">
                            {chainProducts.sort((a: any, b: any) => { const order: Record<string, number> = { SOURCE_ALIGNED: 0, BUSINESS: 1, CONSUMER_ALIGNED: 2 }; return (order[a.product_type] ?? 0) - (order[b.product_type] ?? 0); }).map((cp: any) => {
                              const q = Math.round((cp.quality_score || 0) * 100);
                              const isCurrent = cp.id === selProduct.id;
                              return (
                                <div key={cp.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${isCurrent ? "bg-gray-100 ring-1 ring-gray-200" : "bg-gray-50"}`}>
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.layerColors[cp.product_type] }} />
                                  <span className={`text-[10px] flex-1 truncate ${isCurrent ? "font-bold" : "font-medium"}`} style={{ color: cfg.text }}>{cp.name}</span>
                                  <span className="text-[9px] text-gray-400 shrink-0">{LAYER_SHORT[cp.product_type]}</span>
                                  <span className="text-[10px] font-bold shrink-0" style={{ color: q >= 75 ? cfg.green : cfg.red }}>{q}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })(                ) : (() => {
                  const overallMetrics = deriveQualityMetrics(products as any[]);
                  const overallVals = DQ_LABELS.map(d => overallMetrics[d.key] ?? 0);
                  const overallAvg = Math.round(overallVals.reduce((s, v) => s + v, 0) / overallVals.length);
                  return (
                    <>
                      <h2 className="text-[15px] font-bold mb-1" style={{ color: cfg.text }}>Data Quality Overview</h2>
                      <p className="text-[10px] text-gray-400 mb-4">Across all {products.length} data products</p>
                      <DQHexRadar metrics={overallMetrics} size={200} layerColor={cfg.text} label="All Products" avgScore={overallAvg} />
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">How We Measure</div>
                        <div className="space-y-2">
                          {DQ_LABELS.map(dq => {
                            const val = overallMetrics[dq.key] ?? 0;
                            const barColor = val >= 90 ? cfg.green : val >= 75 ? "#dab508" : cfg.red;
                            return (
                              <div key={dq.key}>
                                <div className="flex items-center justify-between mb-0.5"><span className="text-[10px] font-semibold" style={{ color: cfg.text }}>{dq.label}</span><span className="text-[10px] font-bold" style={{ color: barColor }}>{val}%</span></div>
                                <div className="h-1.5 rounded-full bg-gray-100 mb-0.5"><div className="h-1.5 rounded-full transition-all" style={{ width: `${val}%`, background: barColor }} /></div>
                                <p className="text-[8px] text-gray-400">{dq.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quality by Layer</div>
                        {(["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const).map(type => {
                          const metrics = dqByType[type];
                          const vals = DQ_LABELS.map(d => metrics[d.key as keyof typeof metrics] ?? 0);
                          const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
                          return (
                            <div key={type} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 mb-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.layerColors[type] }} />
                              <span className="text-[10px] font-semibold flex-1" style={{ color: cfg.text }}>{LAYER_SHORT[type]}</span>
                              <span className="text-[11px] font-bold" style={{ color: avg >= 75 ? cfg.green : cfg.red }}>{avg}%</span>
                            </div>
                          );
                        })}
                        <p className="text-[9px] text-gray-400 mt-2">Click a product bubble to see its detailed 6-dimension quality breakdown.</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── TAB: LINEAGE ── */}
            {panelTab === "lineage" && (() => {
              if (selProduct || selApp) {
                const chainIds = [...linked].filter(id => !id.startsWith("dom-") && !id.startsWith("as-") && !id.startsWith("le-"));
                const chainProds = chainIds.map(id => { const n = pMap.get(id); return n ? { ...n, prod: products.find((p: any) => p.id === n.id) } : null; }).filter(n => n && n.prod) as (PNode & { prod: any })[];
                const chainAppsArr = chainIds.map(id => allPosApps.find(a => a.id === id)).filter(Boolean) as PApp[];
                const layers = ["APPS", "SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const;
                type LnItem = { id: string; name: string; type: string; quality?: number; status?: string; domCol?: string };
                const layerItems: Record<string, LnItem[]> = {};
                layers.forEach(l => { layerItems[l] = []; });
                chainAppsArr.forEach(a => layerItems.APPS.push({ id: a.id, name: a.name, type: "APPS", status: a.conn_status, domCol: a.color_hex }));
                chainProds.forEach(cp => { layerItems[cp.productType]?.push({ id: cp.id, name: cp.label, type: cp.productType, quality: cp.qualityScore, domCol: domainColorMap[cp.domainName] || "#999" }); });

                const activeLayers = layers.filter(l => layerItems[l].length > 0);
                const totalNodes = activeLayers.reduce((s, l) => s + layerItems[l].length, 0);

                const relevantEdges: { fromId: string; toId: string; healthy: boolean }[] = [];
                appSourceEdges.forEach(e => { if (linked.has(e.id)) relevantEdges.push({ fromId: e.appId, toId: e.productId, healthy: e.healthy }); });
                lineageEdges.forEach(e => { if (linked.has(`le-${e.id}`)) relevantEdges.push({ fromId: e.source, toId: e.target, healthy: e.healthy }); });

                const W = 370;
                const nodeR = 20;
                const layerGapY = 80;
                const nodeGapX = 14;
                const headerH = 20;
                const nodePos: Record<string, { x: number; y: number; col: string }> = {};
                let totalH = 30;
                const layerBands: { l: string; y: number; items: LnItem[] }[] = [];

                activeLayers.forEach((l, li) => {
                  const items = layerItems[l];
                  const col = l === "APPS" ? cfg.layerColors.APPS : cfg.layerColors[l];
                  const y = totalH + headerH + nodeR + 10;
                  const totalRowW = items.length * (nodeR * 2 + nodeGapX) - nodeGapX;
                  const startX = Math.max(nodeR + 4, (W - totalRowW) / 2 + nodeR);
                  items.forEach((n, i) => {
                    nodePos[n.id] = { x: startX + i * (nodeR * 2 + nodeGapX), y, col };
                  });
                  layerBands.push({ l, y: totalH, items });
                  totalH = y + nodeR + 20;
                });

                const blastRadius = selProduct ? (() => {
                  const downIds = new Set<string>();
                  const q = [selProduct.id];
                  const visited = new Set<string>();
                  while (q.length) {
                    const cur = q.shift()!;
                    if (visited.has(cur)) continue;
                    visited.add(cur);
                    lineageEdges.forEach(e => { if (e.source === cur) { downIds.add(e.target); q.push(e.target); } });
                  }
                  const brokenUps = appSourceEdges.filter(e => linked.has(e.id) && !e.healthy);
                  const broken = lineageEdges.filter(e => linked.has(`le-${e.id}`) && !e.healthy);
                  return { downstreamCount: downIds.size, brokenLinks: brokenUps.length + broken.length, affectedProducts: [...downIds].map(id => pMap.get(id)).filter(Boolean) as PNode[] };
                })() : null;

                const svgH = totalH + (blastRadius && blastRadius.brokenLinks > 0 ? 0 : 0);

                return (
                  <div>
                    <h2 className="text-[14px] font-bold mb-1" style={{ color: cfg.text }}>Lineage: {selProduct?.name ?? selApp?.name}</h2>
                    <p className="text-[10px] text-gray-400 mb-3">{totalNodes} nodes across {activeLayers.length} layers</p>
                    <svg width={W} height={svgH} viewBox={`0 0 ${W} ${svgH}`} className="w-full">
                      <defs>
                        <marker id="lnArr" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="6" markerHeight="5" orient="auto"><path d="M0 0L10 4L0 8z" fill="#9ca3af" opacity="0.4" /></marker>
                        <filter id="nodeShadow"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" /></filter>
                      </defs>

                      {layerBands.map(b => {
                        const col = b.l === "APPS" ? cfg.layerColors.APPS : cfg.layerColors[b.l];
                        const bandH = headerH + nodeR * 2 + 30;
                        return (<g key={b.l}>
                          <rect x={6} y={b.y} width={W - 12} height={bandH} rx={10} fill={col} opacity={0.03} stroke={col} strokeWidth={0.5} strokeOpacity={0.08} />
                          <text x={14} y={b.y + 13} fontSize={8} fontWeight={700} fill={col} opacity={0.4} letterSpacing="0.05em">{b.l === "APPS" ? "APPLICATIONS" : (LAYER_SHORT[b.l] || b.l).toUpperCase()}</text>
                        </g>);
                      })}

                      {relevantEdges.map((e, i) => {
                        const a = nodePos[e.fromId], b = nodePos[e.toId];
                        if (!a || !b) return null;
                        const dx = b.x - a.x;
                        const dy = b.y - a.y;
                        const cpOff = Math.min(Math.abs(dx) * 0.4, 60);
                        const d = `M ${a.x} ${a.y + nodeR + 2} C ${a.x + (dx > 0 ? cpOff : -cpOff)} ${a.y + nodeR + dy * 0.4}, ${b.x - (dx > 0 ? cpOff : -cpOff)} ${b.y - nodeR - dy * 0.4}, ${b.x} ${b.y - nodeR - 2}`;
                        return (<g key={i}>
                          <path d={d} fill="none" stroke={e.healthy ? cfg.green : cfg.red} strokeWidth={e.healthy ? 1.5 : 2} opacity={0.25} markerEnd="url(#lnArr)" strokeDasharray={e.healthy ? "none" : "4 3"} />
                          {!e.healthy && <path d={d} fill="none" stroke={cfg.red} strokeWidth={2.5} opacity={0.08} strokeDasharray="4 3" />}
                        </g>);
                      })}

                      {activeLayers.map(l => layerItems[l].map(n => {
                        const pos = nodePos[n.id]; if (!pos) return null;
                        const isSel = (sel?.kind === "product" && sel.id === n.id) || (sel?.kind === "app" && sel.id === n.id);
                        const col = pos.col;
                        const qCol = n.quality != null ? (n.quality >= 0.76 ? cfg.green : cfg.red) : n.status === "ACTIVE" ? cfg.green : cfg.red;
                        const qVal = n.quality != null ? `${Math.round(n.quality * 100)}%` : n.status || "";
                        const displayName = n.name.length > 10 ? n.name.slice(0, 9) + "\u2026" : n.name;
                        return (
                          <g key={n.id} style={{ cursor: "pointer" }} onClick={() => setSel(n.type === "APPS" ? { kind: "app", id: n.id } : { kind: "product", id: n.id })} filter="url(#nodeShadow)">
                            <circle cx={pos.x} cy={pos.y} r={nodeR} fill="white" stroke={col} strokeWidth={isSel ? 2.5 : 1.2} />
                            <circle cx={pos.x} cy={pos.y} r={nodeR - 5} fill={col} opacity={0.12} />
                            <circle cx={pos.x} cy={pos.y} r={5} fill={col} opacity={0.6} />
                            {isSel && <circle cx={pos.x} cy={pos.y} r={nodeR + 4} fill="none" stroke={col} strokeWidth={1.5} strokeDasharray="3 2"><animate attributeName="opacity" values="0.6;0.15;0.6" dur="2s" repeatCount="indefinite" /></circle>}
                            <text x={pos.x} y={pos.y + nodeR + 12} textAnchor="middle" fontSize={7} fontWeight={600} fill={cfg.text} opacity={0.7}>{displayName}</text>
                            <text x={pos.x} y={pos.y + nodeR + 21} textAnchor="middle" fontSize={7} fontWeight={700} fill={qCol}>{qVal}</text>
                          </g>
                        );
                      }))}
                    </svg>

                    {blastRadius && blastRadius.brokenLinks > 0 && (
                      <div className="mt-4 pt-3 border-t border-red-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center"><svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                          <div><div className="text-[11px] font-bold text-red-600">Blast Radius Analysis</div><div className="text-[9px] text-red-400">{blastRadius.brokenLinks} broken link{blastRadius.brokenLinks > 1 ? "s" : ""} detected</div></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="rounded-xl p-2.5 bg-red-50 text-center"><div className="text-[18px] font-black text-red-500">{blastRadius.brokenLinks}</div><div className="text-[7px] font-bold text-red-400 uppercase">Broken Links</div></div>
                          <div className="rounded-xl p-2.5 bg-orange-50 text-center"><div className="text-[18px] font-black text-orange-500">{blastRadius.downstreamCount}</div><div className="text-[7px] font-bold text-orange-400 uppercase">Downstream Affected</div></div>
                        </div>
                        {blastRadius.affectedProducts.length > 0 && (
                          <div><div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1.5">Impacted Products</div>
                            {blastRadius.affectedProducts.slice(0, 6).map(p => (
                              <button key={p.id} onClick={ev => { ev.stopPropagation(); setSel({ kind: "product", id: p.id }); }} className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.layerColors[p.productType] }} />
                                <span className="text-[9px] font-medium flex-1 truncate" style={{ color: cfg.text }}>{p.label}</span>
                                <span className="text-[8px] text-gray-400">{LAYER_SHORT[p.productType]}</span>
                                <span className="text-[8px] font-bold" style={{ color: p.qualityScore >= 0.76 ? cfg.green : cfg.red }}>{Math.round(p.qualityScore * 100)}%</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg className="w-14 h-14 text-gray-200 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="5" cy="4" r="2" /><circle cx="19" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="20" r="2" /><path d="M5 6c0 2 2.5 3 7 6M19 6c0 2-2.5 3-7 6M12 14v4" strokeDasharray="2 1.5" /></svg>
                  <h3 className="text-[14px] font-bold text-gray-400 mb-1">No Selection</h3>
                  <p className="text-[11px] text-gray-300 max-w-[220px]">Click a product or application bubble to explore its data lineage network</p>
                </div>
              );
            })()}

            {/* ── TAB: COST ── */}
            {panelTab === "cost" && (() => {
              const totalCost = (apps as any[]).reduce((s: number, a: any) => s + (a.monthly_cost_usd || 0), 0);
              const costByDomain: Record<string, number> = {};
              (apps as any[]).forEach((a: any) => { costByDomain[a.domain_name] = (costByDomain[a.domain_name] || 0) + (a.monthly_cost_usd || 0); });
              const costByType: Record<string, number> = {};
              (apps as any[]).forEach((a: any) => { costByType[a.app_type] = (costByType[a.app_type] || 0) + (a.monthly_cost_usd || 0); });
              const sortedDomCost = Object.entries(costByDomain).sort((a, b) => b[1] - a[1]);
              const sortedTypeCost = Object.entries(costByType).sort((a, b) => b[1] - a[1]);

              const ingestionCost = totalCost * 0.40;
              const transformCost = totalCost * 0.35;
              const storageCost = totalCost * 0.15;
              const computeCost = totalCost * 0.55;
              const networkCost = totalCost * 0.10;
              const dailyRunCost = totalCost / 30;

              const catData = [
                { label: "Compute", val: computeCost, color: cfg.layerColors.CONSUMER_ALIGNED },
                { label: "Ingestion", val: ingestionCost, color: cfg.layerColors.SOURCE_ALIGNED },
                { label: "Transform", val: transformCost, color: cfg.layerColors.BUSINESS },
                { label: "Storage", val: storageCost, color: "#6b7280" },
                { label: "Network", val: networkCost, color: "#9ca3af" },
              ];
              const catTotal = catData.reduce((s, c) => s + c.val, 0) || 1;

              const months = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];
              const trendBase = totalCost;
              const trendPts = months.map((m, i) => {
                const noise = Math.sin(i * 1.7) * 0.08 + Math.cos(i * 0.9) * 0.05;
                const growth = 1 + (i - 6) * 0.015;
                return { month: m, val: Math.round(trendBase * growth * (1 + noise)) };
              });
              const tMin = Math.min(...trendPts.map(p => p.val)) * 0.92;
              const tMax = Math.max(...trendPts.map(p => p.val)) * 1.08;
              const tW = 360, tH = 100;
              const trendLine = trendPts.map((p, i) => {
                const x = (i / (trendPts.length - 1)) * tW;
                const y = tH - ((p.val - tMin) / (tMax - tMin)) * tH;
                return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
              }).join(" ");
              const trendArea = trendLine + ` L ${tW} ${tH} L 0 ${tH} Z`;

              if (selApp) {
                const appCost = selApp.monthly_cost_usd || 0;
                const appTrend = months.map((m, i) => {
                  const noise = Math.sin(i * 2.1 + (appCost % 7)) * 0.12;
                  const growth = 1 + (i - 6) * 0.02;
                  return { month: m, val: Math.round(appCost * growth * (1 + noise)) };
                });
                const aMin = Math.min(...appTrend.map(p => p.val)) * 0.88;
                const aMax = Math.max(...appTrend.map(p => p.val)) * 1.12 || 1;
                const aLine = appTrend.map((p, i) => {
                  const x = (i / (appTrend.length - 1)) * tW;
                  const y = tH - ((p.val - aMin) / (aMax - aMin)) * tH;
                  return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(" ");
                const aArea = aLine + ` L ${tW} ${tH} L 0 ${tH} Z`;
                return (
                  <div>
                    <h2 className="text-[14px] font-bold mb-1" style={{ color: cfg.text }}>Cost: {selApp.name}</h2>
                    <p className="text-[10px] text-gray-400 mb-3">{selApp.app_type} · {selApp.domain_name}</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-xl p-3 bg-gray-50"><div className="text-[20px] font-black" style={{ color: cfg.layerColors.CONSUMER_ALIGNED }}>${appCost}</div><div className="text-[7px] font-bold text-gray-400 uppercase">Monthly</div></div>
                      <div className="rounded-xl p-3 bg-gray-50"><div className="text-[20px] font-black" style={{ color: cfg.text }}>${(appCost / 30).toFixed(1)}</div><div className="text-[7px] font-bold text-gray-400 uppercase">Daily</div></div>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">12-Month Trend</div>
                    <div className="rounded-xl bg-gray-50 p-3 mb-4">
                      <svg viewBox={`-5 -5 ${tW + 10} ${tH + 24}`} className="w-full">
                        <defs><linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cfg.layerColors.CONSUMER_ALIGNED} stopOpacity="0.25" /><stop offset="100%" stopColor={cfg.layerColors.CONSUMER_ALIGNED} stopOpacity="0.02" /></linearGradient></defs>
                        {[0, 0.25, 0.5, 0.75, 1].map(f => <line key={f} x1={0} y1={tH * (1 - f)} x2={tW} y2={tH * (1 - f)} stroke="#e5e7eb" strokeWidth="0.5" />)}
                        <path d={aArea} fill="url(#aGrad)" />
                        <path d={aLine} fill="none" stroke={cfg.layerColors.CONSUMER_ALIGNED} strokeWidth="1.8" strokeLinejoin="round" />
                        {appTrend.map((p, i) => { const x = (i / (appTrend.length - 1)) * tW; const y = tH - ((p.val - aMin) / (aMax - aMin)) * tH; return <circle key={i} cx={x} cy={y} r="2.5" fill="white" stroke={cfg.layerColors.CONSUMER_ALIGNED} strokeWidth="1.2" />; })}
                        {appTrend.filter((_, i) => i % 2 === 0).map((p, _, arr) => { const idx = appTrend.indexOf(p); const x = (idx / (appTrend.length - 1)) * tW; return <text key={idx} x={x} y={tH + 14} textAnchor="middle" fill="#9ca3af" fontSize="7" fontWeight="500">{p.month}</text>; })}
                      </svg>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Breakdown</div>
                    {[{ label: "Ingestion", pct: 40, color: cfg.layerColors.SOURCE_ALIGNED }, { label: "Transformation", pct: 35, color: cfg.layerColors.BUSINESS }, { label: "Storage", pct: 15, color: cfg.layerColors.CONSUMER_ALIGNED }, { label: "Network", pct: 10, color: "#9ca3af" }].map(b => (
                      <div key={b.label} className="mb-2.5">
                        <div className="flex justify-between mb-0.5"><span className="text-[10px] font-semibold" style={{ color: cfg.text }}>{b.label}</span><span className="text-[10px] font-bold" style={{ color: b.color }}>${(appCost * b.pct / 100).toFixed(0)}</span></div>
                        <div className="h-1.5 rounded-full bg-gray-100"><div className="h-1.5 rounded-full" style={{ width: `${b.pct}%`, background: b.color }} /></div>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sync Details</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ l: "Frequency", v: selApp.sync_frequency }, { l: "Rows/Sync", v: selApp.rows_per_sync_avg >= 1000 ? `${(selApp.rows_per_sync_avg / 1000).toFixed(0)}K` : String(selApp.rows_per_sync_avg) }, { l: "Connector", v: selApp.connector_type || "—" }, { l: "Status", v: selApp.conn_status }].map(s => (
                          <div key={s.l} className="rounded-lg bg-gray-50 px-2.5 py-2"><div className="text-[7px] font-bold text-gray-400 uppercase mb-0.5">{s.l}</div><div className="text-[11px] font-semibold truncate" style={{ color: cfg.text }}>{s.v}</div></div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              const donutR = 56, donutInner = 36, donutCx = 70, donutCy = 70;
              let donutAngle = -Math.PI / 2;
              const donutSlices = catData.map(c => {
                const sweep = (c.val / catTotal) * Math.PI * 2;
                const startA = donutAngle;
                donutAngle += sweep;
                const endA = donutAngle;
                const largeArc = sweep > Math.PI ? 1 : 0;
                const x1o = donutCx + donutR * Math.cos(startA), y1o = donutCy + donutR * Math.sin(startA);
                const x2o = donutCx + donutR * Math.cos(endA), y2o = donutCy + donutR * Math.sin(endA);
                const x1i = donutCx + donutInner * Math.cos(endA), y1i = donutCy + donutInner * Math.sin(endA);
                const x2i = donutCx + donutInner * Math.cos(startA), y2i = donutCy + donutInner * Math.sin(startA);
                const d = `M ${x1o} ${y1o} A ${donutR} ${donutR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${donutInner} ${donutInner} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;
                return { ...c, d };
              });

              return (
                <div>
                  <h2 className="text-[15px] font-bold mb-1" style={{ color: cfg.text }}>Pipeline Cost Analysis</h2>
                  <p className="text-[10px] text-gray-400 mb-4">{(apps as any[]).length} pipelines · {domainOrder.length} domains</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl p-2.5 text-center bg-gray-50"><div className="text-[18px] font-black" style={{ color: cfg.layerColors.CONSUMER_ALIGNED }}>${(totalCost / 1000).toFixed(1)}K</div><div className="text-[7px] font-bold text-gray-400 uppercase">Monthly</div></div>
                    <div className="rounded-xl p-2.5 text-center bg-gray-50"><div className="text-[18px] font-black" style={{ color: cfg.text }}>${Math.round(dailyRunCost)}</div><div className="text-[7px] font-bold text-gray-400 uppercase">Daily</div></div>
                    <div className="rounded-xl p-2.5 text-center bg-gray-50"><div className="text-[18px] font-black" style={{ color: cfg.text }}>${(totalCost * 12 / 1000).toFixed(0)}K</div><div className="text-[7px] font-bold text-gray-400 uppercase">Annual</div></div>
                  </div>

                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">12-Month Cost Trend</div>
                  <div className="rounded-xl bg-gray-50 p-3 mb-4">
                    <svg viewBox={`-5 -5 ${tW + 10} ${tH + 24}`} className="w-full">
                      <defs><linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cfg.layerColors.BUSINESS} stopOpacity="0.25" /><stop offset="100%" stopColor={cfg.layerColors.BUSINESS} stopOpacity="0.02" /></linearGradient></defs>
                      {[0, 0.25, 0.5, 0.75, 1].map(f => <line key={f} x1={0} y1={tH * (1 - f)} x2={tW} y2={tH * (1 - f)} stroke="#e5e7eb" strokeWidth="0.5" />)}
                      <path d={trendArea} fill="url(#tGrad)" />
                      <path d={trendLine} fill="none" stroke={cfg.layerColors.BUSINESS} strokeWidth="1.8" strokeLinejoin="round" />
                      {trendPts.map((p, i) => { const x = (i / (trendPts.length - 1)) * tW; const y = tH - ((p.val - tMin) / (tMax - tMin)) * tH; return <circle key={i} cx={x} cy={y} r="2.5" fill="white" stroke={cfg.layerColors.BUSINESS} strokeWidth="1.2" />; })}
                      {trendPts.filter((_, i) => i % 2 === 0).map((p) => { const idx = trendPts.indexOf(p); const x = (idx / (trendPts.length - 1)) * tW; return <text key={idx} x={x} y={tH + 14} textAnchor="middle" fill="#9ca3af" fontSize="7" fontWeight="500">{p.month}</text>; })}
                    </svg>
                  </div>

                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cost by Category</div>
                  <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 mb-4">
                    <svg viewBox="0 0 140 140" className="w-[110px] h-[110px] shrink-0">
                      {donutSlices.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity="0.85"><title>{s.label}: ${(s.val / 1000).toFixed(1)}K ({(s.val / catTotal * 100).toFixed(0)}%)</title></path>)}
                      <text x={donutCx} y={donutCy - 4} textAnchor="middle" fill={cfg.text} fontSize="13" fontWeight="800">${(catTotal / 1000).toFixed(1)}K</text>
                      <text x={donutCx} y={donutCy + 9} textAnchor="middle" fill="#9ca3af" fontSize="6.5" fontWeight="600">TOTAL</text>
                    </svg>
                    <div className="flex-1 pt-1">
                      {catData.map(c => (
                        <div key={c.label} className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                          <span className="text-[9px] font-medium flex-1" style={{ color: cfg.text }}>{c.label}</span>
                          <span className="text-[9px] font-bold" style={{ color: c.color }}>{(c.val / catTotal * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cost by Domain</div>
                  <div className="rounded-xl bg-gray-50 p-3 mb-4">
                    {sortedDomCost.map(([dom, cost]) => {
                      const pct = (cost / (sortedDomCost[0]?.[1] || 1)) * 100;
                      return (
                        <div key={dom} className="mb-2 last:mb-0">
                          <div className="flex items-center justify-between mb-0.5"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: domainColorMap[dom] || "#999" }} /><span className="text-[10px] font-medium" style={{ color: cfg.text }}>{dom}</span></span><span className="text-[10px] font-bold" style={{ color: cfg.text }}>${(cost / 1000).toFixed(1)}K</span></div>
                          <div className="h-2 rounded-full bg-white/60"><div className="h-2 rounded-full transition-all" style={{ width: `${pct.toFixed(0)}%`, background: domainColorMap[dom] || "#999", opacity: 0.7 }} /></div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cost by Pipeline Type</div>
                  <div className="rounded-xl bg-gray-50 p-3 mb-4">
                    {sortedTypeCost.map(([type, cost]) => {
                      const pct = (cost / (sortedTypeCost[0]?.[1] || 1)) * 100;
                      return (
                        <div key={type} className="mb-2 last:mb-0">
                          <div className="flex items-center justify-between mb-0.5"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: cfg.appTypeColors[type] || "#999" }} /><span className="text-[10px] font-medium" style={{ color: cfg.text }}>{type}</span></span><span className="text-[10px] font-bold" style={{ color: cfg.text }}>${(cost / 1000).toFixed(1)}K</span></div>
                          <div className="h-2 rounded-full bg-white/60"><div className="h-2 rounded-full transition-all" style={{ width: `${pct.toFixed(0)}%`, background: cfg.appTypeColors[type] || "#999", opacity: 0.7 }} /></div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Pipelines by Cost</div>
                  <div className="rounded-xl bg-gray-50 overflow-hidden mb-3">
                    <table className="w-full text-left">
                      <thead><tr className="border-b border-gray-200"><th className="text-[8px] font-bold text-gray-400 uppercase px-3 py-1.5">Pipeline</th><th className="text-[8px] font-bold text-gray-400 uppercase px-2 py-1.5">Domain</th><th className="text-[8px] font-bold text-gray-400 uppercase px-2 py-1.5 text-right">$/mo</th></tr></thead>
                      <tbody>
                        {([...(apps as any[])].sort((a: any, b: any) => (b.monthly_cost_usd || 0) - (a.monthly_cost_usd || 0)).slice(0, 8)).map((a: any) => (
                          <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-white/50 cursor-pointer" onClick={e => { e.stopPropagation(); setSel({ kind: "app", id: a.id }); }}>
                            <td className="px-3 py-1.5"><div className="text-[10px] font-medium truncate max-w-[120px]" style={{ color: cfg.text }}>{a.name}</div><div className="text-[8px] text-gray-400">{a.app_type}</div></td>
                            <td className="px-2 py-1.5"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: domainColorMap[a.domain_name] || "#999" }} /><span className="text-[9px] text-gray-500 truncate max-w-[60px]">{a.domain_name}</span></span></td>
                            <td className="px-2 py-1.5 text-right text-[10px] font-bold" style={{ color: cfg.text }}>${a.monthly_cost_usd}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[9px] text-gray-400">Click an application bubble to see individual cost details and trends.</p>
                </div>
              );
            })()}

            {/* ── TAB: CATALOGUE ── */}
            {panelTab === "catalogue" && (() => {
              if (selProduct) {
                const dq = deriveQualityMetrics([selProduct]);
                const ups = lineageEdges.filter(e => e.target === selProduct.id).map(e => e.a);
                const downs = lineageEdges.filter(e => e.source === selProduct.id).map(e => e.b);
                const qScore = (selProduct.qualityScore ?? selProduct.quality_score ?? 0);
                const slaFreshness = selProduct.sla_freshness || selProduct.sla || null;
                const tierVal = selProduct.tier || "—";
                const ownerName = selProduct.owner || selProduct.domain_name;
                return (
                  <div>
                    <h2 className="text-[14px] font-bold mb-0.5" style={{ color: cfg.text }}>{selProduct.name}</h2>
                    <p className="text-[10px] text-gray-400 mb-3">{selProduct.product_type?.replace("_", " ")} · {selProduct.domain_name}</p>

                    {/* Ownership Card */}
                    <div className="rounded-xl bg-gray-50 p-3 mb-3">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ownership</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><div className="text-[8px] font-bold text-gray-400 uppercase">Owner</div><div className="text-[11px] font-semibold" style={{ color: cfg.text }}>{ownerName}</div></div>
                        <div><div className="text-[8px] font-bold text-gray-400 uppercase">Domain</div><div className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: cfg.text }}><span className="w-2 h-2 rounded-full" style={{ background: domainColorMap[selProduct.domain_name] || "#999" }} />{selProduct.domain_name}</div></div>
                        <div><div className="text-[8px] font-bold text-gray-400 uppercase">Tier</div><div className="text-[11px] font-semibold" style={{ color: tierColor(tierVal) }}>{tierVal}</div></div>
                        <div><div className="text-[8px] font-bold text-gray-400 uppercase">Type</div><div className="text-[11px] font-semibold" style={{ color: cfg.text }}>{selProduct.product_type?.replace(/_/g, " ")}</div></div>
                      </div>
                    </div>

                    {/* Schema Contract */}
                    <div className="rounded-xl border border-gray-100 p-3 mb-3">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Schema Contract</div>
                      <div className="space-y-1.5">
                        {[
                          { l: "Format", v: selProduct.product_type === "SOURCE_ALIGNED" ? "Raw / Schema-on-Read" : selProduct.product_type === "BUSINESS" ? "Normalized / Star Schema" : "Materialized View / API" },
                          { l: "Versioning", v: "Semantic (major.minor)" },
                          { l: "Breaking Changes", v: "Requires downstream notification" },
                          { l: "Refresh", v: selProduct.refresh_cron || (selProduct.product_type === "SOURCE_ALIGNED" ? "Event-driven / Near real-time" : selProduct.product_type === "BUSINESS" ? "Scheduled / Hourly" : "On-demand / Daily") },
                          { l: "Retention", v: selProduct.product_type === "SOURCE_ALIGNED" ? "90 days raw + archived" : "Rolling 24 months" },
                        ].map(r => (
                          <div key={r.l} className="flex items-start justify-between gap-2">
                            <span className="text-[9px] font-semibold text-gray-500 shrink-0">{r.l}</span>
                            <span className="text-[9px] font-medium text-right" style={{ color: cfg.text }}>{r.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quality SLAs */}
                    <div className="rounded-xl border border-gray-100 p-3 mb-3">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quality SLAs</div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="rounded-lg bg-gray-50 px-2.5 py-2 text-center">
                          <div className="text-[16px] font-black" style={{ color: qScore >= 0.8 ? cfg.green : qScore >= 0.5 ? "#f59e0b" : cfg.red }}>{(qScore * 100).toFixed(0)}%</div>
                          <div className="text-[7px] font-bold text-gray-400 uppercase">Overall Quality</div>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-2.5 py-2 text-center">
                          <div className="text-[12px] font-black mt-1" style={{ color: cfg.text }}>{slaFreshness || "—"}</div>
                          <div className="text-[7px] font-bold text-gray-400 uppercase mt-1">Freshness SLA</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {DQ_LABELS.map(d => {
                          const v = (dq as any)[d.key] ?? 0;
                          const target = d.key === "completeness" || d.key === "accuracy" ? 0.95 : 0.90;
                          const met = v >= target;
                          return (
                            <div key={d.key} className="rounded-lg bg-gray-50 px-2 py-1.5 text-center">
                              <div className="text-[12px] font-black" style={{ color: v >= 0.8 ? cfg.green : v >= 0.5 ? "#f59e0b" : cfg.red }}>{(v * 100).toFixed(0)}%</div>
                              <div className="text-[7px] font-bold text-gray-400 uppercase">{d.label}</div>
                              <div className={`text-[7px] font-bold mt-0.5 ${met ? "text-green-500" : "text-red-400"}`}>{met ? "SLA Met" : "Breach"}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {ups.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Upstream ({ups.length})</div>
                        <div className="space-y-1">
                          {ups.map(u => (
                            <div key={u.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setSel({ kind: "product", id: u.id })}>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.layerColors[u.productType as keyof typeof cfg.layerColors] || "#999" }} />
                              <span className="text-[10px] font-semibold truncate" style={{ color: cfg.text }}>{u.label}</span>
                              <span className="text-[8px] text-gray-400 ml-auto shrink-0">{u.productType?.replace("_", " ")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {downs.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Downstream ({downs.length})</div>
                        <div className="space-y-1">
                          {downs.map(d => (
                            <div key={d.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setSel({ kind: "product", id: d.id })}>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.layerColors[d.productType as keyof typeof cfg.layerColors] || "#999" }} />
                              <span className="text-[10px] font-semibold truncate" style={{ color: cfg.text }}>{d.label}</span>
                              <span className="text-[8px] text-gray-400 ml-auto shrink-0">{d.productType?.replace("_", " ")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selProduct.description && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</div>
                        <p className="text-[10px] text-gray-500 leading-[1.7]">{selProduct.description}</p>
                      </div>
                    )}
                  </div>
                );
              }

              const grouped: Record<string, any[]> = {};
              products.forEach((p: any) => {
                (grouped[p.product_type] ??= []).push(p);
              });
              const layers = ["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"];
              return (
                <div>
                  <h2 className="text-[15px] font-bold mb-1" style={{ color: cfg.text }}>Product Catalogue</h2>
                  <p className="text-[10px] text-gray-400 mb-4">{products.length} data products across {domainOrder.length} domains</p>
                  {layers.map(layer => {
                    const items = grouped[layer] || [];
                    return (
                      <div key={layer} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.layerColors[layer as keyof typeof cfg.layerColors] || "#999" }} />
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.text }}>{layer.replace("_", " ")} ({items.length})</span>
                        </div>
                        <div className="space-y-1">
                          {items.map((p: any) => (
                            <div key={p.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-2.5 py-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSel({ kind: "product", id: p.id })}>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: domainColorMap[p.domain_name] || "#999" }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-semibold truncate" style={{ color: cfg.text }}>{p.name}</div>
                                <div className="text-[8px] text-gray-400">{p.domain_name} · {p.owner || "—"}</div>
                              </div>
                              <div className="text-[10px] font-bold shrink-0" style={{ color: (p.qualityScore ?? 0) >= 0.8 ? cfg.green : (p.qualityScore ?? 0) >= 0.5 ? "#f59e0b" : cfg.red }}>{((p.qualityScore ?? 0) * 100).toFixed(0)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Bottom Description */}
      <section className="border-t border-gray-100 bg-white">
        <div className="max-w-[1200px] mx-auto px-8 py-14">
          <h2 className="text-[26px] font-bold mb-2" style={{ color: cfg.text }}>How to Read MeshAtlas</h2>
          <p className="text-[14px] text-gray-500 leading-[1.8] mb-10 max-w-[680px]">This visualization maps Orange Co&apos;s enterprise data mesh as concentric arcs. Data flows inward from source applications at the outermost ring through three layers of data products.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {([{ title: "Applications", desc: "Outermost arc \u2014 source systems in circular clusters, sub-grouped by type.", color: cfg.layerColors.APPS }, { title: "Source Products", desc: "Raw data products aligned 1:1 with applications.", color: cfg.layerColors.SOURCE_ALIGNED }, { title: "Business Products", desc: "Transformed, enriched cross-domain products with nested upstream dots.", color: cfg.layerColors.BUSINESS }, { title: "Consumer Products", desc: "Innermost arc \u2014 ready-to-consume products with nested upstream dots.", color: cfg.layerColors.CONSUMER_ALIGNED }] as const).map(l => <div key={l.title} className="rounded-xl p-5 border border-gray-100"><div className="w-3 h-3 rounded-full mb-3" style={{ background: l.color }} /><h3 className="text-[13px] font-bold mb-1.5" style={{ color: cfg.text }}>{l.title}</h3><p className="text-[11px] text-gray-500 leading-[1.7]">{l.desc}</p></div>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl p-5 border border-gray-100"><h3 className="text-[13px] font-bold mb-2" style={{ color: cfg.text }}>Pipeline Health</h3><div className="space-y-2 text-[11px] text-gray-500"><div className="flex items-center gap-2"><span className="w-8 h-0.5 rounded" style={{ background: cfg.green }} /> Healthy</div><div className="flex items-center gap-2"><span className="w-8 h-0.5 rounded" style={{ background: cfg.red }} /> Broken</div></div></div>
            <div className="rounded-xl p-5 border border-gray-100"><h3 className="text-[13px] font-bold mb-2" style={{ color: cfg.text }}>Data Quality</h3><div className="space-y-1.5 text-[10px] text-gray-500">{DQ_LABELS.map(dq => <div key={dq.key} className="flex items-start gap-1.5"><span className="font-semibold text-gray-700 shrink-0">{dq.label}:</span> {dq.desc}</div>)}</div></div>
            <div className="rounded-xl p-5 border border-gray-100"><h3 className="text-[13px] font-bold mb-2" style={{ color: cfg.text }}>Interaction</h3><div className="space-y-2 text-[11px] text-gray-500 leading-[1.7]"><p><strong className="text-gray-700">Search</strong> to find products or apps.</p><p><strong className="text-gray-700">Click</strong> any bubble for details + quality metrics.</p><p><strong className="text-gray-700">Gear icon</strong> opens the playground controls.</p></div></div>
          </div>
        </div>
      </section>
    </div>
  );
}
