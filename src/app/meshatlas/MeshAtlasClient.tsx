"use client";

import { useState, useMemo, useRef, useEffect, useCallback, type ReactNode } from "react";
import type { PlaygroundConfig } from "./playground/types";
import { APP_CATEGORIES, DEFAULTS } from "./playground/types";
import { usePlayground, type ColorTheme, loadSavedThemes, saveThemesToStorage, CLASSIC_THEME, applyThemeColors, extractColorsFromCfg, extractRightPanelSyncSnapshot, rightPanelSyncPathsForTarget, buildRightPanelSyncUpdates, LS_KEY_ARC, LS_KEY_GLOBAL_BG, LS_KEY_ACTIVE_THEME } from "./playground/usePlayground";
import {
  ColorRow,
  SliderRow,
  SliderRowWithInput,
  ToggleRow,
} from "./components/ui-primitives";
import { buildAiContextString } from "./lib/ai-context";
import {
  arcSvgPath,
  arcXY,
  deriveCharScore,
  deriveQualityMetrics,
  dotsInGroup,
  hexWithOpacity,
  qualityToStars,
  tToAngle,
  typeGroupR,
} from "./lib/geometry";
import { IS_AUTHORING } from "@/lib/authoring";

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
  { id: "cost", label: "Cost", icon: "M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-7 2a7 7 0 1114 0 7 7 0 01-14 0z" },
  { id: "catalogue", label: "Catalogue", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { id: "pipeline", label: "Pipeline", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { id: "quality", label: "Quality", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "askai", label: "Ask Atlas", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
] as const;

/* ═══ Types ═══ */
interface GNode { id: string; label: string; qualityScore: number; productType: string; domainId: string; domainName: string; color: string; }
interface GEdge { id: string; source: string; target: string; edgeType: string; label: string; edgeStatus: "HEALTHY" | "BROKEN" | "WARNING"; statusReason?: string | null; }
interface PNode extends GNode { x: number; y: number; r: number; upstreamIds?: string[]; }
interface PApp { id: string; name: string; app_type: string; vendor: string; description: string; domain_name: string; color_hex: string; conn_status: string; sync_frequency: string; monthly_cost_usd: number; rows_per_sync_avg: number; connector_type: string; destination_name: string; x: number; y: number; }
interface TypeGroup { type: string; color: string; apps: PApp[]; cx: number; cy: number; r: number; }
interface DCluster { domain: string; color: string; cx: number; cy: number; radius: number; groups: TypeGroup[]; }
type Sel = { kind: "product"; id: string } | { kind: "app"; id: string } | null;
interface AppProductLink { app_id: string; product_id: string; }
interface Props { graph: { nodes: GNode[]; edges: GEdge[] }; overview: import("@/lib/db-types").MeshOverviewRow | undefined; domains: import("@/lib/db-types").DomainHealthRow[]; apps: import("@/lib/db-types").ApplicationRow[]; products: import("@/lib/db-types").DataProductRow[]; policies: import("@/lib/db-types").GovernancePolicyRow[]; execKpis: import("@/lib/db-types").ExecKpisRow | undefined; appProductLinks: AppProductLink[]; pipelineStatus: import("@/lib/db-types").PipelineStatusRow[]; productPipelineStatus: import("@/lib/db-types").ProductPipelineStatusRow[]; productPipelineRuns: import("@/lib/db-types").ProductPipelineRunRow[]; recentSyncLogs: import("@/lib/db-types").SyncLogRow[]; connectionHealth: import("@/lib/db-types").ConnectionHealthRow[]; }

function starColor(stars: number): string {
  if (stars >= 4) return "#8fcd73";
  if (stars >= 3) return "#dab508";
  return "#ef4444";
}
function StarRating({ stars, size = 12 }: { stars: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-px">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i <= stars ? starColor(stars) : "#e5e7eb"}>
          <path d="M10 1.5l2.47 5.01L18.5 7.4l-4.25 4.14 1 5.83L10 14.67l-5.25 2.76 1-5.83L1.5 7.46l6.03-.88L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

/** Overview “selected product” gradient hero — reused in other right-panel tabs */
function OverviewStyleProductBannerBlock({
  os,
  selProduct,
  domainColorMap,
  cfg,
  bannerFooterExtra,
}: {
  os: PlaygroundConfig["overviewPanel"];
  selProduct: any;
  domainColorMap: Record<string, string>;
  cfg: PlaygroundConfig;
  bannerFooterExtra?: ReactNode;
}) {
  const layerCol = cfg.layerColors[selProduct.product_type] || cfg.layerColors.SOURCE_ALIGNED;
  const st = qualityToStars(selProduct.quality_score || 0);
  return (
    <div className="rounded-xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${layerCol}, ${layerCol}cc)` }}>
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.06] pointer-events-none">
        <svg viewBox="0 0 96 96" fill="white"><circle cx="72" cy="24" r="48" /><circle cx="84" cy="60" r="30" /></svg>
      </div>
      <div className="p-3.5">
        <div className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: os.selBannerLabelSize, color: os.selBannerOverlineColor }}>{LAYER_SHORT[selProduct.product_type]} Data Product</div>
        <div className="font-bold mb-0.5 pr-12" style={{ fontSize: os.selBannerNameSize, color: os.selBannerTitleColor }}>{selProduct.name}</div>
        {selProduct.description && <p className="leading-[1.5] mb-1.5 pr-8" style={{ fontSize: os.selBannerDescSize, color: os.selBannerDescColor }}>{selProduct.description}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-1.5 py-0.5 rounded-full font-bold" style={{ fontSize: os.selBannerLabelSize, background: "rgba(255,255,255,0.15)", color: os.selBannerPillTextColor }}>{LAYER_SHORT[selProduct.product_type]}</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ fontSize: os.selBannerLabelSize, background: "rgba(255,255,255,0.15)", color: os.selBannerPillTextColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: domainColorMap[selProduct.domain_name] || "#fff" }} />
            <span style={{ color: os.selBannerDomainTextColor }}>{selProduct.domain_name}</span>
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <StarRating stars={st} size={os.selStarSize} />
            <span className="font-bold" style={{ fontSize: os.selBannerLabelSize + 2, color: os.selBannerPillTextColor }}>{st}/5</span>
          </div>
          {bannerFooterExtra}
        </div>
      </div>
    </div>
  );
}

const DATA_PRODUCT_CHARS = [
  { key: "discoverable", label: "Discoverable", desc: "Meta config, controlled vocabulary", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { key: "addressable", label: "Addressable", desc: "Model contracts, versions, deprecation date", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { key: "understandable", label: "Understandable", desc: "Doc blocks, enhanced descriptions", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { key: "trustworthy", label: "Trustworthy & Useful", desc: "SLOs, data tests, freshness checks", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { key: "accessible", label: "Natively Accessible", desc: "Cross-platform/Iceberg, Semantic Layer", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" },
  { key: "interoperable", label: "Interoperable", desc: "Semantic Layer, naming conventions", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { key: "valuable", label: "Valuable on its own", desc: "OBT, sql + yml + md + data + lineage", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "secure", label: "Secure", desc: "Grants config, terraform", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
] as const;

function qualityMethodText(metricKey: string) {
  switch (metricKey) {
    case "completeness": return "Coverage of required fields, null-rate thresholds, and contract-required columns.";
    case "accuracy": return "Record-level checks against trusted reference sets and reconciliation rules.";
    case "consistency": return "Cross-system agreement for keys, enums, and shared business definitions.";
    case "timeliness": return "Freshness and latency checks against published SLAs for the product.";
    case "validity": return "Range, format, and schema validation against allowed values.";
    case "uniqueness": return "Duplicate detection on primary grain and business-unique keys.";
    default: return "Automated tests across product contracts, data shape, and operational health.";
  }
}
function buildQualityFailures(metricKey: string, productName: string, failedCount: number) {
  const failures = {
    completeness: [
      "3 required fields exceeded null threshold in the last load window.",
      "Contract-required `customer_id` coverage dropped below 99.5%.",
      "Optional enrichment attributes stopped landing for one upstream feed.",
    ],
    accuracy: [
      "Reference match rate drifted against the source-of-truth snapshot.",
      "Currency normalization rule produced mismatched values in one partition.",
      "Reconciliation check failed for high-value transactions.",
    ],
    consistency: [
      "Status enum values diverged between source and curated models.",
      "Country code mapping is inconsistent across upstream systems.",
      "Shared business key appears with conflicting classifications.",
    ],
    timeliness: [
      "Latest refresh breached freshness SLA by more than one interval.",
      "Streaming lag crossed the warning threshold for downstream consumers.",
      "Scheduled transform started late because an upstream extract was delayed.",
    ],
    validity: [
      "Format validation failed for one contract-managed identifier.",
      "Accepted-range checks failed for a monitored numeric field.",
      "Schema validation detected an unexpected nullable column transition.",
    ],
    uniqueness: [
      "Primary-grain duplicate rate crossed the alert threshold.",
      "Late-arriving merge produced duplicate business keys in one slice.",
      "Deduplication policy did not apply to all replayed records.",
    ],
  } as Record<string, string[]>;
  const source = failures[metricKey] || ["Automated validation found a contract or data quality issue."];
  return source.slice(0, Math.max(1, Math.min(failedCount, 3))).map((issue, idx) => ({
    name: `${productName} · ${metricKey} test ${idx + 1}`,
    severity: idx === 0 ? ("high" as const) : ("medium" as const),
    issue,
  }));
}

/* ═══ Hexagonal Radar DQ Chart ═══ */
function DQHexRadar({ metrics, size, layerColor, label, avgScore, fillOpacity, strokeWidth, gridColor, labelSize, valueSize, dotRadius, centerScoreSize, centerLabelSize, labelColor, axisWidth, labelGap, labelOffset, consistencyLabelOutset, highColor, midColor, lowColor }: { metrics: Record<string, number>; size: number; layerColor: string; label: string; avgScore: number; fillOpacity?: number; strokeWidth?: number; gridColor?: string; labelSize?: number; valueSize?: number; dotRadius?: number; centerScoreSize?: number; centerLabelSize?: number; labelColor?: string; axisWidth?: number; labelGap?: number; labelOffset?: number; consistencyLabelOutset?: number; highColor?: string; midColor?: string; lowColor?: string }) {
  const fo = fillOpacity ?? 0.18;
  const sw = strokeWidth ?? 1.5;
  const gc = gridColor ?? "#e5e7eb";
  const ls = labelSize ?? 6.5;
  const vs = valueSize ?? 7;
  const dr = dotRadius ?? 3;
  const css = centerScoreSize ?? 16;
  const cls = centerLabelSize ?? 8;
  const lc = labelColor ?? "#6b7280";
  const aw = axisWidth ?? 0.5;
  const lg = labelGap ?? 9;
  const lo = labelOffset ?? 22;
  const clo = consistencyLabelOutset ?? 0;
  const hc = highColor ?? "#8fcd73";
  const mc = midColor ?? "#dab508";
  const lcc = lowColor ?? "#ef4444";
  const qCol = (v: number) => v >= 90 ? hc : v >= 75 ? mc : lcc;
  const cxy = size / 2;
  const halfGap = lg / 2;
  /** Small viewBox margin only for text that extends past the nominal size box — keeps `width/height === size` scale closer to 1:1 so the chart reads larger. */
  const canvasBleed = Math.ceil(Math.max(2, clo * 0.2 + ls * 0.36 + vs * 0.08 + 0.5));
  const vb = size + 2 * canvasBleed;
  /** Outer labels sit at maxR+lo(+consistency outset); bleed in viewBox lets maxR grow vs a fixed inset. */
  const maxR = Math.max(
    size * 0.33,
    size / 2 + canvasBleed - lo - clo - halfGap - vs - 1,
  );
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
    <div className="flex flex-col items-center" style={{ overflow: "visible" }}>
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} style={{ overflow: "visible" }}>
        <g transform={`translate(${canvasBleed}, ${canvasBleed})`}>
        {gridLevels.map(lev => {
          const pts = Array.from({ length: 6 }, (_, i) => hexPt(i, maxR * lev));
          return <polygon key={lev} points={pts.map(p => `${p[0]},${p[1]}`).join(" ")} fill="none" stroke={gc} strokeWidth={0.8} />;
        })}
        {keys.map((_, i) => {
          const [ex, ey] = hexPt(i, maxR);
          return <line key={i} x1={cxy} y1={cxy} x2={ex} y2={ey} stroke={gc} strokeWidth={aw} />;
        })}
        <polygon points={dataPts.map(p => `${p[0]},${p[1]}`).join(" ")} fill={layerColor} fillOpacity={fo} stroke={layerColor} strokeWidth={sw} strokeOpacity={0.7} />
        <path d={dataPath} fill="none" />
        {keys.map((k, i) => {
          const val = metrics[k] ?? 0;
          const [dx, dy] = hexPt(i, maxR * (val / 100));
          return <circle key={k} cx={dx} cy={dy} r={dr} fill={qCol(val)} stroke="white" strokeWidth={1} />;
        })}
        {DQ_LABELS.map((dq, i) => {
          const extra = dq.key === "consistency" ? clo : 0;
          const labelR = maxR + lo + extra;
          const [lx, ly] = hexPt(i, labelR);
          const val = metrics[dq.key] ?? 0;
          return (<g key={dq.key}>
            <text x={lx} y={ly - halfGap} textAnchor="middle" fontSize={ls} fontWeight={600} fill={lc} dominantBaseline="auto">{dq.label}</text>
            <text x={lx} y={ly + halfGap} textAnchor="middle" fontSize={vs} fontWeight={800} fill={qCol(val)} dominantBaseline="hanging">{val}%</text>
          </g>);
        })}
        <text x={cxy} y={cxy - 3} textAnchor="middle" fontSize={css} fontWeight={800} fill={layerColor}>{avgScore}%</text>
        <foreignObject x={cxy - maxR * 0.5} y={cxy + 6} width={maxR} height={cls * 3.5} overflow="visible">
          <div style={{ fontSize: cls, fontWeight: 600, color: lc, textAlign: "center", lineHeight: 1.25, wordWrap: "break-word" as const, overflowWrap: "break-word" as const, width: "100%" }}>{label}</div>
        </foreignObject>
        </g>
      </svg>
    </div>
  );
}

/** Word-wrap for SVG multi-line text (character budget per line). */
function wrapTextToLines(text: string, maxCharsPerLine: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const limit = Math.max(8, maxCharsPerLine);
  const lines: string[] = [];
  let cur = words[0]!;
  for (let i = 1; i < words.length; i++) {
    const w = words[i]!;
    if (cur.length + 1 + w.length <= limit) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  lines.push(cur);
  return lines;
}

const CUSTOM_TEXT_ALIGNS = ["left", "center", "right", "justify", "start", "end"] as const;

/* ═══ Lightweight markdown renderer for AI responses ═══ */
function AiMarkdown({ text }: { text: string }) {
  if (!text) return <span className="text-gray-400 italic">Thinking...</span>;
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let inCodeBlock = false;
  let codeLang = "";
  let codeLines: string[] = [];

  const inlineFormat = (s: string): ReactNode => {
    const parts: ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|`([^`]+)`|_(.+?)_)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(s)) !== null) {
      if (match.index > last) parts.push(s.slice(last, match.index));
      if (match[2]) parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
      else if (match[3]) parts.push(<code key={match.index} className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono text-indigo-600">{match[3]}</code>);
      else if (match[4]) parts.push(<em key={match.index}>{match[4]}</em>);
      last = match.index + match[0].length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(<pre key={`cb${i}`} className="bg-gray-900 text-green-300 rounded-lg p-2.5 text-[9.5px] font-mono overflow-x-auto my-1.5 leading-[1.6]">{codeLines.join("\n")}</pre>);
        codeLines = []; inCodeBlock = false; codeLang = "";
      } else { inCodeBlock = true; codeLang = line.slice(3).trim(); }
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }
    if (!line.trim()) { elements.push(<div key={`br${i}`} className="h-2" />); continue; }
    if (line.startsWith("### ")) { elements.push(<div key={i} className="font-bold text-[11px] mt-2 mb-0.5">{inlineFormat(line.slice(4))}</div>); continue; }
    if (line.startsWith("## ")) { elements.push(<div key={i} className="font-bold text-[12px] mt-2.5 mb-0.5">{inlineFormat(line.slice(3))}</div>); continue; }
    if (line.startsWith("# ")) { elements.push(<div key={i} className="font-bold text-[13px] mt-3 mb-1">{inlineFormat(line.slice(2))}</div>); continue; }
    if (/^[-*] /.test(line)) { elements.push(<div key={i} className="flex gap-1.5 ml-1"><span className="text-gray-400 shrink-0 mt-0.5">&#8226;</span><span>{inlineFormat(line.slice(2))}</span></div>); continue; }
    if (/^\d+\. /.test(line)) { const m = line.match(/^(\d+)\. (.*)/); if (m) elements.push(<div key={i} className="flex gap-1.5 ml-1"><span className="text-gray-400 shrink-0 font-mono text-[10px]">{m[1]}.</span><span>{inlineFormat(m[2])}</span></div>); continue; }
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line.slice(1, -1).split("|").map(c => c.trim());
      if (cells.every(c => /^-+$/.test(c))) continue;
      const isHeader = i + 1 < lines.length && /^\|[-| ]+\|$/.test(lines[i + 1]);
      elements.push(
        <div key={i} className={`flex gap-px text-[9.5px] ${isHeader ? "font-bold bg-gray-100" : "bg-white"} rounded overflow-hidden`}>
          {cells.map((c, j) => <div key={j} className="flex-1 px-1.5 py-1 border-b border-gray-100 truncate">{inlineFormat(c)}</div>)}
        </div>
      );
      continue;
    }
    elements.push(<p key={i}>{inlineFormat(line)}</p>);
  }
  if (inCodeBlock && codeLines.length > 0) {
    elements.push(<pre key="cblast" className="bg-gray-900 text-green-300 rounded-lg p-2.5 text-[9.5px] font-mono overflow-x-auto my-1.5 leading-[1.6]">{codeLines.join("\n")}</pre>);
  }
  return <div className="space-y-0.5">{elements}</div>;
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function MeshAtlasClient({ graph, overview, domains, apps, products, execKpis, appProductLinks, pipelineStatus, productPipelineStatus, productPipelineRuns, recentSyncLogs, connectionHealth }: Props) {
  const [arcCfg, updateArcCfg, resetArcCfg, undoArcCfg, , batchUpdateCfg] = usePlayground(LS_KEY_ARC);

  const cfg = useMemo<PlaygroundConfig>(() => ({
    ...arcCfg,
    layout: "arc" as const,
  }), [arcCfg]);

  const updateCfg = updateArcCfg;
  const resetCfg = resetArcCfg;
  const undoCfg = undoArcCfg;

  useEffect(() => {
    document.body.style.background = cfg.bg;
    document.documentElement.style.setProperty("--nav-bg", cfg.bg);
    if (IS_AUTHORING) {
      try { localStorage.setItem(LS_KEY_GLOBAL_BG, cfg.bg); } catch {}
    }
  }, [cfg.bg]);

  const DESIGN_WIDTH = 1728;
  const DESIGN_HEIGHT = Math.max(cfg.vh + 40, 840);
  const NAV_HEIGHT = 64;
  const VIEWPORT_MARGIN = 4;
  const MAX_EFFECTIVE_STAGE_SCALE = 1.5;
  const [viewportSize, setViewportSize] = useState(() => ({
    w: Math.round(window.visualViewport?.width ?? window.innerWidth),
    h: Math.round(window.visualViewport?.height ?? window.innerHeight),
  }));
  useEffect(() => {
    const calc = () => {
      const vv = window.visualViewport;
      setViewportSize({
        w: Math.round(vv?.width ?? window.innerWidth),
        h: Math.round(vv?.height ?? window.innerHeight),
      });
    };
    calc();
    window.addEventListener("resize", calc);
    window.visualViewport?.addEventListener("resize", calc);
    window.visualViewport?.addEventListener("scroll", calc);
    return () => {
      window.removeEventListener("resize", calc);
      window.visualViewport?.removeEventListener("resize", calc);
      window.visualViewport?.removeEventListener("scroll", calc);
    };
  }, [DESIGN_HEIGHT]);
  const availableWidth = Math.max(0, viewportSize.w - VIEWPORT_MARGIN * 2);
  const availableHeight = Math.max(0, viewportSize.h - NAV_HEIGHT - VIEWPORT_MARGIN * 2);
  const fitZoom = useMemo(() => {
    const widthScale = availableWidth / DESIGN_WIDTH;
    const heightScale = availableHeight / DESIGN_HEIGHT;
    return Math.min(Math.max(0.01, widthScale), Math.max(0.01, heightScale));
  }, [DESIGN_HEIGHT, DESIGN_WIDTH, availableHeight, availableWidth]);
  const requestedStageScale = Math.max(0.5, cfg.stageScaleFactor ?? 1);
  const uiZoom = useMemo(
    () => Math.min(MAX_EFFECTIVE_STAGE_SCALE, fitZoom * requestedStageScale),
    [MAX_EFFECTIVE_STAGE_SCALE, fitZoom, requestedStageScale]
  );
  const scaledStageWidth = DESIGN_WIDTH * uiZoom;
  const scaledStageHeight = DESIGN_HEIGHT * uiZoom;
  const stageLeft = useMemo(
    () => (scaledStageWidth + VIEWPORT_MARGIN * 2 <= viewportSize.w ? Math.max(VIEWPORT_MARGIN, (viewportSize.w - scaledStageWidth) / 2) : VIEWPORT_MARGIN),
    [VIEWPORT_MARGIN, scaledStageWidth, viewportSize.w]
  );
  const stageTop = useMemo(
    () => (scaledStageHeight + VIEWPORT_MARGIN * 2 <= availableHeight ? NAV_HEIGHT + Math.max(VIEWPORT_MARGIN, (availableHeight - scaledStageHeight) / 2) : NAV_HEIGHT + VIEWPORT_MARGIN),
    [DESIGN_HEIGHT, NAV_HEIGHT, VIEWPORT_MARGIN, availableHeight, scaledStageHeight]
  );
  const stageCanvasWidth = useMemo(
    () => Math.max(viewportSize.w, stageLeft + scaledStageWidth + VIEWPORT_MARGIN),
    [VIEWPORT_MARGIN, scaledStageWidth, stageLeft, viewportSize.w]
  );
  const stageCanvasHeight = useMemo(
    () => Math.max(viewportSize.h, stageTop + scaledStageHeight + VIEWPORT_MARGIN),
    [VIEWPORT_MARGIN, scaledStageHeight, stageTop, viewportSize.h]
  );

  const [savedThemes, setSavedThemes] = useState<ColorTheme[]>(() => loadSavedThemes());
  const [activeThemeId, setActiveThemeId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(LS_KEY_ACTIVE_THEME); } catch { return null; }
  });
  const allThemes = useMemo(() => [CLASSIC_THEME, ...savedThemes], [savedThemes]);

  const applyTheme = useCallback((theme: ColorTheme) => {
    const merged = applyThemeColors(cfg, theme.colors);
    const flat = JSON.parse(JSON.stringify(merged));
    for (const [key, val] of Object.entries(flat)) {
      if (key === "layout") continue;
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        for (const [sub, sv] of Object.entries(val as Record<string, unknown>)) {
          updateCfg(`${key}.${sub}`, sv);
        }
      } else {
        updateCfg(key, val);
      }
    }
    setActiveThemeId(theme.id);
    try { localStorage.setItem(LS_KEY_ACTIVE_THEME, theme.id); } catch {}
  }, [cfg, updateCfg]);

  const saveCurrentAsTheme = useCallback((name: string) => {
    const id = `custom-${Date.now()}`;
    const theme: ColorTheme = { id, name, colors: extractColorsFromCfg(cfg) };
    const next = [...savedThemes, theme];
    setSavedThemes(next);
    saveThemesToStorage(next);
    setActiveThemeId(id);
    try { localStorage.setItem(LS_KEY_ACTIVE_THEME, id); } catch {}
    return theme;
  }, [cfg, savedThemes]);

  const deleteTheme = useCallback((id: string) => {
    const next = savedThemes.filter(t => t.id !== id);
    setSavedThemes(next);
    saveThemesToStorage(next);
    if (activeThemeId === id) {
      setActiveThemeId(null);
      try { localStorage.removeItem(LS_KEY_ACTIVE_THEME); } catch {}
    }
  }, [savedThemes, activeThemeId]);

  const [sel, setSel] = useState<Sel>(null);
  const [tip, setTip] = useState<{ x: number; y: number; content: ReactNode } | null>(null);
  const [hovDom, setHD] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pgOpen, setPgOpen] = useState(false);
  const [themeNameInput, setThemeNameInput] = useState("");
  const [showThemeSave, setShowThemeSave] = useState(false);
  const [pgSections, setPgSections] = useState({
    display: true,
    legends: false,
    colors: false,
    layout: false,
    flowLines: false,
    typography: false,
    appShapes: false,
    customTexts: false,
    separatorLines: false,
    rightPanelSync: false,
    overviewPanel: false,
    costPanel: false,
    cataloguePanel: false,
    qualityPanel: false,
    pipelinePanel: false,
    toggleBars: false,
  });
  const [editingLegendText, setEditingLegendText] = useState<{ cfgPath: string; x: number; y: number; value: string; width: number } | null>(null);
  const [pgProductQuery, setPgProductQuery] = useState("");
  const [pgProductId, setPgProductId] = useState<string>("");
  const [panelTab, setPanelTab] = useState<string>("overview");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<"ALL" | "ACTIVE" | "BROKEN" | "PAUSED">("BROKEN");
  const [qualityDrilldown, setQualityDrilldown] = useState<{
    title: string;
    description: string;
    testsRun: number;
    passed: number;
    failed: number;
    failures: { name: string; severity: "high" | "medium"; issue: string }[];
  } | null>(null);
  const [costRange, setCostRange] = useState<"monthly" | "30d">("monthly");
  const [costCatTab, setCostCatTab] = useState<string>("all");
  const [costProdSort, setCostProdSort] = useState<"cost" | "name" | "domain">("cost");
  const [costProdSortDir, setCostProdSortDir] = useState<"desc" | "asc">("desc");
  const [costProdFilter, setCostProdFilter] = useState<string>("all");
  const [costBarMode, setCostBarMode] = useState<"$" | "%">("$");
  const [catActiveLayer, setCatActiveLayer] = useState<string>("SOURCE_ALIGNED");
  const [catRubricOpen, setCatRubricOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [catViewMode, setCatViewMode] = useState<"grid" | "list">("grid");
  const [pipeStatusFilter, setPipeStatusFilter] = useState<"all" | "pass" | "fail">("all");
  const [pipeSearch, setPipeSearch] = useState("");
  const [pipeBanTab, setPipeBanTab] = useState<"ingestion" | "dataproduct">("ingestion");
  const [pipeArchTab, setPipeArchTab] = useState<"source" | "business" | "consumer">("source");
  const [pipeDetailTab, setPipeDetailTab] = useState<"models" | "logs">("models");
  const [pipeModelTab, setPipeModelTab] = useState<"all" | "connector" | "ingestion" | "staging" | "stage" | "mart">("all");
  const [pipeLogTab, setPipeLogTab] = useState<"success" | "warnings" | "failure">("success");
  const [pipeLineageFocusId, setPipeLineageFocusId] = useState<string | null>(null);
  const [qualitySearch, setQualitySearch] = useState("");
  const [showUpDown, setShowUpDown] = useState(true);
  const [focusTogglePos, setFocusTogglePos] = useState<{ x: number; y: number }>(() => {
    try { const s = localStorage.getItem("meshlens-focus-pos"); if (s) return JSON.parse(s); } catch {}
    return { x: 539.76171875, y: -816.734375 };
  });
  useEffect(() => { try { localStorage.setItem("meshlens-focus-pos", JSON.stringify(focusTogglePos)); } catch {} }, [focusTogglePos]);
  const focusToggleDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [highlightIssues, setHighlightIssues] = useState(false);
  const [issuesTogglePos, setIssuesTogglePos] = useState<{ x: number; y: number }>(() => {
    try { const s = localStorage.getItem("meshlens-issues-pos"); if (s) return JSON.parse(s); } catch {}
    return { x: 539.33203125, y: -757.09765625 };
  });
  useEffect(() => { try { localStorage.setItem("meshlens-issues-pos", JSON.stringify(issuesTogglePos)); } catch {} }, [issuesTogglePos]);
  const issuesToggleDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [appViewMode, setAppViewMode] = useState<"apps" | "source" | "business" | "consumer">("apps");
  const [pgPos, setPgPos] = useState<{ x: number; y: number } | null>(null);
  const pgDrag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [stageScroll, setStageScroll] = useState({ x: 0, y: 0 });
  const labelDrag = useRef<{ id: string; grabOffsetX: number; grabOffsetY: number; origPerX: number; origPerY: number; baseLx: number; baseLy: number } | null>(null);
  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null);

  /* ── Ask AI chat state ── */
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  useEffect(() => { panelRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [sel, panelTab]);
  useEffect(() => { setQualityDrilldown(null); }, [sel, panelTab]);
  useEffect(() => { setPipeLineageFocusId(null); }, [sel?.kind, sel?.id, panelTab]);

  const _arc = useCallback((r: number, t: number): [number, number] => {
    return arcXY(r, t, cfg.cx, cfg.cy, cfg.pad);
  }, [cfg.cx, cfg.cy, cfg.pad]);
  const _arcPath = useCallback((r: number) => {
    return arcSvgPath(r, cfg.cx, cfg.cy, cfg.pad);
  }, [cfg.cx, cfg.cy, cfg.pad]);
  const _tToAngle = useCallback((t: number) => tToAngle(t, cfg.pad), [cfg.pad]);

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
    type ASEdgeStatus = "HEALTHY" | "BROKEN" | "WARNING";
    const edges: { id: string; d: string; healthy: boolean; status: ASEdgeStatus; appId: string; productId: string; domain: string }[] = [];
    const appPosMap = new Map(allPosApps.map(a => [a.id, a]));
    const seen = new Set<string>();
    for (const link of appProductLinks) {
      const app = appPosMap.get(link.app_id);
      const prod = pMap.get(link.product_id);
      if (!app || !prod || prod.productType !== "SOURCE_ALIGNED") continue;
      const key = `${link.app_id}-${link.product_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const [x1, y1] = anchorPt(app.x, app.y, cfg.appDotR + 2, "APPS", "downstream");
      const [x2, y2] = anchorPt(prod.x, prod.y, prod.r + 2, "SOURCE_ALIGNED", "upstream");
      const angA = Math.atan2(app.y - cfg.cy, app.x - cfg.cx);
      const angB = Math.atan2(prod.y - cfg.cy, prod.x - cfg.cx);
      let delta = angB - angA;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      const rCorr = cfg.radii.APPS + (cfg.radii.SOURCE_ALIGNED - cfg.radii.APPS) * cfg.flow.noodle.appSourceCorridor;
      const sp = cfg.flow.noodle.appSourceSpread;
      const cp1a = angA + delta * sp;
      const cp2a = angA + delta * (1 - sp);
      const d = `M ${x1} ${y1} C ${cfg.cx + rCorr * Math.cos(cp1a)} ${cfg.cy + rCorr * Math.sin(cp1a)}, ${cfg.cx + rCorr * Math.cos(cp2a)} ${cfg.cy + rCorr * Math.sin(cp2a)}, ${x2} ${y2}`;
      const st: ASEdgeStatus = app.conn_status === "BROKEN" ? "BROKEN" : app.conn_status === "ACTIVE" ? "HEALTHY" : "WARNING";
      edges.push({ id: `as-${app.id}-${prod.id}`, d, healthy: st === "HEALTHY", status: st, appId: app.id, productId: prod.id, domain: app.domain_name });
    }
    return edges;
  }, [allPosApps, pMap, appProductLinks, cfg.appDotR, cfg.cx, cfg.cy, cfg.radii, cfg.flow.anchor, cfg.flow.noodle.appSourceCorridor, cfg.flow.noodle.appSourceSpread, anchorPt]);

  const lineageEdges = useMemo(() => {
    // Compute business products with broken/warning upstream for cascade
    const bizWithBrokenUpstream = new Set<string>();
    for (const e of graph.edges) {
      if ((e.edgeStatus === "BROKEN" || e.edgeStatus === "WARNING") && e.target.startsWith("biz-")) {
        bizWithBrokenUpstream.add(e.target);
      }
    }
    const effectiveStatus = (e: GEdge): "HEALTHY" | "BROKEN" | "WARNING" => {
      if (e.edgeStatus === "BROKEN" || e.edgeStatus === "WARNING") return e.edgeStatus;
      const srcNode = pMap.get(e.source);
      if (srcNode && srcNode.productType === "BUSINESS" && bizWithBrokenUpstream.has(e.source)) return "WARNING";
      return "HEALTHY";
    };

    return graph.edges.map(e => {
      const a = pMap.get(e.source), b = pMap.get(e.target);
      if (!a || !b) return null;
      const eStatus = effectiveStatus(e);
      const sameLayer = a.productType === b.productType;

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
            return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + cpR * Math.cos(cp1a)} ${cfg.cy + cpR * Math.sin(cp1a)}, ${cfg.cx + cpR * Math.cos(cp2a)} ${cfg.cy + cpR * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: eStatus === "HEALTHY", eStatus };
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
          return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + cpR * Math.cos(cp1a)} ${cfg.cy + cpR * Math.sin(cp1a)}, ${cfg.cx + cpR * Math.cos(cp2a)} ${cfg.cy + cpR * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: eStatus === "HEALTHY", eStatus };
        }

        const pair = `${a.productType}->${b.productType}`;

        // Source -> Business: bottom of source, top of business
        if (pair === "SOURCE_ALIGNED->BUSINESS") {
          const [x1, y1] = anchorPt(a.x, a.y, a.r + 2, "SOURCE_ALIGNED", "downstream");
          const [x2, y2] = anchorPt(b.x, b.y, b.r + 2, "BUSINESS", "upstream");
          const rCorr = rA + (rB - rA) * cfg.flow.noodle.sourceBusinessCorridor;
          const cp1a = at(0.33);
          const cp2a = at(0.67);
          return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + rCorr * Math.cos(cp1a)} ${cfg.cy + rCorr * Math.sin(cp1a)}, ${cfg.cx + rCorr * Math.cos(cp2a)} ${cfg.cy + rCorr * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: eStatus === "HEALTHY", eStatus };
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
          return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + rBridge * Math.cos(cp1a)} ${cfg.cy + rBridge * Math.sin(cp1a)}, ${cfg.cx + rBridge * Math.cos(cp2a)} ${cfg.cy + rBridge * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: eStatus === "HEALTHY", eStatus };
        }

        // Fallback cross-layer: bottom(inner) -> top(outer)
        const aIsInner = rA < rB;
        const [x1, y1] = radPt(a.x, a.y, a.r + 2, !aIsInner);
        const [x2, y2] = radPt(b.x, b.y, b.r + 2, aIsInner);
        const rCorr = Math.min(rA, rB) + Math.abs(rB - rA) * 0.55;
        const cp1a = at(0.33);
        const cp2a = at(0.67);
        return { ...e, a, b, d: `M ${x1} ${y1} C ${cfg.cx + rCorr * Math.cos(cp1a)} ${cfg.cy + rCorr * Math.sin(cp1a)}, ${cfg.cx + rCorr * Math.cos(cp2a)} ${cfg.cy + rCorr * Math.sin(cp2a)}, ${x2} ${y2}`, healthy: eStatus === "HEALTHY", eStatus };
    }).filter(Boolean) as (GEdge & { a: PNode; b: PNode; d: string; healthy: boolean; eStatus: "HEALTHY" | "BROKEN" | "WARNING" })[];
  }, [graph.edges, pMap, cfg.cx, cfg.cy, cfg.radii, cfg.flow.curveTension, cfg.flow.anchor, cfg.flow.noodle, anchorPt, radPt]);

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
      s.add(sel.id);
      if (showUpDown) {
        lineageEdges.forEach(e => { if (e.source === sel.id) { s.add(`le-${e.id}`); s.add(e.target); } });
        lineageEdges.forEach(e => { if (e.target === sel.id) { s.add(`le-${e.id}`); s.add(e.source); } });
      } else {
        let q = [sel.id]; let v = new Set<string>(); while (q.length) { const p = q.shift()!; if (v.has(p)) continue; v.add(p); lineageEdges.forEach(e => { if (e.source === p) { s.add(`le-${e.id}`); s.add(e.target); q.push(e.target); } }); }
        q = [sel.id]; v = new Set<string>(); while (q.length) { const p = q.shift()!; if (v.has(p)) continue; v.add(p); lineageEdges.forEach(e => { if (e.target === p) { s.add(`le-${e.id}`); s.add(e.source); q.push(e.source); } }); }
      }
      appSourceEdges.forEach(e => { if (s.has(e.productId)) { s.add(e.id); s.add(e.appId); s.add(`dom-${e.domain}`); } });
    }
    return s;
  }, [sel, showUpDown, lineageEdges, appSourceEdges, graph.nodes, allPosApps]);

  const focusOffsets = useMemo(() => {
    const offsets = new Map<string, { dx: number; dy: number }>();
    if (!sel) return offsets;

    const selNode = pNodes.find(n => n.id === sel.id) || (sel.kind === "app" ? allPosApps.find((a: any) => a.id === sel.id) : null);
    if (!selNode) return offsets;

    const centerAngle = -Math.PI / 2;

    const allLinked = pNodes.filter(n => linked.has(n.id));
    const byLayer: Record<string, PNode[]> = {};
    for (const n of allLinked) (byLayer[n.productType] ??= []).push(n);

    for (const [layerType, nodes] of Object.entries(byLayer)) {
      const arcR = cfg.radii[layerType as keyof typeof cfg.radii] ?? 300;
      const count = nodes.length;
      const maxBubbleR = Math.max(...nodes.map(n => n.r), 12);
      const minGapAngle = (maxBubbleR * 2 + 6) / arcR;
      const totalNeeded = count * minGapAngle;
      const spreadAngle = Math.max(totalNeeded / 2, Math.min(0.8, count * 0.1));
      nodes.sort((a, b) => Math.atan2(a.y - cfg.cy, a.x - cfg.cx) - Math.atan2(b.y - cfg.cy, b.x - cfg.cx));
      nodes.forEach((n, i) => {
        const frac = count === 1 ? 0 : (i / (count - 1)) - 0.5;
        const targetAngle = centerAngle + frac * spreadAngle * 2;
        const targetX = cfg.cx + arcR * Math.cos(targetAngle);
        const targetY = cfg.cy + arcR * Math.sin(targetAngle);
        offsets.set(n.id, { dx: targetX - n.x, dy: targetY - n.y });
      });
    }

    // Collision resolution pass: push apart any overlapping bubbles
    const allPlaced = allLinked.filter(n => offsets.has(n.id));
    for (let iter = 0; iter < 5; iter++) {
      let anyMoved = false;
      for (let i = 0; i < allPlaced.length; i++) {
        for (let j = i + 1; j < allPlaced.length; j++) {
          const a = allPlaced[i], b = allPlaced[j];
          const oa = offsets.get(a.id)!, ob = offsets.get(b.id)!;
          const ax = a.x + oa.dx, ay = a.y + oa.dy;
          const bx = b.x + ob.dx, by = b.y + ob.dy;
          const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
          const minDist = a.r + b.r + 6;
          if (dist < minDist && dist > 0.01) {
            anyMoved = true;
            const overlap = (minDist - dist) / 2;
            const ux = (bx - ax) / dist, uy = (by - ay) / dist;
            oa.dx -= ux * overlap; oa.dy -= uy * overlap;
            ob.dx += ux * overlap; ob.dy += uy * overlap;
          }
        }
      }
      if (!anyMoved) break;
    }

    const linkedDomains: string[] = [];
    for (const id of linked) { if (id.startsWith("dom-")) linkedDomains.push(id.slice(4)); }
    // Sort by original angular position to preserve visual order
    linkedDomains.sort((a, b) => {
      const ca = clusters.find(c => c.domain === a);
      const cb = clusters.find(c => c.domain === b);
      if (!ca || !cb) return 0;
      return Math.atan2(ca.cy - cfg.cy, ca.cx - cfg.cx) - Math.atan2(cb.cy - cfg.cy, cb.cx - cfg.cx);
    });
    const domCount = linkedDomains.length;
    const arcR = cfg.radii.APPS ?? 140;
    const domSpread = Math.min(0.45, domCount * 0.08);
    linkedDomains.forEach((domain, i) => {
      const cl = clusters.find(c => c.domain === domain);
      if (!cl) return;
      const frac = domCount === 1 ? 0 : (i / (domCount - 1)) - 0.5;
      const targetAngle = centerAngle + frac * domSpread * 2;
      const targetX = cfg.cx + arcR * Math.cos(targetAngle);
      const targetY = cfg.cy + arcR * Math.sin(targetAngle);
      offsets.set(`dom-${domain}`, { dx: targetX - cl.cx, dy: targetY - cl.cy });
    });

    for (const link of appProductLinks) {
      const app = allPosApps.find((a: any) => a.id === link.app_id);
      if (app && linked.has(app.id)) {
        const domOff = offsets.get(`dom-${(app as any).domain_name}`);
        if (domOff) offsets.set(app.id, domOff);
      }
    }

    return offsets;
  }, [sel, linked, pNodes, cfg.cx, cfg.cy, cfg.radii, allPosApps, clusters, appProductLinks]);

  const selProduct = sel?.kind === "product" ? products.find((p: any) => p.id === sel.id) : null;
  const selApp = sel?.kind === "app" ? (apps as any[]).find(a => a.id === sel.id) : null;

  /* ── Ask AI context builder & sender (needs selProduct/selApp) ── */
  const buildAiContext = useCallback(
    () =>
      buildAiContextString({
        overview,
        execKpis,
        domains,
        products,
        apps,
        productPipelineStatus,
        productPipelineRuns,
        selProduct,
        selApp,
        graph,
        appProductLinks,
        panelTab,
      }),
    [
      overview,
      execKpis,
      domains,
      products,
      apps,
      productPipelineStatus,
      productPipelineRuns,
      selProduct,
      selApp,
      graph,
      appProductLinks,
      panelTab,
    ],
  );

  const sendAiMessage = useCallback(async (text: string) => {
    if (!text.trim() || aiStreaming) return;
    const userMsg = { role: "user" as const, text: text.trim() };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput("");
    setAiStreaming(true);

    const history = aiMessages.map(m => ({
      role: m.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.text }],
    }));

    const controller = new AbortController();
    aiAbortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history, context: buildAiContext() }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setAiMessages(prev => [...prev, { role: "assistant", text: `Error: ${err.error}` }]);
        setAiStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setAiStreaming(false); return; }
      const decoder = new TextDecoder();
      let accumulated = "";
      setAiMessages(prev => [...prev, { role: "assistant", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) { accumulated += `\n\n_Error: ${parsed.error}_`; }
            else if (parsed.text) { accumulated += parsed.text; }
          } catch { /* skip malformed */ }
        }
        setAiMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", text: accumulated };
          return copy;
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setAiMessages(prev => [...prev, { role: "assistant", text: `Error: ${err.message}` }]);
      }
    } finally {
      setAiStreaming(false);
      aiAbortRef.current = null;
    }
  }, [aiMessages, aiStreaming, buildAiContext]);

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

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
  const pipelineCounts = useMemo(() => { let a = 0, b = 0, p = 0; (apps as any[]).forEach((x: any) => { if (x.conn_status === "ACTIVE") a++; else if (x.conn_status === "BROKEN") b++; else p++; }); return { active: a, broken: b, paused: p }; }, [apps]);
  const pipelineAppDetails = useMemo(() => {
    return (apps as any[]).map((app: any) => {
      const sourceLinks = appSourceEdges.filter(e => e.appId === app.id);
      const sourceProductIds = sourceLinks.map(e => e.productId);
      const impacted = new Set<string>();
      const q = [...sourceProductIds];
      const seen = new Set<string>();
      while (q.length) {
        const cur = q.shift()!;
        if (seen.has(cur)) continue;
        seen.add(cur);
        lineageEdges.forEach(e => {
          if (e.source === cur) {
            impacted.add(e.target);
            q.push(e.target);
          }
        });
      }
      const hash = (app.id || "").split("").reduce((s: number, c: string) => s + c.charCodeAt(0), 0);
      const status = app.conn_status === "ACTIVE" ? "ACTIVE" : app.conn_status === "BROKEN" ? "BROKEN" : "PAUSED";
      const reason = status === "ACTIVE"
        ? "No blocking incidents. All contract and freshness checks are within threshold."
        : app.app_type === "API"
          ? "Schema contract mismatch detected on the upstream API payload."
          : app.app_type === "Streaming"
            ? "Consumer lag breached freshness SLA for downstream consumers."
            : app.app_type === "Database"
              ? "Warehouse load task failed after extraction due to a dependency error."
              : "Connector authentication expired during the latest sync window.";
      return {
        ...app,
        status,
        sourceCount: sourceProductIds.length,
        impactedCount: impacted.size,
        severity: status === "BROKEN" ? (impacted.size > 3 ? "P1" : "P2") : status === "PAUSED" ? "P3" : "Healthy",
        lastRunLabel: status === "BROKEN" ? `${5 + (hash % 37)} min ago` : `${1 + (hash % 12)} min ago`,
        reason,
      };
    });
  }, [apps, appSourceEdges, lineageEdges]);
  const filteredPipelineApps = useMemo(() => {
    if (pipelineStatusFilter === "ALL") return pipelineAppDetails;
    return pipelineAppDetails.filter((app: any) => app.status === pipelineStatusFilter);
  }, [pipelineAppDetails, pipelineStatusFilter]);
  const dqByType = useMemo(() => ({ SOURCE_ALIGNED: deriveQualityMetrics(products.filter((p: any) => p.product_type === "SOURCE_ALIGNED")), BUSINESS: deriveQualityMetrics(products.filter((p: any) => p.product_type === "BUSINESS")), CONSUMER_ALIGNED: deriveQualityMetrics(products.filter((p: any) => p.product_type === "CONSUMER_ALIGNED")) }), [products]);

  const searchLower = search.toLowerCase();
  const searchMatch = (name: string) => !search || name.toLowerCase().includes(searchLower);
  const searchHits = useMemo(() => {
    if (!search.trim()) return [] as Array<{ id: string; name: string; score: number }>;
    const q = searchLower.trim();
    const score = (name: string) => {
      const n = name.toLowerCase();
      if (n === q) return 100;
      if (n.startsWith(q)) return 75;
      return n.includes(q) ? 50 : 0;
    };
    return (products as any[])
      .map((p: any) => ({ id: p.id as string, name: p.name as string, score: score(p.name) }))
      .filter(h => h.score > 0);
  }, [search, searchLower, products]);
  const commitSearchSelection = useCallback((productId: string) => {
    setSel({ kind: "product", id: productId });
    setSearch("");
  }, []);
  const applySearchSelection = useCallback(() => {
    if (searchHits.length === 0) return;
    commitSearchSelection(searchHits[0].id);
  }, [searchHits, commitSearchSelection]);
  const rankedSearchHits = useMemo(
    () => [...searchHits].sort((a, b) => (b.score - a.score) || (a.name.length - b.name.length) || a.name.localeCompare(b.name)).slice(0, 8),
    [searchHits]
  );
  const isDim = (id: string, name: string, domainName?: string) => (search && !searchMatch(name)) || (hovDom != null && domainName != null && domainName !== hovDom) || (sel != null && !linked.has(id));

  function productTip(p: any): ReactNode {
    const upN = (upstreamMap[p.id] || []).length;
    const downN = graph.edges.filter((e: { source: string }) => e.source === p.id).length;
    const q = p.quality_score ?? 0;
    const qPct = Math.round(q * 100);
    const qCol = q >= 0.75 ? cfg.green : cfg.red;
    return (
      <div className="space-y-2">
        <div className="font-bold text-[13px] leading-tight" style={{ color: cfg.text }}>{p.name}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: cfg.layerColors[p.product_type] + "33", color: cfg.text }}>{LAYER_SHORT[p.product_type]}</span>
          <span className="text-[10px] text-gray-400">·</span>
          <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: "#4b5563" }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color_hex }} />
            {p.domain_name}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
          <div>
            <div className="text-[8px] uppercase tracking-wide text-gray-400 font-semibold">Quality</div>
            <div className="text-[11px] font-bold tabular-nums" style={{ color: qCol }}>{qPct}%</div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wide text-gray-400 font-semibold">Upstream</div>
            <div className="text-[11px] font-bold text-gray-800 tabular-nums">{upN}</div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wide text-gray-400 font-semibold">Downstream</div>
            <div className="text-[11px] font-bold text-gray-800 tabular-nums">{downN}</div>
          </div>
        </div>
        {(p.owner || p.sla_freshness) && (
          <div className="flex flex-col gap-0.5 text-[10px] text-gray-600 border-t border-gray-100 pt-1.5">
            {p.owner && <div><span className="text-gray-400 font-semibold">Owner</span> {p.owner}</div>}
            {p.sla_freshness && <div><span className="text-gray-400 font-semibold">SLA / refresh</span> {p.sla_freshness}</div>}
          </div>
        )}
        {p.description && (
          <p className="text-gray-500 text-[10px] leading-[1.55] pt-1 border-t border-gray-100 m-0">{p.description.length > 160 ? p.description.slice(0, 158) + "\u2026" : p.description}</p>
        )}
      </div>
    );
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
    const out: Record<string, { dotX: number; dotY: number; textX: number; textY: number }> = {};
    for (const type of ["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const) {
      const [lx, ly] = _arc(cfg.radii[type], 0);
      const adj = cfg.layerLabelPos[type] || { x: 0, y: 0 };
      const baseX = lx - 12;
      const baseY = ly;
      out[type] = { dotX: baseX, dotY: baseY, textX: baseX + adj.x, textY: baseY + adj.y };
    }
    return out;
  }, [cfg.radii, cfg.layerLabelPos, _arc]);
  const appTypes = useMemo(() => { const s = new Set<string>(); (apps as any[]).forEach(a => s.add(a.app_type)); return [...s].sort(); }, [apps]);
  const domainSeparators = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < domainSections.length - 1; i++) {
      const t = domainSections[i].tEnd + DOM_GAP / 2;
      const angle = _tToAngle(t);
      const rI = cfg.radii.APPS - 15, rO = cfg.radii.CONSUMER_ALIGNED + 30;
      lines.push({ x1: cfg.cx + rI * Math.cos(angle), y1: cfg.cy - rI * Math.sin(angle), x2: cfg.cx + rO * Math.cos(angle), y2: cfg.cy - rO * Math.sin(angle) });
    }
    return lines;
  }, [domainSections, cfg.cx, cfg.cy, cfg.radii, _tToAngle]);

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
    if (!IS_AUTHORING) return;
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

  // Generic drag for domain labels, legends, custom texts
  const elemDrag = useRef<{ key: string; grabX: number; grabY: number; origX: number; origY: number } | null>(null);
  const [draggingElem, setDraggingElem] = useState<string | null>(null);

  const onElemDragStart = useCallback((e: React.MouseEvent, key: string, cfgPathX: string, cfgPathY: string, curX: number, curY: number) => {
    if (!IS_AUTHORING) return;
    e.stopPropagation(); e.preventDefault();
    const svgPt = screenToSvg(e.clientX, e.clientY);
    elemDrag.current = { key, grabX: svgPt.x - curX, grabY: svgPt.y - curY, origX: curX, origY: curY };
    setDraggingElem(key);
    const onMove = (ev: MouseEvent) => {
      if (!elemDrag.current) return;
      const cur = screenToSvg(ev.clientX, ev.clientY);
      updateCfg(cfgPathX, Math.round((cur.x - elemDrag.current.grabX) * 10) / 10);
      updateCfg(cfgPathY, Math.round((cur.y - elemDrag.current.grabY) * 10) / 10);
    };
    const onUp = () => { elemDrag.current = null; setDraggingElem(null); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [screenToSvg, updateCfg]);

  const customSepDrag = useRef<{ idx: number; sx: number; sy: number; x1: number; y1: number; x2: number; y2: number } | null>(null);
  const onCustomSepDragStart = useCallback((e: React.MouseEvent, idx: number, l: { id: string; x1: number; y1: number; x2: number; y2: number }) => {
    if (!IS_AUTHORING) return;
    e.stopPropagation();
    e.preventDefault();
    const svgPt = screenToSvg(e.clientX, e.clientY);
    customSepDrag.current = { idx, sx: svgPt.x, sy: svgPt.y, x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 };
    setDraggingElem(`csep-${l.id}`);
    const onMove = (ev: MouseEvent) => {
      const d = customSepDrag.current;
      if (!d) return;
      const cur = screenToSvg(ev.clientX, ev.clientY);
      const dx = cur.x - d.sx;
      const dy = cur.y - d.sy;
      const rnd = (n: number) => Math.round(n * 10) / 10;
      batchUpdateCfg({
        [`customSeparators.${d.idx}.x1`]: rnd(d.x1 + dx),
        [`customSeparators.${d.idx}.y1`]: rnd(d.y1 + dy),
        [`customSeparators.${d.idx}.x2`]: rnd(d.x2 + dx),
        [`customSeparators.${d.idx}.y2`]: rnd(d.y2 + dy),
      });
    };
    const onUp = () => {
      customSepDrag.current = null;
      setDraggingElem(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [screenToSvg, batchUpdateCfg]);

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
      let nx = Math.sin(labelAngle);
      let ny = -Math.cos(labelAngle);
      if (ny < 0) { nx = -nx; ny = -ny; }
      lx += nx * 5;
      lx += pl.xOffset + per.x;
      ly += pl.yOffset + per.y;
      const fontSize = pl.srcSize;
      const label = n.label.length > 12 ? n.label.slice(0, 11) + "\u2026" : n.label;
      const rot = (labelAngle * 180) / Math.PI + pl.rotation + per.rotation;
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
      }
    };

    arcLabel(bizNodes, "BUSINESS", pl.bizSize, 18, pl.bizOffset);
    arcLabel(conNodes, "CONSUMER_ALIGNED", pl.conSize, 22, pl.conOffset);

    return result;
  }, [pNodes, cfg.show.productLabels, cfg.show.smartLabels, cfg.prodLabel, cfg.cy, cfg.cx, cfg.radii]);

  const bdr = cfg.paneBorder;

  return (
    <div style={{ background: cfg.bg }}>
      <div
        ref={stageViewportRef}
        className="relative"
        style={{ height: "100dvh", overflow: "auto" }}
        onScroll={e => setStageScroll({ x: e.currentTarget.scrollLeft, y: e.currentTarget.scrollTop })}
      >
        <div className="relative" style={{ width: stageCanvasWidth, height: stageCanvasHeight }}>
        <div
        style={{
          position: "absolute",
          left: stageLeft,
          top: stageTop,
          width: scaledStageWidth,
          height: scaledStageHeight,
        }}
      >
          <div
            className="flex gap-0"
            style={{
              width: DESIGN_WIDTH,
              height: DESIGN_HEIGHT,
              transform: `scale(${uiZoom})`,
              transformOrigin: "top left",
              background: cfg.bg,
              padding: `${bdr.padTop}px ${bdr.padSide}px ${bdr.padBottom}px ${bdr.padSide}px`,
            }}
          >

        {/* LEFT: SVG Canvas */}
        <div className="flex-1 min-w-0 min-h-0 relative overflow-hidden p-3" style={{ background: cfg.bg, border: `${bdr.width}px solid ${bdr.color}`, borderRadius: `${bdr.radius}px 0 0 ${bdr.radius}px`, borderRight: "none" }} onClick={() => setSel(null)}>

          {cfg.show.searchBar && (() => {
            const su = cfg.searchBarUi;
            const left = `calc(50% - ${su.width / 2}px + ${su.x}px)`;
            const top = `${24 + su.y}px`;
            const shadow = `0 6px 18px rgba(0,0,0,${Math.max(0, Math.min(0.45, su.shadow))})`;
            const startSearchDrag = (startX: number, startY: number) => {
              if (!IS_AUTHORING) return;
              const startCfg = cfg.searchBarUi;
              const onMove = (ev: MouseEvent) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                updateCfg("searchBarUi.x", Math.round(startCfg.x + dx));
                updateCfg("searchBarUi.y", Math.round(startCfg.y + dy));
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            };
            return (
              <div className="absolute z-10" style={{ left, top }} onClick={e => e.stopPropagation()}>
                <div className="relative"
                  style={{ width: su.width }}
                  onMouseDown={e => e.stopPropagation()}>
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 cursor-grab active:cursor-grabbing"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={su.icon}
                    strokeWidth="2"
                    onMouseDown={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      startSearchDrag(e.clientX, e.clientY);
                    }}
                  >
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applySearchSelection();
                      }
                    }}
                    placeholder="Search products"
                    className="w-full pl-10 pr-9 focus:outline-none focus:ring-2"
                    style={{
                      height: su.height,
                      borderRadius: su.radius,
                      background: su.bg,
                      border: `1px solid ${su.border}`,
                      color: su.text,
                      fontSize: su.fontSize,
                      boxShadow: shadow,
                    }}
                  />
                  {search && (
                    <button onClick={e => { e.stopPropagation(); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[15px]"
                      style={{ color: su.icon }}>
                      &times;
                    </button>
                  )}
                  {search.trim() && rankedSearchHits.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${su.border}`, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }}>
                      {rankedSearchHits.map(hit => (
                        <button key={hit.id} className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50 cursor-pointer"
                          onMouseDown={e => e.preventDefault()}
                          onClick={e => {
                            e.stopPropagation();
                            commitSearchSelection(hit.id);
                          }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.layerColors.BUSINESS }} />
                          <span className="font-semibold flex-1 truncate" style={{ color: cfg.text }}>{hit.name}</span>
                          <span className="text-[9px] uppercase text-gray-400">Product</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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
@keyframes idleLive{
  0%{transform:translate(0,0) scale(1);filter:none}
  25%{transform:translate(0.6px,-0.8px) scale(1.02);filter:drop-shadow(0 0 1px currentColor)}
  50%{transform:translate(-0.4px,0.5px) scale(1);filter:none}
  75%{transform:translate(0.5px,0.6px) scale(1.015);filter:drop-shadow(0 0 0.5px currentColor)}
  100%{transform:translate(0,0) scale(1);filter:none}
}
@keyframes idleFlowStream{to{stroke-dashoffset:-40}}
.murmur-node{animation:murmurDrift 3s ease-in-out infinite,murmurGlow 2.5s ease-in-out infinite}
.murmur-line{animation:murmurPulse 1.8s ease-in-out infinite}
.dim-out{opacity:0.06;transform:scale(0.94);transition:opacity 0.35s ease-out,transform 0.4s ease-out}
.idle-node{animation:idleLive 5s ease-in-out infinite}
.idle-flow-dot{stroke-dasharray:1 30;animation:idleFlowStream ${cfg.flow.idleSpeed}s linear infinite;stroke-linecap:round}
.idle-flow-glow{stroke-dasharray:3 25;animation:idleFlowStream ${cfg.flow.idleSpeed}s linear infinite;stroke-linecap:round;filter:drop-shadow(0 0 2px currentColor) drop-shadow(0 0 4px currentColor)}
.idle-flow-arrow{stroke-dasharray:8 4 2 4 2 20;animation:idleFlowStream ${cfg.flow.idleSpeed}s linear infinite;stroke-linecap:butt}
.idle-flow-diamond{stroke-dasharray:1 6 4 6 1 22;animation:idleFlowStream ${cfg.flow.idleSpeed}s linear infinite;stroke-linecap:round}
.idle-flow-dash{stroke-dasharray:10 18;animation:idleFlowStream ${cfg.flow.idleSpeed}s linear infinite;stroke-linecap:round}
.idle-flow-pulse{stroke-dasharray:4 28;animation:idleFlowStream ${cfg.flow.idleSpeed}s linear infinite,idleFlowPulse ${cfg.flow.idleSpeed * 0.6}s ease-in-out infinite;stroke-linecap:round}
.idle-flow-ripple{stroke-dasharray:2 8 2 20;animation:idleFlowStream ${cfg.flow.idleSpeed * 0.8}s linear infinite;stroke-linecap:round;filter:drop-shadow(0 0 1px currentColor)}
.idle-flow-spark{stroke-dasharray:1 18 1 12;animation:idleFlowStream ${cfg.flow.idleSpeed * 0.5}s linear infinite;stroke-linecap:round;filter:drop-shadow(0 0 3px currentColor) drop-shadow(0 0 6px currentColor)}
.idle-flow-trail{stroke-dasharray:16 6 4 14;animation:idleFlowStream ${cfg.flow.idleSpeed * 1.2}s linear infinite;stroke-linecap:round}
.idle-flow-wave{stroke-dasharray:6 3 2 3 6 20;animation:idleFlowStream ${cfg.flow.idleSpeed * 0.7}s linear infinite;stroke-linecap:round}
.idle-flow-morse{stroke-dasharray:2 6 8 6 2 16;animation:idleFlowStream ${cfg.flow.idleSpeed}s linear infinite;stroke-linecap:round}
.idle-flow-comet{stroke-dasharray:12 28;animation:idleFlowStream ${cfg.flow.idleSpeed * 0.6}s linear infinite;stroke-linecap:round;filter:drop-shadow(0 0 2px currentColor)}
.idle-flow-none{stroke-dasharray:none;animation:none}
@keyframes idleFlowPulse{0%,100%{opacity:0.4}50%{opacity:1}}
${cfg.animationPaused ? `.idle-node,.murmur-node,.murmur-line,.fl,.fl-fast,.idle-flow-dot,.idle-flow-glow,.idle-flow-arrow,.idle-flow-diamond,.idle-flow-dash,.idle-flow-pulse,.idle-flow-ripple,.idle-flow-spark,.idle-flow-trail,.idle-flow-wave,.idle-flow-morse,.idle-flow-comet{animation-play-state:paused!important}` : ""}
`}</style>
              <marker id="arrowIn" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#000000" /></marker>
            </defs>

            {cfg.show.arcBands && (["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const).map(type => (
              <g key={`band-${type}`}>
                <path d={_arcPath(cfg.radii[type])} fill="none" stroke={cfg.layerColors[type]} strokeWidth={type === "APPS" ? cfg.arcBand.width * 1.8 : cfg.arcBand.width} opacity={cfg.arcBand.opacity} strokeLinecap="round" />
                <path d={_arcPath(cfg.radii[type])} fill="none" stroke={cfg.layerColors[type]} strokeWidth={1} opacity={cfg.arcBand.opacity * 3} />
              </g>
            ))}

            {cfg.show.separators && domainSeparators.map((l, i) => <line key={`sep-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={cfg.separator.color} strokeWidth={cfg.separator.width} opacity={cfg.separator.opacity} strokeDasharray={`${cfg.separator.dash} ${Math.max(1, cfg.separator.dash - 1)}`} />)}
            {cfg.customSeparators.map((l, sepIdx) => (
              <g key={l.id}>
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke="transparent"
                  strokeWidth={14}
                  strokeLinecap="round"
                  style={{ cursor: draggingElem === `csep-${l.id}` ? "grabbing" : "grab" }}
                  onMouseDown={e => onCustomSepDragStart(e, sepIdx, l)}
                />
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={l.color}
                  strokeWidth={l.width}
                  opacity={l.opacity}
                  strokeDasharray={l.dash > 0 ? `${l.dash} ${Math.max(1, l.dash - 1)}` : undefined}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            ))}

            {cfg.show.layerLabels && (["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const).map(type => {
              const lp = labelPos[type];
              const ox = cfg.typoOffset.layerX, oy = cfg.typoOffset.layerY;
              const adj = cfg.layerLabelPos[type] || { x: 0, y: 0 };
              const isDrag = draggingElem === `layer-lbl-${type}`;
              return (<g key={`lbl-${type}`}>
                <circle cx={lp.dotX + 4 + ox} cy={lp.dotY + oy} r={3.5} fill={cfg.layerColors[type]} opacity={0.7} />
                <text
                  x={lp.textX - 4 + ox}
                  y={lp.textY + 3.5 + oy}
                  textAnchor="end"
                  fill={cfg.text}
                  fontSize={cfg.labelSize}
                  fontWeight={isDrag ? 800 : cfg.labelWeight}
                  letterSpacing="0.04em"
                  opacity={isDrag ? 0.95 : cfg.labelOpacity}
                  style={{ cursor: isDrag ? "grabbing" : "grab" }}
                  onMouseDown={e => onElemDragStart(e, `layer-lbl-${type}`, `layerLabelPos.${type}.x`, `layerLabelPos.${type}.y`, adj.x, adj.y)}>
                  {LAYER_LABEL[type].toUpperCase()}
                </text>
              </g>);
            })}

            {cfg.show.dataFlowArrow && (() => {
              const ap = cfg.arrowPos ?? { x: 0, y: 0 };
              const ax = cfg.vw - cfg.arrowX + ap.x;
              const ay = cfg.arrowY + ap.y;
              const [, conY] = _arc(cfg.radii.CONSUMER_ALIGNED, 0.5);
              const [, appY] = _arc(cfg.radii.APPS, 0.5);
              const rawTop = Math.min(appY, conY) + ay;
              const rawBot = Math.max(appY, conY) + ay;
              const midY = (rawTop + rawBot) / 2;
              const halfLen = ((rawBot - rawTop) / 2) * (cfg.arrowLength ?? 1);
              const topY = midY - halfLen;
              const botY = midY + halfLen;
              const labelY = botY + 14;
              const thirdY = topY + (botY - topY) / 3;
              const ink = "#000000";
              return (<g opacity={cfg.legendUi.dataFlowArrowOpacity} style={{ cursor: draggingElem === "data-arrow" ? "grabbing" : "grab" }}
                onMouseDown={e => onElemDragStart(e, "data-arrow", "arrowPos.x", "arrowPos.y", ap.x, ap.y)}>
                <g transform={`rotate(${cfg.arrowRotation}, ${ax}, ${midY})`}>
                  <path d={`M ${ax} ${topY} L ${ax} ${botY}`} fill="none" stroke={ink} strokeWidth={cfg.legendUi.dataFlowArrowStrokeWidth} markerEnd="url(#arrowIn)" />
                  <text x={ax} y={labelY} textAnchor="middle" fill={ink} fontSize={7} fontWeight={700} letterSpacing="0.1em">{cfg.legendText.dataFlowArrowLabel}</text>
                </g>
              </g>);
            })()}

            {clusters.map(cl => {
              const clDim = (sel && !linked.has(`dom-${cl.domain}`)) || (hovDom != null && hovDom !== cl.domain);
              const isHov = hovDom === cl.domain;
              const domFo = focusOffsets.get(`dom-${cl.domain}`);
              return (<g key={cl.domain}
                className={clDim && sel ? "dim-out" : !sel ? "idle-node" : ""}
                opacity={clDim && !sel ? 0.12 : 1}
                style={{
                  transform: domFo ? `translate(${domFo.dx}px, ${domFo.dy}px)` : undefined,
                  transition: domFo ? "transform 0.8s cubic-bezier(0.34,1.56,0.64,1)" : undefined,
                  transformOrigin: `${cl.cx}px ${cl.cy}px`,
                  animationDelay: !sel ? `${(cl.cx * 11 + cl.cy * 5) % 5000}ms` : undefined,
                }}>

                <circle cx={cl.cx} cy={cl.cy} r={cl.radius} fill={cl.color} fillOpacity={isHov ? cfg.domainBubbleOpacity + 0.08 : cfg.domainBubbleOpacity} stroke={cl.color} strokeWidth={isHov ? 2 : 1.2} strokeOpacity={isHov ? 0.5 : 0.25} />
                {cl.groups.map(g => {
                  const shape = cfg.appCategoryShapes[g.type] || "circle";
                  const gfc = g.color; const gfo = cfg.groupBubbleOpacity; const gso = 0.45;
                  return (<g key={g.type}>
                  {shape === "circle" && <circle cx={g.cx} cy={g.cy} r={g.r} fill={gfc} fillOpacity={gfo} stroke={gfc} strokeWidth={0.8} strokeOpacity={gso} />}
                  {shape === "hexagon" && <polygon points={[0,1,2,3,4,5].map(i => { const ang = Math.PI / 3 * i - Math.PI / 6; return `${g.cx + g.r * Math.cos(ang)},${g.cy + g.r * Math.sin(ang)}`; }).join(" ")} fill={gfc} fillOpacity={gfo} stroke={gfc} strokeWidth={0.8} strokeOpacity={gso} />}
                  {shape === "square" && <rect x={g.cx - g.r * 0.9} y={g.cy - g.r * 0.9} width={g.r * 1.8} height={g.r * 1.8} rx={2} fill={gfc} fillOpacity={gfo} stroke={gfc} strokeWidth={0.8} strokeOpacity={gso} />}
                  {shape === "diamond" && <polygon points={`${g.cx},${g.cy - g.r * 1.15} ${g.cx + g.r * 1.15},${g.cy} ${g.cx},${g.cy + g.r * 1.15} ${g.cx - g.r * 1.15},${g.cy}`} fill={gfc} fillOpacity={gfo} stroke={gfc} strokeWidth={0.8} strokeOpacity={gso} />}
                  {g.apps.map(a => { const isSel = sel?.kind === "app" && sel.id === a.id; const appDim = isDim(a.id, a.name, a.domain_name); return (<g key={a.id} style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); setSel(isSel ? null : { kind: "app", id: a.id }); }} onMouseEnter={e => showTip(e, appTip(a))} onMouseLeave={hideTip}>
                    {isSel && <circle cx={a.x} cy={a.y} r={cfg.appDotR + 4} fill="none" stroke={cfg.layerColors.APPS} strokeWidth={1.5}><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" /></circle>}
                    <circle cx={a.x} cy={a.y} r={cfg.appDotR} fill={appDim ? "#d1d5db" : g.color} stroke={cfg.bg} strokeWidth={0.5} opacity={appDim ? 0.25 : 1} style={{ transition: "all 0.2s" }} />
                  </g>); })}
                </g>);
                })}
                {cfg.show.domainNames && (() => {
                  const domMidT = domainSections.find(s => s.domain === cl.domain);
                  const midT = domMidT ? (domMidT.tStart + domMidT.tEnd) / 2 : 0.5;
                  const [baseLabelX, bandY] = _arc(cfg.radii.APPS, midT);
                  const baseLabelY = bandY + 14;
                  const dp = cfg.domainLabelPos[cl.domain] || { x: 0, y: 0 };
                  const labelX = baseLabelX + cfg.typoOffset.domainX + dp.x;
                  const labelY = baseLabelY + cfg.typoOffset.domainY + dp.y;
                  const isDrag = draggingElem === `dom-lbl-${cl.domain}`;
                  return (<g style={{ cursor: isDrag ? "grabbing" : "grab" }}
                    onMouseDown={e => onElemDragStart(e, `dom-lbl-${cl.domain}`, `domainLabelPos.${cl.domain}.x`, `domainLabelPos.${cl.domain}.y`, dp.x, dp.y)}>
                    <text x={labelX} y={labelY} textAnchor="middle" fill={isDrag ? cfg.layerColors.APPS : cfg.text} fontSize={cfg.domainNameSize} fontWeight={isDrag ? 800 : cfg.labelWeight} opacity={0.55}>{cl.domain}</text>
                    <text x={labelX} y={labelY + 10} textAnchor="middle" fill={cfg.text} fontSize={7} fontWeight={500} opacity={0.3}>{cl.groups.length} types · {cl.groups.reduce((s, g) => s + g.apps.length, 0)} apps</text>
                  </g>);
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
              const fo = focusOffsets.get(n.id);
              return (
                <g key={n.id}
                  style={{
                    transform: fo ? `translate(${fo.dx}px, ${fo.dy}px)` : undefined,
                    transition: fo ? "transform 0.8s cubic-bezier(0.34,1.56,0.64,1)" : undefined,
                  }}>
                  <g
                    className={murmur ? "murmur-node" : dim && sel ? "dim-out" : !sel ? "idle-node" : ""}
                    style={{
                      cursor: "pointer",
                      transformOrigin: `${n.x}px ${n.y}px`,
                      color: layerCol,
                      animationDelay: `${(n.x * 7 + n.y * 3) % 4000}ms`,
                    }}
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
                </g>
              );
            })}

            {/* Flow lines — rendered after bubbles so they're always visible */}
            {appSourceEdges.map(e => {
              const hi = sel ? linked.has(e.id) : false;
              const dim = sel && !hi;
              const issueDim = highlightIssues && e.status === "HEALTHY";
              const issueBoost = highlightIssues && e.status !== "HEALTHY";
              const statusKey = e.status === "BROKEN" ? "broken" : e.status === "WARNING" ? "warning" : "healthy";
              const sov = cfg.flow.statusOverrides[statusKey as keyof typeof cfg.flow.statusOverrides];
              const baseOp = sov?.opacity || cfg.flow.opacity;
              const baseW = sov?.width || cfg.flow.width;
              const op = dim ? 0.02 : issueDim ? 0.015 : hi ? 0.7 : issueBoost ? cfg.flow.issueBoostOpacity : baseOp;
              const w = hi ? cfg.flow.highlightWidth : issueBoost ? cfg.flow.issueBoostWidth : baseW;
              const defaultCol = e.status === "BROKEN" ? cfg.red : e.status === "WARNING" ? cfg.warning : cfg.green;
              const col = sov?.color || defaultCol;
              const fo1 = focusOffsets.get(e.appId);
              const fo2 = focusOffsets.get(e.productId);
              const hasFocus = hi && (fo1 || fo2);
              const app = hasFocus ? allPosApps.find((a: any) => a.id === e.appId) : null;
              const prod = hasFocus ? pMap.get(e.productId) : null;
              let focusD: string | null = null;
              if (hasFocus && app && prod) {
                const acx = (app as any).x + (fo1?.dx ?? 0), acy = (app as any).y + (fo1?.dy ?? 0);
                const pcx = prod.x + (fo2?.dx ?? 0), pcy = prod.y + (fo2?.dy ?? 0);
                const aAng = Math.atan2(acy - cfg.cy, acx - cfg.cx);
                const pAng = Math.atan2(pcy - cfg.cy, pcx - cfg.cx);
                const aR = cfg.appDotR + 2;
                // App bottom (inward, toward center), Source center
                const x1 = acx - Math.cos(aAng) * aR, y1 = acy - Math.sin(aAng) * aR;
                const x2 = pcx, y2 = pcy;
                const midAng = (aAng + pAng) / 2;
                const midR = (cfg.radii.APPS + cfg.radii.SOURCE_ALIGNED) / 2;
                const mx = cfg.cx + midR * Math.cos(midAng);
                const my = cfg.cy + midR * Math.sin(midAng);
                focusD = `M ${x1} ${y1} Q ${mx} ${my}, ${x2} ${y2}`;
              }
              const idleCls = `idle-flow-${sov?.idleStyle || cfg.flow.idleStyle}`;
              const sovAnim = sov?.animation !== false;
              return (<g key={e.id} style={{ transition: "opacity 0.5s ease-out", color: col, pointerEvents: "none" }}>
                <path d={focusD ?? e.d} fill="none" stroke={col} strokeWidth={!sel ? 0.3 : w} opacity={!sel ? op * 0.5 : op} strokeLinecap="round" style={{ transition: "d 0.8s ease-out" }} />
                {!sel && sovAnim && <path d={focusD ?? e.d} fill="none" stroke={col} strokeWidth={w + 0.5} opacity={op * 0.9} className={idleCls} style={{ animationDelay: `${(e.id.charCodeAt(0) * 13) % 3000}ms` }} />}
                {hi && <path d={focusD ?? e.d} fill="none" stroke={col} strokeWidth={w + 0.5} opacity={0.9} className={cfg.show.flowAnimation && sovAnim ? "fl-fast" : "murmur-line"} style={{ transition: "d 0.8s ease-out" }} />}
              </g>);
            })}

            {lineageEdges.map(e => {
              const hi = sel ? linked.has(`le-${e.id}`) : false;
              const dim = sel && !hi;
              const leIssueDim = highlightIssues && e.eStatus === "HEALTHY";
              const leStatusKey = e.eStatus === "BROKEN" ? "broken" : e.eStatus === "WARNING" ? "warning" : "healthy";
              const leIssueBoost = highlightIssues && e.eStatus !== "HEALTHY";
              const leSov = cfg.flow.statusOverrides[leStatusKey as keyof typeof cfg.flow.statusOverrides];
              const leBaseOp = leSov?.opacity || cfg.flow.opacity;
              const leBaseW = leSov?.width || cfg.flow.width;
              const op = dim ? 0.02 : leIssueDim ? 0.015 : hi ? 0.7 : leIssueBoost ? cfg.flow.issueBoostOpacity : leBaseOp;
              const w = hi ? cfg.flow.highlightWidth : leIssueBoost ? cfg.flow.issueBoostWidth : leBaseW;
              const leDefaultCol = e.eStatus === "BROKEN" ? cfg.red : e.eStatus === "WARNING" ? cfg.warning : cfg.green;
              const col = leSov?.color || leDefaultCol;
              const fo1 = focusOffsets.get(e.source);
              const fo2 = focusOffsets.get(e.target);
              const hasFocus = hi && (fo1 || fo2);
              const nodeA = hasFocus ? pMap.get(e.source) : null;
              const nodeB = hasFocus ? pMap.get(e.target) : null;
              let focusD: string | null = null;
              if (hasFocus && nodeA && nodeB) {
                const acx = nodeA.x + (fo1?.dx ?? 0), acy = nodeA.y + (fo1?.dy ?? 0);
                const bcx = nodeB.x + (fo2?.dx ?? 0), bcy = nodeB.y + (fo2?.dy ?? 0);
                const aAng = Math.atan2(acy - cfg.cy, acx - cfg.cx);
                const bAng = Math.atan2(bcy - cfg.cy, bcx - cfg.cx);
                const aR = nodeA.r + 2, bR = nodeB.r + 2;
                const rA = cfg.radii[nodeA.productType as keyof typeof cfg.radii] ?? 300;
                const rB = cfg.radii[nodeB.productType as keyof typeof cfg.radii] ?? 300;
                const sameLayer = nodeA.productType === nodeB.productType;
                if (sameLayer) {
                  // Same layer (biz→biz, consumer→consumer): outward to outward, curve outward
                  const x1 = acx + Math.cos(aAng) * aR, y1 = acy + Math.sin(aAng) * aR;
                  const x2 = bcx + Math.cos(bAng) * bR, y2 = bcy + Math.sin(bAng) * bR;
                  const midAng = (aAng + bAng) / 2;
                  const span = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
                  const lift = Math.max(35, span * 0.6);
                  const mx = (x1 + x2) / 2 + Math.cos(midAng) * lift;
                  const my = (y1 + y2) / 2 + Math.sin(midAng) * lift;
                  focusD = `M ${x1} ${y1} Q ${mx} ${my}, ${x2} ${y2}`;
                } else {
                  // Cross-layer: upstream outward → downstream inward
                  const aIsUpstream = rA < rB;
                  const x1 = acx + (aIsUpstream ? 1 : -1) * Math.cos(aAng) * aR;
                  const y1 = acy + (aIsUpstream ? 1 : -1) * Math.sin(aAng) * aR;
                  const x2 = bcx + (aIsUpstream ? -1 : 1) * Math.cos(bAng) * bR;
                  const y2 = bcy + (aIsUpstream ? -1 : 1) * Math.sin(bAng) * bR;
                  // Curve along the arc between the two layers
                  const midAng = (aAng + bAng) / 2;
                  const midR = (rA + rB) / 2;
                  const mx = cfg.cx + midR * Math.cos(midAng);
                  const my = cfg.cy + midR * Math.sin(midAng);
                  focusD = `M ${x1} ${y1} Q ${mx} ${my}, ${x2} ${y2}`;
                }
              }
              const idleCls = `idle-flow-${leSov?.idleStyle || cfg.flow.idleStyle}`;
              const leSovAnim = leSov?.animation !== false;
              return (<g key={e.id} style={{ transition: "opacity 0.5s ease-out", color: col, pointerEvents: "none" }}>
                <path d={focusD ?? e.d} fill="none" stroke={col} strokeWidth={!sel ? 0.3 : w} opacity={!sel ? op * 0.5 : op} strokeLinecap="round" style={{ transition: "d 0.8s ease-out" }} />
                {!sel && leSovAnim && <path d={focusD ?? e.d} fill="none" stroke={col} strokeWidth={w + 0.5} opacity={op * 0.9} className={idleCls} style={{ animationDelay: `${(e.id.length * 17) % 3000}ms` }} />}
                {hi && <path d={focusD ?? e.d} fill="none" stroke={col} strokeWidth={w + 0.5} opacity={0.9} className={cfg.show.flowAnimation && leSovAnim ? "fl-fast" : "murmur-line"} style={{ transition: "d 0.8s ease-out" }} />}
              </g>);
            })}

            {/* Product labels — draggable, move with bubbles */}
            {visibleLabels.map(item => {
              const dim = isDim(item.n.id, item.n.label, item.n.domainName);
              if (!item.visible) return null;
              const pl = cfg.prodLabel;
              const isDragging = draggingLabelId === item.n.id;
              const isLinkedLabel = sel != null && linked.has(item.n.id);
              const fo = focusOffsets.get(item.n.id);
              return (
                <g key={`plbl-${item.n.id}`}
                  className={dim && sel && !isLinkedLabel ? "dim-out" : ""}
                  opacity={dim && !sel ? 0.05 : 1}
                  style={{
                    transform: fo ? `translate(${fo.dx}px, ${fo.dy}px)` : undefined,
                    transition: isDragging ? "none" : fo ? "transform 0.8s cubic-bezier(0.34,1.56,0.64,1)" : undefined,
                    cursor: isDragging ? "grabbing" : "grab",
                  }}
                  onMouseDown={e => onLabelDragStart(e, item.n.id, item.lx, item.ly)}>
                  {item.stagger && <line x1={item.n.x + item.n.r * Math.cos(Math.atan2(item.n.y - cfg.cy, item.n.x - cfg.cx))} y1={item.n.y + item.n.r * Math.sin(Math.atan2(item.n.y - cfg.cy, item.n.x - cfg.cx))} x2={item.lx} y2={item.ly} stroke={cfg.text} strokeWidth={0.3} opacity={0.15} strokeDasharray="1 1" />}
                  <text x={item.lx} y={item.ly} textAnchor={item.anchor} dominantBaseline="central" fill={isDragging ? cfg.layerColors.APPS : cfg.text} fontSize={item.fontSize} fontWeight={isDragging ? 600 : 400} opacity={pl.opacity} transform={item.rot !== 0 ? `rotate(${item.rot}, ${item.lx}, ${item.ly})` : undefined}>{item.label}</text>
                </g>
              );
            })}

            {/* ═══ LEGENDS — Fragapane-inspired, with global scale ═══ */}
            {(() => {
              const sc = cfg.legendScale ?? 1;
              const lu = cfg.legendUi;
              const lc = (c: string) => (c && c.length > 0 ? c : cfg.text);
              const ANATOMY_LAYERS = ([
                { key: "APPS" as const, label: "Application", color: cfg.layerColors.APPS, dotR: cfg.appDotR, outerR: 10 },
                { key: "SOURCE_ALIGNED" as const, label: "Source Product", color: cfg.layerColors.SOURCE_ALIGNED, dotR: cfg.innerDotR, outerR: 12 },
                { key: "BUSINESS" as const, label: "Business Product", color: cfg.layerColors.BUSINESS, dotR: cfg.innerDotR, outerR: 12 },
                { key: "CONSUMER_ALIGNED" as const, label: "Consumer Product", color: cfg.layerColors.CONSUMER_ALIGNED, dotR: cfg.innerDotR, outerR: 14 },
              ]).map(row => {
                const o = cfg.legendText.anatomyRows[row.key];
                return { ...row, label: o?.label || row.label };
              });
              const bubbleSub =
                (cfg.legendText.bubbleSizeSubtitle || "").trim() ||
                (cfg.bubbleSizeMode === "uniform"
                  ? "Radius is fixed per layer—tune source, business, and consumer sizes in the playground."
                  : "On business & consumer layers, larger rings reflect more upstream lineage products.");
              return (<>

            {cfg.show.domainLegend && (() => {
              const cols = domainOrder.length;
              const cellW = 18 * sc; const gap = 4 * sc;
              const totalW = cols * cellW + (cols - 1) * gap;
              const lp = cfg.legendPos.domain;
              const bx = (cfg.vw - totalW) / 2 + cfg.typoOffset.legendX + lp.x;
              const by = cfg.vh - 16 + cfg.typoOffset.legendY + lp.y;
              return (<g style={{ cursor: draggingElem === "leg-domain" ? "grabbing" : "grab" }}
                onMouseDown={e => onElemDragStart(e, "leg-domain", "legendPos.domain.x", "legendPos.domain.y", lp.x, lp.y)}>
                <text x={bx + totalW / 2} y={by - 22 * sc} textAnchor="middle" fill={lc(lu.domainTitleColor)} fontSize={lu.domainTitleSize * sc} fontWeight={600} opacity={lu.domainTitleOpacity} letterSpacing="0.12em" style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.domainTitle", x: r2.left, y: r2.top, value: cfg.legendText.domainTitle, width: r2.width + 20 }); }}>{cfg.legendText.domainTitle}</text>
                <line x1={bx} x2={bx + totalW} y1={by - 17 * sc} y2={by - 17 * sc} stroke={cfg.text} strokeWidth={0.3} opacity={lu.domainDividerOpacity} />
                {domainOrder.map((name, i) => {
                  const col = domainColorMap[name] || "#999";
                  const cx = bx + i * (cellW + gap) + cellW / 2;
                  const cy2 = by - 4 * sc;
                  const isHov = hovDom === name;
                  return (<g key={name} onMouseEnter={() => setHD(name)} onMouseLeave={() => setHD(null)}>
                    <circle cx={cx} cy={cy2} r={(isHov ? 6 : 4) * sc} fill={col} fillOpacity={isHov ? 0.9 : 0.7} stroke={col} strokeWidth={(isHov ? 1.5 : 0.5) * sc} strokeOpacity={isHov ? 1 : 0.3} style={{ transition: "all 0.2s ease" }} />
                    <text x={cx} y={cy2 - 8 * sc} textAnchor="middle" fill={lc(lu.domainNameColor)} fontSize={lu.domainNameSize * sc} fontWeight={isHov ? 700 : 400} opacity={isHov ? lu.domainNameOpacityHover : lu.domainNameOpacity} letterSpacing="0.02em" style={{ transition: "all 0.2s ease" }}>{name}</text>
                  </g>);
                })}
              </g>);
            })()}

            {cfg.show.appTypeLegend && (() => {
              const types = [...APP_CATEGORIES];
              const cellH = 22 * sc;
              const lp = cfg.legendPos.appType;
              const sx = 14 + cfg.typoOffset.legendX + lp.x;
              const sy = cfg.vh - 36 - types.length * cellH + cfg.typoOffset.legendY + lp.y;
              const r = 7 * sc;
              const dotR = (cfg.appDotR || 3) * sc * 0.6;
              return (<g transform={`translate(${sx},${sy})`} style={{ cursor: draggingElem === "leg-apptype" ? "grabbing" : "grab" }}
                onMouseDown={e => onElemDragStart(e, "leg-apptype", "legendPos.appType.x", "legendPos.appType.y", lp.x, lp.y)}>
                <text x={0} y={-6 * sc} fill={lc(lu.appTypeTitleColor)} fontSize={lu.appTypeTitleSize * sc} fontWeight={600} opacity={lu.appTypeTitleOpacity} letterSpacing="0.12em" style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.appTitle", x: r2.left, y: r2.top, value: cfg.legendText.appTitle, width: r2.width + 20 }); }}>{cfg.legendText.appTitle}</text>
                <line x1={0} x2={110 * sc} y1={-1} y2={-1} stroke={cfg.text} strokeWidth={0.3} opacity={lu.appTypeDividerOpacity} />
                {types.map((type, i) => {
                  const ty = i * cellH + 12 * sc;
                  const fc = cfg.appTypeColors[type] || "#94a3b8";
                  const sh = cfg.appCategoryShapes[type] || "circle";
                  const cx0 = r + 2;
                  return (<g key={type} transform={`translate(${cx0},${ty})`}>
                    {sh === "circle" && <circle r={r} fill={fc} fillOpacity={0.15} stroke={fc} strokeWidth={0.8} strokeOpacity={0.4} />}
                    {sh === "hexagon" && <polygon points={[0,1,2,3,4,5].map(j => { const a = Math.PI / 3 * j - Math.PI / 6; return `${r * Math.cos(a)},${r * Math.sin(a)}`; }).join(" ")} fill={fc} fillOpacity={0.15} stroke={fc} strokeWidth={0.8} strokeOpacity={0.4} />}
                    {sh === "square" && <rect x={-r * 0.85} y={-r * 0.85} width={r * 1.7} height={r * 1.7} rx={1} fill={fc} fillOpacity={0.15} stroke={fc} strokeWidth={0.8} strokeOpacity={0.4} />}
                    {sh === "diamond" && <polygon points={`0,${-r * 1.1} ${r * 1.1},0 0,${r * 1.1} ${-r * 1.1},0`} fill={fc} fillOpacity={0.15} stroke={fc} strokeWidth={0.8} strokeOpacity={0.4} />}
                    <circle r={dotR} fill={fc} fillOpacity={0.8} />
                    <circle r={dotR} cx={dotR * 1.6} cy={-dotR * 1.2} fill={fc} fillOpacity={0.5} />
                    <circle r={dotR * 0.8} cx={-dotR * 1.4} cy={dotR * 1} fill={fc} fillOpacity={0.5} />
                    <text x={r + 8 * sc} y={3.5} fill={lc(lu.appTypeRowColor)} fontSize={lu.appTypeRowSize * sc} fontWeight={400} opacity={lu.appTypeRowOpacity} style={{ cursor: "text" }}
                      onDoubleClick={ev => { ev.stopPropagation(); const r3 = (ev.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: `legendText.appTypeLabels.${type}`, x: r3.left, y: r3.top, value: cfg.legendText.appTypeLabels[type] || type, width: r3.width + 20 }); }}>{cfg.legendText.appTypeLabels[type] || type}</text>
                  </g>);
                })}
              </g>);
            })()}

            {/* ── Data Flow Legend ── */}
            {cfg.show.dataFlowLegend && (() => {
              const lp = cfg.legendPos.dataFlow;
              const bx = cfg.vw - 140 + cfg.typoOffset.legendX + lp.x;
              const by = cfg.vh - 30 + cfg.typoOffset.legendY + lp.y;
              return (<g transform={`translate(${bx}, ${by}) scale(${sc})`} style={{ cursor: draggingElem === "leg-dataflow" ? "grabbing" : "grab" }}
                onMouseDown={e => onElemDragStart(e, "leg-dataflow", "legendPos.dataFlow.x", "legendPos.dataFlow.y", lp.x, lp.y)}>
                <text x={0} y={-4} fill={lc(lu.dataFlowTitleColor)} fontSize={lu.dataFlowTitleSize} fontWeight={600} opacity={lu.dataFlowTitleOpacity} letterSpacing="0.12em" style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.dataFlowTitle", x: r2.left, y: r2.top, value: cfg.legendText.dataFlowTitle, width: r2.width + 20 }); }}>{cfg.legendText.dataFlowTitle}</text>
                <line x1={0} x2={120} y1={1} y2={1} stroke={cfg.text} strokeWidth={0.3} opacity={lu.dataFlowDividerOpacity} />
                <line x1={0} x2={28} y1={12} y2={12} stroke={cfg.text} strokeWidth={0.3} opacity={0.15} />
                <path d="M 0 12 L 28 12" fill="none" stroke={cfg.green} strokeWidth={1.5} strokeDasharray="2 6" opacity={0.7}>
                  <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.5s" repeatCount="indefinite" />
                </path>
                <text x={33} y={14.5} fill={lc(lu.dataFlowLineLabelColor)} fontSize={lu.dataFlowLineLabelSize} fontWeight={400} opacity={lu.dataFlowLineLabelOpacity} style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.pipelineHealthy", x: r2.left, y: r2.top, value: cfg.legendText.pipelineHealthy, width: r2.width + 20 }); }}>{cfg.legendText.pipelineHealthy}</text>
                <line x1={0} x2={28} y1={24} y2={24} stroke={cfg.text} strokeWidth={0.3} opacity={0.15} />
                <path d="M 0 24 L 28 24" fill="none" stroke={cfg.red} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
                <text x={33} y={26.5} fill={lc(lu.dataFlowLineLabelColor)} fontSize={lu.dataFlowLineLabelSize} fontWeight={400} opacity={lu.dataFlowLineLabelOpacity} style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.pipelineBroken", x: r2.left, y: r2.top, value: cfg.legendText.pipelineBroken, width: r2.width + 20 }); }}>{cfg.legendText.pipelineBroken}</text>
                <line x1={0} x2={28} y1={36} y2={36} stroke={cfg.text} strokeWidth={0.3} opacity={0.15} />
                <path d="M 0 36 L 28 36" fill="none" stroke={cfg.warning} strokeWidth={1.5} strokeDasharray="3 4" opacity={0.7} />
                <text x={33} y={38.5} fill={lc(lu.dataFlowLineLabelColor)} fontSize={lu.dataFlowLineLabelSize} fontWeight={400} opacity={lu.dataFlowLineLabelOpacity} style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.pipelineWarning", x: r2.left, y: r2.top, value: cfg.legendText.pipelineWarning, width: r2.width + 20 }); }}>{cfg.legendText.pipelineWarning}</text>
              </g>);
            })()}

            {/* ── Product Anatomy Legend — 4 layers ── */}
            {cfg.show.productAnatomyLegend && (() => {
              const lp = cfg.legendPos.productAnatomy;
              const sx = 14 + cfg.typoOffset.legendX + lp.x;
              const sy = 30 + cfg.typoOffset.legendY + lp.y;
              const rowH = 22 * sc;
              return (<g transform={`translate(${sx},${sy})`} style={{ cursor: draggingElem === "leg-anatomy" ? "grabbing" : "grab" }}
                onMouseDown={e => onElemDragStart(e, "leg-anatomy", "legendPos.productAnatomy.x", "legendPos.productAnatomy.y", lp.x, lp.y)}>
                <text x={0} y={0} fill={lc(lu.anatomyTitleColor)} fontSize={lu.anatomyTitleSize * sc} fontWeight={600} opacity={lu.anatomyTitleOpacity} letterSpacing="0.12em" style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.productLayersTitle", x: r2.left, y: r2.top, value: cfg.legendText.productLayersTitle, width: r2.width + 20 }); }}>{cfg.legendText.productLayersTitle}</text>
                <line x1={0} x2={140 * sc} y1={5 * sc} y2={5 * sc} stroke={cfg.text} strokeWidth={0.3} opacity={lu.anatomyDividerOpacity} />
                {ANATOMY_LAYERS.map((layer, i) => {
                  const ty = 12 * sc + i * rowH;
                  const outerR = layer.outerR * sc * 0.6;
                  const innerR = layer.dotR * sc * 0.55;
                  return (<g key={layer.key} transform={`translate(${outerR + 2},${ty})`}>
                    <circle r={outerR} fill={layer.color} fillOpacity={0.12} stroke={layer.color} strokeWidth={0.8 * sc} strokeOpacity={0.3} />
                    <circle r={innerR} fill={layer.color} fillOpacity={0.65} />
                    <line x1={outerR + 3} x2={outerR + 14 * sc} y1={0} y2={0} stroke={cfg.text} strokeWidth={0.3} opacity={0.15} />
                    <text x={outerR + 16 * sc} y={2} fill={lc(lu.anatomyRowTitleColor)} fontSize={lu.anatomyRowTitleSize * sc} fontWeight={500} opacity={lu.anatomyRowTitleOpacity} style={{ cursor: "text" }}
                      onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: `legendText.anatomyRows.${layer.key}.label`, x: r2.left, y: r2.top, value: layer.label, width: r2.width + 20 }); }}>{layer.label}</text>
                  </g>);
                })}
              </g>);
            })()}

            {cfg.show.bubbleSizeLegend && (() => {
              const lp = cfg.legendPos.bubbleSize;
              const bx = cfg.vw - 210 + cfg.typoOffset.legendX + lp.x;
              const by = cfg.vh - 118 + cfg.typoOffset.legendY + lp.y;
              const rS = lu.bubbleSampleSmallR * sc;
              const rL = lu.bubbleSampleLargeR * sc;
              const colB = cfg.layerColors.BUSINESS;
              const subPx = lu.bubbleSubtitleSize * sc;
              const subLH = subPx * 1.28;
              const subMaxChars = Math.max(18, Math.floor((172 * sc) / Math.max(3.5, subPx * 0.52)));
              const subLines = wrapTextToLines(bubbleSub, subMaxChars);
              const subFirstBaseline = 6.25 * sc + subPx * 0.85;
              const lastSubBaseline = subFirstBaseline + (subLines.length - 1) * subLH;
              const gapAfterSub = 2 * sc;
              const rowY = lastSubBaseline + gapAfterSub + Math.max(rS, rL);
              return (<g transform={`translate(${bx},${by})`} style={{ cursor: draggingElem === "leg-bubblesize" ? "grabbing" : "grab" }}
                onMouseDown={e => onElemDragStart(e, "leg-bubblesize", "legendPos.bubbleSize.x", "legendPos.bubbleSize.y", lp.x, lp.y)}>
                <text x={0} y={0} fill={lc(lu.bubbleTitleColor)} fontSize={lu.bubbleTitleSize * sc} fontWeight={600} opacity={lu.bubbleTitleOpacity} letterSpacing="0.12em" style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.bubbleSizeTitle", x: r2.left, y: r2.top, value: cfg.legendText.bubbleSizeTitle, width: r2.width + 20 }); }}>{cfg.legendText.bubbleSizeTitle}</text>
                <line x1={0} x2={170 * sc} y1={3.5 * sc} y2={3.5 * sc} stroke={cfg.text} strokeWidth={0.3} opacity={0.12} />
                <text
                  x={0}
                  y={subFirstBaseline}
                  fill={lc(lu.bubbleSubtitleColor)}
                  fontSize={subPx}
                  fontWeight={400}
                  opacity={lu.bubbleSubtitleOpacity}
                  style={{ cursor: "text" }}
                  onDoubleClick={e => { e.stopPropagation(); const r2 = (e.target as SVGTextElement).getBoundingClientRect(); setEditingLegendText({ cfgPath: "legendText.bubbleSizeSubtitle", x: r2.left, y: r2.top, value: cfg.legendText.bubbleSizeSubtitle || bubbleSub, width: Math.max(120, r2.width) }); }}>
                  {subLines.map((line, li) => (
                    <tspan key={li} x={0} dy={li === 0 ? 0 : subLH}>{line}</tspan>
                  ))}
                </text>
                <circle cx={rS + 2 * sc} cy={rowY} r={rS} fill={colB} fillOpacity={0.15} stroke={colB} strokeWidth={0.8 * sc} strokeOpacity={0.45} />
                <circle cx={rS * 2 + rL + 28 * sc} cy={rowY} r={rL} fill={colB} fillOpacity={0.15} stroke={colB} strokeWidth={0.8 * sc} strokeOpacity={0.45} />
                <text x={rS * 2 + 8 * sc} y={rowY + subPx * 0.35} fill={lc(lu.bubbleSubtitleColor)} fontSize={5.25 * sc} fontWeight={500} opacity={lu.bubbleSubtitleOpacity * 1.1}>Smaller</text>
                <text x={rS * 2 + rL * 2 + 38 * sc} y={rowY + subPx * 0.35} fill={lc(lu.bubbleSubtitleColor)} fontSize={5.25 * sc} fontWeight={500} opacity={lu.bubbleSubtitleOpacity * 1.1}>Larger</text>
              </g>);
            })()}

              </>);
            })()}

            {/* Custom texts */}
            {cfg.customTexts.map(ct => {
              const ctW = ct.width ?? 240;
              const ctLH = ct.lineHeight ?? 1.5;
              const ctAlign = ct.textAlign || "left";
              const lines = ct.text.split("\n");
              const charsPerLine = Math.max(1, Math.floor(ctW / (ct.fontSize * 0.55)));
              const wrappedLines = lines.reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
              const foH = Math.max(wrappedLines * ct.fontSize * ctLH + 4, ct.fontSize * ctLH + 4);
              return (
                <g key={ct.id} style={{ cursor: draggingElem === `ct-${ct.id}` ? "grabbing" : "grab" }}
                  onMouseDown={e => onElemDragStart(e, `ct-${ct.id}`, `customTexts.${cfg.customTexts.findIndex(c => c.id === ct.id)}.x`, `customTexts.${cfg.customTexts.findIndex(c => c.id === ct.id)}.y`, ct.x, ct.y)}>
                  <foreignObject x={ct.x} y={ct.y} width={ctW} height={foH} overflow="visible">
                    <div style={{ fontSize: ct.fontSize, fontWeight: ct.fontWeight, color: ct.color, opacity: ct.opacity, lineHeight: ctLH, textAlign: ctAlign, width: ctW, wordWrap: "break-word", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                      {ct.text}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* Focus Mode & Pipeline Issues toggle bars — shared styling from cfg.toggleBars */}
          {(() => {
            const tb = cfg.toggleBars;
            const barStyle: React.CSSProperties = { minWidth: tb.minWidth, background: tb.bg, border: `1px solid ${tb.borderColor}`, borderRadius: tb.borderRadius, boxShadow: tb.shadow ? "0 1px 6px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" : "none" };
            return (<>
              <div className="absolute flex items-center select-none group/focus z-[50] hover:z-[200]"
                style={{ ...barStyle, left: focusTogglePos.x, bottom: -focusTogglePos.y }}
                onClick={e => e.stopPropagation()}>
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover/focus:opacity-100 transition-opacity duration-150 delay-100 whitespace-nowrap z-[9999]">
                  <div className="bg-gray-900 text-white text-[9px] px-2.5 py-1.5 rounded-lg shadow-lg max-w-[220px] whitespace-normal text-center leading-tight">Show only direct upstream &amp; downstream connections, hiding the full transitive lineage chain</div>
                </div>
                {IS_AUTHORING && <div className="shrink-0 flex items-center justify-center rounded-l-full px-1.5 py-2 touch-none"
                  style={{ cursor: focusToggleDrag.current ? "grabbing" : "grab" }}
                  onPointerDown={e => { e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId); focusToggleDrag.current = { sx: e.clientX, sy: e.clientY, ox: focusTogglePos.x, oy: focusTogglePos.y }; }}
                  onPointerMove={e => { if (!focusToggleDrag.current) return; setFocusTogglePos({ x: focusToggleDrag.current.ox + (e.clientX - focusToggleDrag.current.sx), y: focusToggleDrag.current.oy - (e.clientY - focusToggleDrag.current.sy) }); }}
                  onPointerUp={e => { focusToggleDrag.current = null; (e.target as HTMLElement).releasePointerCapture(e.pointerId); }}>
                  <svg className="opacity-30" width="5" height="10" viewBox="0 0 5 10"><circle cx="1" cy="1.5" r="0.9" fill="#666" /><circle cx="4" cy="1.5" r="0.9" fill="#666" /><circle cx="1" cy="5" r="0.9" fill="#666" /><circle cx="4" cy="5" r="0.9" fill="#666" /><circle cx="1" cy="8.5" r="0.9" fill="#666" /><circle cx="4" cy="8.5" r="0.9" fill="#666" /></svg>
                </div>}
                <div className="flex items-center gap-2 pr-3 py-1.5" style={{ cursor: "default" }}>
                  <svg width={tb.iconSize} height={tb.iconSize} viewBox="0 0 24 24" fill="none" stroke={showUpDown ? (selProduct ? cfg.layerColors[selProduct.product_type] : selApp ? cfg.layerColors.APPS : tb.activeColor) : tb.inactiveColor} strokeWidth="2" strokeLinecap="round"><path d="M8 6l4-4 4 4M8 18l4 4 4-4M12 2v20" /></svg>
                  <span className="font-semibold whitespace-nowrap" style={{ fontSize: tb.fontSize, color: showUpDown ? tb.activeColor : tb.inactiveColor }}>Lineage Focus Mode</span>
                  <button onClick={() => setShowUpDown(!showUpDown)} className={`w-7 h-[16px] rounded-full cursor-pointer transition-colors relative ${showUpDown ? "bg-gray-800" : "bg-gray-200"}`}>
                    <span className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white shadow transition-transform ${showUpDown ? "left-[13px]" : "left-[2px]"}`} />
                  </button>
                </div>
              </div>

              <div className="absolute flex items-center select-none group/issues z-[50] hover:z-[200]"
                style={{ ...barStyle, left: issuesTogglePos.x, bottom: -issuesTogglePos.y }}
                onClick={e => e.stopPropagation()}>
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover/issues:opacity-100 transition-opacity duration-150 delay-100 whitespace-nowrap z-[9999]">
                  <div className="bg-gray-900 text-white text-[9px] px-2.5 py-1.5 rounded-lg shadow-lg max-w-[220px] whitespace-normal text-center leading-tight">Dim healthy flows and visually emphasize broken &amp; warning pipelines</div>
                </div>
                {IS_AUTHORING && <div className="shrink-0 flex items-center justify-center rounded-l-full px-1.5 py-2 touch-none"
                  style={{ cursor: issuesToggleDrag.current ? "grabbing" : "grab" }}
                  onPointerDown={e => { e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId); issuesToggleDrag.current = { sx: e.clientX, sy: e.clientY, ox: issuesTogglePos.x, oy: issuesTogglePos.y }; }}
                  onPointerMove={e => { if (!issuesToggleDrag.current) return; setIssuesTogglePos({ x: issuesToggleDrag.current.ox + (e.clientX - issuesToggleDrag.current.sx), y: issuesToggleDrag.current.oy - (e.clientY - issuesToggleDrag.current.sy) }); }}
                  onPointerUp={e => { issuesToggleDrag.current = null; (e.target as HTMLElement).releasePointerCapture(e.pointerId); }}>
                  <svg className="opacity-30" width="5" height="10" viewBox="0 0 5 10"><circle cx="1" cy="1.5" r="0.9" fill="#666" /><circle cx="4" cy="1.5" r="0.9" fill="#666" /><circle cx="1" cy="5" r="0.9" fill="#666" /><circle cx="4" cy="5" r="0.9" fill="#666" /><circle cx="1" cy="8.5" r="0.9" fill="#666" /><circle cx="4" cy="8.5" r="0.9" fill="#666" /></svg>
                </div>}
                <div className="flex items-center gap-2 pr-3 py-1.5" style={{ cursor: "default" }}>
                  <svg width={tb.iconSize} height={tb.iconSize} viewBox="0 0 24 24" fill="none" stroke={highlightIssues ? cfg.red : tb.inactiveColor} strokeWidth="2" strokeLinecap="round"><path d="M12 9v2m0 4h.01M5.07 19h13.86c1.33 0 2.17-1.44 1.5-2.59L13.5 4.02a1.73 1.73 0 00-3 0L3.57 16.41C2.9 17.56 3.74 19 5.07 19z" /></svg>
                  <span className="font-semibold whitespace-nowrap" style={{ fontSize: tb.fontSize, color: highlightIssues ? tb.activeColor : tb.inactiveColor }}>Highlight Pipeline Issues</span>
                  <button onClick={() => setHighlightIssues(!highlightIssues)} className={`w-7 h-[16px] rounded-full cursor-pointer transition-colors relative ${highlightIssues ? "bg-gray-800" : "bg-gray-200"}`}>
                    <span className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white shadow transition-transform ${highlightIssues ? "left-[13px]" : "left-[2px]"}`} />
                  </button>
                </div>
              </div>
            </>);
          })()}

          {tip && <div className="fixed z-[200] pointer-events-none" style={{ left: (tip.x - (stageLeft - stageScroll.x) + 16) / uiZoom, top: (tip.y - (stageTop - stageScroll.y) - 8) / uiZoom, transform: "translateY(-100%)" }}><div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 text-[11px] min-w-[220px] max-w-[280px]">{tip.content}</div></div>}

          {IS_AUTHORING && editingLegendText && (
            <div className="absolute z-[150]" style={{ left: editingLegendText.x, top: editingLegendText.y, transform: "translate(-4px, -4px)" }}>
              <input autoFocus type="text" value={editingLegendText.value}
                onChange={e => setEditingLegendText(p => p ? { ...p, value: e.target.value } : null)}
                onBlur={() => { if (editingLegendText) { updateCfg(editingLegendText.cfgPath, editingLegendText.value); } setEditingLegendText(null); }}
                onKeyDown={e => { if (e.key === "Enter") { updateCfg(editingLegendText.cfgPath, editingLegendText.value); setEditingLegendText(null); } if (e.key === "Escape") setEditingLegendText(null); }}
                className="text-[10px] px-1.5 py-0.5 rounded border border-blue-400 bg-white shadow-lg outline-none"
                style={{ width: Math.max(80, editingLegendText.width) }} />
            </div>
          )}

          {/* ═══ PLAYGROUND GEAR + PANEL ═══ */}
          {IS_AUTHORING && (<><button onClick={e => { e.stopPropagation(); setPgOpen(p => !p); }}
            className="absolute bottom-5 right-5 z-30 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-transform"
            style={{ transform: pgOpen ? "rotate(60deg)" : "rotate(0deg)" }} title="Playground Controls">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {pgOpen && (
            <div data-pg-panel className="fixed z-30 w-[300px] max-h-[65vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200"
              style={pgPos ? { left: (pgPos.x - (stageLeft - stageScroll.x)) / uiZoom, top: (pgPos.y - (stageTop - stageScroll.y)) / uiZoom } : { bottom: 80, right: 20 }}
              onClick={e => e.stopPropagation()}>
              <div className="p-4">
                <div data-pg-handle className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing select-none" onMouseDown={onPgDragStart}>
                  <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg> Playground</h3>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => {
                      const allSettings = {
                        playground: cfg,
                        navSettings: (() => { try { const r = localStorage.getItem("meshlens-settings"); return r ? JSON.parse(r) : null; } catch { return null; } })(),
                        focusTogglePos,
                        issuesTogglePos,
                        globalBg: (() => { try { return localStorage.getItem("meshatlas-global-bg"); } catch { return null; } })(),
                        activeThemeId: (() => { try { return localStorage.getItem("meshatlas-active-theme"); } catch { return null; } })(),
                        savedThemes: (() => { try { const r = localStorage.getItem("meshatlas-color-themes"); return r ? JSON.parse(r) : null; } catch { return null; } })(),
                      };
                      navigator.clipboard.writeText(JSON.stringify(allSettings, null, 2));
                      alert("All settings copied to clipboard!");
                    }} className="text-[10px] font-medium text-blue-500 hover:text-blue-700 cursor-pointer px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50" title="Copy ALL settings (playground + nav + positions) as JSON">Export All</button>
                    <button onClick={undoCfg} className="text-[10px] font-medium text-gray-500 hover:text-gray-700 cursor-pointer px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-50 flex items-center gap-1" title="Undo last change"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H12" /><path d="M3 10l4-4M3 10l4 4" /></svg>Undo</button>
                    <button onClick={resetCfg} className="text-[10px] font-medium text-red-500 hover:text-red-700 cursor-pointer px-2 py-0.5 rounded border border-red-200 hover:bg-red-50">Reset</button>
                  </div>
                </div>

                {/* ── Color Theme Selector ── */}
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Color Theme</span>
                    <button onClick={() => setShowThemeSave(p => !p)} className="text-[9px] font-semibold text-blue-500 hover:text-blue-700 cursor-pointer px-1.5 py-0.5 rounded border border-blue-200 hover:bg-blue-50">
                      {showThemeSave ? "Cancel" : "+ Save Current"}
                    </button>
                  </div>
                  {showThemeSave && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <input type="text" value={themeNameInput} onChange={e => setThemeNameInput(e.target.value)} placeholder="Theme name…" className="flex-1 text-[10px] px-2 py-1 rounded border border-gray-300 outline-none focus:border-blue-400" onKeyDown={e => { if (e.key === "Enter" && themeNameInput.trim()) { saveCurrentAsTheme(themeNameInput.trim()); setThemeNameInput(""); setShowThemeSave(false); } }} />
                      <button onClick={() => { if (themeNameInput.trim()) { saveCurrentAsTheme(themeNameInput.trim()); setThemeNameInput(""); setShowThemeSave(false); } }} disabled={!themeNameInput.trim()} className="text-[9px] font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 cursor-pointer disabled:cursor-default px-2.5 py-1 rounded">Save</button>
                    </div>
                  )}
                  <div className="space-y-1">
                    {allThemes.map(theme => {
                      const active = activeThemeId === theme.id;
                      const lc = theme.colors.layerColors;
                      return (
                        <div key={theme.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${active ? "bg-gray-100 ring-1 ring-gray-300" : "hover:bg-gray-50"}`} onClick={() => applyTheme(theme)}>
                          <div className="flex gap-0.5 shrink-0">
                            {[theme.colors.bg, lc.SOURCE_ALIGNED || "#3d9b8f", lc.BUSINESS || "#c5a800", lc.CONSUMER_ALIGNED || "#d96028", theme.colors.green].map((c, i) => (
                              <span key={i} className="w-3 h-3 rounded-full border border-gray-200" style={{ background: c }} />
                            ))}
                          </div>
                          <span className={`text-[10px] flex-1 truncate ${active ? "font-bold text-gray-800" : "font-medium text-gray-600"}`}>{theme.name}</span>
                          {active && <svg className="w-3 h-3 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>}
                          {!theme.builtIn && (
                            <button onClick={e => { e.stopPropagation(); deleteTheme(theme.id); }} className="text-gray-300 hover:text-red-500 cursor-pointer shrink-0" title="Delete theme">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button onClick={() => toggleSection("display")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Display</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.display ? "\u2212" : "+"}</span>
                </button>
                {pgSections.display && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Screen Fit</div>
                    <p className="text-[8px] text-gray-400 mb-1.5 leading-snug">
                      Tunes the whole dashboard stage for your screen while keeping chart coordinates and spacing fixed.
                      Values above `1.0` zoom from the current fit size; on smaller screens the dashboard will scroll instead of ignoring the setting.
                    </p>
                    <SliderRow
                      label="Dashboard Scale"
                      value={cfg.stageScaleFactor ?? 1}
                      min={0.7}
                      max={1.5}
                      step={0.01}
                      inputStep={0.01}
                      unit="x"
                      onChange={v => updateCfg("stageScaleFactor", v)}
                    />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Show / Hide</div>
                    <ToggleRow label="Product Labels" value={cfg.show.productLabels} onChange={v => updateCfg("show.productLabels", v)} />
                    <ToggleRow label="Smart Labels" value={cfg.show.smartLabels} onChange={v => updateCfg("show.smartLabels", v)} />
                    <ToggleRow label="Layer Labels" value={cfg.show.layerLabels} onChange={v => updateCfg("show.layerLabels", v)} />
                    <ToggleRow label="Domain Names" value={cfg.show.domainNames} onChange={v => updateCfg("show.domainNames", v)} />
                    <ToggleRow label="Data Flow Arrow" value={cfg.show.dataFlowArrow} onChange={v => updateCfg("show.dataFlowArrow", v)} />
                    <ToggleRow label="Domain Separators" value={cfg.show.separators} onChange={v => updateCfg("show.separators", v)} />
                    <ToggleRow label="Arc Bands" value={cfg.show.arcBands} onChange={v => updateCfg("show.arcBands", v)} />
                    <ToggleRow label="Flow Animation" value={cfg.show.flowAnimation} onChange={v => updateCfg("show.flowAnimation", v)} />
                    <ToggleRow label="Search Bar" value={cfg.show.searchBar} onChange={v => updateCfg("show.searchBar", v)} />
                    {cfg.show.searchBar && (
                      <>
                        <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Search Bar Layout</div>
                        <p className="text-[8px] text-gray-400 mb-1.5 leading-snug">
                          With the playground open, drag from the space just above the search bar, or tune exact size, position, and visual style here.
                        </p>
                        <SliderRow label="X Offset" value={cfg.searchBarUi.x} min={-500} max={500} step={1} inputStep={1} onChange={v => updateCfg("searchBarUi.x", v)} unit="px" />
                        <SliderRow label="Y Offset" value={cfg.searchBarUi.y} min={-180} max={240} step={1} inputStep={1} onChange={v => updateCfg("searchBarUi.y", v)} unit="px" />
                        <SliderRow label="Width" value={cfg.searchBarUi.width} min={220} max={620} step={2} inputStep={1} onChange={v => updateCfg("searchBarUi.width", v)} unit="px" />
                        <SliderRow label="Height" value={cfg.searchBarUi.height} min={30} max={64} step={1} inputStep={1} onChange={v => updateCfg("searchBarUi.height", v)} unit="px" />
                        <SliderRow label="Corner Radius" value={cfg.searchBarUi.radius} min={4} max={999} step={1} inputStep={1} onChange={v => updateCfg("searchBarUi.radius", v)} unit="px" />
                        <SliderRow label="Font Size" value={cfg.searchBarUi.fontSize} min={9} max={18} step={0.5} inputStep={0.5} onChange={v => updateCfg("searchBarUi.fontSize", v)} unit="px" />
                        <SliderRow label="Shadow Opacity" value={cfg.searchBarUi.shadow} min={0} max={0.4} step={0.01} inputStep={0.01} onChange={v => updateCfg("searchBarUi.shadow", v)} />
                        <ColorRow label="Background" value={cfg.searchBarUi.bg} onChange={v => updateCfg("searchBarUi.bg", v)} />
                        <ColorRow label="Border" value={cfg.searchBarUi.border} onChange={v => updateCfg("searchBarUi.border", v)} />
                        <ColorRow label="Text" value={cfg.searchBarUi.text} onChange={v => updateCfg("searchBarUi.text", v)} />
                        <ColorRow label="Icon / Accent" value={cfg.searchBarUi.icon} onChange={v => updateCfg("searchBarUi.icon", v)} />
                      </>
                    )}
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Tab Dock</div>
                    <ColorRow label="Dock Background" value={cfg.tabDock.bg} onChange={v => updateCfg("tabDock.bg", v)} />
                    <ColorRow label="Active Circle" value={cfg.tabDock.activeColor} onChange={v => updateCfg("tabDock.activeColor", v)} />
                    <ColorRow label="Inactive Circle" value={cfg.tabDock.inactiveColor} onChange={v => updateCfg("tabDock.inactiveColor", v)} />
                    <ColorRow label="Text (Active)" value={cfg.tabDock.textActive} onChange={v => updateCfg("tabDock.textActive", v)} />
                    <ColorRow label="Text (Inactive)" value={cfg.tabDock.textInactive} onChange={v => updateCfg("tabDock.textInactive", v)} />
                    <SliderRow label="Circle Size" value={cfg.tabDock.circleSize} min={28} max={56} step={1} inputStep={1} onChange={v => updateCfg("tabDock.circleSize", v)} unit="px" />
                    <SliderRow label="Icon Size" value={cfg.tabDock.iconSize} min={10} max={24} step={1} inputStep={1} onChange={v => updateCfg("tabDock.iconSize", v)} unit="px" />
                    <SliderRow label="Gap" value={cfg.tabDock.gap} min={0} max={16} step={1} inputStep={1} onChange={v => updateCfg("tabDock.gap", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Animation</div>
                    <ToggleRow label="Pause All Animations" value={cfg.animationPaused ?? false} onChange={v => updateCfg("animationPaused", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Separators</div>
                    <ColorRow label="Color" value={cfg.separator.color} onChange={v => updateCfg("separator.color", v)} />
                    <SliderRow label="Opacity" value={cfg.separator.opacity} min={0.01} max={0.5} step={0.01} onChange={v => updateCfg("separator.opacity", v)} />
                    <SliderRow label="Width" value={cfg.separator.width} min={0.2} max={3} step={0.1} onChange={v => updateCfg("separator.width", v)} unit="px" />
                    <SliderRow label="Dash Length" value={cfg.separator.dash} min={1} max={12} step={1} onChange={v => updateCfg("separator.dash", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Arc Bands</div>
                    <SliderRow label="Opacity" value={cfg.arcBand.opacity} min={0.01} max={0.3} step={0.01} onChange={v => updateCfg("arcBand.opacity", v)} />
                    <SliderRow label="Width" value={cfg.arcBand.width} min={10} max={80} step={2} onChange={v => updateCfg("arcBand.width", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Flow Lines</div>
                    <SliderRow label="Line Width" value={cfg.flow.width} min={0.1} max={12} step={0.1} onChange={v => updateCfg("flow.width", v)} unit="px" />
                    <SliderRow label="Opacity" value={cfg.flow.opacity} min={0.01} max={1} step={0.01} onChange={v => updateCfg("flow.opacity", v)} />
                    <SliderRow label="Highlight Width" value={cfg.flow.highlightWidth} min={0.5} max={12} step={0.5} onChange={v => updateCfg("flow.highlightWidth", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Issue Highlight</div>
                    <SliderRow label="Boost Opacity" value={cfg.flow.issueBoostOpacity} min={0.05} max={1} step={0.05} onChange={v => updateCfg("flow.issueBoostOpacity", v)} />
                    <SliderRow label="Boost Width" value={cfg.flow.issueBoostWidth} min={0.3} max={8} step={0.1} onChange={v => updateCfg("flow.issueBoostWidth", v)} unit="px" />
                    <SliderRow label="Curve Tension" value={cfg.flow.curveTension} min={0} max={1} step={0.05} onChange={v => updateCfg("flow.curveTension", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Idle Animation</div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] text-gray-500 w-[52px] shrink-0">Style</span>
                      <div className="flex gap-1 flex-wrap">
                        {(["dot", "glow", "arrow", "diamond", "dash", "pulse", "ripple", "spark", "trail", "wave", "morse", "comet", "none"] as const).map(s => (
                          <button key={s} onClick={() => updateCfg("flow.idleStyle", s)}
                            className={`px-2 py-0.5 rounded text-[9px] font-medium cursor-pointer transition-colors ${cfg.flow.idleStyle === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <SliderRow label="Speed" value={cfg.flow.idleSpeed} min={1} max={10} step={0.5} onChange={v => updateCfg("flow.idleSpeed", v)} unit="s" />
                    {(["healthy", "broken", "warning"] as const).map(sk => {
                      const so = cfg.flow.statusOverrides[sk];
                      const defCol = sk === "healthy" ? cfg.green : sk === "broken" ? cfg.red : cfg.warning;
                      return (
                        <div key={sk}>
                          <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: so?.color || defCol }} />{sk.charAt(0).toUpperCase() + sk.slice(1)} Flow
                          </div>
                          <ColorRow label="Color" value={so?.color || ""} onChange={v => updateCfg(`flow.statusOverrides.${sk}.color`, v)} />
                          <SliderRow label="Width" value={so?.width || 0} min={0} max={12} step={0.1} onChange={v => updateCfg(`flow.statusOverrides.${sk}.width`, v)} unit="px" />
                          <SliderRow label="Opacity" value={so?.opacity || 0} min={0} max={1} step={0.01} onChange={v => updateCfg(`flow.statusOverrides.${sk}.opacity`, v)} />
                          <ToggleRow label="Animation" value={so?.animation !== false} onChange={v => updateCfg(`flow.statusOverrides.${sk}.animation`, v)} />
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-gray-500 w-[52px] shrink-0">Style</span>
                            <div className="flex gap-1 flex-wrap">
                              {(["", "dot", "glow", "arrow", "diamond", "dash", "pulse", "ripple", "spark", "trail", "wave", "morse", "comet", "none"] as const).map(s => (
                                <button key={s} onClick={() => updateCfg(`flow.statusOverrides.${sk}.idleStyle`, s)}
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-medium cursor-pointer transition-colors ${(so?.idleStyle || "") === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{s || "global"}</button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[8px] text-gray-400 mt-0.5 leading-snug">0 / empty = use global default</p>
                        </div>
                      );
                    })}
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Data Flow Arrow</div>
                    <p className="text-[8px] text-gray-400 mb-1.5 leading-snug">Arrow stroke, head, and label render in solid black on the mesh. Drag the arrow on the canvas to offset.</p>
                    <SliderRow label="Group Opacity" value={cfg.legendUi.dataFlowArrowOpacity} min={0.05} max={1} step={0.05} onChange={v => updateCfg("legendUi.dataFlowArrowOpacity", v)} inputStep={0.01} />
                    <SliderRow label="Stroke Width" value={cfg.legendUi.dataFlowArrowStrokeWidth} min={0.5} max={4} step={0.25} onChange={v => updateCfg("legendUi.dataFlowArrowStrokeWidth", v)} unit="px" inputStep={0.05} />
                    <SliderRow label="X Position" value={cfg.arrowX} min={20} max={1100} step={5} onChange={v => updateCfg("arrowX", v)} unit="px" inputStep={1} />
                    <SliderRow label="Y Offset" value={cfg.arrowY} min={-200} max={200} step={5} onChange={v => updateCfg("arrowY", v)} unit="px" inputStep={1} />
                    <SliderRow label="Length" value={cfg.arrowLength ?? 1} min={0.2} max={2} step={0.05} onChange={v => updateCfg("arrowLength", v)} inputStep={0.01} />
                    <SliderRow label="Rotation" value={cfg.arrowRotation} min={-180} max={180} step={1} onChange={v => updateCfg("arrowRotation", v)} unit={"°"} />
                  </div>
                )}

                <button onClick={() => toggleSection("toggleBars")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Toggle Bars</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.toggleBars ? "\u2212" : "+"}</span>
                </button>
                {pgSections.toggleBars && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-[8px] text-gray-400 mb-1.5 leading-snug">
                      Controls for the Lineage Focus Mode and Highlight Pipeline Issues toggle bars.
                    </p>
                    <SliderRow label="Min Width" value={cfg.toggleBars.minWidth} min={140} max={320} step={2} inputStep={1} onChange={v => updateCfg("toggleBars.minWidth", v)} unit="px" />
                    <SliderRow label="Font Size" value={cfg.toggleBars.fontSize} min={8} max={14} step={0.5} inputStep={0.5} onChange={v => updateCfg("toggleBars.fontSize", v)} unit="px" />
                    <SliderRow label="Icon Size" value={cfg.toggleBars.iconSize} min={10} max={22} step={1} inputStep={1} onChange={v => updateCfg("toggleBars.iconSize", v)} unit="px" />
                    <SliderRow label="Border Radius" value={cfg.toggleBars.borderRadius} min={4} max={9999} step={1} inputStep={1} onChange={v => updateCfg("toggleBars.borderRadius", v)} unit="px" />
                    <ColorRow label="Background" value={cfg.toggleBars.bg} onChange={v => updateCfg("toggleBars.bg", v)} />
                    <ColorRow label="Border Color" value={cfg.toggleBars.borderColor} onChange={v => updateCfg("toggleBars.borderColor", v)} />
                    <ColorRow label="Active Color" value={cfg.toggleBars.activeColor} onChange={v => updateCfg("toggleBars.activeColor", v)} />
                    <ColorRow label="Inactive Color" value={cfg.toggleBars.inactiveColor} onChange={v => updateCfg("toggleBars.inactiveColor", v)} />
                    <ToggleRow label="Drop Shadow" value={cfg.toggleBars.shadow} onChange={v => updateCfg("toggleBars.shadow", v)} />
                  </div>
                )}

                <button onClick={() => toggleSection("legends")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Legends</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.legends ? "\u2212" : "+"}</span>
                </button>
                {pgSections.legends && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Visibility</div>
                    <ToggleRow label="Domain Legend" value={cfg.show.domainLegend} onChange={v => updateCfg("show.domainLegend", v)} />
                    <ToggleRow label="App Categories" value={cfg.show.appTypeLegend} onChange={v => updateCfg("show.appTypeLegend", v)} />
                    <ToggleRow label="Data Flow" value={cfg.show.dataFlowLegend} onChange={v => updateCfg("show.dataFlowLegend", v)} />
                    <ToggleRow label="Product Layers" value={cfg.show.productAnatomyLegend} onChange={v => updateCfg("show.productAnatomyLegend", v)} />
                    <ToggleRow label="Bubble Size" value={cfg.show.bubbleSizeLegend} onChange={v => updateCfg("show.bubbleSizeLegend", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Scale</div>
                    <SliderRow label="Legend Size" value={cfg.legendScale ?? 1} min={0.5} max={3} step={0.1} onChange={v => updateCfg("legendScale", v)} inputStep={0.01} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Titles &amp; copy</div>
                    <div className="mb-1.5">
                      <label className="text-[9px] text-gray-500 mb-0.5 block">Domain legend title</label>
                      <input type="text" value={cfg.legendText.domainTitle} onChange={e => updateCfg("legendText.domainTitle", e.target.value)} className="w-full text-[10px] px-2 py-1 rounded border border-gray-200 bg-white" />
                    </div>
                    <div className="mb-1.5">
                      <label className="text-[9px] text-gray-500 mb-0.5 block">Data-flow box title</label>
                      <input type="text" value={cfg.legendText.dataFlowTitle} onChange={e => updateCfg("legendText.dataFlowTitle", e.target.value)} className="w-full text-[10px] px-2 py-1 rounded border border-gray-200 bg-white" />
                    </div>
                    <div className="mb-1.5">
                      <label className="text-[9px] text-gray-500 mb-0.5 block">Vertical arrow label</label>
                      <input type="text" value={cfg.legendText.dataFlowArrowLabel} onChange={e => updateCfg("legendText.dataFlowArrowLabel", e.target.value)} className="w-full text-[10px] px-2 py-1 rounded border border-gray-200 bg-white" />
                    </div>
                    <div className="mb-1.5">
                      <label className="text-[9px] text-gray-500 mb-0.5 block">Product layers title</label>
                      <input type="text" value={cfg.legendText.productLayersTitle} onChange={e => updateCfg("legendText.productLayersTitle", e.target.value)} className="w-full text-[10px] px-2 py-1 rounded border border-gray-200 bg-white" />
                    </div>
                    <div className="mb-1.5">
                      <label className="text-[9px] text-gray-500 mb-0.5 block">Bubble size title</label>
                      <input type="text" value={cfg.legendText.bubbleSizeTitle} onChange={e => updateCfg("legendText.bubbleSizeTitle", e.target.value)} className="w-full text-[10px] px-2 py-1 rounded border border-gray-200 bg-white" />
                    </div>
                    <div className="mb-1.5">
                      <label className="text-[9px] text-gray-500 mb-0.5 block">Bubble size subtitle (empty = auto from mode)</label>
                      <input type="text" value={cfg.legendText.bubbleSizeSubtitle} onChange={e => updateCfg("legendText.bubbleSizeSubtitle", e.target.value)}
                        placeholder="Auto"
                        className="w-full text-[10px] px-2 py-1 rounded border border-gray-200 bg-white placeholder:text-gray-400" />
                    </div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">App Category Labels</div>
                    <div className="mb-1.5">
                      <label className="text-[9px] text-gray-500 mb-0.5 block">Title</label>
                      <input type="text" value={cfg.legendText.appTitle} onChange={e => updateCfg("legendText.appTitle", e.target.value)}
                        className="w-full text-[10px] px-2 py-1 rounded border border-gray-200 bg-white" />
                    </div>
                    {APP_CATEGORIES.map(type => (
                      <div key={type} className="mb-1.5">
                        <label className="text-[9px] text-gray-500 mb-0.5 block">{type} Label</label>
                        <input type="text" value={cfg.legendText.appTypeLabels[type] || type} onChange={e => updateCfg(`legendText.appTypeLabels.${type}`, e.target.value)}
                          className="w-full text-[10px] px-2 py-1 rounded border border-gray-200 bg-white" />
                      </div>
                    ))}
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Legend typography &amp; color</div>
                    <p className="text-[8px] text-gray-400 mb-1.5">Empty color fields use the main text color. Double-click legend text on the mesh to edit in place.</p>
                    {([
                      ["Domain title", "legendUi.domainTitleSize", "legendUi.domainTitleColor", "legendUi.domainTitleOpacity", "legendUi.domainDividerOpacity"],
                      ["Domain names", "legendUi.domainNameSize", "legendUi.domainNameColor", "legendUi.domainNameOpacity", "legendUi.domainNameOpacityHover"],
                      ["App-type title", "legendUi.appTypeTitleSize", "legendUi.appTypeTitleColor", "legendUi.appTypeTitleOpacity", "legendUi.appTypeDividerOpacity"],
                      ["App-type rows", "legendUi.appTypeRowSize", "legendUi.appTypeRowColor", "legendUi.appTypeRowOpacity", null],
                      ["Data-flow title", "legendUi.dataFlowTitleSize", "legendUi.dataFlowTitleColor", "legendUi.dataFlowTitleOpacity", "legendUi.dataFlowDividerOpacity"],
                      ["Data-flow lines", "legendUi.dataFlowLineLabelSize", "legendUi.dataFlowLineLabelColor", "legendUi.dataFlowLineLabelOpacity", null],
                      ["Anatomy title", "legendUi.anatomyTitleSize", "legendUi.anatomyTitleColor", "legendUi.anatomyTitleOpacity", "legendUi.anatomyDividerOpacity"],
                      ["Anatomy row title", "legendUi.anatomyRowTitleSize", "legendUi.anatomyRowTitleColor", "legendUi.anatomyRowTitleOpacity", null],
                      ["Bubble title", "legendUi.bubbleTitleSize", "legendUi.bubbleTitleColor", "legendUi.bubbleTitleOpacity", null],
                      ["Bubble subtitle", "legendUi.bubbleSubtitleSize", "legendUi.bubbleSubtitleColor", "legendUi.bubbleSubtitleOpacity", null],
                    ] as const).map(([label, sizePath, colorPath, opPath, extraPath]) => (
                      <div key={label} className="mb-2 pb-2 border-b border-gray-50 last:border-0">
                        <div className="text-[9px] font-semibold text-gray-600 mb-1">{label}</div>
                        <SliderRow label="Size" value={(cfg as any)[sizePath.split(".")[0]][sizePath.split(".")[1]]} min={3} max={14} step={0.5} onChange={v => updateCfg(sizePath, v)} unit="px" inputStep={0.1} />
                        <ColorRow label="Color" value={(cfg as any)[colorPath.split(".")[0]][colorPath.split(".")[1]]} onChange={v => updateCfg(colorPath, v)} />
                        <SliderRow label="Opacity" value={(cfg as any)[opPath.split(".")[0]][opPath.split(".")[1]]} min={0.05} max={1} step={0.05} onChange={v => updateCfg(opPath, v)} inputStep={0.01} />
                        {extraPath && <SliderRow label={extraPath.includes("Divider") ? "Divider opacity" : "Hover opacity"} value={(cfg as any)[extraPath.split(".")[0]][extraPath.split(".")[1]]} min={0.05} max={1} step={0.05} onChange={v => updateCfg(extraPath, v)} inputStep={0.01} />}
                      </div>
                    ))}
                    <SliderRow label="Bubble sample (small R)" value={cfg.legendUi.bubbleSampleSmallR} min={2} max={14} step={0.5} onChange={v => updateCfg("legendUi.bubbleSampleSmallR", v)} unit="px" inputStep={0.1} />
                    <SliderRow label="Bubble sample (large R)" value={cfg.legendUi.bubbleSampleLargeR} min={4} max={22} step={0.5} onChange={v => updateCfg("legendUi.bubbleSampleLargeR", v)} unit="px" inputStep={0.1} />
                    <div className="text-[8px] text-gray-400 mt-2">Drag legends and arc layer labels on the chart to reposition</div>
                  </div>
                )}

                <button onClick={() => toggleSection("appShapes")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">App Shapes</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.appShapes ? "\u2212" : "+"}</span>
                </button>
                {pgSections.appShapes && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    {APP_CATEGORIES.map(type => (
                      <div key={type} className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] text-gray-500 w-[60px] shrink-0">{type}</span>
                        <div className="flex gap-1">
                          {(["circle", "hexagon", "square", "diamond"] as const).map(s => (
                            <button key={s} onClick={() => updateCfg(`appCategoryShapes.${type}`, s)}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-medium cursor-pointer ${cfg.appCategoryShapes[type] === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                              {s === "circle" ? "\u25CF" : s === "hexagon" ? "\u2B22" : s === "square" ? "\u25A0" : "\u25C6"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => toggleSection("customTexts")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Custom Texts</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.customTexts ? "\u2212" : "+"}</span>
                </button>
                {pgSections.customTexts && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <button onClick={() => {
                      const id = `ct-${Date.now()}`;
                      const newTexts = [...cfg.customTexts, { id, text: "Title", x: cfg.vw / 2 - 120, y: 30, fontSize: 16, color: cfg.text, fontWeight: 700, opacity: 0.8, width: 240, lineHeight: 1.5, textAlign: "left" as const }];
                      updateCfg("customTexts", newTexts);
                    }} className="w-full text-[10px] py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer font-medium mb-2">+ Add Text</button>
                    {cfg.customTexts.map((ct, idx) => (
                      <div key={ct.id} className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-1 mb-1.5">
                          <textarea value={ct.text} onChange={e => updateCfg(`customTexts.${idx}.text`, e.target.value)} rows={3}
                            className="flex-1 text-[10px] px-2 py-1.5 rounded border border-gray-200 bg-white resize-y leading-relaxed" />
                          <button onClick={() => updateCfg("customTexts", cfg.customTexts.filter(c => c.id !== ct.id))}
                            className="text-red-400 hover:text-red-600 text-[14px] cursor-pointer px-1 mt-0.5">&times;</button>
                        </div>
                        <SliderRowWithInput label="Size" value={ct.fontSize} min={6} max={48} step={1} inputStep={0.1} onChange={v => updateCfg(`customTexts.${idx}.fontSize`, v)} unit="px" />
                        <SliderRowWithInput label="Weight" value={ct.fontWeight} min={100} max={900} step={1} inputStep={1} onChange={v => updateCfg(`customTexts.${idx}.fontWeight`, v)} />
                        <SliderRowWithInput label="Opacity" value={ct.opacity} min={0.1} max={1} step={0.05} inputStep={0.01} onChange={v => updateCfg(`customTexts.${idx}.opacity`, v)} />
                        <SliderRowWithInput label="Width" value={ct.width ?? 240} min={60} max={800} step={5} inputStep={1} onChange={v => updateCfg(`customTexts.${idx}.width`, v)} unit="px" />
                        <SliderRowWithInput label="Line Height" value={ct.lineHeight ?? 1.5} min={1} max={3} step={0.1} inputStep={0.01} onChange={v => updateCfg(`customTexts.${idx}.lineHeight`, v)} />
                        <SliderRowWithInput label="X" value={ct.x} min={0} max={cfg.vw} step={5} inputStep={0.1} onChange={v => updateCfg(`customTexts.${idx}.x`, v)} unit="px" />
                        <SliderRowWithInput label="Y" value={ct.y} min={0} max={cfg.vh} step={5} inputStep={0.1} onChange={v => updateCfg(`customTexts.${idx}.y`, v)} unit="px" />
                        <ColorRow label="Color" value={ct.color} onChange={v => updateCfg(`customTexts.${idx}.color`, v)} />
                        <div className="mt-1">
                          <span className="text-[9px] text-gray-500 block mb-1">Alignment</span>
                          <div className="grid grid-cols-3 gap-1">
                            {CUSTOM_TEXT_ALIGNS.map(a => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => updateCfg(`customTexts.${idx}.textAlign`, a)}
                                className={`text-[8px] py-1 rounded cursor-pointer font-medium capitalize ${(ct.textAlign || "left") === a ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                title={a === "justify" ? "Justify — full width lines" : a === "start" ? "Start — inline start (LTR: left)" : a === "end" ? "End — inline end (LTR: right)" : undefined}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="text-[8px] text-gray-400 mt-1.5">Drag on chart to position</div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => toggleSection("separatorLines")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Separator Lines</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.separatorLines ? "\u2212" : "+"}</span>
                </button>
                {pgSections.separatorLines && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <button
                      onClick={() => {
                        const id = `sep-${Date.now()}`;
                        const nx = cfg.vw * 0.2;
                        const ny = cfg.vh * 0.2;
                        updateCfg("customSeparators", [
                          ...cfg.customSeparators,
                          { id, x1: nx, y1: ny, x2: nx + 220, y2: ny, color: cfg.separator.color, width: 1, opacity: 0.25, dash: 0 },
                        ]);
                      }}
                      className="w-full text-[10px] py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer font-medium mb-2"
                    >
                      + Add Separator Line
                    </button>
                    <p className="text-[8px] text-gray-400 mb-2 leading-snug">Drag any custom line on the mesh to translate it; use sliders for precise endpoints.</p>
                    {cfg.customSeparators.map((ln, idx) => (
                      <div key={ln.id} className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-semibold text-gray-500">Line {idx + 1}</span>
                          <button
                            onClick={() => updateCfg("customSeparators", cfg.customSeparators.filter(l => l.id !== ln.id))}
                            className="text-red-400 hover:text-red-600 text-[14px] cursor-pointer px-1"
                          >
                            &times;
                          </button>
                        </div>
                        <SliderRow label="X1" value={ln.x1} min={0} max={cfg.vw} step={1} onChange={v => updateCfg(`customSeparators.${idx}.x1`, v)} unit="px" />
                        <SliderRow label="Y1" value={ln.y1} min={0} max={cfg.vh} step={1} onChange={v => updateCfg(`customSeparators.${idx}.y1`, v)} unit="px" />
                        <SliderRow label="X2" value={ln.x2} min={0} max={cfg.vw} step={1} onChange={v => updateCfg(`customSeparators.${idx}.x2`, v)} unit="px" />
                        <SliderRow label="Y2" value={ln.y2} min={0} max={cfg.vh} step={1} onChange={v => updateCfg(`customSeparators.${idx}.y2`, v)} unit="px" />
                        <ColorRow label="Color" value={ln.color} onChange={v => updateCfg(`customSeparators.${idx}.color`, v)} />
                        <SliderRow label="Width" value={ln.width} min={0.2} max={8} step={0.1} onChange={v => updateCfg(`customSeparators.${idx}.width`, v)} unit="px" />
                        <SliderRow label="Opacity" value={ln.opacity} min={0.05} max={1} step={0.05} onChange={v => updateCfg(`customSeparators.${idx}.opacity`, v)} />
                        <SliderRow label="Dash" value={ln.dash} min={0} max={24} step={1} onChange={v => updateCfg(`customSeparators.${idx}.dash`, v)} unit="px" />
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" onClick={() => toggleSection("rightPanelSync")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Right panel sync</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.rightPanelSync ? "\u2212" : "+"}</span>
                </button>
                {pgSections.rightPanelSync && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-[9px] text-gray-500 mb-2 leading-snug">
                      Match header typography across Overview, Cost, Catalogue, Quality, and Pipeline: title and subtitle sizes, header text colors, and tab/search-sized controls. Optionally also copy the outer widget shell (background, border, corner radius, section gap).
                    </p>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Source tab</div>
                    <select
                      className="w-full text-[11px] border border-gray-200 rounded px-2 py-1.5 mb-2 bg-white"
                      value={cfg.panelSync.sourcePanel}
                      onChange={e => updateCfg("panelSync.sourcePanel", e.target.value as PlaygroundConfig["panelSync"]["sourcePanel"])}
                    >
                      {PANEL_TABS.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <ToggleRow
                      label="Include widget shell (BG, border, radius, gap)"
                      value={cfg.panelSync.includeWidgetShell}
                      onChange={v => updateCfg("panelSync.includeWidgetShell", v)}
                    />
                    <button
                      type="button"
                      className="mt-2 w-full text-[11px] font-semibold py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 cursor-pointer"
                      onClick={() =>
                        batchUpdateCfg(
                          buildRightPanelSyncUpdates(cfg, cfg.panelSync.sourcePanel, cfg.panelSync.includeWidgetShell),
                        )
                      }
                    >
                      Apply sync to other tabs
                    </button>
                  </div>
                )}

                <button onClick={() => toggleSection("overviewPanel")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Overview Panel</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.overviewPanel ? "\u2212" : "+"}</span>
                </button>
                {pgSections.overviewPanel && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Card Style</div>
                    <ColorRow label="Card BG" value={cfg.overviewPanel.cardBg} onChange={v => updateCfg("overviewPanel.cardBg", v)} />
                    <ColorRow label="Card Border" value={cfg.overviewPanel.cardBorder} onChange={v => updateCfg("overviewPanel.cardBorder", v)} />
                    <SliderRow label="Card Radius" value={cfg.overviewPanel.cardRadius} min={4} max={28} step={2} onChange={v => updateCfg("overviewPanel.cardRadius", v)} unit="px" />
                    <ToggleRow label="Card Shadow" value={cfg.overviewPanel.cardShadow} onChange={v => updateCfg("overviewPanel.cardShadow", v)} />
                    <SliderRow label="Section Gap" value={cfg.overviewPanel.sectionGap} min={8} max={40} step={2} onChange={v => updateCfg("overviewPanel.sectionGap", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Tab Style</div>
                    <ColorRow label="Active BG" value={cfg.overviewPanel.tabBg} onChange={v => updateCfg("overviewPanel.tabBg", v)} />
                    <ColorRow label="Active Text" value={cfg.overviewPanel.tabTextColor} onChange={v => updateCfg("overviewPanel.tabTextColor", v)} />
                    <ColorRow label="Inactive Text" value={cfg.overviewPanel.tabInactiveColor} onChange={v => updateCfg("overviewPanel.tabInactiveColor", v)} />
                    <SliderRow label="Tab Font" value={cfg.overviewPanel.tabFontSize} min={6} max={12} step={0.5} onChange={v => updateCfg("overviewPanel.tabFontSize", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Domain Circles</div>
                    <SliderRow label="Outline Width" value={cfg.overviewPanel.domainOutlineWidth} min={0.5} max={3} step={0.25} onChange={v => updateCfg("overviewPanel.domainOutlineWidth", v)} unit="px" />
                    <SliderRow label="Fill Opacity" value={cfg.overviewPanel.domainFillOpacity} min={0} max={0.2} step={0.01} onChange={v => updateCfg("overviewPanel.domainFillOpacity", v)} />
                    <SliderRow label="Circle Gap" value={cfg.overviewPanel.domainCircleGap} min={4} max={24} step={2} onChange={v => updateCfg("overviewPanel.domainCircleGap", v)} unit="px" />
                    <ColorRow label="Label Color" value={cfg.overviewPanel.domainLabelColor} onChange={v => updateCfg("overviewPanel.domainLabelColor", v)} />
                    <SliderRow label="Label Size" value={cfg.overviewPanel.domainLabelSize} min={5} max={11} step={0.5} onChange={v => updateCfg("overviewPanel.domainLabelSize", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Bubble Sizes</div>
                    <SliderRow label="Type Bubble Size" value={cfg.overviewPanel.typeBubbleSize} min={50} max={120} step={2} onChange={v => updateCfg("overviewPanel.typeBubbleSize", v)} unit="px" />
                    <SliderRow label="Domain Bubble Size" value={cfg.overviewPanel.domainBubbleSize} min={36} max={90} step={2} onChange={v => updateCfg("overviewPanel.domainBubbleSize", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Dot Style</div>
                    <SliderRow label="Type App Dot R" value={cfg.overviewPanel.typeAppDotR} min={1.5} max={8} step={0.5} onChange={v => updateCfg("overviewPanel.typeAppDotR", v)} unit="px" />
                    <SliderRow label="Domain App Dot R" value={cfg.overviewPanel.domainAppDotR} min={1.5} max={6} step={0.5} onChange={v => updateCfg("overviewPanel.domainAppDotR", v)} unit="px" />
                    <SliderRow label="Product Dot R" value={cfg.overviewPanel.productDotR} min={2} max={8} step={0.5} onChange={v => updateCfg("overviewPanel.productDotR", v)} unit="px" />
                    <SliderRow label="Dot Opacity" value={cfg.overviewPanel.dotActiveOpacity} min={0.3} max={1} step={0.05} onChange={v => updateCfg("overviewPanel.dotActiveOpacity", v)} />
                    <SliderRow label="Dot Spacing" value={cfg.overviewPanel.dotSpacing} min={1.5} max={4} step={0.1} onChange={v => updateCfg("overviewPanel.dotSpacing", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Typography</div>
                    <SliderRow label="Section Title" value={cfg.overviewPanel.titleSize} min={7} max={16} step={0.5} onChange={v => updateCfg("overviewPanel.titleSize", v)} unit="px" />
                    <SliderRow label="BAN Number" value={cfg.overviewPanel.banSize} min={14} max={36} step={1} onChange={v => updateCfg("overviewPanel.banSize", v)} unit="px" />
                    <SliderRow label="Label" value={cfg.overviewPanel.labelSize} min={5} max={12} step={0.5} onChange={v => updateCfg("overviewPanel.labelSize", v)} unit="px" />
                    <SliderRow label="Count Size" value={cfg.overviewPanel.countSize} min={8} max={20} step={1} onChange={v => updateCfg("overviewPanel.countSize", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">KPI Cards</div>
                    <ColorRow label="Number Color" value={cfg.overviewPanel.kpiNumberColor} onChange={v => updateCfg("overviewPanel.kpiNumberColor", v)} />
                    <ColorRow label="Label Color" value={cfg.overviewPanel.kpiLabelColor} onChange={v => updateCfg("overviewPanel.kpiLabelColor", v)} />
                    <SliderRow label="Icon BG Opacity" value={cfg.overviewPanel.kpiIconBgOpacity} min={0} max={0.3} step={0.01} onChange={v => updateCfg("overviewPanel.kpiIconBgOpacity", v)} />

                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">No product selected</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Page header</div>
                    <SliderRow label="Title Size" value={cfg.overviewPanel.nsPageTitleSize} min={12} max={28} step={0.5} onChange={v => updateCfg("overviewPanel.nsPageTitleSize", v)} unit="px" />
                    <SliderRow label="Subtitle Size" value={cfg.overviewPanel.nsPageSubtitleSize} min={8} max={16} step={0.5} onChange={v => updateCfg("overviewPanel.nsPageSubtitleSize", v)} unit="px" />
                    <ColorRow label="Title Color" value={cfg.overviewPanel.nsPageTitleColor} onChange={v => updateCfg("overviewPanel.nsPageTitleColor", v)} />
                    <ColorRow label="Subtitle Color" value={cfg.overviewPanel.nsPageSubtitleColor} onChange={v => updateCfg("overviewPanel.nsPageSubtitleColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Mesh Entities card</div>
                    <SliderRow label="Block Title" value={cfg.overviewPanel.nsEntitiesTitleSize} min={10} max={20} step={0.5} onChange={v => updateCfg("overviewPanel.nsEntitiesTitleSize", v)} unit="px" />
                    <SliderRow label="Block Subtitle" value={cfg.overviewPanel.nsEntitiesSubtitleSize} min={8} max={16} step={0.5} onChange={v => updateCfg("overviewPanel.nsEntitiesSubtitleSize", v)} unit="px" />
                    <ColorRow label="Block Title Color" value={cfg.overviewPanel.nsEntitiesTitleColor} onChange={v => updateCfg("overviewPanel.nsEntitiesTitleColor", v)} />
                    <ColorRow label="Block Subtitle Color" value={cfg.overviewPanel.nsEntitiesSubtitleColor} onChange={v => updateCfg("overviewPanel.nsEntitiesSubtitleColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">KPI row icons</div>
                    <SliderRow label="Icon Box" value={cfg.overviewPanel.nsKpiIconBox} min={24} max={48} step={1} onChange={v => updateCfg("overviewPanel.nsKpiIconBox", v)} unit="px" />
                    <SliderRow label="Icon SVG" value={cfg.overviewPanel.nsKpiIconSvg} min={12} max={28} step={1} onChange={v => updateCfg("overviewPanel.nsKpiIconSvg", v)} unit="px" />

                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">Selected Product View</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Banner</div>
                    <SliderRow label="Name Size" value={cfg.overviewPanel.selBannerNameSize} min={10} max={22} step={0.5} onChange={v => updateCfg("overviewPanel.selBannerNameSize", v)} unit="px" />
                    <SliderRow label="Desc Size" value={cfg.overviewPanel.selBannerDescSize} min={6} max={14} step={0.5} onChange={v => updateCfg("overviewPanel.selBannerDescSize", v)} unit="px" />
                    <SliderRow label="Label Size" value={cfg.overviewPanel.selBannerLabelSize} min={5} max={12} step={0.5} onChange={v => updateCfg("overviewPanel.selBannerLabelSize", v)} unit="px" />
                    <SliderRow label="Star Size" value={cfg.overviewPanel.selStarSize} min={8} max={18} step={0.5} onChange={v => updateCfg("overviewPanel.selStarSize", v)} unit="px" />
                    <SliderRow label="Domain Size" value={cfg.overviewPanel.selDomainSize} min={6} max={14} step={0.5} onChange={v => updateCfg("overviewPanel.selDomainSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Banner Colors</div>
                    <ColorRow label="Overline" value={cfg.overviewPanel.selBannerOverlineColor} onChange={v => updateCfg("overviewPanel.selBannerOverlineColor", v)} />
                    <ColorRow label="Title" value={cfg.overviewPanel.selBannerTitleColor} onChange={v => updateCfg("overviewPanel.selBannerTitleColor", v)} />
                    <ColorRow label="Description" value={cfg.overviewPanel.selBannerDescColor} onChange={v => updateCfg("overviewPanel.selBannerDescColor", v)} />
                    <ColorRow label="Pill / Stars" value={cfg.overviewPanel.selBannerPillTextColor} onChange={v => updateCfg("overviewPanel.selBannerPillTextColor", v)} />
                    <ColorRow label="Domain" value={cfg.overviewPanel.selBannerDomainTextColor} onChange={v => updateCfg("overviewPanel.selBannerDomainTextColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">KPI Cards</div>
                    <SliderRow label="Value Size" value={cfg.overviewPanel.selKpiValueSize} min={10} max={28} step={1} onChange={v => updateCfg("overviewPanel.selKpiValueSize", v)} unit="px" />
                    <SliderRow label="Label Size" value={cfg.overviewPanel.selKpiLabelSize} min={5} max={12} step={0.5} onChange={v => updateCfg("overviewPanel.selKpiLabelSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">KPI Colors (empty = default)</div>
                    <ColorRow label="Quality — value" value={cfg.overviewPanel.selKpiQualityValueColor} onChange={v => updateCfg("overviewPanel.selKpiQualityValueColor", v)} />
                    <ColorRow label="Quality — label" value={cfg.overviewPanel.selKpiQualityLabelColor} onChange={v => updateCfg("overviewPanel.selKpiQualityLabelColor", v)} />
                    <ColorRow label="Rating — value" value={cfg.overviewPanel.selKpiRatingValueColor} onChange={v => updateCfg("overviewPanel.selKpiRatingValueColor", v)} />
                    <ColorRow label="Rating — label" value={cfg.overviewPanel.selKpiRatingLabelColor} onChange={v => updateCfg("overviewPanel.selKpiRatingLabelColor", v)} />
                    <ColorRow label="SLA — value" value={cfg.overviewPanel.selKpiSlaValueColor} onChange={v => updateCfg("overviewPanel.selKpiSlaValueColor", v)} />
                    <ColorRow label="SLA — label" value={cfg.overviewPanel.selKpiSlaLabelColor} onChange={v => updateCfg("overviewPanel.selKpiSlaLabelColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Lineage Sections</div>
                    <SliderRow label="Section Header" value={cfg.overviewPanel.selSectionHeaderSize} min={6} max={14} step={0.5} onChange={v => updateCfg("overviewPanel.selSectionHeaderSize", v)} unit="px" />
                    <SliderRow label="Item Name" value={cfg.overviewPanel.selItemNameSize} min={7} max={14} step={0.5} onChange={v => updateCfg("overviewPanel.selItemNameSize", v)} unit="px" />
                    <SliderRow label="Item Dot" value={cfg.overviewPanel.selItemDotSize} min={4} max={12} step={0.5} onChange={v => updateCfg("overviewPanel.selItemDotSize", v)} unit="px" />
                    <SliderRow label="Layer Label" value={cfg.overviewPanel.selLayerLabelSize} min={5} max={12} step={0.5} onChange={v => updateCfg("overviewPanel.selLayerLabelSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Lineage Colors</div>
                    <ColorRow label="Section title" value={cfg.overviewPanel.selLineageSectionTitleColor} onChange={v => updateCfg("overviewPanel.selLineageSectionTitleColor", v)} />
                    <ColorRow label="Item text" value={cfg.overviewPanel.selLineageItemTextColor} onChange={v => updateCfg("overviewPanel.selLineageItemTextColor", v)} />
                    <ColorRow label="Clear selection" value={cfg.overviewPanel.selClearLinkColor} onChange={v => updateCfg("overviewPanel.selClearLinkColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Card Style</div>
                    <SliderRow label="Card Radius" value={cfg.overviewPanel.selCardRadius} min={4} max={20} step={1} onChange={v => updateCfg("overviewPanel.selCardRadius", v)} unit="px" />
                    <ColorRow label="Card BG" value={cfg.overviewPanel.selCardBg} onChange={v => updateCfg("overviewPanel.selCardBg", v)} />
                    <ColorRow label="Card Border" value={cfg.overviewPanel.selCardBorder} onChange={v => updateCfg("overviewPanel.selCardBorder", v)} />
                    <SliderRow label="Section Gap" value={cfg.overviewPanel.selSectionGap} min={4} max={24} step={2} onChange={v => updateCfg("overviewPanel.selSectionGap", v)} unit="px" />
                  </div>
                )}

                <button onClick={() => toggleSection("costPanel")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Cost Panel</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.costPanel ? "\u2212" : "+"}</span>
                </button>
                {pgSections.costPanel && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Widget Style</div>
                    <ColorRow label="Widget BG" value={cfg.costPanel.widgetBg} onChange={v => updateCfg("costPanel.widgetBg", v)} />
                    <ColorRow label="Widget Border" value={cfg.costPanel.widgetBorder} onChange={v => updateCfg("costPanel.widgetBorder", v)} />
                    <SliderRow label="Corner Radius" value={cfg.costPanel.widgetRadius} min={4} max={24} step={2} onChange={v => updateCfg("costPanel.widgetRadius", v)} unit="px" />
                    <SliderRow label="Section Gap" value={cfg.costPanel.sectionGap} min={6} max={30} step={2} onChange={v => updateCfg("costPanel.sectionGap", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Typography</div>
                    <SliderRow label="Title Size" value={cfg.costPanel.titleSize} min={10} max={20} step={0.5} onChange={v => updateCfg("costPanel.titleSize", v)} unit="px" />
                    <SliderRow label="BAN Size" value={cfg.costPanel.banSize} min={14} max={32} step={1} onChange={v => updateCfg("costPanel.banSize", v)} unit="px" />
                    <SliderRow label="Label Size" value={cfg.costPanel.labelSize} min={6} max={13} step={0.5} onChange={v => updateCfg("costPanel.labelSize", v)} unit="px" />
                    <SliderRow label="Tab Size" value={cfg.costPanel.tabSize} min={6} max={11} step={0.5} onChange={v => updateCfg("costPanel.tabSize", v)} unit="px" />
                    <ColorRow label="Muted Color" value={cfg.costPanel.mutedColor} onChange={v => updateCfg("costPanel.mutedColor", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Trend Chart</div>
                    <SliderRow label="Chart Height" value={cfg.costPanel.chartHeight} min={80} max={200} step={5} onChange={v => updateCfg("costPanel.chartHeight", v)} unit="px" />
                    <SliderRow label="Left Padding" value={cfg.costPanel.chartPadLeft} min={30} max={70} step={2} onChange={v => updateCfg("costPanel.chartPadLeft", v)} unit="px" />
                    <SliderRow label="Right Padding" value={cfg.costPanel.chartPadRight} min={0} max={30} step={2} onChange={v => updateCfg("costPanel.chartPadRight", v)} unit="px" />
                    <SliderRow label="Top Padding" value={cfg.costPanel.chartPadTop} min={0} max={20} step={1} onChange={v => updateCfg("costPanel.chartPadTop", v)} unit="px" />
                    <SliderRow label="Bottom Padding" value={cfg.costPanel.chartPadBottom} min={12} max={30} step={1} onChange={v => updateCfg("costPanel.chartPadBottom", v)} unit="px" />
                    <SliderRow label="Line Width" value={cfg.costPanel.lineWidth} min={1} max={4} step={0.25} onChange={v => updateCfg("costPanel.lineWidth", v)} unit="px" />
                    <ColorRow label="Line Color" value={cfg.costPanel.chartLineColor || "#auto"} onChange={v => updateCfg("costPanel.chartLineColor", v)} />
                    <ColorRow label="Area Fill" value={cfg.costPanel.chartAreaColor || "#auto"} onChange={v => updateCfg("costPanel.chartAreaColor", v)} />
                    <SliderRow label="Area Opacity" value={cfg.costPanel.chartAreaOpacity} min={0} max={0.5} step={0.01} onChange={v => updateCfg("costPanel.chartAreaOpacity", v)} />
                    <SliderRow label="Dot Radius" value={cfg.costPanel.dotRadius} min={1} max={5} step={0.5} onChange={v => updateCfg("costPanel.dotRadius", v)} unit="px" />
                    <ColorRow label="Dot Fill" value={cfg.costPanel.dotFill} onChange={v => updateCfg("costPanel.dotFill", v)} />
                    <ColorRow label="Dot Stroke" value={cfg.costPanel.chartDotStrokeColor || "#auto"} onChange={v => updateCfg("costPanel.chartDotStrokeColor", v)} />
                    <SliderRow label="Dot Stroke Width" value={cfg.costPanel.dotStrokeWidth} min={0.5} max={3} step={0.1} onChange={v => updateCfg("costPanel.dotStrokeWidth", v)} unit="px" />
                    <ColorRow label="Grid Color" value={cfg.costPanel.chartGridColor} onChange={v => updateCfg("costPanel.chartGridColor", v)} />
                    <SliderRow label="Grid Width" value={cfg.costPanel.chartGridWidth} min={0.2} max={2} step={0.1} onChange={v => updateCfg("costPanel.chartGridWidth", v)} unit="px" />
                    <SliderRow label="Axis Font Size" value={cfg.costPanel.chartAxisFontSize} min={5} max={12} step={0.5} onChange={v => updateCfg("costPanel.chartAxisFontSize", v)} unit="px" />
                    <ColorRow label="Axis Color" value={cfg.costPanel.chartAxisColor} onChange={v => updateCfg("costPanel.chartAxisColor", v)} />
                    <SliderRow label="Month Font Size" value={cfg.costPanel.chartMonthFontSize} min={5} max={12} step={0.5} onChange={v => updateCfg("costPanel.chartMonthFontSize", v)} unit="px" />
                    <ColorRow label="Month Color" value={cfg.costPanel.chartMonthColor} onChange={v => updateCfg("costPanel.chartMonthColor", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Category Bars & Colors</div>
                    <SliderRow label="Bar Height" value={cfg.costPanel.barHeight} min={2} max={10} step={0.5} onChange={v => updateCfg("costPanel.barHeight", v)} unit="px" />
                    <ColorRow label="Ingestion" value={cfg.costPanel.catIngestionColor} onChange={v => updateCfg("costPanel.catIngestionColor", v)} />
                    <ColorRow label="Processing" value={cfg.costPanel.catProcessingColor} onChange={v => updateCfg("costPanel.catProcessingColor", v)} />
                    <ColorRow label="Orchestration" value={cfg.costPanel.catOrchestrationColor} onChange={v => updateCfg("costPanel.catOrchestrationColor", v)} />
                    <ColorRow label="Storage" value={cfg.costPanel.catStorageColor} onChange={v => updateCfg("costPanel.catStorageColor", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Product Table</div>
                    <SliderRow label="Table Max Height" value={cfg.costPanel.tableMaxHeight} min={80} max={400} step={10} onChange={v => updateCfg("costPanel.tableMaxHeight", v)} unit="px" />
                    <SliderRow label="Table Font Size" value={cfg.costPanel.tableFontSize} min={5} max={12} step={0.5} onChange={v => updateCfg("costPanel.tableFontSize", v)} unit="px" />
                    <ColorRow label="Header BG" value={cfg.costPanel.tableHeaderBg} onChange={v => updateCfg("costPanel.tableHeaderBg", v)} />
                    <ColorRow label="Header Color" value={cfg.costPanel.tableHeaderColor} onChange={v => updateCfg("costPanel.tableHeaderColor", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Colors</div>
                    <ColorRow label="Positive (down)" value={cfg.costPanel.posColor} onChange={v => updateCfg("costPanel.posColor", v)} />
                    <ColorRow label="Negative (up)" value={cfg.costPanel.negColor} onChange={v => updateCfg("costPanel.negColor", v)} />

                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">No product selected</div>
                    <ColorRow label="Page title color" value={cfg.costPanel.nsPageTitleColor} onChange={v => updateCfg("costPanel.nsPageTitleColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">BANs & category strip</div>
                    <SliderRow label="Caption (THIS MO…)" value={cfg.costPanel.nsCaptionSize} min={5} max={12} step={0.5} onChange={v => updateCfg("costPanel.nsCaptionSize", v)} unit="px" />
                    <SliderRow label="Delta %" value={cfg.costPanel.nsDeltaSize} min={6} max={14} step={0.5} onChange={v => updateCfg("costPanel.nsDeltaSize", v)} unit="px" />
                    <SliderRow label="“vs last month”" value={cfg.costPanel.nsVsLabelSize} min={5} max={12} step={0.5} onChange={v => updateCfg("costPanel.nsVsLabelSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Trend chart header</div>
                    <SliderRow label="Total $ size" value={cfg.costPanel.nsTrendTotalSize} min={10} max={28} step={0.5} onChange={v => updateCfg("costPanel.nsTrendTotalSize", v)} unit="px" />
                    <SliderRow label="“yearly” size" value={cfg.costPanel.nsTrendYearSize} min={6} max={14} step={0.5} onChange={v => updateCfg("costPanel.nsTrendYearSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Product table</div>
                    <SliderRow label="Domain (sub)" value={cfg.costPanel.nsTableDomainSize} min={4} max={11} step={0.5} onChange={v => updateCfg("costPanel.nsTableDomainSize", v)} unit="px" />
                    <SliderRow label="Sort / $% buttons" value={cfg.costPanel.nsSortBtnSize} min={5} max={12} step={0.5} onChange={v => updateCfg("costPanel.nsSortBtnSize", v)} unit="px" />

                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">Selected Product View</div>
                    <SliderRow label="Title Size" value={cfg.costPanel.selTitleSize} min={10} max={22} step={0.5} onChange={v => updateCfg("costPanel.selTitleSize", v)} unit="px" />
                    <SliderRow label="BAN Size" value={cfg.costPanel.selBanSize} min={14} max={32} step={1} onChange={v => updateCfg("costPanel.selBanSize", v)} unit="px" />
                    <SliderRow label="Label Size" value={cfg.costPanel.selLabelSize} min={6} max={14} step={0.5} onChange={v => updateCfg("costPanel.selLabelSize", v)} unit="px" />
                    <SliderRow label="Category Label" value={cfg.costPanel.selCatLabelSize} min={6} max={14} step={0.5} onChange={v => updateCfg("costPanel.selCatLabelSize", v)} unit="px" />
                    <SliderRow label="Trend Tab" value={cfg.costPanel.selTrendTabSize} min={5} max={11} step={0.5} onChange={v => updateCfg("costPanel.selTrendTabSize", v)} unit="px" />
                    <SliderRow label="Bar Height" value={cfg.costPanel.selBarHeight} min={2} max={10} step={0.5} onChange={v => updateCfg("costPanel.selBarHeight", v)} unit="px" />
                    <ColorRow label="Muted Color" value={cfg.costPanel.selMutedColor} onChange={v => updateCfg("costPanel.selMutedColor", v)} />
                    <SliderRow label="App Name" value={cfg.costPanel.selAppNameSize} min={7} max={14} step={0.5} onChange={v => updateCfg("costPanel.selAppNameSize", v)} unit="px" />
                    <SliderRow label="App Cost" value={cfg.costPanel.selAppCostSize} min={6} max={14} step={0.5} onChange={v => updateCfg("costPanel.selAppCostSize", v)} unit="px" />
                    <ColorRow label="Positive" value={cfg.costPanel.posColor} onChange={v => updateCfg("costPanel.posColor", v)} />
                    <ColorRow label="Negative" value={cfg.costPanel.negColor} onChange={v => updateCfg("costPanel.negColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Title & muted (selected)</div>
                    <ColorRow label="Page title" value={cfg.costPanel.selTitleColor} onChange={v => updateCfg("costPanel.selTitleColor", v)} />
                    <ColorRow label="Muted override" value={cfg.costPanel.selMutedOverride} onChange={v => updateCfg("costPanel.selMutedOverride", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Selected product cards (overview-style)</div>
                    <ColorRow label="Card BG" value={cfg.costPanel.selWidgetBg} onChange={v => updateCfg("costPanel.selWidgetBg", v)} />
                    <ColorRow label="Card border" value={cfg.costPanel.selWidgetBorder} onChange={v => updateCfg("costPanel.selWidgetBorder", v)} />
                    <SliderRow label="Section gap (product selected)" value={cfg.costPanel.selSectionGap} min={4} max={28} step={2} onChange={v => updateCfg("costPanel.selSectionGap", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Cost trend chart (selected product)</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Layout</div>
                    <SliderRow label="Chart width" value={cfg.costPanel.selChartWidth} min={260} max={420} step={5} onChange={v => updateCfg("costPanel.selChartWidth", v)} unit="px" />
                    <SliderRow label="Chart height" value={cfg.costPanel.selChartHeight} min={72} max={200} step={4} onChange={v => updateCfg("costPanel.selChartHeight", v)} unit="px" />
                    <SliderRow label="Pad left" value={cfg.costPanel.selChartPadLeft} min={20} max={64} step={2} onChange={v => updateCfg("costPanel.selChartPadLeft", v)} unit="px" />
                    <SliderRow label="Pad right" value={cfg.costPanel.selChartPadRight} min={0} max={48} step={2} onChange={v => updateCfg("costPanel.selChartPadRight", v)} unit="px" />
                    <SliderRow label="Pad top" value={cfg.costPanel.selChartPadTop} min={0} max={24} step={1} onChange={v => updateCfg("costPanel.selChartPadTop", v)} unit="px" />
                    <SliderRow label="Pad bottom" value={cfg.costPanel.selChartPadBottom} min={10} max={40} step={1} onChange={v => updateCfg("costPanel.selChartPadBottom", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Style</div>
                    <ColorRow label="Grid" value={cfg.costPanel.selChartGridColor} onChange={v => updateCfg("costPanel.selChartGridColor", v)} />
                    <SliderRow label="Grid line width" value={cfg.costPanel.selChartGridLineWidth} min={0.2} max={2} step={0.1} onChange={v => updateCfg("costPanel.selChartGridLineWidth", v)} unit="px" />
                    <ColorRow label="Axis" value={cfg.costPanel.selChartAxisColor} onChange={v => updateCfg("costPanel.selChartAxisColor", v)} />
                    <ColorRow label="Month labels" value={cfg.costPanel.selChartMonthColor} onChange={v => updateCfg("costPanel.selChartMonthColor", v)} />
                    <ColorRow label="Line (empty = layer)" value={cfg.costPanel.selChartLineColor} onChange={v => updateCfg("costPanel.selChartLineColor", v)} />
                    <SliderRow label="Area opacity" value={cfg.costPanel.selChartAreaOpacity} min={0} max={0.5} step={0.01} onChange={v => updateCfg("costPanel.selChartAreaOpacity", v)} />
                    <SliderRow label="Line width" value={cfg.costPanel.selChartLineWidth} min={0.5} max={4} step={0.25} onChange={v => updateCfg("costPanel.selChartLineWidth", v)} unit="px" />
                    <SliderRow label="Dot radius" value={cfg.costPanel.selChartDotRadius} min={0.5} max={5} step={0.5} onChange={v => updateCfg("costPanel.selChartDotRadius", v)} unit="px" />
                    <ColorRow label="Dot fill" value={cfg.costPanel.selChartDotFill} onChange={v => updateCfg("costPanel.selChartDotFill", v)} />
                    <SliderRow label="Dot stroke width" value={cfg.costPanel.selChartDotStrokeWidth} min={0.5} max={3} step={0.1} onChange={v => updateCfg("costPanel.selChartDotStrokeWidth", v)} unit="px" />
                    <SliderRow label="Axis font" value={cfg.costPanel.selChartAxisFontSize} min={5} max={12} step={0.5} onChange={v => updateCfg("costPanel.selChartAxisFontSize", v)} unit="px" />
                    <SliderRow label="Month font" value={cfg.costPanel.selChartMonthFontSize} min={5} max={12} step={0.5} onChange={v => updateCfg("costPanel.selChartMonthFontSize", v)} unit="px" />
                  </div>
                )}

                <button onClick={() => toggleSection("cataloguePanel")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Catalogue Panel</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.cataloguePanel ? "\u2212" : "+"}</span>
                </button>
                {pgSections.cataloguePanel && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Page</div>
                    <ColorRow label="Widget BG" value={cfg.cataloguePanel.widgetBg} onChange={v => updateCfg("cataloguePanel.widgetBg", v)} />
                    <ColorRow label="Widget Border" value={cfg.cataloguePanel.widgetBorder} onChange={v => updateCfg("cataloguePanel.widgetBorder", v)} />
                    <SliderRow label="Corner Radius" value={cfg.cataloguePanel.widgetRadius} min={4} max={24} step={2} onChange={v => updateCfg("cataloguePanel.widgetRadius", v)} unit="px" />
                    <SliderRow label="Section Gap" value={cfg.cataloguePanel.sectionGap} min={4} max={24} step={2} onChange={v => updateCfg("cataloguePanel.sectionGap", v)} unit="px" />
                    <ColorRow label="Header Text" value={cfg.cataloguePanel.headerTextColor} onChange={v => updateCfg("cataloguePanel.headerTextColor", v)} />
                    <ColorRow label="Header Sub" value={cfg.cataloguePanel.headerSubColor} onChange={v => updateCfg("cataloguePanel.headerSubColor", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Tabs</div>
                    <SliderRow label="Tab Height" value={cfg.cataloguePanel.tabHeight} min={24} max={50} step={2} onChange={v => updateCfg("cataloguePanel.tabHeight", v)} unit="px" />
                    <SliderRow label="Tab Radius" value={cfg.cataloguePanel.tabRadius} min={4} max={16} step={1} onChange={v => updateCfg("cataloguePanel.tabRadius", v)} unit="px" />
                    <SliderRow label="Tab Label" value={cfg.cataloguePanel.tabFontSize} min={6} max={12} step={0.5} onChange={v => updateCfg("cataloguePanel.tabFontSize", v)} unit="px" />
                    <SliderRow label="Tab Count" value={cfg.cataloguePanel.tabCountSize} min={8} max={22} step={1} onChange={v => updateCfg("cataloguePanel.tabCountSize", v)} unit="px" />
                    <ColorRow label="Active Text" value={cfg.cataloguePanel.tabActiveTextColor} onChange={v => updateCfg("cataloguePanel.tabActiveTextColor", v)} />
                    <ColorRow label="Inactive Text" value={cfg.cataloguePanel.tabInactiveTextColor} onChange={v => updateCfg("cataloguePanel.tabInactiveTextColor", v)} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Search Bar</div>
                    <ColorRow label="Search BG" value={cfg.cataloguePanel.searchBg} onChange={v => updateCfg("cataloguePanel.searchBg", v)} />
                    <ColorRow label="Search Border" value={cfg.cataloguePanel.searchBorder} onChange={v => updateCfg("cataloguePanel.searchBorder", v)} />
                    <ColorRow label="Search Text" value={cfg.cataloguePanel.searchTextColor} onChange={v => updateCfg("cataloguePanel.searchTextColor", v)} />
                    <ColorRow label="Placeholder" value={cfg.cataloguePanel.searchPlaceholderColor} onChange={v => updateCfg("cataloguePanel.searchPlaceholderColor", v)} />
                    <SliderRow label="Font Size" value={cfg.cataloguePanel.searchFontSize} min={7} max={14} step={0.5} onChange={v => updateCfg("cataloguePanel.searchFontSize", v)} unit="px" />
                    <SliderRow label="Radius" value={cfg.cataloguePanel.searchRadius} min={4} max={16} step={1} onChange={v => updateCfg("cataloguePanel.searchRadius", v)} unit="px" />
                    <SliderRow label="Height" value={cfg.cataloguePanel.searchHeight} min={20} max={40} step={2} onChange={v => updateCfg("cataloguePanel.searchHeight", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Grid Layout</div>
                    <SliderRow label="Columns" value={cfg.cataloguePanel.gridCols} min={1} max={3} step={1} onChange={v => updateCfg("cataloguePanel.gridCols", v)} />
                    <SliderRow label="Grid Gap" value={cfg.cataloguePanel.gridGap} min={4} max={16} step={1} onChange={v => updateCfg("cataloguePanel.gridGap", v)} unit="px" />
                    <SliderRow label="Max Height" value={cfg.cataloguePanel.listMaxHeight} min={200} max={600} step={20} onChange={v => updateCfg("cataloguePanel.listMaxHeight", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Product Card</div>
                    <ColorRow label="Card BG" value={cfg.cataloguePanel.cardBg} onChange={v => updateCfg("cataloguePanel.cardBg", v)} />
                    <ColorRow label="Card Border" value={cfg.cataloguePanel.cardBorder} onChange={v => updateCfg("cataloguePanel.cardBorder", v)} />
                    <ColorRow label="Card Hover" value={cfg.cataloguePanel.cardHoverBg} onChange={v => updateCfg("cataloguePanel.cardHoverBg", v)} />
                    <SliderRow label="Card Radius" value={cfg.cataloguePanel.cardRadius} min={4} max={20} step={1} onChange={v => updateCfg("cataloguePanel.cardRadius", v)} unit="px" />
                    <ToggleRow label="Card Shadow" value={cfg.cataloguePanel.cardShadow} onChange={v => updateCfg("cataloguePanel.cardShadow", v)} />
                    <ToggleRow label="Show Banner" value={cfg.cataloguePanel.showBanner} onChange={v => updateCfg("cataloguePanel.showBanner", v)} />
                    <SliderRow label="Banner Strip" value={cfg.cataloguePanel.bannerHeight} min={1} max={12} step={1} onChange={v => updateCfg("cataloguePanel.bannerHeight", v)} unit="px" />
                    <ColorRow label="Separator" value={cfg.cataloguePanel.separatorColor} onChange={v => updateCfg("cataloguePanel.separatorColor", v)} />
                    <SliderRow label="Domain Dot" value={cfg.cataloguePanel.domainDotSize} min={3} max={10} step={0.5} onChange={v => updateCfg("cataloguePanel.domainDotSize", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Typography</div>
                    <SliderRow label="Title Size" value={cfg.cataloguePanel.titleSize} min={10} max={20} step={0.5} onChange={v => updateCfg("cataloguePanel.titleSize", v)} unit="px" />
                    <SliderRow label="Subtitle" value={cfg.cataloguePanel.subtitleSize} min={7} max={14} step={0.5} onChange={v => updateCfg("cataloguePanel.subtitleSize", v)} unit="px" />
                    <SliderRow label="Card Name" value={cfg.cataloguePanel.cardNameSize} min={7} max={14} step={0.5} onChange={v => updateCfg("cataloguePanel.cardNameSize", v)} unit="px" />
                    <ColorRow label="Name Color" value={cfg.cataloguePanel.cardNameColor} onChange={v => updateCfg("cataloguePanel.cardNameColor", v)} />
                    <SliderRow label="Card Meta" value={cfg.cataloguePanel.cardMetaSize} min={5} max={11} step={0.5} onChange={v => updateCfg("cataloguePanel.cardMetaSize", v)} unit="px" />
                    <SliderRow label="Description" value={cfg.cataloguePanel.cardDescSize} min={5} max={11} step={0.5} onChange={v => updateCfg("cataloguePanel.cardDescSize", v)} unit="px" />
                    <SliderRow label="Tag Font" value={cfg.cataloguePanel.tagFontSize} min={4} max={10} step={0.5} onChange={v => updateCfg("cataloguePanel.tagFontSize", v)} unit="px" />
                    <SliderRow label="Tag Radius" value={cfg.cataloguePanel.tagRadius} min={2} max={8} step={1} onChange={v => updateCfg("cataloguePanel.tagRadius", v)} unit="px" />
                    <SliderRow label="Star Size" value={cfg.cataloguePanel.starSize} min={5} max={14} step={0.5} onChange={v => updateCfg("cataloguePanel.starSize", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Info Icon</div>
                    <SliderRow label="Icon Size" value={cfg.cataloguePanel.infoIconSize} min={16} max={32} step={1} onChange={v => updateCfg("cataloguePanel.infoIconSize", v)} unit="px" />
                    <ColorRow label="Icon BG" value={cfg.cataloguePanel.infoIconBg} onChange={v => updateCfg("cataloguePanel.infoIconBg", v)} />
                    <ColorRow label="Active BG" value={cfg.cataloguePanel.infoIconActiveBg} onChange={v => updateCfg("cataloguePanel.infoIconActiveBg", v)} />
                    <ColorRow label="Icon Color" value={cfg.cataloguePanel.infoIconColor} onChange={v => updateCfg("cataloguePanel.infoIconColor", v)} />
                    <ColorRow label="Active Color" value={cfg.cataloguePanel.infoIconActiveColor} onChange={v => updateCfg("cataloguePanel.infoIconActiveColor", v)} />
                    <SliderRow label="Rubric Width" value={cfg.cataloguePanel.rubricWidth} min={160} max={320} step={10} onChange={v => updateCfg("cataloguePanel.rubricWidth", v)} unit="px" />
                    <SliderRow label="Rubric Title" value={cfg.cataloguePanel.rubricTitleSize} min={5} max={12} step={0.5} onChange={v => updateCfg("cataloguePanel.rubricTitleSize", v)} unit="px" />
                    <SliderRow label="Rubric Stars" value={cfg.cataloguePanel.rubricStarSize} min={4} max={12} step={0.5} onChange={v => updateCfg("cataloguePanel.rubricStarSize", v)} unit="px" />
                    <SliderRow label="Rubric Label" value={cfg.cataloguePanel.rubricLabelSize} min={5} max={12} step={0.5} onChange={v => updateCfg("cataloguePanel.rubricLabelSize", v)} unit="px" />
                    <SliderRow label="Rubric Desc" value={cfg.cataloguePanel.rubricDescSize} min={4} max={10} step={0.5} onChange={v => updateCfg("cataloguePanel.rubricDescSize", v)} unit="px" />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Colors</div>
                    <ColorRow label="Meta Color" value={cfg.cataloguePanel.metaColor} onChange={v => updateCfg("cataloguePanel.metaColor", v)} />
                    <ColorRow label="Desc Color" value={cfg.cataloguePanel.descColor} onChange={v => updateCfg("cataloguePanel.descColor", v)} />
                    <ColorRow label="Tag BG" value={cfg.cataloguePanel.tagBg} onChange={v => updateCfg("cataloguePanel.tagBg", v)} />
                    <ColorRow label="Tag Color" value={cfg.cataloguePanel.tagColor} onChange={v => updateCfg("cataloguePanel.tagColor", v)} />

                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">No product selected</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Layer tabs (icons)</div>
                    <SliderRow label="Icon wrap box" value={cfg.cataloguePanel.nsTabIconWrap} min={16} max={36} step={1} onChange={v => updateCfg("cataloguePanel.nsTabIconWrap", v)} unit="px" />
                    <SliderRow label="Icon SVG" value={cfg.cataloguePanel.nsTabIconSvg} min={8} max={20} step={0.5} onChange={v => updateCfg("cataloguePanel.nsTabIconSvg", v)} unit="px" />

                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">Selected Product View</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Card design</div>
                    <SliderRow label="Section gap (product selected)" value={cfg.cataloguePanel.selSectionGap} min={4} max={28} step={1} onChange={v => updateCfg("cataloguePanel.selSectionGap", v)} unit="px" />
                    <SliderRow label="Hero radius" value={cfg.cataloguePanel.selHeroRadius} min={0} max={28} step={1} onChange={v => updateCfg("cataloguePanel.selHeroRadius", v)} unit="px" />
                    <SliderRow label="Hero padding" value={cfg.cataloguePanel.selHeroPadding} min={8} max={32} step={2} onChange={v => updateCfg("cataloguePanel.selHeroPadding", v)} unit="px" />
                    <SliderRow label="Hero watermark opacity" value={cfg.cataloguePanel.selHeroDecorOpacity} min={0} max={60} step={1} onChange={v => updateCfg("cataloguePanel.selHeroDecorOpacity", v)} unit="%" />
                    <SliderRow label="Card radius" value={cfg.cataloguePanel.selCardRadius} min={0} max={24} step={1} onChange={v => updateCfg("cataloguePanel.selCardRadius", v)} unit="px" />
                    <ToggleRow label="Card shadow" value={cfg.cataloguePanel.selCardShadow} onChange={v => updateCfg("cataloguePanel.selCardShadow", v)} />
                    <SliderRow label="Card body padding" value={cfg.cataloguePanel.selCardBodyPadding} min={4} max={24} step={1} onChange={v => updateCfg("cataloguePanel.selCardBodyPadding", v)} unit="px" />
                    <SliderRow label="Section header pad X" value={cfg.cataloguePanel.selCardHeaderPadX} min={4} max={24} step={1} onChange={v => updateCfg("cataloguePanel.selCardHeaderPadX", v)} unit="px" />
                    <SliderRow label="Section header pad Y" value={cfg.cataloguePanel.selCardHeaderPadY} min={4} max={20} step={1} onChange={v => updateCfg("cataloguePanel.selCardHeaderPadY", v)} unit="px" />
                    <SliderRow label="Tint — card border" value={cfg.cataloguePanel.selTintCardBorder} min={0} max={40} step={0.5} onChange={v => updateCfg("cataloguePanel.selTintCardBorder", v)} unit="%" />
                    <SliderRow label="Tint — header fill" value={cfg.cataloguePanel.selTintHeaderBg} min={0} max={25} step={0.5} onChange={v => updateCfg("cataloguePanel.selTintHeaderBg", v)} unit="%" />
                    <SliderRow label="Tint — header rule" value={cfg.cataloguePanel.selTintHeaderRule} min={0} max={30} step={0.5} onChange={v => updateCfg("cataloguePanel.selTintHeaderRule", v)} unit="%" />
                    <SliderRow label="Tint — row dividers" value={cfg.cataloguePanel.selTintRowRule} min={0} max={25} step={0.5} onChange={v => updateCfg("cataloguePanel.selTintRowRule", v)} unit="%" />
                    <SliderRow label="Tint — icon plate" value={cfg.cataloguePanel.selTintIconBg} min={0} max={25} step={0.5} onChange={v => updateCfg("cataloguePanel.selTintIconBg", v)} unit="%" />
                    <SliderRow label="Scorecard inner padding" value={cfg.cataloguePanel.selScorecardBodyPadding} min={4} max={20} step={1} onChange={v => updateCfg("cataloguePanel.selScorecardBodyPadding", v)} unit="px" />
                    <SliderRow label="Scorecard tile gap" value={cfg.cataloguePanel.selScorecardGridGap} min={2} max={16} step={1} onChange={v => updateCfg("cataloguePanel.selScorecardGridGap", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Widget shell (details + scorecard)</div>
                    <ColorRow label="Widget BG" value={cfg.cataloguePanel.selWidgetBg} onChange={v => updateCfg("cataloguePanel.selWidgetBg", v)} />
                    <ColorRow label="Widget border" value={cfg.cataloguePanel.selWidgetBorder} onChange={v => updateCfg("cataloguePanel.selWidgetBorder", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Banner</div>
                    <SliderRow label="Name Size" value={cfg.cataloguePanel.selBannerNameSize} min={10} max={22} step={0.5} onChange={v => updateCfg("cataloguePanel.selBannerNameSize", v)} unit="px" />
                    <SliderRow label="Desc Size" value={cfg.cataloguePanel.selBannerDescSize} min={6} max={14} step={0.5} onChange={v => updateCfg("cataloguePanel.selBannerDescSize", v)} unit="px" />
                    <SliderRow label="Label Size" value={cfg.cataloguePanel.selBannerLabelSize} min={5} max={12} step={0.5} onChange={v => updateCfg("cataloguePanel.selBannerLabelSize", v)} unit="px" />
                    <SliderRow label="Star Size" value={cfg.cataloguePanel.selStarSize} min={8} max={20} step={0.5} onChange={v => updateCfg("cataloguePanel.selStarSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Product Details</div>
                    <SliderRow label="Detail Label" value={cfg.cataloguePanel.selDetailLabelSize} min={5} max={12} step={0.5} onChange={v => updateCfg("cataloguePanel.selDetailLabelSize", v)} unit="px" />
                    <SliderRow label="Detail Value" value={cfg.cataloguePanel.selDetailValueSize} min={6} max={14} step={0.5} onChange={v => updateCfg("cataloguePanel.selDetailValueSize", v)} unit="px" />
                    <SliderRow label="Detail Icon" value={cfg.cataloguePanel.selDetailIconSize} min={6} max={16} step={0.5} onChange={v => updateCfg("cataloguePanel.selDetailIconSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Scorecard</div>
                    <SliderRow label="Label Size" value={cfg.cataloguePanel.selScorecardLabelSize} min={5} max={14} step={0.5} onChange={v => updateCfg("cataloguePanel.selScorecardLabelSize", v)} unit="px" />
                    <SliderRow label="Value Size" value={cfg.cataloguePanel.selScorecardValueSize} min={5} max={14} step={0.5} onChange={v => updateCfg("cataloguePanel.selScorecardValueSize", v)} unit="px" />
                    <SliderRow label="Bar Height" value={cfg.cataloguePanel.selScorecardBarHeight} min={1} max={8} step={0.5} onChange={v => updateCfg("cataloguePanel.selScorecardBarHeight", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Banner Colors</div>
                    <ColorRow label="Title" value={cfg.cataloguePanel.selBannerTitleColor} onChange={v => updateCfg("cataloguePanel.selBannerTitleColor", v)} />
                    <ColorRow label="Description" value={cfg.cataloguePanel.selBannerDescColor} onChange={v => updateCfg("cataloguePanel.selBannerDescColor", v)} />
                    <ColorRow label="Label / meta" value={cfg.cataloguePanel.selBannerLabelColor} onChange={v => updateCfg("cataloguePanel.selBannerLabelColor", v)} />
                    <ColorRow label="Banner icon stroke" value={cfg.cataloguePanel.selBannerIconStroke} onChange={v => updateCfg("cataloguePanel.selBannerIconStroke", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Product Details</div>
                    <ColorRow label="Section title" value={cfg.cataloguePanel.selDetailSectionTitleColor} onChange={v => updateCfg("cataloguePanel.selDetailSectionTitleColor", v)} />
                    <ColorRow label="Row label" value={cfg.cataloguePanel.selDetailLabelColor} onChange={v => updateCfg("cataloguePanel.selDetailLabelColor", v)} />
                    <ColorRow label="Row value" value={cfg.cataloguePanel.selDetailValueColor} onChange={v => updateCfg("cataloguePanel.selDetailValueColor", v)} />
                    <ColorRow label="Icon stroke" value={cfg.cataloguePanel.selDetailIconStroke} onChange={v => updateCfg("cataloguePanel.selDetailIconStroke", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Scorecard</div>
                    <ColorRow label="Section title" value={cfg.cataloguePanel.selScorecardTitleColor} onChange={v => updateCfg("cataloguePanel.selScorecardTitleColor", v)} />
                    <ColorRow label="Average %" value={cfg.cataloguePanel.selScorecardAvgColor} onChange={v => updateCfg("cataloguePanel.selScorecardAvgColor", v)} />
                    <ColorRow label="Icon stroke" value={cfg.cataloguePanel.selScorecardIconStroke} onChange={v => updateCfg("cataloguePanel.selScorecardIconStroke", v)} />
                  </div>
                )}

                <button onClick={() => toggleSection("qualityPanel")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Quality Panel</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.qualityPanel ? "\u2212" : "+"}</span>
                </button>
                {pgSections.qualityPanel && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Layout</div>
                    <ColorRow label="Widget BG" value={cfg.qualityPanel.widgetBg} onChange={v => updateCfg("qualityPanel.widgetBg", v)} />
                    <ColorRow label="Widget Border" value={cfg.qualityPanel.widgetBorder} onChange={v => updateCfg("qualityPanel.widgetBorder", v)} />
                    <SliderRow label="Corner Radius" value={cfg.qualityPanel.widgetRadius} min={4} max={24} step={2} onChange={v => updateCfg("qualityPanel.widgetRadius", v)} unit="px" />
                    <SliderRow label="Section Gap" value={cfg.qualityPanel.sectionGap} min={4} max={24} step={2} onChange={v => updateCfg("qualityPanel.sectionGap", v)} unit="px" />
                    <SliderRow label="Title Size" value={cfg.qualityPanel.titleSize} min={10} max={22} step={1} onChange={v => updateCfg("qualityPanel.titleSize", v)} unit="px" />
                    <SliderRow label="Subtitle Size" value={cfg.qualityPanel.subtitleSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.subtitleSize", v)} unit="px" />
                    <ColorRow label="Header Text" value={cfg.qualityPanel.headerTextColor} onChange={v => updateCfg("qualityPanel.headerTextColor", v)} />
                    <ColorRow label="Sub Text" value={cfg.qualityPanel.headerSubColor} onChange={v => updateCfg("qualityPanel.headerSubColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Radar Chart</div>
                    <SliderRow label="Radar Size" value={cfg.qualityPanel.radarSize} min={120} max={300} step={10} onChange={v => updateCfg("qualityPanel.radarSize", v)} unit="px" />
                    <SliderRow label="Fill Opacity" value={cfg.qualityPanel.radarFillOpacity} min={0.05} max={0.5} step={0.01} onChange={v => updateCfg("qualityPanel.radarFillOpacity", v)} />
                    <SliderRow label="Stroke Width" value={cfg.qualityPanel.radarStrokeWidth} min={0.5} max={4} step={0.25} onChange={v => updateCfg("qualityPanel.radarStrokeWidth", v)} unit="px" />
                    <ColorRow label="Grid Color" value={cfg.qualityPanel.radarGridColor} onChange={v => updateCfg("qualityPanel.radarGridColor", v)} />
                    <SliderRow label="Axis Width" value={cfg.qualityPanel.radarAxisWidth} min={0.2} max={2} step={0.1} onChange={v => updateCfg("qualityPanel.radarAxisWidth", v)} unit="px" />
                    <SliderRow label="Dot Radius" value={cfg.qualityPanel.radarDotRadius} min={1} max={6} step={0.5} onChange={v => updateCfg("qualityPanel.radarDotRadius", v)} unit="px" />
                    <SliderRow label="Label Size" value={cfg.qualityPanel.radarLabelSize} min={4} max={12} step={0.5} onChange={v => updateCfg("qualityPanel.radarLabelSize", v)} unit="px" />
                    <ColorRow label="Label Color" value={cfg.qualityPanel.radarLabelColor} onChange={v => updateCfg("qualityPanel.radarLabelColor", v)} />
                    <SliderRow label="Value Size" value={cfg.qualityPanel.radarValueSize} min={4} max={12} step={0.5} onChange={v => updateCfg("qualityPanel.radarValueSize", v)} unit="px" />
                    <SliderRow label="Label Gap" value={cfg.qualityPanel.radarLabelGap} min={2} max={20} step={1} onChange={v => updateCfg("qualityPanel.radarLabelGap", v)} unit="px" />
                    <SliderRow label="Label Offset" value={cfg.qualityPanel.radarLabelOffset} min={14} max={40} step={1} onChange={v => updateCfg("qualityPanel.radarLabelOffset", v)} unit="px" />
                    <SliderRow label="Consistency label outset" value={cfg.qualityPanel.radarConsistencyLabelOutset} min={0} max={24} step={1} onChange={v => updateCfg("qualityPanel.radarConsistencyLabelOutset", v)} unit="px" />
                    <SliderRow label="Center Score" value={cfg.qualityPanel.radarCenterScoreSize} min={10} max={24} step={1} onChange={v => updateCfg("qualityPanel.radarCenterScoreSize", v)} unit="px" />
                    <SliderRow label="Center Label" value={cfg.qualityPanel.radarCenterLabelSize} min={5} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.radarCenterLabelSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Color Coding</div>
                    <ColorRow label="High (90%+)" value={cfg.qualityPanel.qualityHighColor} onChange={v => updateCfg("qualityPanel.qualityHighColor", v)} />
                    <ColorRow label="Mid (75-89%)" value={cfg.qualityPanel.qualityMidColor} onChange={v => updateCfg("qualityPanel.qualityMidColor", v)} />
                    <ColorRow label="Low (<75%)" value={cfg.qualityPanel.qualityLowColor} onChange={v => updateCfg("qualityPanel.qualityLowColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Product Header</div>
                    <SliderRow label="Star Size" value={cfg.qualityPanel.starSize} min={8} max={20} step={1} onChange={v => updateCfg("qualityPanel.starSize", v)} unit="px" />
                    <SliderRow label="Star Meaning" value={cfg.qualityPanel.starMeaningSize} min={5} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.starMeaningSize", v)} unit="px" />
                    <SliderRow label="Star Score" value={cfg.qualityPanel.starScoreSize} min={8} max={16} step={0.5} onChange={v => updateCfg("qualityPanel.starScoreSize", v)} unit="px" />
                    <SliderRow label="Layer Pill" value={cfg.qualityPanel.layerPillSize} min={5} max={12} step={0.5} onChange={v => updateCfg("qualityPanel.layerPillSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Quality Insights</div>
                    <SliderRow label="Label Size" value={cfg.qualityPanel.dimLabelSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.dimLabelSize", v)} unit="px" />
                    <SliderRow label="Value Size" value={cfg.qualityPanel.dimValueSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.dimValueSize", v)} unit="px" />
                    <SliderRow label="Desc Size" value={cfg.qualityPanel.dimDescSize} min={6} max={12} step={0.5} onChange={v => updateCfg("qualityPanel.dimDescSize", v)} unit="px" />
                    <SliderRow label="Inspect Text" value={cfg.qualityPanel.inspectTextSize} min={5} max={10} step={0.5} onChange={v => updateCfg("qualityPanel.inspectTextSize", v)} unit="px" />
                    <ColorRow label="Icon Color" value={cfg.qualityPanel.dimIconColor} onChange={v => updateCfg("qualityPanel.dimIconColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Cards & Text</div>
                    <ColorRow label="Card BG" value={cfg.qualityPanel.cardBg} onChange={v => updateCfg("qualityPanel.cardBg", v)} />
                    <ColorRow label="Card Border" value={cfg.qualityPanel.cardBorder} onChange={v => updateCfg("qualityPanel.cardBorder", v)} />
                    <SliderRow label="Card Radius" value={cfg.qualityPanel.cardRadius} min={4} max={20} step={1} onChange={v => updateCfg("qualityPanel.cardRadius", v)} unit="px" />
                    <SliderRow label="Method Text" value={cfg.qualityPanel.methodTextSize} min={6} max={12} step={0.5} onChange={v => updateCfg("qualityPanel.methodTextSize", v)} unit="px" />
                    <ColorRow label="Method Color" value={cfg.qualityPanel.methodTextColor} onChange={v => updateCfg("qualityPanel.methodTextColor", v)} />
                    <SliderRow label="Icon Size" value={cfg.qualityPanel.iconSize} min={8} max={22} step={1} onChange={v => updateCfg("qualityPanel.iconSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Quality Insights Box</div>
                    <SliderRow label="Max Height" value={cfg.qualityPanel.insightsMaxHeight} min={150} max={500} step={10} onChange={v => updateCfg("qualityPanel.insightsMaxHeight", v)} unit="px" />
                    <ColorRow label="BG" value={cfg.qualityPanel.insightsBg} onChange={v => updateCfg("qualityPanel.insightsBg", v)} />
                    <ColorRow label="Border" value={cfg.qualityPanel.insightsBorder} onChange={v => updateCfg("qualityPanel.insightsBorder", v)} />
                    <ColorRow label="Passing BG" value={cfg.qualityPanel.insightsPassingBg} onChange={v => updateCfg("qualityPanel.insightsPassingBg", v)} />
                    <ColorRow label="Attention BG" value={cfg.qualityPanel.insightsAttentionBg} onChange={v => updateCfg("qualityPanel.insightsAttentionBg", v)} />
                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">No product selected</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Explainer cards (0 = use sizes above)</div>
                    <SliderRow label="Section heading" value={cfg.qualityPanel.nsEmptyHeadingSize} min={0} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.nsEmptyHeadingSize", v)} unit="px" />
                    <ColorRow label="Heading color" value={cfg.qualityPanel.nsEmptyHeadingColor} onChange={v => updateCfg("qualityPanel.nsEmptyHeadingColor", v)} />
                    <SliderRow label="Body paragraph" value={cfg.qualityPanel.nsEmptyBodySize} min={0} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.nsEmptyBodySize", v)} unit="px" />
                    <SliderRow label="Radar legend labels" value={cfg.qualityPanel.nsEmptyRadarLegendSize} min={0} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.nsEmptyRadarLegendSize", v)} unit="px" />
                    <SliderRow label="Search input" value={cfg.qualityPanel.nsEmptySearchSize} min={0} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.nsEmptySearchSize", v)} unit="px" />
                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">Selected Product View</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Radar widget shell</div>
                    <ColorRow label="Widget BG" value={cfg.qualityPanel.selWidgetBg} onChange={v => updateCfg("qualityPanel.selWidgetBg", v)} />
                    <ColorRow label="Widget border" value={cfg.qualityPanel.selWidgetBorder} onChange={v => updateCfg("qualityPanel.selWidgetBorder", v)} />
                    <SliderRow label="Section gap (product selected)" value={cfg.qualityPanel.selSectionGap} min={4} max={24} step={2} onChange={v => updateCfg("qualityPanel.selSectionGap", v)} unit="px" />
                    <SliderRow label={'Radar box title ("Data Quality")'} value={cfg.qualityPanel.selRadarHeaderSize} min={8} max={16} step={0.5} onChange={v => updateCfg("qualityPanel.selRadarHeaderSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Insights drill-down</div>
                    <SliderRow label="Title" value={cfg.qualityPanel.drillTitleSize} min={10} max={20} step={0.5} onChange={v => updateCfg("qualityPanel.drillTitleSize", v)} unit="px" />
                    <SliderRow label="Description" value={cfg.qualityPanel.drillDescSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.drillDescSize", v)} unit="px" />
                    <SliderRow label="Close" value={cfg.qualityPanel.drillCloseSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.drillCloseSize", v)} unit="px" />
                    <SliderRow label="KPI values" value={cfg.qualityPanel.drillKpiValueSize} min={12} max={28} step={1} onChange={v => updateCfg("qualityPanel.drillKpiValueSize", v)} unit="px" />
                    <SliderRow label="KPI labels" value={cfg.qualityPanel.drillKpiLabelSize} min={5} max={11} step={0.5} onChange={v => updateCfg("qualityPanel.drillKpiLabelSize", v)} unit="px" />
                    <SliderRow label="Section header" value={cfg.qualityPanel.drillSectionHeaderSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.drillSectionHeaderSize", v)} unit="px" />
                    <SliderRow label="Failure name" value={cfg.qualityPanel.drillFailureNameSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.drillFailureNameSize", v)} unit="px" />
                    <SliderRow label="Failure detail" value={cfg.qualityPanel.drillFailureIssueSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.drillFailureIssueSize", v)} unit="px" />
                    <SliderRow label="Empty state" value={cfg.qualityPanel.drillEmptyStateSize} min={7} max={14} step={0.5} onChange={v => updateCfg("qualityPanel.drillEmptyStateSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Typography colors (empty = default)</div>
                    <ColorRow label="Page title" value={cfg.qualityPanel.selHeaderTitleColor} onChange={v => updateCfg("qualityPanel.selHeaderTitleColor", v)} />
                    <ColorRow label="Subtitle" value={cfg.qualityPanel.selHeaderSubtitleColor} onChange={v => updateCfg("qualityPanel.selHeaderSubtitleColor", v)} />
                    <ColorRow label="Product bar" value={cfg.qualityPanel.selProductBarTextColor} onChange={v => updateCfg("qualityPanel.selProductBarTextColor", v)} />
                    <ColorRow label="Insights title" value={cfg.qualityPanel.selInsightsTitleColor} onChange={v => updateCfg("qualityPanel.selInsightsTitleColor", v)} />
                    <ColorRow label="Insights hint" value={cfg.qualityPanel.selInsightsHintColor} onChange={v => updateCfg("qualityPanel.selInsightsHintColor", v)} />
                    <ColorRow label="Passing header" value={cfg.qualityPanel.selInsightsPassingHeaderColor} onChange={v => updateCfg("qualityPanel.selInsightsPassingHeaderColor", v)} />
                    <ColorRow label="Attention header" value={cfg.qualityPanel.selInsightsAttentionHeaderColor} onChange={v => updateCfg("qualityPanel.selInsightsAttentionHeaderColor", v)} />
                    <ColorRow label="Dimension label (passing)" value={cfg.qualityPanel.selInsightsStrongDimLabelColor} onChange={v => updateCfg("qualityPanel.selInsightsStrongDimLabelColor", v)} />
                    <ColorRow label="Clear selection" value={cfg.qualityPanel.selClearLinkColor} onChange={v => updateCfg("qualityPanel.selClearLinkColor", v)} />
                  </div>
                )}

                <button onClick={() => toggleSection("pipelinePanel")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Pipeline Panel</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.pipelinePanel ? "\u2212" : "+"}</span>
                </button>
                {pgSections.pipelinePanel && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Shared</div>
                    <ColorRow label="Widget BG" value={cfg.pipelinePanel.widgetBg} onChange={v => updateCfg("pipelinePanel.widgetBg", v)} />
                    <ColorRow label="Widget Border" value={cfg.pipelinePanel.widgetBorder} onChange={v => updateCfg("pipelinePanel.widgetBorder", v)} />
                    <SliderRow label="Corner Radius" value={cfg.pipelinePanel.widgetRadius} min={4} max={24} step={2} onChange={v => updateCfg("pipelinePanel.widgetRadius", v)} unit="px" />
                    <SliderRow label="Section Gap" value={cfg.pipelinePanel.sectionGap} min={4} max={24} step={2} onChange={v => updateCfg("pipelinePanel.sectionGap", v)} unit="px" />
                    <SliderRow label="Title Size" value={cfg.pipelinePanel.titleSize} min={10} max={22} step={1} onChange={v => updateCfg("pipelinePanel.titleSize", v)} unit="px" />
                    <SliderRow label="Subtitle Size" value={cfg.pipelinePanel.subtitleSize} min={7} max={14} step={0.5} onChange={v => updateCfg("pipelinePanel.subtitleSize", v)} unit="px" />
                    <ColorRow label="Header Text" value={cfg.pipelinePanel.headerTextColor} onChange={v => updateCfg("pipelinePanel.headerTextColor", v)} />
                    <ColorRow label="Sub Text" value={cfg.pipelinePanel.headerSubColor} onChange={v => updateCfg("pipelinePanel.headerSubColor", v)} />
                    <SliderRow label="Tab Font" value={cfg.pipelinePanel.tabFontSize} min={5} max={12} step={0.5} onChange={v => updateCfg("pipelinePanel.tabFontSize", v)} unit="px" />

                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">No Selection View</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">KPI Banners</div>
                    <SliderRow label="KPI Number" value={cfg.pipelinePanel.kpiFontSize} min={10} max={24} step={1} onChange={v => updateCfg("pipelinePanel.kpiFontSize", v)} unit="px" />
                    <SliderRow label="KPI Label" value={cfg.pipelinePanel.kpiLabelSize} min={4} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.kpiLabelSize", v)} unit="px" />
                    <SliderRow label="BAN Desc" value={cfg.pipelinePanel.banDescSize} min={4} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.banDescSize", v)} unit="px" />
                    <SliderRow label="BAN tab labels (0 = tab+1)" value={cfg.pipelinePanel.nsBanTabFontSize} min={0} max={14} step={0.5} onChange={v => updateCfg("pipelinePanel.nsBanTabFontSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Search Bar</div>
                    <ColorRow label="Search BG" value={cfg.pipelinePanel.searchBg} onChange={v => updateCfg("pipelinePanel.searchBg", v)} />
                    <ColorRow label="Search Border" value={cfg.pipelinePanel.searchBorder} onChange={v => updateCfg("pipelinePanel.searchBorder", v)} />
                    <SliderRow label="Search Font" value={cfg.pipelinePanel.searchFontSize} min={6} max={14} step={0.5} onChange={v => updateCfg("pipelinePanel.searchFontSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Architecture Diagrams</div>
                    <SliderRow label="Arch Label" value={cfg.pipelinePanel.archLabelSize} min={5} max={14} step={0.5} onChange={v => updateCfg("pipelinePanel.archLabelSize", v)} unit="px" />
                    <SliderRow label="Arch Sub" value={cfg.pipelinePanel.archSubSize} min={3} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.archSubSize", v)} unit="px" />
                    <SliderRow label="Max Inputs" value={cfg.pipelinePanel.archMaxInputs} min={2} max={6} step={1} onChange={v => updateCfg("pipelinePanel.archMaxInputs", v)} />

                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-3 mb-1.5 tracking-wider border-t border-blue-100 pt-2">Selected Product View</div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Widget / lineage / table chrome</div>
                    <ColorRow label="Outer widget BG" value={cfg.pipelinePanel.selWidgetBg} onChange={v => updateCfg("pipelinePanel.selWidgetBg", v)} />
                    <ColorRow label="Outer widget border" value={cfg.pipelinePanel.selWidgetBorder} onChange={v => updateCfg("pipelinePanel.selWidgetBorder", v)} />
                    <ColorRow label="Lineage box BG" value={cfg.pipelinePanel.selBoxBg} onChange={v => updateCfg("pipelinePanel.selBoxBg", v)} />
                    <ColorRow label="Lineage box border" value={cfg.pipelinePanel.selBoxBorder} onChange={v => updateCfg("pipelinePanel.selBoxBorder", v)} />
                    <ColorRow label="Table surface BG" value={cfg.pipelinePanel.selTableBg} onChange={v => updateCfg("pipelinePanel.selTableBg", v)} />
                    <ColorRow label="Table header BG" value={cfg.pipelinePanel.selTableHeaderBg} onChange={v => updateCfg("pipelinePanel.selTableHeaderBg", v)} />
                    <ColorRow label="Table rules / borders" value={cfg.pipelinePanel.selTableBorder} onChange={v => updateCfg("pipelinePanel.selTableBorder", v)} />
                    <SliderRow label="Section gap (product selected)" value={cfg.pipelinePanel.selSectionGap} min={4} max={24} step={2} onChange={v => updateCfg("pipelinePanel.selSectionGap", v)} unit="px" />
                    <SliderRow label="Models table max height" value={cfg.pipelinePanel.selModelTableMaxHeight} min={80} max={400} step={10} onChange={v => updateCfg("pipelinePanel.selModelTableMaxHeight", v)} unit="px" />
                    <SliderRow label="Logs list max height" value={cfg.pipelinePanel.selLogMaxHeight} min={100} max={400} step={10} onChange={v => updateCfg("pipelinePanel.selLogMaxHeight", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Lineage — Upstream / Downstream titles</div>
                    <SliderRow label="Title font size" value={cfg.pipelinePanel.selLineageTitleSize} min={5} max={12} step={0.5} onChange={v => updateCfg("pipelinePanel.selLineageTitleSize", v)} unit="px" />
                    <ColorRow label="Title color" value={cfg.pipelinePanel.selLineageTitleColor} onChange={v => updateCfg("pipelinePanel.selLineageTitleColor", v)} />
                    <ColorRow label="Chevron color" value={cfg.pipelinePanel.selLineageChevronColor} onChange={v => updateCfg("pipelinePanel.selLineageChevronColor", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Typography (legacy)</div>
                    <SliderRow label="Prod Name" value={cfg.pipelinePanel.prodNameSize} min={6} max={14} step={0.5} onChange={v => updateCfg("pipelinePanel.prodNameSize", v)} unit="px" />
                    <SliderRow label="Prod Meta" value={cfg.pipelinePanel.prodMetaSize} min={4} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.prodMetaSize", v)} unit="px" />
                    <SliderRow label="Status Badge" value={cfg.pipelinePanel.statusBadgeSize} min={4} max={8} step={0.5} onChange={v => updateCfg("pipelinePanel.statusBadgeSize", v)} unit="px" />
                    <SliderRow label="Section Header" value={cfg.pipelinePanel.sectionHeaderSize} min={5} max={12} step={0.5} onChange={v => updateCfg("pipelinePanel.sectionHeaderSize", v)} unit="px" />
                    <ColorRow label="Card BG" value={cfg.pipelinePanel.cardBg} onChange={v => updateCfg("pipelinePanel.cardBg", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Model Table</div>
                    <SliderRow label="Model Name" value={cfg.pipelinePanel.modelNameSize} min={5} max={12} step={0.5} onChange={v => updateCfg("pipelinePanel.modelNameSize", v)} unit="px" />
                    <SliderRow label="Table Header" value={cfg.pipelinePanel.tableHeaderSize} min={4} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.tableHeaderSize", v)} unit="px" />
                    <SliderRow label="Table Data" value={cfg.pipelinePanel.tableDataSize} min={5} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.tableDataSize", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Logs</div>
                    <SliderRow label="Severity Size" value={cfg.pipelinePanel.logSeveritySize} min={5} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.logSeveritySize", v)} unit="px" />
                    <SliderRow label="Message Size" value={cfg.pipelinePanel.logMessageSize} min={7} max={14} step={0.5} onChange={v => updateCfg("pipelinePanel.logMessageSize", v)} unit="px" />
                    <SliderRow label="Time Size" value={cfg.pipelinePanel.logTimeSize} min={5} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.logTimeSize", v)} unit="px" />
                    <SliderRow label="Log Icon" value={cfg.pipelinePanel.logIconSize} min={12} max={28} step={1} onChange={v => updateCfg("pipelinePanel.logIconSize", v)} unit="px" />
                    <SliderRow label="Log Badge" value={cfg.pipelinePanel.logBadgeSize} min={5} max={12} step={0.5} onChange={v => updateCfg("pipelinePanel.logBadgeSize", v)} unit="px" />
                    <SliderRow label="Sev Badge" value={cfg.pipelinePanel.logSevBadgeSize} min={4} max={10} step={0.5} onChange={v => updateCfg("pipelinePanel.logSevBadgeSize", v)} unit="px" />
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
                    <ColorRow label="Warning" value={cfg.warning} onChange={v => updateCfg("warning", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">General</div>
                    <ColorRow label="Text" value={cfg.text} onChange={v => updateCfg("text", v)} />
                    <ColorRow label="Background" value={cfg.bg} onChange={v => updateCfg("bg", v)} />
                    <ColorRow label="Right Panel" value={cfg.panelBg} onChange={v => updateCfg("panelBg", v)} />
                    <ToggleRow label="Gradient Background" value={cfg.panelGradient.enabled} onChange={v => updateCfg("panelGradient.enabled", v)} />
                    {cfg.panelGradient.enabled && (<>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-gray-500">Type</span>
                        <div className="flex rounded-md overflow-hidden border border-gray-200">
                          {(["linear", "radial"] as const).map(t => (
                            <button key={t} onClick={() => updateCfg("panelGradient.type", t)} className="px-2 py-0.5 text-[8px] font-semibold cursor-pointer transition-colors" style={{ background: cfg.panelGradient.type === t ? "#1a1a1a" : "#fff", color: cfg.panelGradient.type === t ? "#fff" : "#888" }}>{t === "linear" ? "Linear" : "Radial"}</button>
                          ))}
                        </div>
                      </div>
                      <ColorRow label="Start Color" value={cfg.panelGradient.color1} onChange={v => updateCfg("panelGradient.color1", v)} />
                      <ColorRow label="Mid Color" value={cfg.panelGradient.color2} onChange={v => updateCfg("panelGradient.color2", v)} />
                      <ColorRow label="End Color" value={cfg.panelGradient.color3} onChange={v => updateCfg("panelGradient.color3", v)} />
                      <SliderRow label="Mid Position" value={cfg.panelGradient.midStop} min={10} max={90} step={5} onChange={v => updateCfg("panelGradient.midStop", v)} unit="%" />
                      {cfg.panelGradient.type === "linear" && (
                        <SliderRow label="Angle" value={cfg.panelGradient.angle} min={0} max={360} step={15} onChange={v => updateCfg("panelGradient.angle", v)} unit="°" />
                      )}
                      <SliderRow label="Opacity" value={cfg.panelGradient.opacity} min={0} max={100} step={5} onChange={v => updateCfg("panelGradient.opacity", v)} unit="%" />
                    </>)}
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
                    <ColorRow label="All Types" value={cfg.appTypeColors[APP_CATEGORIES[0]] || "#94a3b8"} onChange={v => { APP_CATEGORIES.forEach(t => updateCfg(`appTypeColors.${t}`, v)); }} />
                    <div className="grid grid-cols-2 gap-x-2">
                      {APP_CATEGORIES.map(type => (
                        <ColorRow key={type} label={type} value={cfg.appTypeColors[type]} onChange={v => updateCfg(`appTypeColors.${type}`, v)} />
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => toggleSection("layout")} className="flex items-center justify-between w-full text-left py-1.5 mb-1 cursor-pointer">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Layout</span>
                  <span className="text-gray-400 text-[12px]">{pgSections.layout ? "\u2212" : "+"}</span>
                </button>
                {pgSections.layout && (
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">Canvas</div>
                    <SliderRow label="View Width" value={cfg.vw} min={800} max={2400} step={10} onChange={v => updateCfg("vw", v)} unit="px" inputStep={1} />
                    <SliderRow label="View Height" value={cfg.vh} min={400} max={1600} step={10} onChange={v => updateCfg("vh", v)} unit="px" inputStep={1} />

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Domain Sort Order</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(["custom", "alpha", "appCount", "upstream"] as const).map(m => (
                        <button key={m} onClick={() => updateCfg("sortMode", m)}
                          className={`text-[9px] py-1 px-2 rounded-lg cursor-pointer border font-bold ${cfg.sortMode === m ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                          {m === "custom" ? "Custom" : m === "alpha" ? "A–Z" : m === "appCount" ? "By App Count" : "By Upstream"}
                        </button>
                      ))}
                    </div>

                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Position & Spread</div>
                    <SliderRow label="Center X" value={cfg.cx} min={100} max={1800} step={5} onChange={v => updateCfg("cx", v)} inputStep={1} />
                    <SliderRow label="Center Y" value={cfg.cy} min={200} max={1200} step={5} onChange={v => updateCfg("cy", v)} inputStep={1} />
                    <SliderRow label="Arc Spread" value={cfg.pad} min={0} max={0.45} step={0.01} onChange={v => updateCfg("pad", v)} inputStep={0.005} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Arc Radii</div>
                    <SliderRow label="Apps" value={cfg.radii.APPS} min={200} max={1200} step={5} onChange={v => updateCfg("radii.APPS", v)} inputStep={1} />
                    <SliderRow label="Source" value={cfg.radii.SOURCE_ALIGNED} min={100} max={1000} step={5} onChange={v => updateCfg("radii.SOURCE_ALIGNED", v)} inputStep={1} />
                    <SliderRow label="Business" value={cfg.radii.BUSINESS} min={50} max={800} step={5} onChange={v => updateCfg("radii.BUSINESS", v)} inputStep={1} />
                    <SliderRow label="Consumer" value={cfg.radii.CONSUMER_ALIGNED} min={30} max={600} step={5} onChange={v => updateCfg("radii.CONSUMER_ALIGNED", v)} inputStep={1} />

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
                    <SliderRow label="Line Width" value={cfg.flow.width} min={0.1} max={12} step={0.1} onChange={v => updateCfg("flow.width", v)} unit="px" />
                    <SliderRow label="Opacity" value={cfg.flow.opacity} min={0.01} max={1} step={0.01} onChange={v => updateCfg("flow.opacity", v)} />
                    <SliderRow label="Highlight Width" value={cfg.flow.highlightWidth} min={0.5} max={12} step={0.5} onChange={v => updateCfg("flow.highlightWidth", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Issue Highlight</div>
                    <SliderRow label="Boost Opacity" value={cfg.flow.issueBoostOpacity} min={0.05} max={1} step={0.05} onChange={v => updateCfg("flow.issueBoostOpacity", v)} />
                    <SliderRow label="Boost Width" value={cfg.flow.issueBoostWidth} min={0.3} max={8} step={0.1} onChange={v => updateCfg("flow.issueBoostWidth", v)} unit="px" />
                    <SliderRow label="Curve Tension" value={cfg.flow.curveTension} min={0} max={1} step={0.05} onChange={v => updateCfg("flow.curveTension", v)} />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-3 mb-1.5">Idle Animation</div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] text-gray-500 w-[52px] shrink-0">Style</span>
                      <div className="flex gap-1 flex-wrap">
                        {(["dot", "glow", "arrow", "diamond", "dash", "pulse", "ripple", "spark", "trail", "wave", "morse", "comet", "none"] as const).map(s => (
                          <button key={s} onClick={() => updateCfg("flow.idleStyle", s)}
                            className={`px-2 py-0.5 rounded text-[9px] font-medium cursor-pointer transition-colors ${cfg.flow.idleStyle === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <SliderRow label="Speed" value={cfg.flow.idleSpeed} min={1} max={10} step={0.5} onChange={v => updateCfg("flow.idleSpeed", v)} unit="s" />

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
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5 pt-2 border-t border-gray-100">Layer Label Position (global)</div>
                    <SliderRow label="X Offset" value={cfg.typoOffset.layerX} min={-200} max={200} step={1} onChange={v => updateCfg("typoOffset.layerX", v)} unit="px" />
                    <SliderRow label="Y Offset" value={cfg.typoOffset.layerY} min={-200} max={200} step={1} onChange={v => updateCfg("typoOffset.layerY", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5">Per-layer offset (or drag on mesh)</div>
                    {(["APPS", "SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const).map(lk => (
                      <div key={lk} className="mb-2 pl-1 border-l-2 border-gray-100">
                        <div className="text-[9px] font-semibold text-gray-600 mb-0.5">{LAYER_LABEL[lk]}</div>
                        <SliderRow label="ΔX" value={cfg.layerLabelPos[lk]?.x ?? 0} min={-120} max={120} step={1} onChange={v => updateCfg(`layerLabelPos.${lk}.x`, v)} unit="px" />
                        <SliderRow label="ΔY" value={cfg.layerLabelPos[lk]?.y ?? 0} min={-120} max={120} step={1} onChange={v => updateCfg(`layerLabelPos.${lk}.y`, v)} unit="px" />
                      </div>
                    ))}
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5 pt-2 border-t border-gray-100">Domain Name Position</div>
                    <SliderRow label="X Offset" value={cfg.typoOffset.domainX} min={-200} max={200} step={1} onChange={v => updateCfg("typoOffset.domainX", v)} unit="px" />
                    <SliderRow label="Y Offset" value={cfg.typoOffset.domainY} min={-200} max={200} step={1} onChange={v => updateCfg("typoOffset.domainY", v)} unit="px" />
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mt-2 mb-1.5 pt-2 border-t border-gray-100">Legend Position</div>
                    <SliderRow label="X Offset" value={cfg.typoOffset.legendX} min={-300} max={300} step={1} onChange={v => updateCfg("typoOffset.legendX", v)} unit="px" />
                    <SliderRow label="Y Offset" value={cfg.typoOffset.legendY} min={-200} max={200} step={1} onChange={v => updateCfg("typoOffset.legendY", v)} unit="px" />
                  </div>
                )}
              </div>
            </div>
          )}
          </>)}
        </div>

        {/* ═══ RIGHT PANEL (420px, always-tabbed) ═══ */}
        <div ref={panelRef} className="relative w-[420px] shrink-0 overflow-y-auto flex flex-col" style={{ background: (() => {
          if (!cfg.panelGradient.enabled) return cfg.panelBg;
          const g = cfg.panelGradient;
          const hex2rgba = (hex: string, a: number) => { const r = parseInt(hex.slice(1, 3), 16), gr = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${gr},${b},${a})`; };
          const a = g.opacity / 100;
          const c1 = hex2rgba(g.color1, a), c2 = hex2rgba(g.color2, a), c3 = hex2rgba(g.color3, a);
          if (g.type === "radial") return `radial-gradient(ellipse at center, ${c1} 0%, ${c2} ${g.midStop}%, ${c3} 100%)`;
          return `linear-gradient(${g.angle}deg, ${c1} 0%, ${c2} ${g.midStop}%, ${c3} 100%)`;
        })(), border: `${bdr.width}px solid ${bdr.color}`, borderRadius: `0 ${bdr.radius}px ${bdr.radius}px 0` }}>
          {/* Tab bar — circular dock (playground-configurable) */}
          {(() => { const td = cfg.tabDock; return (
          <div className="shrink-0 mx-3 mt-3 mb-1 rounded-2xl px-2 py-2.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]" style={{ backgroundColor: td.bg }}>
            <div className="flex justify-between" style={{ gap: td.gap }}>
              {PANEL_TABS.map(tab => {
                const active = panelTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setPanelTab(tab.id)}
                    className="flex flex-col items-center cursor-pointer group"
                    style={{ minWidth: 0, flex: "1 1 0%", gap: Math.max(td.gap * 0.4, 3) }}>
                    <div
                      className={`rounded-full flex items-center justify-center transition-all duration-200 ${
                        active ? "shadow-[0_4px_12px_rgba(0,0,0,0.25)] scale-105" : "shadow-[0_1px_3px_rgba(0,0,0,0.08)] group-hover:shadow-[0_3px_10px_rgba(0,0,0,0.12)] group-hover:scale-105"
                      }`}
                      style={{ width: td.circleSize, height: td.circleSize, backgroundColor: active ? td.activeColor : td.inactiveColor, color: active ? "#fff" : td.textInactive }}>
                      <svg style={{ width: td.iconSize, height: td.iconSize }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon} /></svg>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-wide leading-none" style={{ color: active ? td.textActive : td.textInactive }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          ); })()}

          <div className="p-5 flex-1 overflow-y-auto">

            {/* ── APP SELECTED: shared panel across all tabs ── */}
            {selApp && (() => {
              const appStatusCol = selApp.conn_status === "ACTIVE" ? cfg.green : selApp.conn_status === "BROKEN" ? cfg.red : cfg.warning;
              const connectedProducts = appSourceEdges.filter(e => e.appId === selApp.id).map(e => pNodes.find(n => n.id === e.productId)).filter(Boolean);
              const appSyncLogs = (recentSyncLogs as any[]).filter((sl: any) => sl.app_id === selApp.id).slice(0, 5);
              const appHealth = (connectionHealth as any[]).find((ch: any) => ch.app_id === selApp.id);

              const AppHeader = () => (
                <div>
                  <button onClick={() => setSel(null)} className="text-[10px] font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 cursor-pointer mb-2"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>Clear selection</button>
                  <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full shrink-0" style={{ background: selApp.color_hex }} /><h2 className="text-[14px] font-bold truncate" style={{ color: cfg.text }}>{selApp.name}</h2><span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: (cfg.appTypeColors[selApp.app_type] || "#999") + "22", color: cfg.appTypeColors[selApp.app_type] || "#999" }}>{selApp.app_type}</span></div>
                  <div className="text-[10px] text-gray-500 mb-3">{selApp.vendor} · {selApp.domain_name}</div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl p-2.5 bg-gray-50 text-center"><div className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: appStatusCol }} /><span className="text-[11px] font-bold" style={{ color: appStatusCol }}>{selApp.conn_status}</span></div><div className="text-[7px] font-semibold text-gray-400 uppercase mt-0.5">Status</div></div>
                    <div className="rounded-xl p-2.5 bg-gray-50 text-center"><div className="text-[13px] font-bold" style={{ color: cfg.layerColors.CONSUMER_ALIGNED }}>${selApp.monthly_cost_usd}</div><div className="text-[7px] font-semibold text-gray-400 uppercase mt-0.5">Cost/mo</div></div>
                    <div className="rounded-xl p-2.5 bg-gray-50 text-center"><div className="text-[11px] font-bold" style={{ color: cfg.text }}>{selApp.sync_frequency}</div><div className="text-[7px] font-semibold text-gray-400 uppercase mt-0.5">Sync</div></div>
                  </div>
                  {selApp.description && <p className="text-[11px] text-gray-600 leading-[1.7] mb-4 pb-4 border-b border-gray-100">{selApp.description}</p>}
                </div>
              );
              const ConnectedProducts = () => connectedProducts.length > 0 ? (
                <div className="mt-3">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Connected Source Products</div>
                  <div className="space-y-1">
                    {connectedProducts.map(prod => prod ? <button key={prod.id} onClick={ev => { ev.stopPropagation(); setSel({ kind: "product", id: prod.id }); }} className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.layerColors.SOURCE_ALIGNED }} /><span className="text-[10px] font-medium" style={{ color: cfg.text }}>{prod.label}</span><span className="text-[8px] text-gray-400 ml-auto">Source</span></button> : null)}
                  </div>
                </div>
              ) : null;

              if (panelTab === "overview" || panelTab === "catalogue") {
                return (<div><AppHeader /><ConnectedProducts /></div>);
              }
              if (panelTab === "cost") {
                return (<div><AppHeader /></div>);
              }
              if (panelTab === "pipeline") {
                return (
                  <div>
                    <AppHeader />
                    <div className="rounded-xl p-3 mb-3" style={{ background: appStatusCol + "08", border: `1px solid ${appStatusCol}18` }}>
                      <div className="flex items-center gap-2 mb-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: appStatusCol }} /><span className="text-[11px] font-bold" style={{ color: appStatusCol }}>Connector {selApp.conn_status}</span></div>
                      <div className="text-[10px] text-gray-500">Sync frequency: {selApp.sync_frequency} · Rows/sync: {selApp.rows_per_sync_avg?.toLocaleString() || "—"}</div>
                      {appHealth && <div className="text-[10px] text-gray-500 mt-0.5">Last success: {appHealth.last_success_at || "—"} · Avg latency: {appHealth.avg_latency_sec ? `${appHealth.avg_latency_sec.toFixed(1)}s` : "—"}{appHealth.failure_streak > 0 ? ` · Failure streak: ${appHealth.failure_streak}` : ""}</div>}
                    </div>
                    {appSyncLogs.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Sync Logs</div>
                        <div className="space-y-1.5">
                          {appSyncLogs.map((sl: any, i: number) => {
                            const slCol = sl.event_type === "ERROR" ? cfg.red : sl.event_type === "WARNING" ? cfg.warning : cfg.green;
                            return (
                              <div key={sl.id || i} className="rounded-lg px-2.5 py-2" style={{ background: slCol + "06", border: `1px solid ${slCol}12` }}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: slCol }} />
                                  <span className="text-[9px] font-bold uppercase" style={{ color: slCol }}>{sl.event_type}</span>
                                  <span className="text-[8px] text-gray-400 ml-auto">{sl.started_at?.slice(0, 16) || "—"}</span>
                                </div>
                                <div className="text-[9px] text-gray-600 leading-[1.5] break-words">{sl.message?.slice(0, 200) || "—"}</div>
                                {sl.rows_synced > 0 && <div className="text-[8px] text-gray-400 mt-0.5">{sl.rows_synced.toLocaleString()} rows · {sl.duration_sec?.toFixed(1)}s</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <ConnectedProducts />
                  </div>
                );
              }
              if (panelTab === "quality") {
                return (
                  <div>
                    <AppHeader />
                    <div className="rounded-xl p-3 mb-3 bg-gray-50">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Connector Health</div>
                      {appHealth ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-[10px] font-semibold text-gray-500">Status</span><div className="text-[12px] font-bold" style={{ color: appHealth.status === "HEALTHY" ? cfg.green : appHealth.status === "DOWN" ? cfg.red : cfg.warning }}>{appHealth.status}</div></div>
                          <div><span className="text-[10px] font-semibold text-gray-500">Latency</span><div className="text-[12px] font-bold" style={{ color: cfg.text }}>{appHealth.avg_latency_sec?.toFixed(1) || "—"}s</div></div>
                          <div><span className="text-[10px] font-semibold text-gray-500">Failure streak</span><div className="text-[12px] font-bold" style={{ color: appHealth.failure_streak > 0 ? cfg.red : cfg.green }}>{appHealth.failure_streak}</div></div>
                          <div><span className="text-[10px] font-semibold text-gray-500">Last success</span><div className="text-[10px] font-bold" style={{ color: cfg.text }}>{appHealth.last_success_at?.slice(0, 16) || "—"}</div></div>
                        </div>
                      ) : <div className="text-[10px] text-gray-400">No health data available</div>}
                    </div>
                    {appSyncLogs.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Last 5 Sync Metrics</div>
                        <div className="overflow-y-auto rounded-lg" style={{ border: "1px solid #e5e7eb" }}>
                          <table className="w-full" style={{ tableLayout: "fixed" }}>
                            <thead><tr>{["Time", "Type", "Rows", "Duration"].map(h => <th key={h} className="px-1.5 py-1 text-left text-[8px] font-bold text-gray-400 uppercase bg-gray-50 border-b border-gray-200">{h}</th>)}</tr></thead>
                            <tbody>{appSyncLogs.map((sl: any, i: number) => (
                              <tr key={sl.id || i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                <td className="px-1.5 py-1 text-[9px] text-gray-600">{sl.started_at?.slice(5, 16) || "—"}</td>
                                <td className="px-1.5 py-1"><span className="text-[8px] font-bold" style={{ color: sl.event_type === "ERROR" ? cfg.red : sl.event_type === "WARNING" ? cfg.warning : cfg.green }}>{sl.event_type}</span></td>
                                <td className="px-1.5 py-1 text-[9px] text-gray-600">{sl.rows_synced > 0 ? sl.rows_synced.toLocaleString() : "—"}</td>
                                <td className="px-1.5 py-1 text-[9px] text-gray-600">{sl.duration_sec ? `${sl.duration_sec.toFixed(1)}s` : "—"}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return (<div><AppHeader /><ConnectedProducts /></div>);
            })()}

            {/* ── TAB: OVERVIEW ── */}
            {panelTab === "overview" && !selApp && (() => {
              const srcCount = products.filter((p: any) => p.product_type === "SOURCE_ALIGNED").length;
              const bizCount = products.filter((p: any) => p.product_type === "BUSINESS").length;
              const conCount = products.filter((p: any) => p.product_type === "CONSUMER_ALIGNED").length;
              const totalProducts = products.length;
              const appsByType: Record<string, any[]> = {};
              (apps as any[]).forEach((a: any) => { if (!appsByType[a.app_type]) appsByType[a.app_type] = []; appsByType[a.app_type].push(a); });
              const appsByDomain: Record<string, any[]> = {};
              (apps as any[]).forEach((a: any) => { if (!appsByDomain[a.domain_name]) appsByDomain[a.domain_name] = []; appsByDomain[a.domain_name].push(a); });

              const DOT_SIZE = 8;
              const DOT_GAP = 3;
              const DOTS_PER_ROW = 7;
              const dotColor = (a: any) => a.conn_status === "BROKEN" ? cfg.red : a.conn_status === "ACTIVE" ? cfg.green : "#d1d5db";
              const DotGrid = ({ items, colorFn }: { items: any[]; colorFn: (a: any) => string }) => {
                const rows: any[][] = [];
                for (let i = 0; i < items.length; i += DOTS_PER_ROW) rows.push(items.slice(i, i + DOTS_PER_ROW));
                return (
                  <div className="flex flex-col" style={{ gap: DOT_GAP }}>
                    {rows.map((row, ri) => (
                      <div key={ri} className="flex" style={{ gap: DOT_GAP }}>
                        {row.map((item, ci) => (
                          <button key={item.id || ci} title={item.name || item.label || ""} onClick={e => { e.stopPropagation(); if (item.id) setSel({ kind: item.product_type ? "product" : "app", id: item.id }); }}
                            className="rounded-full cursor-pointer transition-all hover:scale-125 hover:ring-2 hover:ring-gray-300"
                            style={{ width: DOT_SIZE, height: DOT_SIZE, background: colorFn(item) }} />
                        ))}
                      </div>
                    ))}
                  </div>
                );
              };

              if (selProduct) {
                const st = qualityToStars(selProduct.quality_score || 0);
                const qPct = Math.round((selProduct.quality_score ?? 0) * 100);
                const layerCol = cfg.layerColors[selProduct.product_type] || cfg.layerColors.SOURCE_ALIGNED;
                const os = cfg.overviewPanel;
                const ovSelCardStyle: React.CSSProperties = { background: os.selCardBg, border: `1px solid ${os.selCardBorder}`, borderRadius: os.selCardRadius };

                const LAYER_ORDER = ["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const;
                const categorize = (items: typeof upstream) => {
                  const grouped: Record<string, typeof upstream> = {};
                  items.forEach(n => {
                    const pType = (n as any).productType || products.find((p: any) => p.id === n.id)?.product_type || "SOURCE_ALIGNED";
                    (grouped[pType] ??= []).push({ ...n, productType: pType });
                  });
                  return LAYER_ORDER.map(lt => ({ type: lt, label: LAYER_SHORT[lt], color: cfg.layerColors[lt], items: grouped[lt] || [] })).filter(g => g.items.length > 0);
                };
                const upCats = categorize(upstream);
                const downCats = categorize(downstream);

                const secAccent = os.selLineageSectionTitleColor || layerCol;
                const LineageSection = ({ title, icon, groups, total }: { title: string; icon: string; groups: { type: string; label: string; color: string; items: typeof upstream }[]; total: number }) => (
                  <div className="rounded-xl overflow-hidden" style={ovSelCardStyle}>
                    <div className="px-3 py-2 flex items-center gap-1.5" style={{ background: layerCol + "06", borderBottom: `1px solid ${os.selCardBorder}` }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={secAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                      <span className="font-bold uppercase tracking-wider" style={{ fontSize: os.selSectionHeaderSize, color: secAccent }}>{title}</span>
                      <span className="ml-auto font-bold rounded-full px-1.5 py-0.5" style={{ fontSize: os.selSectionHeaderSize - 1, background: secAccent + "12", color: secAccent }}>{total}</span>
                    </div>
                    <div className="p-2">
                      {groups.map(g => (
                        <div key={g.type} className="mb-1.5 last:mb-0">
                          <div className="flex items-center gap-1.5 px-1 mb-1">
                            <span className="rounded-full" style={{ width: os.selItemDotSize, height: os.selItemDotSize, background: g.color + "30" }} />
                            <span className="font-bold uppercase tracking-wider" style={{ fontSize: os.selLayerLabelSize, color: g.color }}>{g.label}</span>
                            <span className="font-semibold" style={{ fontSize: os.selLayerLabelSize - 1, color: g.color + "88" }}>{g.items.length}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                            {g.items.map(item => {
                              const health = (item.qualityScore || 0.85) >= 0.76;
                              return (
                                <button key={item.id} onClick={e => { e.stopPropagation(); setSel({ kind: "product", id: item.id }); }}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left">
                                  <span className="rounded-full shrink-0" style={{ width: os.selItemDotSize, height: os.selItemDotSize, background: health ? cfg.green : cfg.red }} />
                                  <span className="font-medium flex-1 truncate" style={{ fontSize: os.selItemNameSize, color: os.selLineageItemTextColor || cfg.text }}>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );

                return (
                  <div className="flex flex-col" style={{ gap: os.selSectionGap }}>
                    <button onClick={() => setSel(null)} className="text-[10px] font-medium hover:opacity-80 flex items-center gap-1 cursor-pointer self-start" style={{ color: os.selClearLinkColor }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>Clear selection</button>

                    <OverviewStyleProductBannerBlock os={os} selProduct={selProduct} domainColorMap={domainColorMap} cfg={cfg} />

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Quality", value: `${qPct}%`, base: qPct >= 76 ? cfg.green : cfg.red, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                        { label: "Rating", value: `${st}/5`, base: "#dab508", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
                        { label: "SLA", value: selProduct.sla_freshness || "—", base: layerCol, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                      ].map(kpi => {
                        const valColor = kpi.label === "Quality" ? (os.selKpiQualityValueColor || kpi.base) : kpi.label === "Rating" ? (os.selKpiRatingValueColor || kpi.base) : (os.selKpiSlaValueColor || kpi.base);
                        const labColor = kpi.label === "Quality" ? (os.selKpiQualityLabelColor || os.kpiLabelColor) : kpi.label === "Rating" ? (os.selKpiRatingLabelColor || os.kpiLabelColor) : (os.selKpiSlaLabelColor || os.kpiLabelColor);
                        return (
                        <div key={kpi.label} className="rounded-xl p-2.5 text-center relative overflow-hidden" style={ovSelCardStyle}>
                          <div className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center" style={{ width: os.selKpiValueSize, height: os.selKpiValueSize, background: valColor + "10" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={valColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={kpi.icon} /></svg>
                          </div>
                          <div className="font-black" style={{ fontSize: os.selKpiValueSize, color: valColor }}>{kpi.value}</div>
                          <div className="font-bold uppercase tracking-wider mt-0.5" style={{ fontSize: os.selKpiLabelSize, color: labColor }}>{kpi.label}</div>
                        </div>
                        );
                      })}
                    </div>

                    {upCats.length > 0 && <LineageSection title="Upstream" icon="M7 11l5-5 5 5M7 17l5-5 5 5" groups={upCats} total={upstream.length} />}
                    {downCats.length > 0 && <LineageSection title="Downstream" icon="M7 13l5 5 5-5M7 7l5 5 5-5" groups={downCats} total={downstream.length} />}
                  </div>
                );
              }
              /* selApp is handled by the shared app panel block above all tabs */

              const ov = cfg.overviewPanel;
              const cardStyle: React.CSSProperties = {
                background: ov.cardBg,
                border: `1px solid ${ov.cardBorder}`,
                borderRadius: ov.cardRadius,
                boxShadow: ov.cardShadow ? "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)" : "none",
              };

              const ShapeSvg = ({ shape, size, color, children }: { shape: string; size: number; color: string; children?: React.ReactNode }) => {
                const r = size / 2;
                return (
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
                    {shape === "circle" && <circle cx={r} cy={r} r={r - 1} fill={color} fillOpacity={0.05} stroke={color} strokeWidth={1.2} strokeOpacity={0.25} />}
                    {shape === "hexagon" && <polygon points={[0,1,2,3,4,5].map(i => { const a = Math.PI / 3 * i - Math.PI / 6; return `${r + (r - 1) * Math.cos(a)},${r + (r - 1) * Math.sin(a)}`; }).join(" ")} fill={color} fillOpacity={0.05} stroke={color} strokeWidth={1.2} strokeOpacity={0.25} />}
                    {shape === "square" && <rect x={1} y={1} width={size - 2} height={size - 2} rx={3} fill={color} fillOpacity={0.05} stroke={color} strokeWidth={1.2} strokeOpacity={0.25} />}
                    {shape === "diamond" && <polygon points={`${r},1 ${size - 1},${r} ${r},${size - 1} 1,${r}`} fill={color} fillOpacity={0.05} stroke={color} strokeWidth={1.2} strokeOpacity={0.25} />}
                    {children}
                  </svg>
                );
              };

              const spiralLayout = (count: number, cx: number, cy: number, maxR: number, dotR: number, spacingMul: number = ov.dotSpacing) => {
                const pts: { x: number; y: number }[] = [];
                if (count === 0) return pts;
                if (count === 1) return [{ x: cx, y: cy }];
                const gap = dotR * Math.max(spacingMul, 2.2);
                const rings: { r: number; n: number }[] = [];
                let placed = 1;
                rings.push({ r: 0, n: 1 });
                let ringR = gap;
                while (placed < count && ringR <= maxR - dotR) {
                  const circ = 2 * Math.PI * ringR;
                  const fit = Math.max(1, Math.floor(circ / gap));
                  const n = Math.min(fit, count - placed);
                  rings.push({ r: ringR, n });
                  placed += n;
                  ringR += gap;
                }
                if (placed < count) {
                  const lastRing = rings[rings.length - 1];
                  lastRing.n += count - placed;
                }
                for (const ring of rings) {
                  if (ring.r === 0) { pts.push({ x: cx, y: cy }); continue; }
                  const step = (2 * Math.PI) / ring.n;
                  const offset = rings.indexOf(ring) % 2 === 0 ? 0 : step / 2;
                  for (let j = 0; j < ring.n; j++) {
                    const a = offset + j * step;
                    pts.push({ x: cx + ring.r * Math.cos(a), y: cy + ring.r * Math.sin(a) });
                  }
                }
                return pts;
              };

              const totalApps = (apps as any[]).length;
              const brokenApps = (apps as any[]).filter((a: any) => a.conn_status === "BROKEN").length;

              const KPI_ICONS = {
                total: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
                source: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
                business: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                consumer: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
              };

              const srcProds = (products as any[]).filter((p: any) => p.product_type === "SOURCE_ALIGNED");
              const bizProds = (products as any[]).filter((p: any) => p.product_type === "BUSINESS");
              const conProds = (products as any[]).filter((p: any) => p.product_type === "CONSUMER_ALIGNED");

              const groupByDomain = (items: any[]) => {
                const m: Record<string, any[]> = {};
                items.forEach(it => { const d = it.domain_name || "Unknown"; if (!m[d]) m[d] = []; m[d].push(it); });
                return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
              };

              const OVERVIEW_TABS = [
                { id: "apps" as const, label: "Application", count: totalApps },
                { id: "source" as const, label: "Source", count: srcCount },
                { id: "business" as const, label: "Business", count: bizCount },
                { id: "consumer" as const, label: "Consumer", count: conCount },
              ];

              const renderDomainBubbles = (
                domainEntries: [string, any[]][],
                dotR: number,
                bubbleSz: number,
                dotColor: (item: any) => { fill: string; opacity: number; stroke: string; strokeW: number },
                onDotClick: (item: any) => void,
              ) => {
                const perRow = Math.ceil(domainEntries.length / 2);
                const rows = [domainEntries.slice(0, perRow), domainEntries.slice(perRow)];
                const cxy = bubbleSz / 2;
                return (
                  <div className="flex flex-col" style={{ gap: ov.domainCircleGap }}>
                    {rows.map((row, ri) => (
                      <div key={ri} className="flex justify-around" style={{ gap: ov.domainCircleGap }}>
                        {row.map(([dom, items]) => {
                          const domColor = domainColorMap[dom] || ov.cardBorder;
                          const pts = spiralLayout(items.length, cxy, cxy, cxy - 3, dotR);
                          return (
                            <div key={dom} className="text-center flex-1 min-w-0">
                              <div className="mx-auto" style={{ width: bubbleSz, height: bubbleSz }}>
                                <svg width={bubbleSz} height={bubbleSz} viewBox={`0 0 ${bubbleSz} ${bubbleSz}`}>
                                  <circle cx={cxy} cy={cxy} r={cxy - 1}
                                    fill={domColor} fillOpacity={ov.domainFillOpacity}
                                    stroke={domColor} strokeWidth={ov.domainOutlineWidth} strokeOpacity={0.4} />
                                  {items.map((item: any, di: number) => {
                                    const p = pts[di] || { x: cxy, y: cxy };
                                    const dc = dotColor(item);
                                    return (
                                      <circle key={item.id} cx={p.x} cy={p.y} r={dotR}
                                        fill={dc.fill} fillOpacity={dc.opacity}
                                        stroke={dc.stroke} strokeWidth={dc.strokeW}
                                        style={{ cursor: "pointer" }}
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDotClick(item); }} />
                                    );
                                  })}
                                </svg>
                              </div>
                              <div className="font-black mt-1 leading-none" style={{ color: cfg.text, fontSize: ov.countSize }}>{items.length}</div>
                              <div className="font-semibold uppercase tracking-wider mt-0.5 leading-tight truncate" style={{ color: ov.domainLabelColor, fontSize: ov.domainLabelSize }}>{dom}</div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              };

              const appDotColor = (app: any) => {
                const isBroken = app.conn_status === "BROKEN";
                const isPaused = app.conn_status === "PAUSED";
                return isBroken
                  ? { fill: cfg.red, opacity: 0.3, stroke: cfg.red, strokeW: 1.2 }
                  : isPaused
                  ? { fill: cfg.warning, opacity: 0.3, stroke: cfg.warning, strokeW: 1.2 }
                  : { fill: cfg.text, opacity: ov.dotActiveOpacity, stroke: "none", strokeW: 0 };
              };

              const productDotColor = (layerColor: string) => (prod: any) => {
                const lowQ = (prod.quality_score || 0.85) < 0.6;
                return { fill: lowQ ? cfg.red : layerColor, opacity: lowQ ? 0.35 : ov.dotActiveOpacity, stroke: lowQ ? cfg.red : "none", strokeW: lowQ ? 1 : 0 };
              };

              const nsTitleC = ov.nsPageTitleColor || cfg.text;
              const nsSubC = ov.nsPageSubtitleColor || "#a8a29e";
              const nsEntTitleC = ov.nsEntitiesTitleColor || cfg.text;
              const nsEntSubC = ov.nsEntitiesSubtitleColor || ov.tabInactiveColor;
              return (
                <div style={{ gap: ov.sectionGap }} className="flex flex-col">
                  <div>
                    <h2 className="font-bold mb-0.5" style={{ color: nsTitleC, fontSize: ov.nsPageTitleSize }}>MeshAtlas</h2>
                    <p style={{ fontSize: ov.nsPageSubtitleSize, color: nsSubC }}>Enterprise Data Mesh — Orange Co</p>
                  </div>

                  {/* ── Data Products KPI Cards ── */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: "Total Products", count: totalProducts, color: cfg.text, icon: KPI_ICONS.total },
                      { label: "Source", count: srcCount, color: cfg.layerColors.SOURCE_ALIGNED, icon: KPI_ICONS.source },
                      { label: "Business", count: bizCount, color: cfg.layerColors.BUSINESS, icon: KPI_ICONS.business },
                      { label: "Consumer", count: conCount, color: cfg.layerColors.CONSUMER_ALIGNED, icon: KPI_ICONS.consumer },
                    ].map(kpi => (
                      <div key={kpi.label} className="p-3.5 flex items-start gap-3" style={cardStyle}>
                        <div className="rounded-lg shrink-0 flex items-center justify-center" style={{ width: ov.nsKpiIconBox, height: ov.nsKpiIconBox, background: kpi.color + Math.round(ov.kpiIconBgOpacity * 255).toString(16).padStart(2, "0") }}>
                          <svg width={ov.nsKpiIconSvg} height={ov.nsKpiIconSvg} viewBox="0 0 24 24" fill="none" stroke={kpi.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={kpi.icon} /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black leading-none" style={{ color: ov.kpiNumberColor, fontSize: ov.banSize }}>{kpi.count}</div>
                          <div className="font-semibold uppercase tracking-wider mt-1" style={{ color: ov.kpiLabelColor, fontSize: ov.labelSize }}>{kpi.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Domain-wise Entity Cards (4 tabs) ── */}
                  <div className="p-4" style={cardStyle}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold" style={{ fontSize: ov.nsEntitiesTitleSize, color: nsEntTitleC }}>Mesh Entities</div>
                        <div style={{ fontSize: ov.nsEntitiesSubtitleSize, color: nsEntSubC }}>By domain</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mb-4">
                      {OVERVIEW_TABS.map(tab => {
                        const active = appViewMode === tab.id;
                        return (
                          <button key={tab.id} onClick={() => setAppViewMode(tab.id)}
                            className="flex-1 py-1.5 cursor-pointer transition-all"
                            style={{
                              fontSize: ov.tabFontSize,
                              fontWeight: active ? 600 : 400,
                              color: active ? ov.tabTextColor : ov.tabInactiveColor,
                              background: active ? ov.tabBg : ov.cardBorder + "44",
                              borderRadius: 8,
                              border: "none",
                              letterSpacing: "0.02em",
                            }}>
                            {tab.label} <span style={{ opacity: 0.6, fontWeight: 400 }}>{tab.count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {appViewMode === "apps" && renderDomainBubbles(
                      groupByDomain(apps as any[]),
                      ov.domainAppDotR,
                      ov.domainBubbleSize,
                      appDotColor,
                      (app) => setSel({ kind: "app", id: app.id }),
                    )}
                    {appViewMode === "source" && renderDomainBubbles(
                      groupByDomain(srcProds),
                      ov.productDotR,
                      ov.typeBubbleSize,
                      productDotColor(cfg.layerColors.SOURCE_ALIGNED),
                      (p) => setSel({ kind: "product", id: p.id }),
                    )}
                    {appViewMode === "business" && renderDomainBubbles(
                      groupByDomain(bizProds),
                      ov.productDotR,
                      ov.typeBubbleSize,
                      productDotColor(cfg.layerColors.BUSINESS),
                      (p) => setSel({ kind: "product", id: p.id }),
                    )}
                    {appViewMode === "consumer" && renderDomainBubbles(
                      groupByDomain(conProds),
                      ov.productDotR,
                      ov.typeBubbleSize,
                      productDotColor(cfg.layerColors.CONSUMER_ALIGNED),
                      (p) => setSel({ kind: "product", id: p.id }),
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── TAB: DATA QUALITY ── */}
            {panelTab === "quality" && !selApp && (() => {
              const qp = cfg.qualityPanel;
              const wStyle: React.CSSProperties = { background: qp.widgetBg, border: `1px solid ${qp.widgetBorder}`, borderRadius: qp.widgetRadius };

              const qSearchLower = qualitySearch.toLowerCase();
              const qSearchResults = qualitySearch.length > 0 ? (products as any[]).filter(p => p.name.toLowerCase().includes(qSearchLower)).slice(0, 8) : [];

              const activeProduct = selProduct || (qSearchResults.length === 1 ? qSearchResults[0] : null);

              if (activeProduct) {
                const base = activeProduct.quality_score || 0.8;
                const offsets: Record<string, number> = { completeness: -5, accuracy: 0, consistency: 3, timeliness: -3, validity: 4, uniqueness: 8 };
                const selMetrics: Record<string, number> = {};
                DQ_LABELS.forEach(dq => { selMetrics[dq.key] = Math.round(Math.min(99, Math.max(55, base * 100 + (offsets[dq.key] ?? 0)))); });
                const openQualityDetails = (dq: typeof DQ_LABELS[number], val: number) => {
                  const testsRun = Math.max(8, 12);
                  const passed = Math.round(testsRun * val / 100);
                  const failed = Math.max(0, testsRun - passed);
                  setQualityDrilldown({
                    title: `${dq.label} · ${activeProduct.name}`,
                    description: qualityMethodText(dq.key),
                    testsRun,
                    passed,
                    failed,
                    failures: buildQualityFailures(dq.key, activeProduct.name, failed),
                  });
                };

                const insT = qp.selInsightsTitleColor || qp.headerSubColor;
                const insH = qp.selInsightsHintColor || qp.headerSubColor;
                const passH = qp.selInsightsPassingHeaderColor || cfg.green;
                const attH = qp.selInsightsAttentionHeaderColor || cfg.red;
                const strongDim = qp.selInsightsStrongDimLabelColor || qp.headerSubColor;
                const qlClear = qp.selClearLinkColor || "#9ca3af";
                const selQualRadarShell: React.CSSProperties = { background: qp.selWidgetBg, border: `1px solid ${qp.selWidgetBorder}`, borderRadius: qp.widgetRadius };
                const dqHdrStroke = insT;
                const dqIco = Math.max(11, Math.round(qp.selRadarHeaderSize + 1.5));
                return (
                  <div style={{ gap: qp.selSectionGap }} className="flex flex-col">
                    {selProduct && <button onClick={() => setSel(null)} className="text-[10px] font-medium hover:opacity-80 flex items-center gap-1 cursor-pointer self-start" style={{ color: qlClear }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>Clear selection</button>}
                    <OverviewStyleProductBannerBlock os={cfg.overviewPanel} selProduct={activeProduct} domainColorMap={domainColorMap} cfg={cfg} />

                    <div className="rounded-xl overflow-visible flex flex-col" style={selQualRadarShell}>
                      <div className="flex items-center justify-between gap-2 shrink-0 px-2 pt-2 pb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <svg className="shrink-0" width={dqIco} height={dqIco} viewBox="0 0 24 24" fill="none" stroke={dqHdrStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          <h2 className="truncate" style={{ color: insT, fontSize: qp.selRadarHeaderSize, fontWeight: 700, lineHeight: 1.15, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Data quality</h2>
                        </div>
                        {!selProduct && <button onClick={() => { setQualitySearch(""); }} className="cursor-pointer shrink-0" style={{ background: "none", border: "none", fontSize: 11, color: qp.headerSubColor }} title="Clear search">&times;</button>}
                      </div>
                      <div className="flex justify-center py-1 pb-2">
                        <DQHexRadar metrics={selMetrics} size={qp.radarSize} layerColor={cfg.layerColors[activeProduct.product_type]} label={activeProduct.name} avgScore={Math.round(Object.values(selMetrics).reduce((s, v) => s + v, 0) / 6)} fillOpacity={qp.radarFillOpacity} strokeWidth={qp.radarStrokeWidth} gridColor={qp.radarGridColor} labelSize={qp.radarLabelSize} valueSize={qp.radarValueSize} dotRadius={qp.radarDotRadius} centerScoreSize={qp.radarCenterScoreSize} centerLabelSize={qp.radarCenterLabelSize} labelColor={qp.radarLabelColor} axisWidth={qp.radarAxisWidth} labelGap={qp.radarLabelGap} labelOffset={qp.radarLabelOffset} consistencyLabelOutset={qp.radarConsistencyLabelOutset} highColor={qp.qualityHighColor} midColor={qp.qualityMidColor} lowColor={qp.qualityLowColor} />
                      </div>
                    </div>

                    {/* Quality Insights - scrollable */}
                    {(() => {
                      const sorted = DQ_LABELS.map(dq => ({ ...dq, val: selMetrics[dq.key] ?? 0 })).sort((a, b) => a.val - b.val);
                      const weak = sorted.filter(d => d.val < 90);
                      const strong = sorted.filter(d => d.val >= 90);
                      return (
                        <div className="rounded-xl p-3 flex flex-col" style={{ background: qp.insightsBg, border: `1px solid ${qp.insightsBorder}`, borderRadius: qp.widgetRadius, maxHeight: qp.insightsMaxHeight, overflow: "hidden" }}>
                          <div className="flex items-center gap-1.5 shrink-0 mb-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={insT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            <span style={{ fontSize: qp.dimLabelSize, fontWeight: 700, color: insT, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Quality Insights</span>
                          </div>
                          <div className="shrink-0 mb-1.5 rounded-md px-2 py-1" style={{ background: insH + "14", fontSize: qp.dimDescSize, color: insH }}>Click any dimension to drill down into test results and failures</div>
                          <div className="overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth: "thin" as const }}>
                          {strong.length > 0 && (
                            <>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={passH} strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="font-bold" style={{ fontSize: qp.dimDescSize + 1, color: passH }}>Passing</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 mb-2">
                                {strong.map(dq => (
                                  <button key={dq.key} onClick={() => openQualityDetails(dq, dq.val)} className="rounded-lg p-1.5 text-center cursor-pointer hover:opacity-80" style={{ background: cfg.green + "08", border: `1px solid ${cfg.green}12` }}>
                                    <div className="font-bold" style={{ fontSize: qp.dimValueSize, color: cfg.green }}>{dq.val}%</div>
                                    <div className="font-semibold truncate" style={{ fontSize: qp.dimDescSize, color: strongDim }}>{dq.label}</div>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                          {weak.length > 0 && (
                            <>
                              <div className="flex items-center gap-1.5 mb-2">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={attH} strokeWidth="2.5" strokeLinecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                                <span className="font-bold" style={{ fontSize: qp.dimDescSize + 1, color: attH }}>Needs Attention</span>
                              </div>
                              {weak.map(dq => {
                                const col = dq.val < 75 ? cfg.red : "#dab508";
                                return (
                                  <button key={dq.key} onClick={() => openQualityDetails(dq, dq.val)} className="mb-2 rounded-lg p-2 w-full text-left cursor-pointer hover:opacity-90 transition-opacity" style={{ background: col + "06", border: `1px solid ${col}18` }}>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="font-semibold" style={{ fontSize: qp.dimLabelSize, color: qp.headerTextColor }}>{dq.label}</span>
                                      <span className="font-bold" style={{ fontSize: qp.dimValueSize, color: col }}>{dq.val}%</span>
                                    </div>
                                    <p style={{ fontSize: qp.dimDescSize, color: qp.methodTextColor, lineHeight: 1.4 }}>{qualityMethodText(dq.key)}</p>
                                    <span className="inline-block mt-1 font-bold uppercase" style={{ fontSize: qp.inspectTextSize, color: col }}>Inspect failures &rarr;</span>
                                  </button>
                                );
                              })}
                            </>
                          )}
                          {weak.length === 0 && <p style={{ fontSize: qp.methodTextSize, color: cfg.green, fontWeight: 600 }}>All dimensions above 90% — no issues detected.</p>}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              }

              const qh = qp.nsEmptyHeadingSize > 0 ? qp.nsEmptyHeadingSize : qp.dimLabelSize;
              const qhc = qp.nsEmptyHeadingColor || qp.headerSubColor;
              const qb = qp.nsEmptyBodySize > 0 ? qp.nsEmptyBodySize : qp.methodTextSize;
              const qrl = qp.nsEmptyRadarLegendSize > 0 ? qp.nsEmptyRadarLegendSize : qp.methodTextSize;
              const qss = qp.nsEmptySearchSize > 0 ? qp.nsEmptySearchSize : qp.dimLabelSize;
              return (
                <div style={{ gap: qp.sectionGap }} className="flex flex-col">
                  <div>
                    <h2 className="font-bold mb-0.5" style={{ color: qp.headerTextColor, fontSize: qp.titleSize }}>Data Quality</h2>
                    <span style={{ fontSize: qp.subtitleSize, color: qp.headerSubColor }}>{products.length} products · {domainOrder.length} domains</span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input type="text" value={qualitySearch} onChange={e => setQualitySearch(e.target.value)} placeholder="Search products..." className="w-full rounded-lg px-3 py-1.5 outline-none" style={{ fontSize: qss, border: `1px solid ${qp.widgetBorder}`, background: qp.cardBg, color: qp.headerTextColor }} />
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={qp.headerSubColor} strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    {qSearchResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-lg" style={{ background: qp.widgetBg, border: `1px solid ${qp.widgetBorder}` }}>
                        {qSearchResults.map(p => (
                          <button key={p.id} onClick={() => { setSel({ kind: "product", id: p.id }); setQualitySearch(""); }} className="w-full text-left px-3 py-1.5 cursor-pointer flex items-center gap-2 transition-colors" style={{ borderBottom: `1px solid ${qp.widgetBorder}44` }}
                            onMouseEnter={e => { e.currentTarget.style.background = qp.cardBg; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.layerColors[p.product_type] }} />
                            <span className="font-semibold truncate flex-1" style={{ fontSize: qp.dimLabelSize, color: qp.headerTextColor }}>{p.name}</span>
                            <StarRating stars={qualityToStars(p.quality_score)} size={7} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* How Quality Is Measured - 2 column card layout */}
                  <div className="rounded-xl p-3" style={wStyle}>
                    <div style={{ fontSize: qh, fontWeight: 700, color: qhc, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>How Quality Is Measured</div>
                    <p style={{ fontSize: qb, color: qp.methodTextColor, lineHeight: 1.55, marginBottom: 8 }}>
                      Every data product is evaluated across six quality dimensions — each backed by automated tests that run on every refresh cycle.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {DQ_LABELS.map(dq => (
                        <div key={dq.key} className="rounded-lg p-2" style={{ background: qp.cardBg, border: `1px solid ${qp.cardBorder}` }}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="shrink-0 rounded flex items-center justify-center" style={{ width: qp.iconSize, height: qp.iconSize, background: qp.dimIconColor + "14" }}>
                              <svg style={{ width: qp.iconSize * 0.7, height: qp.iconSize * 0.7 }} viewBox="0 0 24 24" fill="none" stroke={qp.dimIconColor} strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="font-bold truncate" style={{ fontSize: qp.dimLabelSize - 0.5, color: qp.headerTextColor }}>{dq.label}</span>
                          </div>
                          <p style={{ fontSize: qp.methodTextSize - 1, color: qp.methodTextColor, lineHeight: 1.4 }}>{dq.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Radar preview with % ranges */}
                  <div className="rounded-xl p-3" style={wStyle}>
                    <div style={{ fontSize: qh, fontWeight: 700, color: qhc, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>How It Is Represented</div>
                    <DQHexRadar metrics={{ completeness: 88, accuracy: 92, consistency: 78, timeliness: 85, validity: 90, uniqueness: 95 }} size={qp.radarSize} layerColor={cfg.text} label="Example Product" avgScore={88} fillOpacity={qp.radarFillOpacity} strokeWidth={qp.radarStrokeWidth} gridColor={qp.radarGridColor} labelSize={qp.radarLabelSize} valueSize={qp.radarValueSize} dotRadius={qp.radarDotRadius} centerScoreSize={qp.radarCenterScoreSize} centerLabelSize={qp.radarCenterLabelSize} labelColor={qp.radarLabelColor} axisWidth={qp.radarAxisWidth} labelGap={qp.radarLabelGap} labelOffset={qp.radarLabelOffset} consistencyLabelOutset={qp.radarConsistencyLabelOutset} highColor={qp.qualityHighColor} midColor={qp.qualityMidColor} lowColor={qp.qualityLowColor} />
                    <div className="flex justify-center gap-2 mt-1">
                      {[{ l: "95%+", c: qp.qualityHighColor }, { l: "75–94%", c: qp.qualityMidColor }, { l: "<75%", c: qp.qualityLowColor }].map(r => (
                        <div key={r.l} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: r.c }} />
                          <span className="font-semibold" style={{ fontSize: qrl, color: qp.methodTextColor }}>{r.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── TAB: PIPELINE ── */}
            {panelTab === "pipeline" && !selApp && (() => {
              const pp = cfg.pipelinePanel;
              const wStyle: React.CSSProperties = { background: pp.widgetBg, border: `1px solid ${pp.widgetBorder}`, borderRadius: pp.widgetRadius };

              type PipeStatus = "HEALTHY" | "BROKEN" | "WARNING";
              const ppsMap = new Map((productPipelineStatus as any[]).map((r: any) => [r.product_id, r]));

              type ProdPipe = { prod: any; domCol: string; pipelineData: any; status: PipeStatus; healthy: boolean; upstreamEdges: { id: string; sourceName: string; status: PipeStatus; reason?: string }[]; downstreamEdges: { id: string; targetName: string; status: PipeStatus; reason?: string }[]; upstreamIds: string[]; upstreamNames: string[]; downstreamIds: string[]; downstreamNames: string[] };
              const allProdPipes: ProdPipe[] = (products as any[]).map((p: any) => {
                const domCol = domainColorMap[p.domain_name] || "#999";
                const pps = ppsMap.get(p.id);

                const upEdges: ProdPipe["upstreamEdges"] = [];
                const upIds: string[] = []; const upNames: string[] = [];
                if (p.product_type === "SOURCE_ALIGNED") {
                  appSourceEdges.filter(e => e.productId === p.id).forEach(e => {
                    const a = allPosApps.find(ap => ap.id === e.appId);
                    if (a) {
                      upIds.push(a.id); upNames.push(a.name);
                      const reason = e.status === "BROKEN"
                        ? `Ingestion pipeline from ${a.name} is DOWN — connector failed, no data flowing`
                        : e.status === "WARNING"
                          ? `Connection to ${a.name} is PAUSED — data sync suspended, freshness degrading`
                          : undefined;
                      upEdges.push({ id: e.id, sourceName: a.name, status: e.status, reason });
                    }
                  });
                } else {
                  lineageEdges.filter(e => e.target === p.id).forEach(e => {
                    const s = pMap.get(e.source);
                    if (s) {
                      upIds.push(e.source); upNames.push(s.label);
                      let reason = e.statusReason || undefined;
                      if (!reason && e.eStatus === "WARNING") {
                        reason = `Upstream product ${s.label} has degraded sources — mart tables may be stale`;
                      }
                      upEdges.push({ id: e.id, sourceName: s.label, status: e.eStatus, reason });
                    }
                  });
                }

                const downEdges: ProdPipe["downstreamEdges"] = [];
                const downIds: string[] = []; const downNames: string[] = [];
                lineageEdges.filter(e => e.source === p.id).forEach(e => {
                  const t = pMap.get(e.target);
                  if (t) {
                    downIds.push(e.target); downNames.push(t.label);
                    let reason = e.statusReason || undefined;
                    if (!reason && e.eStatus === "WARNING") {
                      reason = `Upstream product ${p.name} has broken/degraded sources — downstream data may be stale`;
                    }
                    downEdges.push({ id: e.id, targetName: t.label, status: e.eStatus, reason });
                  }
                });

                const hasFailed = pps && pps.failed > 0;
                const hasWarningRuns = pps && pps.warning > 0;
                const hasUpstreamIssue = upEdges.some(ue => ue.status === "BROKEN" || ue.status === "WARNING");
                const prodStatus: PipeStatus = hasFailed ? "BROKEN" : (hasUpstreamIssue || hasWarningRuns) ? "WARNING" : "HEALTHY";

                return { prod: p, domCol, pipelineData: pps || { total_runs: 0, completed: 0, warning: 0, failed: 0, running: 0, skipped: 0, last_error: null, last_run_at: null }, status: prodStatus, healthy: prodStatus === "HEALTHY", upstreamEdges: upEdges, downstreamEdges: downEdges, upstreamIds: upIds, upstreamNames: upNames, downstreamIds: downIds, downstreamNames: downNames };
              });

              const totalAll = allProdPipes.length;
              const healthyAll = allProdPipes.filter(pp2 => pp2.status === "HEALTHY").length;
              const brokenAll = allProdPipes.filter(pp2 => pp2.status === "BROKEN").length;
              const warningAll = allProdPipes.filter(pp2 => pp2.status === "WARNING").length;
              const passedAll = healthyAll;
              const failedAll = brokenAll + warningAll;

              const pipeSearchLower = pipeSearch.toLowerCase();
              const pipeSearchResults = pipeSearch.length > 0 ? allProdPipes.filter(pp2 => pp2.prod.name.toLowerCase().includes(pipeSearchLower)).slice(0, 8) : [];
              const focusProd = selProduct || (pipeSearchResults.length === 1 ? pipeSearchResults[0].prod : null);
              const focusPipe = focusProd ? allProdPipes.find(pp2 => pp2.prod.id === focusProd.id) : null;

              const totalModels = allProdPipes.reduce((s, pp2) => s + (pp2.pipelineData?.total_runs || 0), 0);

              const ArchBox = ({ label, sub, col, dashed }: { label: string; sub?: string; col: string; dashed?: boolean }) => (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: col + "08", border: `1.5px ${dashed ? "dashed" : "solid"} ${col}40`, minWidth: 0 }}>
                  <div className="font-bold truncate" style={{ fontSize: pp.archLabelSize, color: col }}>{label}</div>
                  {sub && <div className="font-mono truncate" style={{ fontSize: pp.archSubSize, color: pp.headerSubColor }}>{sub}</div>}
                </div>
              );
              const ArchArrow = ({ col }: { col: string }) => (
                <div className="flex justify-center py-0.5">
                  <svg width="12" height="16" viewBox="0 0 12 16" fill="none"><line x1="6" y1="0" x2="6" y2="12" stroke={col + "55"} strokeWidth="1.2" /><polygon points="2,10 6,15 10,10" fill={col + "55"} /></svg>
                </div>
              );
              const ArchConsumers = ({ col, nextLayer }: { col: string; nextLayer?: { label: string; col: string } }) => (
                <div>
                  <div className="font-bold uppercase tracking-wider text-center mb-1.5" style={{ fontSize: pp.archSubSize, color: pp.headerSubColor }}>Downstream Consumers</div>
                  <div className={`grid gap-1.5 ${nextLayer ? "grid-cols-4" : "grid-cols-3"}`}>
                    {nextLayer && (
                      <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: nextLayer.col + "0c", border: `1.5px solid ${nextLayer.col}40` }}>
                        <svg className="mx-auto mb-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={nextLayer.col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                        <div className="font-bold" style={{ fontSize: pp.archSubSize + 0.5, color: nextLayer.col }}>{nextLayer.label}</div>
                      </div>
                    )}
                    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "#6366f108", border: "1.5px dashed #6366f140" }}>
                      <svg className="mx-auto mb-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                      <div className="font-bold" style={{ fontSize: pp.archSubSize + 0.5, color: "#6366f1" }}>Dashboards</div>
                    </div>
                    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "#0891b208", border: "1.5px dashed #0891b240" }}>
                      <svg className="mx-auto mb-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                      <div className="font-bold" style={{ fontSize: pp.archSubSize + 0.5, color: "#0891b2" }}>APIs</div>
                    </div>
                    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: col + "08", border: `1.5px dashed ${col}40` }}>
                      <svg className="mx-auto mb-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="M11 18H8a2 2 0 0 1-2-2V9" /></svg>
                      <div className="font-bold" style={{ fontSize: pp.archSubSize + 0.5, color: col }}>AI / ML</div>
                    </div>
                  </div>
                </div>
              );

              return (
                <div style={{ gap: focusPipe ? pp.selSectionGap : pp.sectionGap }} className="flex flex-col">
                  {focusPipe && <button onClick={() => { setSel(null); setPipeSearch(""); }} className="text-[10px] font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 cursor-pointer self-start"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>Clear selection</button>}
                  {!focusPipe && (
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold mb-0.5" style={{ color: pp.headerTextColor, fontSize: pp.titleSize }}>Pipeline Health</h2>
                      <div className="relative group">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center cursor-help" style={{ background: pp.headerSubColor + "18" }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={pp.headerSubColor} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1.5 rounded-lg shadow-lg text-[10px] leading-snug whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30" style={{ background: pp.headerTextColor, color: pp.widgetBg }}>
                          Search or select a product to view detailed pipeline models and logs
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: pp.subtitleSize, color: pp.headerSubColor }}>{totalAll} products · {totalModels} pipeline steps</span>
                  </div>
                  )}

                  {!focusPipe && (
                  <div className="relative">
                    <input type="text" value={pipeSearch} onChange={e => setPipeSearch(e.target.value)} placeholder="Search products..." className="w-full rounded-lg px-3 py-1.5 outline-none" style={{ fontSize: pp.searchFontSize, border: `1px solid ${pp.searchBorder}`, background: pp.searchBg, color: pp.headerTextColor }} />
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={pp.headerSubColor} strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    {pipeSearchResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-lg" style={{ background: pp.widgetBg, border: `1px solid ${pp.widgetBorder}` }}>
                        {pipeSearchResults.map(pp2 => (
                          <button key={pp2.prod.id} onClick={() => { setSel({ kind: "product", id: pp2.prod.id }); setPipeSearch(""); }} className="w-full text-left px-3 py-1.5 cursor-pointer flex items-center gap-2 transition-colors" style={{ borderBottom: `1px solid ${pp.widgetBorder}44` }}
                            onMouseEnter={e => { e.currentTarget.style.background = pp.cardBg; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pp2.status === "BROKEN" ? cfg.red : pp2.status === "WARNING" ? cfg.warning : cfg.green }} />
                            <span className="font-semibold truncate flex-1" style={{ fontSize: pp.prodNameSize, color: pp.headerTextColor }}>{pp2.prod.name}</span>
                            <span className="shrink-0 px-1 py-0.5 rounded font-bold uppercase" style={{ fontSize: pp.statusBadgeSize, background: (pp2.status === "BROKEN" ? cfg.red : pp2.status === "WARNING" ? cfg.warning : cfg.green) + "14", color: pp2.status === "BROKEN" ? cfg.red : pp2.status === "WARNING" ? cfg.warning : cfg.green }}>{pp2.status === "HEALTHY" ? "healthy" : pp2.status === "BROKEN" ? "broken" : "warning"}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  )}

                  {/* BANs — two tabs: Ingestion Pipelines + Data Products Pipeline */}
                  {!focusPipe && (() => {
                    const ingHealthy = pipelineStatus.filter((p: any) => p.health_status === "HEALTHY").length;
                    const ingDegraded = pipelineStatus.filter((p: any) => p.health_status === "DEGRADED").length;
                    const ingDown = pipelineStatus.filter((p: any) => p.health_status === "DOWN").length;
                    const ingTotal = pipelineStatus.length;

                    const dpHealthy = healthyAll;
                    const dpFailed = brokenAll;
                    const dpWarn = warningAll;

                    const banTabs = [
                      { key: "ingestion" as const, label: "Ingestion Pipelines", icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
                      { key: "dataproduct" as const, label: "Data Product Pipelines", icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg> },
                    ];

                    return (
                      <div className="rounded-xl overflow-hidden" style={wStyle}>
                        <div className="flex" style={{ borderBottom: `2px solid ${pp.widgetBorder}` }}>
                          {banTabs.map(tab => (
                            <button key={tab.key} onClick={() => setPipeBanTab(tab.key)} className={`flex-1 py-2 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${pipeBanTab === tab.key ? "border-b-2" : "hover:bg-gray-50"}`} style={{ borderColor: pipeBanTab === tab.key ? pp.headerTextColor : "transparent", fontSize: pp.nsBanTabFontSize || pp.tabFontSize + 1, fontWeight: pipeBanTab === tab.key ? 700 : 500, color: pipeBanTab === tab.key ? pp.headerTextColor : pp.headerSubColor }}>
                              {tab.icon}{tab.label}
                            </button>
                          ))}
                        </div>
                        <div className="p-2.5">
                          {pipeBanTab === "ingestion" ? (
                            <div className="grid grid-cols-4 gap-1.5">
                              <div className="rounded-lg p-2" style={{ background: pp.cardBg, border: `1px solid ${pp.widgetBorder}` }}>
                                <span className="font-black block" style={{ fontSize: pp.kpiFontSize, color: pp.headerTextColor }}>{ingTotal}</span>
                                <span className="font-semibold block" style={{ fontSize: pp.banDescSize, color: pp.headerSubColor, lineHeight: 1.3 }}>Total</span>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: cfg.green + "08", border: `1px solid ${cfg.green}18` }}>
                                <span className="font-black block" style={{ fontSize: pp.kpiFontSize, color: cfg.green }}>{ingHealthy}</span>
                                <span className="font-semibold block" style={{ fontSize: pp.banDescSize, color: cfg.green, lineHeight: 1.3 }}>Succeeded</span>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: ingDown > 0 ? cfg.red + "08" : cfg.green + "08", border: `1px solid ${ingDown > 0 ? cfg.red : cfg.green}18` }}>
                                <span className="font-black block" style={{ fontSize: pp.kpiFontSize, color: ingDown > 0 ? cfg.red : cfg.green }}>{ingDown}</span>
                                <span className="font-semibold block" style={{ fontSize: pp.banDescSize, color: ingDown > 0 ? cfg.red : cfg.green, lineHeight: 1.3 }}>Failed</span>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: ingDegraded > 0 ? cfg.warning + "08" : cfg.green + "08", border: `1px solid ${ingDegraded > 0 ? cfg.warning : cfg.green}18` }}>
                                <span className="font-black block" style={{ fontSize: pp.kpiFontSize, color: ingDegraded > 0 ? cfg.warning : cfg.green }}>{ingDegraded}</span>
                                <span className="font-semibold block" style={{ fontSize: pp.banDescSize, color: ingDegraded > 0 ? cfg.warning : cfg.green, lineHeight: 1.3 }}>Warnings</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-1.5">
                              <div className="rounded-lg p-2" style={{ background: pp.cardBg, border: `1px solid ${pp.widgetBorder}` }}>
                                <span className="font-black block" style={{ fontSize: pp.kpiFontSize, color: pp.headerTextColor }}>{totalAll}</span>
                                <span className="font-semibold block" style={{ fontSize: pp.banDescSize, color: pp.headerSubColor, lineHeight: 1.3 }}>Total</span>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: cfg.green + "08", border: `1px solid ${cfg.green}18` }}>
                                <span className="font-black block" style={{ fontSize: pp.kpiFontSize, color: cfg.green }}>{dpHealthy}</span>
                                <span className="font-semibold block" style={{ fontSize: pp.banDescSize, color: cfg.green, lineHeight: 1.3 }}>Succeeded</span>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: dpFailed > 0 ? cfg.red + "08" : cfg.green + "08", border: `1px solid ${dpFailed > 0 ? cfg.red : cfg.green}18` }}>
                                <span className="font-black block" style={{ fontSize: pp.kpiFontSize, color: dpFailed > 0 ? cfg.red : cfg.green }}>{dpFailed}</span>
                                <span className="font-semibold block" style={{ fontSize: pp.banDescSize, color: dpFailed > 0 ? cfg.red : cfg.green, lineHeight: 1.3 }}>Failed</span>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: dpWarn > 0 ? cfg.warning + "08" : cfg.green + "08", border: `1px solid ${dpWarn > 0 ? cfg.warning : cfg.green}18` }}>
                                <span className="font-black block" style={{ fontSize: pp.kpiFontSize, color: dpWarn > 0 ? cfg.warning : cfg.green }}>{dpWarn}</span>
                                <span className="font-semibold block" style={{ fontSize: pp.banDescSize, color: dpWarn > 0 ? cfg.warning : cfg.green, lineHeight: 1.3 }}>Warnings</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Architecture Diagrams — 3 tabs: Source / Business / Consumer (vertical flow) */}
                  {!focusPipe && (() => {
                    const maxIn = pp.archMaxInputs;
                    const srcCount = Math.min(maxIn, (products as any[]).filter((p: any) => p.product_type === "SOURCE_ALIGNED").length);
                    const srcNames = Array.from({ length: srcCount }, (_, i) => `marts.product_${i + 1}`);
                    const bizCount = Math.min(maxIn, (products as any[]).filter((p: any) => p.product_type === "BUSINESS").length);
                    const bizNames = Array.from({ length: bizCount }, (_, i) => `marts.product_${i + 1}`);
                    const srcCol = cfg.layerColors.SOURCE_ALIGNED;
                    const bizCol = cfg.layerColors.BUSINESS;
                    const conCol = cfg.layerColors.CONSUMER_ALIGNED;
                    const appCol = cfg.layerColors.APPS;

                    const archTabs = [
                      { key: "source" as const, label: "Source", col: srcCol, count: (products as any[]).filter(p => p.product_type === "SOURCE_ALIGNED").length },
                      { key: "business" as const, label: "Business", col: bizCol, count: (products as any[]).filter(p => p.product_type === "BUSINESS").length },
                      { key: "consumer" as const, label: "Consumer", col: conCol, count: (products as any[]).filter(p => p.product_type === "CONSUMER_ALIGNED").length },
                    ];

                    return (
                      <div className="rounded-xl overflow-hidden" style={wStyle}>
                        <div className="px-3 pt-2.5 pb-1.5" style={{ borderBottom: `1px solid ${pp.widgetBorder}` }}>
                          <div className="font-bold" style={{ fontSize: pp.sectionHeaderSize + 1, color: pp.headerTextColor }}>Data Flow Architecture</div>
                        </div>
                        <div className="flex" style={{ borderBottom: `2px solid ${pp.widgetBorder}` }}>
                          {archTabs.map(tab => (
                            <button key={tab.key} onClick={() => setPipeArchTab(tab.key)} className={`flex-1 py-2 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${pipeArchTab === tab.key ? "border-b-2" : "hover:bg-gray-50"}`} style={{ borderColor: pipeArchTab === tab.key ? tab.col : "transparent", fontSize: pp.tabFontSize + 1, fontWeight: pipeArchTab === tab.key ? 700 : 500, color: pipeArchTab === tab.key ? tab.col : pp.headerSubColor }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: tab.col }} />{tab.label}
                              <span className="opacity-40" style={{ fontSize: pp.tabFontSize - 0.5 }}>({tab.count})</span>
                            </button>
                          ))}
                        </div>
                        <div className="p-3 flex flex-col gap-0">
                          {pipeArchTab === "source" && (<>
                            <div className="font-bold text-center mb-2" style={{ fontSize: pp.archLabelSize + 1, color: srcCol }}>Source Product Data Flow</div>
                            <ArchBox label="Applications" sub="SaaS / DB / API / Streaming" col={appCol} />
                            <ArchArrow col={appCol} />
                            <ArchBox label="Ingestion Layer" sub="Connectors / CDC / Event Streams" col={appCol} dashed />
                            <ArchArrow col={srcCol} />
                            <ArchBox label="Staging Models" sub="staging.*" col={srcCol} />
                            <ArchArrow col={srcCol} />
                            <ArchBox label="Source Marts" sub="marts.src_*" col={srcCol} />
                            <ArchArrow col={srcCol} />
                            <ArchConsumers col={srcCol} nextLayer={{ label: "Business Products", col: bizCol }} />
                          </>)}
                          {pipeArchTab === "business" && (<>
                            <div className="font-bold text-center mb-2" style={{ fontSize: pp.archLabelSize + 1, color: bizCol }}>Business Product Data Flow</div>
                            <div className="font-bold uppercase tracking-wider text-center mb-1" style={{ fontSize: pp.archSubSize, color: pp.headerSubColor }}>Source Marts (Upstream)</div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {srcNames.map((n, i) => <ArchBox key={i} label={n} col={srcCol} />)}
                            </div>
                            <ArchArrow col={bizCol} />
                            <ArchBox label="Biz Staging" sub="staging.biz_*" col={bizCol} />
                            <ArchArrow col={bizCol} />
                            <ArchBox label="Business Marts" sub="marts.biz_*" col={bizCol} />
                            <ArchArrow col={bizCol} />
                            <ArchConsumers col={bizCol} nextLayer={{ label: "Consumer Products", col: conCol }} />
                          </>)}
                          {pipeArchTab === "consumer" && (<>
                            <div className="font-bold text-center mb-2" style={{ fontSize: pp.archLabelSize + 1, color: conCol }}>Consumer Product Data Flow</div>
                            <div className="font-bold uppercase tracking-wider text-center mb-1" style={{ fontSize: pp.archSubSize, color: pp.headerSubColor }}>Business Marts (Upstream)</div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {bizNames.map((n, i) => <ArchBox key={i} label={n} col={bizCol} />)}
                            </div>
                            <ArchArrow col={conCol} />
                            <ArchBox label="Consumer Staging" sub="staging.cnsmr_*" col={conCol} />
                            <ArchArrow col={conCol} />
                            <ArchBox label="Consumer Marts" sub="marts.cnsmr_*" col={conCol} />
                            <ArchArrow col={conCol} />
                            <ArchConsumers col={conCol} />
                          </>)}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Focused product view */}
                  {focusPipe && (() => {
                    const fp = focusPipe;
                    const getUpstreamStatus = (uid: string): { name: string; healthy: boolean; status: PipeStatus } => {
                      const upPipe = allProdPipes.find(pp2 => pp2.prod.id === uid);
                      if (upPipe) return { name: upPipe.prod.name, healthy: upPipe.healthy, status: upPipe.status };
                      const upApp = allPosApps.find(a => a.id === uid);
                      if (upApp) return { name: upApp.name, healthy: upApp.conn_status !== "BROKEN", status: upApp.conn_status === "BROKEN" ? "BROKEN" : "HEALTHY" };
                      return { name: uid, healthy: true, status: "HEALTHY" };
                    };
                    const getDownstreamStatus = (did: string): { name: string; healthy: boolean; status: PipeStatus } => {
                      const dPipe = allProdPipes.find(pp2 => pp2.prod.id === did);
                      if (dPipe) return { name: dPipe.prod.name, healthy: dPipe.healthy, status: dPipe.status };
                      return { name: did, healthy: true, status: "HEALTHY" };
                    };

                    const isSource = fp.prod.product_type === "SOURCE_ALIGNED";
                    const isBiz = fp.prod.product_type === "BUSINESS";

                    const pd = fp.pipelineData;
                    const activeMTab = isSource ? pipeModelTab : (pipeModelTab === "ingestion" ? "stage" : pipeModelTab);

                    type LogEntry = { message: string; status: "pass" | "fail" | "running"; time: string; phase: "INGESTION" | "TRANSFORMATION" };
                    const focusLogs: LogEntry[] = [];

                    fp.upstreamEdges.forEach(ue => {
                      if (ue.status === "BROKEN") {
                        focusLogs.push({ message: `[UPSTREAM BROKEN] ${ue.sourceName}: DAG failure in this product's staging model that reads from "${ue.sourceName}" — ${ue.reason || "pipeline broken, downstream stale"}`, status: "fail", time: "—", phase: "INGESTION" });
                      } else if (ue.status === "WARNING") {
                        focusLogs.push({ message: `[UPSTREAM WARNING] ${ue.sourceName}: ${ue.reason || "Upstream dependency degraded — freshness at risk"}`, status: "running", time: "—", phase: "INGESTION" });
                      } else {
                        focusLogs.push({ message: `[UPSTREAM OK] ${ue.sourceName}: healthy, data fresh`, status: "pass", time: "—", phase: "INGESTION" });
                      }
                    });

                    if (pd.last_error) {
                      focusLogs.push({ message: `[DAG FAILURE] ${pd.last_error}`, status: "fail", time: pd.last_run_at?.slice(11, 16) || "—", phase: "TRANSFORMATION" });
                    }
                    const warnCount = pd.warning || 0;
                    const skipped = pd.skipped || (pd.total_runs - pd.completed - pd.failed - warnCount - (pd.running || 0));
                    if (pd.failed > 0) {
                      const parts = [`${pd.failed} FAILED`];
                      if (skipped > 0) parts.push(`${skipped} skipped (dependency chain broken)`);
                      if (warnCount > 0) parts.push(`${warnCount} warning (stale data)`);
                      if (pd.completed > 0) parts.push(`${pd.completed} completed`);
                      focusLogs.push({ message: `[PIPELINE] ${pd.total_runs} model runs: ${parts.join(", ")}`, status: "fail", time: pd.last_run_at?.slice(11, 16) || "—", phase: "TRANSFORMATION" });
                    } else if (warnCount > 0) {
                      const parts = [`${warnCount} warning (stale upstream data)`];
                      if (pd.completed > 0) parts.push(`${pd.completed} completed`);
                      if (skipped > 0) parts.push(`${skipped} skipped`);
                      focusLogs.push({ message: `[PIPELINE] ${pd.total_runs} model runs: ${parts.join(", ")}`, status: "running", time: pd.last_run_at?.slice(11, 16) || "—", phase: "TRANSFORMATION" });
                    } else if (pd.completed > 0 && skipped > 0) {
                      focusLogs.push({ message: `[PIPELINE] ${pd.total_runs} model runs: ${pd.completed} completed, ${skipped} skipped (connector paused — using cached data)`, status: "running", time: pd.last_run_at?.slice(11, 16) || "—", phase: "TRANSFORMATION" });
                    } else if (pd.completed > 0 && pd.failed === 0) {
                      focusLogs.push({ message: `[PIPELINE] All ${pd.completed} of ${pd.total_runs} model runs completed successfully`, status: "pass", time: pd.last_run_at?.slice(11, 16) || "—", phase: "TRANSFORMATION" });
                    }
                    if (pd.running > 0) {
                      focusLogs.push({ message: `[PIPELINE] ${pd.running} model run(s) currently in progress`, status: "running", time: "now", phase: "TRANSFORMATION" });
                    }

                    fp.downstreamEdges.forEach(de => {
                      if (de.status === "BROKEN") {
                        focusLogs.push({ message: `[DOWNSTREAM BROKEN] ${de.targetName}: DAG failure in "${de.targetName}" staging model that reads from "${fp.prod.name}" — ${de.reason || "orchestration pipeline broken"}`, status: "fail", time: "—", phase: "TRANSFORMATION" });
                      } else if (de.status === "WARNING") {
                        focusLogs.push({ message: `[DOWNSTREAM WARNING] ${de.targetName}: ${de.reason || "Downstream product may have stale data due to upstream issues"}`, status: "running", time: "—", phase: "TRANSFORMATION" });
                      }
                    });

                    const successLogs = focusLogs.filter(l => l.status === "pass");
                    const warningLogs = focusLogs.filter(l => l.status === "running");
                    const failureLogs = focusLogs.filter(l => l.status === "fail");
                    const activeLogTab = pipeLogTab;
                    const activeLogList = activeLogTab === "success" ? successLogs : activeLogTab === "warnings" ? warningLogs : failureLogs;
                    const resolveLineageName = (id: string) => {
                      const ap = allPosApps.find(a => a.id === id);
                      if (ap) return ap.name;
                      if (fp.upstreamIds.includes(id)) return getUpstreamStatus(id).name;
                      return getDownstreamStatus(id).name;
                    };
                    const lineageFocusName = pipeLineageFocusId ? resolveLineageName(pipeLineageFocusId) : null;
                    const displayLogList = lineageFocusName
                      ? activeLogList.filter(l => l.message.toLowerCase().includes(lineageFocusName.toLowerCase()))
                      : activeLogList;

                    type PipeLinItem = { id: string; name: string; healthy: boolean; status: PipeStatus };
                    const statusColor = (s: PipeStatus) => s === "BROKEN" ? cfg.red : s === "WARNING" ? cfg.warning : cfg.green;
                    const pipeSelWidget: React.CSSProperties = { background: pp.selWidgetBg, border: `1px solid ${pp.selWidgetBorder}`, borderRadius: pp.widgetRadius };
                    const pipeLinCard: React.CSSProperties = { background: pp.selBoxBg, border: `1px solid ${pp.selBoxBorder}`, borderRadius: pp.cardRadius };
                    const tblRule = pp.selTableBorder;
                    const upPipeGroups = (() => {
                      const apps: PipeLinItem[] = [];
                      const layers: Record<string, PipeLinItem[]> = { SOURCE_ALIGNED: [], BUSINESS: [], CONSUMER_ALIGNED: [] };
                      const upEdgeMap = new Map(fp.upstreamEdges.map(ue => [ue.id, ue]));
                      fp.upstreamIds.forEach((uid, i) => {
                        const ap = allPosApps.find(a => a.id === uid);
                        if (ap) {
                          const st: PipeStatus = ap.conn_status === "BROKEN" ? "BROKEN" : ap.conn_status === "ACTIVE" ? "HEALTHY" : "WARNING";
                          apps.push({ id: uid, name: ap.name, healthy: st === "HEALTHY", status: st });
                          return;
                        }
                        const edgeInfo = upEdgeMap.get(uid);
                        const edgeStatus = edgeInfo?.status;
                        const us = getUpstreamStatus(uid);
                        const finalStatus: PipeStatus = edgeStatus === "BROKEN" ? "BROKEN" : edgeStatus === "WARNING" ? "WARNING" : us.status;
                        const p = (products as any[]).find((x: any) => x.id === uid);
                        const lk = (p?.product_type as string) || "SOURCE_ALIGNED";
                        if (!layers[lk]) layers[lk] = [];
                        layers[lk].push({ id: uid, name: us.name, healthy: finalStatus === "HEALTHY", status: finalStatus });
                      });
                      const out: { label: string; color: string; items: PipeLinItem[] }[] = [];
                      if (apps.length) out.push({ label: "Applications", color: cfg.layerColors.APPS, items: apps });
                      (["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const).forEach(lk => {
                        if (layers[lk]?.length) out.push({ label: LAYER_SHORT[lk], color: cfg.layerColors[lk], items: layers[lk] });
                      });
                      return out;
                    })();
                    const downPipeGroups = (() => {
                      const layers: Record<string, PipeLinItem[]> = { SOURCE_ALIGNED: [], BUSINESS: [], CONSUMER_ALIGNED: [] };
                      const downEdgeMap = new Map(fp.downstreamEdges.map(de => [de.id, de]));
                      fp.downstreamIds.forEach(did => {
                        const ds = getDownstreamStatus(did);
                        const edgeInfo = downEdgeMap.get(did);
                        const edgeStatus = edgeInfo?.status;
                        const finalStatus: PipeStatus = edgeStatus === "BROKEN" ? "BROKEN" : edgeStatus === "WARNING" ? "WARNING" : ds.status;
                        const p = (products as any[]).find((x: any) => x.id === did);
                        const lk = (p?.product_type as string) || "CONSUMER_ALIGNED";
                        if (!layers[lk]) layers[lk] = [];
                        layers[lk].push({ id: did, name: ds.name, healthy: finalStatus === "HEALTHY", status: finalStatus });
                      });
                      const out: { label: string; color: string; items: PipeLinItem[] }[] = [];
                      (["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const).forEach(lk => {
                        if (layers[lk]?.length) out.push({ label: LAYER_SHORT[lk], color: cfg.layerColors[lk], items: layers[lk] });
                      });
                      return out;
                    })();

                    const onPipeLineageClick = (item: PipeLinItem) => {
                      setPipeLineageFocusId(item.id);
                      setPipeDetailTab("logs");
                      const rel = focusLogs.filter(l => l.message.toLowerCase().includes(item.name.toLowerCase()));
                      const hasFail = rel.some(l => l.status === "fail");
                      const hasRun = rel.some(l => l.status === "running");
                      setPipeLogTab(hasFail ? "failure" : hasRun ? "warnings" : "success");
                    };

                    const layerCol = cfg.layerColors[fp.prod.product_type] || cfg.layerColors.SOURCE_ALIGNED;
                    const linTitleC = pp.selLineageTitleColor || pp.headerTextColor;
                    const linTitleSz = pp.selLineageTitleSize;
                    const linChevC = pp.selLineageChevronColor || linTitleC;

                    type PPRun = { id: string; model_name: string; stage: string; orchestrator: string; status: string; duration_sec: number; rows_processed: number; log_message: string | null; error_message: string | null; started_at: string | null; data_product_id: string };
                    const fpRuns: PPRun[] = (productPipelineRuns as any[]).filter((r: any) => r.data_product_id === fp.prod.id);

                    const fmtDuration = (s: number) => s < 60 ? `${s.toFixed(0)}s` : s < 3600 ? `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s` : `${(s / 3600).toFixed(1)}h`;
                    const fmtRows = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n);

                    const PipelineRunTable = ({ runs }: { runs: PPRun[] }) => (
                      <div className="overflow-y-auto rounded-lg flex-1 min-h-0" style={{ scrollbarWidth: "thin" as const, background: pp.selTableBg, border: `1px solid ${tblRule}` }}>
                        <table className="w-full" style={{ tableLayout: "fixed" }}>
                          <colgroup><col style={{ width: "35%" }} /><col style={{ width: "8%" }} /><col style={{ width: "15%" }} /><col style={{ width: "12%" }} /><col style={{ width: "15%" }} /><col style={{ width: "15%" }} /></colgroup>
                          <thead><tr>{["Model", "", "Stage", "Duration", "Records", "Orch"].map(h => (<th key={h} className="px-1 py-0.5 text-left" style={{ fontSize: pp.tableHeaderSize, fontWeight: 700, color: pp.headerSubColor, textTransform: "uppercase" as const, borderBottom: `1px solid ${tblRule}`, position: "sticky" as const, top: 0, background: pp.selTableHeaderBg }}>{h}</th>))}</tr></thead>
                          <tbody>{runs.map((m, i) => {
                            const sCol = m.status === "COMPLETED" ? cfg.green : m.status === "FAILED" ? cfg.red : m.status === "WARNING" ? cfg.warning : m.status === "SKIPPED" ? "#9ca3af" : cfg.warning;
                            const icon = m.status === "COMPLETED" ? "\u2713" : m.status === "FAILED" ? "\u2717" : m.status === "WARNING" ? "\u26A0" : m.status === "RUNNING" ? "\u25CB" : "\u2014";
                            return (<tr key={m.id || i} style={{ borderBottom: `1px solid ${tblRule}40` }}>
                              <td className="px-1 py-0.5"><span className="font-mono font-semibold truncate block" style={{ fontSize: pp.modelNameSize, color: pp.headerTextColor }}>{m.model_name}</span></td>
                              <td className="px-1 py-0.5"><span className="font-bold" style={{ fontSize: pp.modelNameSize + 0.5, color: sCol }}>{icon}</span></td>
                              <td className="px-1 py-0.5"><span className="font-mono" style={{ fontSize: pp.tableDataSize, color: pp.headerSubColor }}>{m.stage}</span></td>
                              <td className="px-1 py-0.5"><span className="font-mono" style={{ fontSize: pp.tableDataSize, color: pp.headerSubColor }}>{m.status === "SKIPPED" ? "\u2014" : fmtDuration(m.duration_sec)}</span></td>
                              <td className="px-1 py-0.5"><span className="font-mono" style={{ fontSize: pp.tableDataSize, color: pp.headerSubColor }}>{m.rows_processed > 0 ? fmtRows(m.rows_processed) : "\u2014"}</span></td>
                              <td className="px-1 py-0.5"><span className="font-mono" style={{ fontSize: pp.tableDataSize, color: pp.headerSubColor }}>{m.orchestrator}</span></td>
                            </tr>);
                          })}</tbody>
                        </table>
                        {runs.length === 0 && <p className="text-center py-3 font-semibold" style={{ fontSize: pp.prodMetaSize + 1, color: pp.headerSubColor }}>No pipeline runs recorded</p>}
                      </div>
                    );

                    return (
                      <>
                        <OverviewStyleProductBannerBlock os={cfg.overviewPanel} selProduct={fp.prod} domainColorMap={domainColorMap} cfg={cfg} />

                        {(fp.upstreamIds.length > 0 || fp.downstreamIds.length > 0) && (
                        <div className="rounded-xl overflow-hidden" style={pipeSelWidget}>
                          <div className="flex flex-col gap-1 p-1.5">
                            {fp.upstreamIds.length > 0 && (
                              <div className="rounded-lg overflow-hidden" style={pipeLinCard}>
                                <div className="px-1.5 py-1 flex items-center gap-1" style={{ background: layerCol + "08", borderBottom: `1px solid ${tblRule}` }}>
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={linChevC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l5-5 5 5M7 17l5-5 5 5" /></svg>
                                  <span className="font-bold uppercase tracking-wider" style={{ fontSize: linTitleSz, color: linTitleC }}>Upstream</span>
                                  <span className="ml-auto font-bold rounded-full px-1.5 py-px tabular-nums" style={{ fontSize: Math.max(5, linTitleSz - 0.5), background: linTitleC + "12", color: linTitleC }}>{fp.upstreamIds.length}</span>
                                </div>
                                <div className="p-1">
                                  {upPipeGroups.map(g => (
                                    <div key={g.label} className="mb-1 last:mb-0">
                                      <div className="flex items-center gap-1 px-0.5 mb-0.5">
                                        <span className="rounded-full shrink-0" style={{ width: 4, height: 4, background: g.color + "35" }} />
                                        <span className="font-bold uppercase tracking-wider" style={{ fontSize: Math.max(5, pp.prodMetaSize - 1), color: g.color }}>{g.label}</span>
                                        <span className="font-semibold" style={{ fontSize: Math.max(5, pp.prodMetaSize - 1.5), color: g.color + "99" }}>{g.items.length}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-x-0.5 gap-y-0.5">
                                        {g.items.map(item => { const sc = statusColor(item.status); return (
                                          <button key={item.id} type="button" onClick={() => onPipeLineageClick(item)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-left cursor-pointer transition-colors hover:bg-gray-50" style={{ boxShadow: item.status !== "HEALTHY" ? `0 0 0 2px ${sc}` : "none" }}>
                                            <span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: sc, boxShadow: item.status !== "HEALTHY" ? `0 0 0 2px ${sc}33` : "none" }} />
                                            <span className="font-medium flex-1 truncate" style={{ fontSize: pp.prodMetaSize, color: pp.headerTextColor }}>{item.name}</span>
                                          </button>); })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {fp.downstreamIds.length > 0 && (
                              <div className="rounded-lg overflow-hidden" style={pipeLinCard}>
                                <div className="px-1.5 py-1 flex items-center gap-1" style={{ background: layerCol + "08", borderBottom: `1px solid ${tblRule}` }}>
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={linChevC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 7l5 5 5-5" /></svg>
                                  <span className="font-bold uppercase tracking-wider" style={{ fontSize: linTitleSz, color: linTitleC }}>Downstream</span>
                                  <span className="ml-auto font-bold rounded-full px-1.5 py-px tabular-nums" style={{ fontSize: Math.max(5, linTitleSz - 0.5), background: linTitleC + "12", color: linTitleC }}>{fp.downstreamIds.length}</span>
                                </div>
                                <div className="p-1">
                                  {downPipeGroups.map(g => (
                                    <div key={g.label} className="mb-1 last:mb-0">
                                      <div className="flex items-center gap-1 px-0.5 mb-0.5">
                                        <span className="rounded-full shrink-0" style={{ width: 4, height: 4, background: g.color + "35" }} />
                                        <span className="font-bold uppercase tracking-wider" style={{ fontSize: Math.max(5, pp.prodMetaSize - 1), color: g.color }}>{g.label}</span>
                                        <span className="font-semibold" style={{ fontSize: Math.max(5, pp.prodMetaSize - 1.5), color: g.color + "99" }}>{g.items.length}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-x-0.5 gap-y-0.5">
                                        {g.items.map(item => { const sc = statusColor(item.status); return (
                                          <button key={item.id} type="button" onClick={() => onPipeLineageClick(item)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-left cursor-pointer transition-colors hover:bg-gray-50" style={{ boxShadow: item.status !== "HEALTHY" ? `0 0 0 2px ${sc}` : "none" }}>
                                            <span className="rounded-full shrink-0" style={{ width: 5, height: 5, background: sc, boxShadow: item.status !== "HEALTHY" ? `0 0 0 2px ${sc}33` : "none" }} />
                                            <span className="font-medium flex-1 truncate" style={{ fontSize: pp.prodMetaSize, color: pp.headerTextColor }}>{item.name}</span>
                                          </button>); })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        )}

                        {/* Models / Logs — top-level tabs (body heights fixed from playground so layout does not jump by product) */}
                        <div className="rounded-xl overflow-hidden flex flex-col" style={pipeSelWidget}>
                          <div className="flex shrink-0" style={{ borderBottom: `2px solid ${tblRule}` }}>
                            {([
                              { key: "models" as const, label: "Models", count: fpRuns.length, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg> },
                              { key: "logs" as const, label: "Logs", count: successLogs.length + warningLogs.length + failureLogs.length, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> },
                            ]).map(tab => (
                              <button key={tab.key} onClick={() => setPipeDetailTab(tab.key)} className={`flex-1 py-2 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${pipeDetailTab === tab.key ? "border-b-2" : "hover:bg-gray-50"}`} style={{ borderColor: pipeDetailTab === tab.key ? layerCol : "transparent", fontSize: pp.tabFontSize + 1.5, fontWeight: pipeDetailTab === tab.key ? 800 : 500, color: pipeDetailTab === tab.key ? pp.headerTextColor : pp.headerSubColor }}>
                                {tab.icon}{tab.label} <span className="opacity-40 font-normal" style={{ fontSize: pp.tabFontSize }}>({tab.count})</span>
                              </button>
                            ))}
                          </div>

                          {pipeDetailTab === "models" && (
                            <>
                              <div className="flex shrink-0" style={{ borderBottom: `1px solid ${tblRule}`, background: pp.selTableHeaderBg }}>
                                {[
                                  { key: "all" as const, label: "All", count: fpRuns.length },
                                  { key: "connector" as const, label: "Connector", count: fpRuns.filter(r => r.stage === "CONNECTOR").length },
                                  { key: "staging" as const, label: "Staging", count: fpRuns.filter(r => r.stage === "STAGING").length },
                                  { key: "mart" as const, label: "Marts", count: fpRuns.filter(r => r.stage === "MART").length },
                                ].map(tab => (
                                  <button key={tab.key} onClick={() => setPipeModelTab(tab.key as any)} className={`flex-1 py-1.5 text-center cursor-pointer transition-all flex items-center justify-center gap-1 ${activeMTab === tab.key ? "border-b-2" : "hover:bg-gray-100"}`} style={{ borderColor: activeMTab === tab.key ? layerCol : "transparent", fontSize: pp.tabFontSize + 0.5, fontWeight: activeMTab === tab.key ? 700 : 500, color: activeMTab === tab.key ? pp.headerTextColor : pp.headerSubColor }}>
                                    {tab.label} <span className="opacity-50">({tab.count})</span>
                                  </button>
                                ))}
                              </div>
                              <div className="px-2.5 py-1.5 box-border shrink-0 flex flex-col min-h-0" style={{ height: pp.selModelTableMaxHeight }}>
                                <PipelineRunTable runs={activeMTab === "all" ? fpRuns : fpRuns.filter(r => r.stage === (activeMTab === "connector" ? "CONNECTOR" : activeMTab === "staging" ? "STAGING" : "MART"))} />
                              </div>
                            </>
                          )}

                          {pipeDetailTab === "logs" && (
                            <>
                              <div className="flex shrink-0" style={{ borderBottom: `1px solid ${tblRule}`, background: pp.selTableHeaderBg }}>
                                {([
                                  { key: "success" as const, label: "Success", count: successLogs.length, col: cfg.green, icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> },
                                  { key: "warnings" as const, label: "Warnings", count: warningLogs.length, col: cfg.warning, icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> },
                                  { key: "failure" as const, label: "Failure", count: failureLogs.length, col: cfg.red, icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> },
                                ]).map(tab => (
                                  <button key={tab.key} onClick={() => setPipeLogTab(tab.key)} className={`flex-1 py-1.5 text-center cursor-pointer transition-all flex items-center justify-center gap-1 ${activeLogTab === tab.key ? "border-b-2" : "hover:bg-gray-100"}`} style={{ borderColor: activeLogTab === tab.key ? tab.col : "transparent", fontSize: pp.tabFontSize + 0.5, fontWeight: activeLogTab === tab.key ? 700 : 500, color: activeLogTab === tab.key ? tab.col : pp.headerSubColor }}>
                                    {tab.icon}{tab.label} <span className="opacity-50">({tab.count})</span>
                                  </button>
                                ))}
                              </div>
                              <div className="p-2 box-border flex flex-col min-h-0 shrink-0" style={{ height: pp.selLogMaxHeight }}>
                                {lineageFocusName && (
                                  <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-lg shrink-0" style={{ background: layerCol + "10", border: `1px solid ${layerCol}22` }}>
                                    <span className="font-semibold truncate flex-1" style={{ fontSize: pp.prodMetaSize, color: pp.headerTextColor }}>Logs mentioning <span style={{ color: layerCol }}>{lineageFocusName}</span></span>
                                    <button type="button" onClick={() => setPipeLineageFocusId(null)} className="shrink-0 font-bold cursor-pointer" style={{ fontSize: pp.prodMetaSize, color: pp.headerSubColor }}>Clear</button>
                                  </div>
                                )}
                                <div className="overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth: "thin" as const }}>
                                {displayLogList.length === 0 && (
                                  <div className="flex flex-col items-center justify-center py-6 gap-1.5 h-full min-h-[120px]">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={pp.headerSubColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    <span className="font-semibold" style={{ fontSize: pp.prodMetaSize + 1, color: pp.headerSubColor }}>{lineageFocusName ? "No matching logs in this tab" : `No ${activeLogTab} logs`}</span>
                                  </div>
                                )}
                                <div className="space-y-1.5">
                                  {displayLogList.map((log, idx) => {
                                    const sevColor = log.status === "fail" ? cfg.red : log.status === "running" ? cfg.warning : cfg.green;
                                    const sevBg = log.status === "fail" ? cfg.red + "06" : log.status === "running" ? cfg.warning + "06" : cfg.green + "04";
                                    const phaseCol = log.phase === "INGESTION" ? "#6366f1" : "#0891b2";
                                    return (
                                      <div key={idx} className="rounded-lg px-2.5 py-2" style={{ background: sevBg, border: `1px solid ${sevColor}12` }}>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.status === "fail" ? "animate-pulse" : ""}`} style={{ background: sevColor }} />
                                          <span className="font-mono" style={{ fontSize: pp.logTimeSize, color: pp.headerSubColor }}>{log.time} UTC</span>
                                          <span className="px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5" style={{ fontSize: pp.logSevBadgeSize - 0.5, background: phaseCol + "14", color: phaseCol }}>
                                            {log.phase === "INGESTION"
                                              ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={phaseCol} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v10m0 0l3.5-3.5M12 12l-3.5-3.5" /><path d="M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" /></svg>
                                              : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={phaseCol} strokeWidth="2.5" strokeLinecap="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>}
                                            {log.phase}
                                          </span>
                                        </div>
                                        <div className="font-medium font-mono" style={{ fontSize: pp.logMessageSize, color: pp.headerTextColor, lineHeight: 1.4 }}>{log.message}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              );
            })()}

            {/* ── TAB: COST ── */}
            {panelTab === "cost" && !selApp && (() => {
              const totalCost = (apps as any[]).reduce((s: number, a: any) => s + (a.monthly_cost_usd || 0), 0);

              const CostClearSel = () => (selProduct || selApp) ? (
                <button onClick={() => setSel(null)} className="text-[10px] font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 cursor-pointer mb-3 self-start"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>Clear selection</button>
              ) : null;

              const cp = cfg.costPanel;
              const wCardStyle: React.CSSProperties = { background: cp.widgetBg, border: `1px solid ${cp.widgetBorder}`, borderRadius: cp.widgetRadius };
              const seededRand = (seed: number) => { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return (s & 0x7fffffff) / 2147483647; }; };
              const COST_CATS = [
                { key: "ingestion", label: "Ingestion", pct: 0.30, color: cp.catIngestionColor },
                { key: "processing", label: "Processing", pct: 0.35, color: cp.catProcessingColor },
                { key: "orchestration", label: "Orchestration", pct: 0.15, color: cp.catOrchestrationColor },
                { key: "storage", label: "Storage", pct: 0.20, color: cp.catStorageColor },
              ];

              const buildProdCost = (p: any) => {
                const directCost = appSourceEdges.filter(e => e.productId === p.id).reduce((s, e) => { const app = (apps as any[]).find(ap => ap.id === e.appId); return s + (app?.monthly_cost_usd || 0); }, 0);
                const peerCount = Math.max(1, products.filter((pp: any) => pp.product_type === p.product_type).length);
                const estimated = p.product_type === "SOURCE_ALIGNED"
                  ? (directCost > 0 ? directCost : Math.round(totalCost * 0.30 / peerCount))
                  : p.product_type === "BUSINESS"
                    ? Math.round(totalCost * 0.35 / peerCount)
                    : Math.round(totalCost * 0.20 / peerCount);
                const hash = p.name.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0);
                const r2 = seededRand(hash);
                const spark = Array.from({ length: 12 }, (_, i) => {
                  const base = estimated * (0.78 + i * 0.02);
                  const jitter = (r2() - 0.5) * estimated * 0.22;
                  const spike = r2() > 0.82 ? estimated * 0.15 * (r2() > 0.5 ? 1 : -1) : 0;
                  return Math.round(Math.max(base * 0.5, base + jitter + spike));
                });
                const prevEst = Math.round(estimated * (0.88 + (hash % 25) * 0.01));
                const delta = estimated - prevEst;
                const ing = p.product_type === "SOURCE_ALIGNED" ? Math.round(estimated * 0.45) : 0;
                const proc = p.product_type === "SOURCE_ALIGNED" ? Math.round(estimated * 0.25) : p.product_type === "BUSINESS" ? Math.round(estimated * 0.55) : Math.round(estimated * 0.40);
                const orch = p.product_type === "SOURCE_ALIGNED" ? Math.round(estimated * 0.15) : p.product_type === "BUSINESS" ? Math.round(estimated * 0.20) : Math.round(estimated * 0.25);
                const stor = estimated - ing - proc - orch;
                return { ...p, cost: estimated, prevCost: prevEst, delta, spark, ing, proc, orch, stor };
              };

              if (selApp) {
                const appCost = selApp.monthly_cost_usd || 0;
                const appPrevCost = Math.round(appCost * 0.91);
                const appDelta = appCost - appPrevCost;
                const appDeltaPct = appPrevCost > 0 ? ((appDelta / appPrevCost) * 100).toFixed(1) : "0";
                const appMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                const appTW = 360, appTH = 100, appPL = 36, appPB = 18;
                const appPW = appTW - appPL, appPH = appTH - appPB;
                const appTrend = appMonths.map((m, i) => ({ month: m, val: Math.round(appCost * (0.85 + i * 0.015) * (1 + Math.sin(i * 2.1 + (appCost % 7)) * 0.12)) }));
                const aMin = Math.min(...appTrend.map(p => p.val)) * 0.88, aMax = Math.max(...appTrend.map(p => p.val)) * 1.12 || 1;
                const aLine = appTrend.map((p, i) => { const x = appPL + (i / (appTrend.length - 1)) * appPW; const y = appTH - appPB - ((p.val - aMin) / (aMax - aMin)) * appPH; return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`; }).join(" ");
                const aArea = aLine + ` L ${appPL + appPW} ${appTH - appPB} L ${appPL} ${appTH - appPB} Z`;
                return (
                  <div>
                    <CostClearSel />
                    <h2 className="text-[14px] font-bold mb-1" style={{ color: cfg.text }}>Cost: {selApp.name}</h2>
                    <p className="text-[10px] text-gray-400 mb-3">{selApp.app_type} · {selApp.domain_name}</p>
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 rounded-xl p-3" style={wCardStyle}>
                        <div className="text-[7px] font-bold text-gray-400 uppercase mb-1">This Month</div>
                        <div className="text-[20px] font-black leading-none" style={{ color: cfg.text }}>${appCost}</div>
                        <div className="flex items-center gap-1 mt-1"><span className="text-[8px] font-bold" style={{ color: appDelta >= 0 ? cfg.red : cfg.green }}>{appDelta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(Number(appDeltaPct))}%</span></div>
                      </div>
                      <div className="flex-1 rounded-xl p-3" style={wCardStyle}>
                        <div className="text-[7px] font-bold text-gray-400 uppercase mb-1">Last Month</div>
                        <div className="text-[20px] font-black leading-none" style={{ color: "#a8a29e" }}>${appPrevCost}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">12-Month Trend</div>
                    <div className="rounded-xl p-3 mb-4" style={wCardStyle}>
                      <svg viewBox={`0 0 ${appTW} ${appTH + 4}`} className="w-full">
                        <defs><linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cfg.layerColors.CONSUMER_ALIGNED} stopOpacity="0.18" /><stop offset="100%" stopColor={cfg.layerColors.CONSUMER_ALIGNED} stopOpacity="0.01" /></linearGradient></defs>
                        {[0, 0.33, 0.66, 1].map(f => { const y = appTH - appPB - f * appPH; const val = aMin + f * (aMax - aMin); return (<g key={f}><line x1={appPL} y1={y} x2={appPL + appPW} y2={y} stroke="#e5e7eb" strokeWidth="0.5" /><text x={appPL - 4} y={y + 3} textAnchor="end" fill="#a8a29e" fontSize="6">${Math.round(val)}</text></g>); })}
                        <path d={aArea} fill="url(#aGrad)" /><path d={aLine} fill="none" stroke={cfg.layerColors.CONSUMER_ALIGNED} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                        {appTrend.map((p, i) => { const x = appPL + (i / (appTrend.length - 1)) * appPW; const y = appTH - appPB - ((p.val - aMin) / (aMax - aMin)) * appPH; return (<g key={i}><circle cx={x} cy={y} r="2.5" fill="white" stroke={cfg.layerColors.CONSUMER_ALIGNED} strokeWidth="1.2" /><title>{p.month}: ${p.val}</title>{i % 2 === 0 && <text x={x} y={appTH - 2} textAnchor="middle" fill="#a8a29e" fontSize="6.5">{p.month}</text>}</g>); })}
                      </svg>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Breakdown</div>
                    {[{ label: "Data Ingestion", pct: 30, color: cp.catIngestionColor }, { label: "Data Processing", pct: 35, color: cp.catProcessingColor }, { label: "Data Orchestration", pct: 15, color: cp.catOrchestrationColor }, { label: "Data Storage", pct: 20, color: cp.catStorageColor }].map(b => (
                      <div key={b.label} className="mb-2.5"><div className="flex justify-between mb-0.5"><span className="text-[10px] font-semibold" style={{ color: cfg.text }}>{b.label}</span><span className="text-[10px] font-bold" style={{ color: b.color }}>${(appCost * b.pct / 100).toFixed(0)}</span></div><div className="h-1.5 rounded-full bg-gray-100"><div className="h-1.5 rounded-full" style={{ width: `${b.pct}%`, background: b.color }} /></div></div>
                    ))}
                  </div>
                );
              }

              if (selProduct) {
                const pc = buildProdCost(selProduct);
                const layerCol = cfg.layerColors[selProduct.product_type] || cfg.layerColors.SOURCE_ALIGNED;
                const deltaPct = pc.prevCost > 0 ? ((pc.delta / pc.prevCost) * 100).toFixed(1) : "0";
                const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                const tW = cp.selChartWidth;
                const tH = cp.selChartHeight;
                const pL = cp.selChartPadLeft;
                const pR = cp.selChartPadRight;
                const pT = cp.selChartPadTop;
                const pB = cp.selChartPadBottom;
                const pW = Math.max(8, tW - pL - pR);
                const pH = Math.max(8, tH - pB - pT);
                const plotBottom = tH - pB;
                const trendData = MONTHS.map((m, i) => ({ month: m, val: pc.spark[i] }));
                const cats = [
                  { label: "Ingestion", val: pc.ing, color: cp.catIngestionColor },
                  { label: "Processing", val: pc.proc, color: cp.catProcessingColor },
                  { label: "Orchestration", val: pc.orch, color: cp.catOrchestrationColor },
                  { label: "Storage", val: pc.stor, color: cp.catStorageColor },
                ].filter(c => c.val > 0);
                const maxCatV = Math.max(...cats.map(c => c.val), 1);
                const yearlyEst = pc.spark.reduce((s: number, v: number) => s + v, 0);
                const mutedSel = cp.selMutedOverride || cp.selMutedColor;
                const lineStroke = (c: string) => cp.selChartLineColor || c;
                const selCostCard: React.CSSProperties = { background: cp.selWidgetBg, border: `1px solid ${cp.selWidgetBorder}`, borderRadius: cp.widgetRadius };
                return (
                  <div style={{ gap: cp.selSectionGap }} className="flex flex-col">
                    <CostClearSel />
                    <OverviewStyleProductBannerBlock os={cfg.overviewPanel} selProduct={selProduct} domainColorMap={domainColorMap} cfg={cfg} />

                    <div className="flex gap-2.5" style={{ alignItems: "stretch" }}>
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="rounded-xl p-3 flex-1 flex flex-col justify-center" style={selCostCard}>
                          <div style={{ fontSize: cp.selLabelSize - 2, fontWeight: 700, color: mutedSel, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>This Month</div>
                          <div className="font-black leading-none" style={{ color: cfg.text, fontSize: cp.selBanSize }}>${pc.cost}</div>
                          <div className="flex items-center gap-1 mt-2">
                            <span style={{ fontSize: cp.selLabelSize - 1, fontWeight: 700, color: pc.delta >= 0 ? cp.negColor : cp.posColor }}>
                              {pc.delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(Number(deltaPct))}%
                            </span>
                            <span style={{ fontSize: cp.selLabelSize - 2, color: mutedSel }}>vs last month</span>
                          </div>
                        </div>
                        <div className="rounded-xl p-3 flex-1 flex flex-col justify-center" style={selCostCard}>
                          <div style={{ fontSize: cp.selLabelSize - 2, fontWeight: 700, color: mutedSel, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Last Month</div>
                          <div className="font-black leading-none" style={{ color: mutedSel, fontSize: cp.selBanSize }}>${pc.prevCost}</div>
                        </div>
                      </div>
                      <div className="flex-1 rounded-xl p-3" style={selCostCard}>
                        <div style={{ fontSize: cp.selLabelSize - 2, fontWeight: 700, color: mutedSel, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>By Category</div>
                        <div className="flex flex-col gap-2.5">
                          {cats.map(cat => (
                            <div key={cat.label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} /><span style={{ fontSize: cp.selCatLabelSize, fontWeight: 500, color: cfg.text }}>{cat.label}</span></span>
                                <span style={{ fontSize: cp.selCatLabelSize, fontWeight: 700, color: cfg.text }}>${cat.val}</span>
                              </div>
                              <div className="rounded-full" style={{ height: cp.selBarHeight, background: cp.widgetBorder }}>
                                <div className="rounded-full" style={{ height: cp.selBarHeight, width: `${(cat.val / maxCatV * 100).toFixed(0)}%`, background: cat.color, opacity: 0.75 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const pcCatData = (catKey: string) => {
                        const pctMap: Record<string, number> = { ingestion: pc.ing, processing: pc.proc, orchestration: pc.orch, storage: pc.stor };
                        const catVal = pctMap[catKey] || 0;
                        const ratio = pc.cost > 0 ? catVal / pc.cost : 0.25;
                        return MONTHS.map((m, i) => ({ month: m, val: Math.round(pc.spark[i] * ratio) }));
                      };
                      const activePcCatTab = costCatTab;
                      const activePcData = activePcCatTab === "all" ? trendData : pcCatData(activePcCatTab);
                      const activePcColor = activePcCatTab === "all" ? layerCol : (cats.find(c => c.label.toLowerCase() === activePcCatTab)?.color || layerCol);
                      const activePcTotal = activePcData.reduce((s, d) => s + d.val, 0);
                      const pcMin = Math.min(...activePcData.map(d => d.val)) * 0.88;
                      const pcMax = Math.max(...activePcData.map(d => d.val)) * 1.12 || 1;
                      const pcLine = activePcData
                        .map((d, i) => {
                          const x = pL + (i / 11) * pW;
                          const y = plotBottom - ((d.val - pcMin) / (pcMax - pcMin)) * pH;
                          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(" ");
                      const pcArea = pcLine + ` L ${pL + pW} ${plotBottom} L ${pL} ${plotBottom} Z`;
                      return (
                        <div className="rounded-xl overflow-hidden" style={selCostCard}>
                          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                            <span style={{ fontSize: cp.selLabelSize, fontWeight: 700, color: mutedSel, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Cost Trend</span>
                            <span className="font-bold" style={{ fontSize: cp.selLabelSize, color: cp.selTitleColor || cfg.text }}>${activePcTotal >= 1000 ? `${(activePcTotal / 1000).toFixed(1)}K` : activePcTotal} <span style={{ fontWeight: 400, color: mutedSel, fontSize: cp.selLabelSize - 1 }}>yearly</span></span>
                          </div>
                          <div className="flex px-2 pb-1 gap-1 flex-wrap">
                            {[{ key: "all", label: "All" }, ...cats.map(c => ({ key: c.label.toLowerCase(), label: c.label }))].map(tab => (
                              <button key={tab.key} onClick={() => setCostCatTab(tab.key)} className="px-2 py-0.5 rounded-full cursor-pointer transition-all" style={{ fontSize: cp.selTrendTabSize, fontWeight: costCatTab === tab.key ? 700 : 500, background: costCatTab === tab.key ? (tab.key === "all" ? layerCol : (cats.find(c => c.label.toLowerCase() === tab.key)?.color || layerCol)) : "transparent", color: costCatTab === tab.key ? "#fff" : mutedSel, border: "none" }}>{tab.label}</button>
                            ))}
                          </div>
                          <div className="px-3 pb-2.5">
                            <svg viewBox={`0 0 ${tW} ${tH + 4}`} className="w-full">
                              <defs><linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lineStroke(activePcColor)} stopOpacity={cp.selChartAreaOpacity} /><stop offset="100%" stopColor={lineStroke(activePcColor)} stopOpacity="0.01" /></linearGradient></defs>
                              {[0, 0.33, 0.66, 1].map(f => {
                                const y = plotBottom - f * pH;
                                const val = pcMin + f * (pcMax - pcMin);
                                return (
                                  <g key={f}>
                                    <line x1={pL} y1={y} x2={pL + pW} y2={y} stroke={cp.selChartGridColor} strokeWidth={cp.selChartGridLineWidth} />
                                    <text x={pL - 4} y={y + 3} textAnchor="end" fill={cp.selChartAxisColor} fontSize={cp.selChartAxisFontSize}>${Math.round(val)}</text>
                                  </g>
                                );
                              })}
                              <path d={pcArea} fill="url(#pGrad)" /><path d={pcLine} fill="none" stroke={lineStroke(activePcColor)} strokeWidth={cp.selChartLineWidth} strokeLinejoin="round" strokeLinecap="round" />
                              {activePcData.map((d, i) => {
                                const x = pL + (i / 11) * pW;
                                const y = plotBottom - ((d.val - pcMin) / (pcMax - pcMin)) * pH;
                                const rd = cp.selChartDotRadius;
                                return (
                                  <g key={i}>
                                    <circle cx={x} cy={y} r={rd} fill={cp.selChartDotFill} stroke={lineStroke(activePcColor)} strokeWidth={cp.selChartDotStrokeWidth} />
                                    <title>{d.month}: ${d.val}</title>
                                    {i % 2 === 0 && <text x={x} y={tH - 2} textAnchor="middle" fill={cp.selChartMonthColor} fontSize={cp.selChartMonthFontSize}>{d.month}</text>}
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      );
                    })()}

                    {selProduct.product_type === "SOURCE_ALIGNED" && (() => {
                      const linkedApps = appSourceEdges.filter(e => e.productId === selProduct.id).map(e => (apps as any[]).find(a => a.id === e.appId)).filter(Boolean);
                      if (linkedApps.length === 0) return null;
                      return (
                        <div className="rounded-xl p-3" style={selCostCard}>
                          <div style={{ fontSize: cp.selLabelSize, fontWeight: 700, color: cp.selMutedColor, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Linked Applications</div>
                          <div className="space-y-1.5">
                            {linkedApps.map((a: any) => (
                              <button key={a.id} onClick={() => setSel({ kind: "app", id: a.id })} className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.conn_status === "ACTIVE" ? cfg.green : a.conn_status === "BROKEN" ? cfg.red : "#9ca3af" }} />
                                <span className="font-medium flex-1 truncate" style={{ fontSize: cp.selAppNameSize, color: cfg.text }}>{a.name}</span>
                                <span className="font-bold" style={{ fontSize: cp.selAppCostSize, color: cp.selMutedColor }}>${a.monthly_cost_usd}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              }

              const prevMonthCost = Math.round(totalCost * 0.93);
              const costDelta = totalCost - prevMonthCost;
              const costDeltaPct = prevMonthCost > 0 ? ((costDelta / prevMonthCost) * 100).toFixed(1) : "0";
              const maxCatVal = Math.max(...COST_CATS.map(c => c.pct));

              const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              const rng = seededRand(42);

              const catMonthly = (catKey: string) => {
                const cat = COST_CATS.find(c => c.key === catKey);
                const pct = cat?.pct || 0.25;
                const r = seededRand(catKey.length * 137);
                return MONTHS.map((m, i) => {
                  const base = totalCost * pct * (0.82 + i * 0.018);
                  const jitter = (r() - 0.5) * totalCost * pct * 0.16;
                  const seasonal = Math.sin(i * 0.8 + catKey.length) * totalCost * pct * 0.06;
                  const spike = r() > 0.85 ? totalCost * pct * 0.12 : 0;
                  return { month: m, val: Math.round(Math.max(base * 0.7, base + jitter + seasonal + spike)) };
                });
              };

              const yearlyData = MONTHS.map((m, i) => {
                return { month: m, val: COST_CATS.reduce((s, c) => s + catMonthly(c.key)[i].val, 0) };
              });
              const yearlyTotal = yearlyData.reduce((s, d) => s + d.val, 0);

              const activeCatData = costCatTab === "all" ? yearlyData : catMonthly(costCatTab);
              const activeCatColor = costCatTab === "all" ? cfg.text : (COST_CATS.find(c => c.key === costCatTab)?.color || "#999");
              const activeCatTotal = activeCatData.reduce((s, d) => s + d.val, 0);
              const activeCatLabel = costCatTab === "all" ? "" : COST_CATS.find(c => c.key === costCatTab)?.label || "";
              const acMin = Math.min(...activeCatData.map(d => d.val)) * 0.92;
              const acMax = Math.max(...activeCatData.map(d => d.val)) * 1.08;
              const chartPadT = cp.chartPadTop, chartPadR = cp.chartPadRight;
              const chartW = 360, chartH = cp.chartHeight, chartPadL = cp.chartPadLeft, chartPadB = cp.chartPadBottom;
              const plotW = chartW - chartPadL - chartPadR, plotH = chartH - chartPadB - chartPadT;
              const acLine = activeCatData.map((d, i) => {
                const x = chartPadL + (i / (activeCatData.length - 1)) * plotW;
                const y = chartPadT + plotH - ((d.val - acMin) / (acMax - acMin)) * plotH;
                return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
              }).join(" ");
              const acArea = acLine + ` L ${chartPadL + plotW} ${chartPadT + plotH} L ${chartPadL} ${chartPadT + plotH} Z`;

              const productCosts = (products as any[]).map((p: any) => buildProdCost(p));

              const filteredProducts = costProdFilter === "all" ? productCosts : productCosts.filter(p => p.product_type === costProdFilter);
              const sortedProducts = [...filteredProducts].sort((a, b) => {
                let cmp = 0;
                if (costProdSort === "cost") cmp = b.cost - a.cost;
                else if (costProdSort === "name") cmp = a.name.localeCompare(b.name);
                else cmp = a.domain_name.localeCompare(b.domain_name);
                return costProdSortDir === "asc" ? -cmp : cmp;
              });

              const costPageTitleC = cp.nsPageTitleColor || cfg.text;
              return (
                <div style={{ gap: cp.sectionGap }} className="flex flex-col">
                  <CostClearSel />
                  <div>
                    <h2 className="font-bold mb-0.5" style={{ color: costPageTitleC, fontSize: cp.titleSize }}>Enterprise Mesh Cost</h2>
                  </div>

                  {/* ── BANs (left) + Category Bars (right) ── */}
                  <div className="flex gap-2.5" style={{ alignItems: "stretch" }}>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="rounded-xl p-3 flex-1 flex flex-col justify-center" style={wCardStyle}>
                        <div style={{ fontSize: cp.nsCaptionSize, fontWeight: 700, color: cp.mutedColor, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>This Month</div>
                        <div className="font-black leading-none" style={{ color: cfg.text, fontSize: cp.banSize }}>${(totalCost / 1000).toFixed(1)}K</div>
                        <div className="flex items-center gap-1 mt-2">
                          <span style={{ fontSize: cp.nsDeltaSize, fontWeight: 700, color: costDelta >= 0 ? cp.negColor : cp.posColor }}>
                            {costDelta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(Number(costDeltaPct))}%
                          </span>
                          <span style={{ fontSize: cp.nsVsLabelSize, color: cp.mutedColor }}>vs last month</span>
                        </div>
                      </div>
                      <div className="rounded-xl p-3 flex-1 flex flex-col justify-center" style={wCardStyle}>
                        <div style={{ fontSize: cp.nsCaptionSize, fontWeight: 700, color: cp.mutedColor, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>Last Month</div>
                        <div className="font-black leading-none" style={{ color: cp.mutedColor, fontSize: cp.banSize }}>${(prevMonthCost / 1000).toFixed(1)}K</div>
                      </div>
                    </div>
                    <div className="flex-1 rounded-xl p-3" style={wCardStyle}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: cp.nsCaptionSize, fontWeight: 700, color: cp.mutedColor, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>By Category</span>
                        <span className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${cp.widgetBorder}` }}>
                          {(["$", "%"] as const).map(m => (
                            <button key={m} onClick={() => setCostBarMode(m)} className="cursor-pointer transition-all"
                              style={{ fontSize: cp.nsSortBtnSize, fontWeight: 600, padding: "1px 6px", background: costBarMode === m ? cfg.text : "transparent", color: costBarMode === m ? cp.widgetBg : cp.mutedColor, border: "none" }}>
                              {m}
                            </button>
                          ))}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {COST_CATS.map(cat => {
                          const catPctDisplay = (cat.pct * 100).toFixed(0);
                          const catValue = costBarMode === "$" ? `$${(totalCost * cat.pct / 1000).toFixed(1)}K` : `${catPctDisplay}%`;
                          return (
                            <div key={cat.key}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                                  <span style={{ fontSize: cp.labelSize, fontWeight: 500, color: cfg.text }}>{cat.label}</span>
                                </span>
                                <span style={{ fontSize: cp.labelSize, fontWeight: 700, color: cfg.text }}>{catValue}</span>
                              </div>
                              <div className="rounded-full" style={{ height: cp.barHeight, background: cp.widgetBorder }}>
                                <div className="rounded-full" style={{ height: cp.barHeight, width: `${(cat.pct / maxCatVal * 100).toFixed(0)}%`, background: cat.color, opacity: 0.75 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── Cost Trend (single chart with category tabs) ── */}
                  <div className="rounded-xl p-3" style={wCardStyle}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div style={{ fontSize: cp.labelSize, fontWeight: 700, color: cp.mutedColor, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Cost Trend{activeCatLabel ? ` · ${activeCatLabel}` : ""}</div>
                        <div className="font-black mt-0.5" style={{ color: activeCatColor, fontSize: cp.nsTrendTotalSize }}>${(activeCatTotal / 1000).toFixed(0)}K <span style={{ fontSize: cp.nsTrendYearSize, fontWeight: 400, color: cp.mutedColor }}>yearly</span></div>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2.5">
                      {[{ key: "all", label: "All" }, ...COST_CATS].map(tab => {
                        const active = costCatTab === tab.key;
                        const tc = tab.key === "all" ? cfg.text : (COST_CATS.find(c => c.key === tab.key)?.color || "#999");
                        return (
                          <button key={tab.key} onClick={() => setCostCatTab(tab.key)}
                            className="flex-1 py-1 cursor-pointer transition-all"
                            style={{ fontSize: cp.tabSize, fontWeight: active ? 600 : 400, color: active ? "#fff" : cp.mutedColor, background: active ? tc : cp.widgetBorder + "66", borderRadius: 6, border: "none" }}>
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      const lineC = cp.chartLineColor || activeCatColor;
                      const areaC = cp.chartAreaColor || activeCatColor;
                      const dotStroke = cp.chartDotStrokeColor || activeCatColor;
                      return (
                        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ overflow: "visible" }}>
                          <defs>
                            <linearGradient id="costTrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={areaC} stopOpacity={cp.chartAreaOpacity} /><stop offset="100%" stopColor={areaC} stopOpacity="0.01" /></linearGradient>
                          </defs>
                          {Array.from({ length: 4 }, (_, i) => {
                            const y = chartPadT + plotH - (i / 3) * plotH;
                            const val = acMin + (i / 3) * (acMax - acMin);
                            return (<g key={i}>
                              <line x1={chartPadL} y1={y} x2={chartPadL + plotW} y2={y} stroke={cp.chartGridColor} strokeWidth={cp.chartGridWidth} />
                              <text x={chartPadL - 5} y={y + cp.chartAxisFontSize * 0.35} textAnchor="end" fill={cp.chartAxisColor} fontSize={cp.chartAxisFontSize}>${(val / 1000).toFixed(0)}K</text>
                            </g>);
                          })}
                          <path d={acArea} fill="url(#costTrGrad)" />
                          <path d={acLine} fill="none" stroke={lineC} strokeWidth={cp.lineWidth} strokeLinejoin="round" strokeLinecap="round" />
                          {activeCatData.map((d, i) => {
                            const x = chartPadL + (i / (activeCatData.length - 1)) * plotW;
                            const y = chartPadT + plotH - ((d.val - acMin) / (acMax - acMin)) * plotH;
                            return (<g key={i}>
                              <circle cx={x} cy={y} r={cp.dotRadius} fill={cp.dotFill} stroke={dotStroke} strokeWidth={cp.dotStrokeWidth} />
                              <title>{d.month}: ${(d.val / 1000).toFixed(1)}K</title>
                              <text x={x} y={chartH - 2} textAnchor="middle" fill={cp.chartMonthColor} fontSize={cp.chartMonthFontSize}>{d.month}</text>
                            </g>);
                          })}
                        </svg>
                      );
                    })()}
                  </div>

                  {/* ── Cost by Product — Stock Monitor Table ── */}
                  <div className="rounded-xl overflow-hidden" style={wCardStyle}>
                    <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
                      <div style={{ fontSize: cp.labelSize, fontWeight: 700, color: cp.mutedColor, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Cost by Product</div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 pb-2 flex-wrap">
                      <select value={costProdFilter} onChange={e => setCostProdFilter(e.target.value)}
                        className="bg-white border rounded-md px-1.5 py-0.5 cursor-pointer" style={{ fontSize: cp.labelSize - 1, fontWeight: 600, color: cfg.text, borderColor: cp.widgetBorder }}>
                        <option value="all">All Layers</option>
                        <option value="SOURCE_ALIGNED">Source</option>
                        <option value="BUSINESS">Business</option>
                        <option value="CONSUMER_ALIGNED">Consumer</option>
                      </select>
                      <select value={costProdSort} onChange={e => setCostProdSort(e.target.value as any)}
                        className="bg-white border rounded-md px-1.5 py-0.5 cursor-pointer" style={{ fontSize: cp.labelSize - 1, fontWeight: 600, color: cfg.text, borderColor: cp.widgetBorder }}>
                        <option value="cost">Sort: Cost</option>
                        <option value="name">Sort: Name</option>
                        <option value="domain">Sort: Domain</option>
                      </select>
                      <span className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${cp.widgetBorder}` }}>
                        {(["desc", "asc"] as const).map(d => (
                          <button key={d} onClick={() => setCostProdSortDir(d)} className="cursor-pointer transition-all"
                            style={{ fontSize: cp.nsSortBtnSize, fontWeight: 600, padding: "1px 5px", background: costProdSortDir === d ? cfg.text : "transparent", color: costProdSortDir === d ? cp.widgetBg : cp.mutedColor, border: "none" }}>
                            {d === "desc" ? "\u2193" : "\u2191"}
                          </button>
                        ))}
                      </span>
                    </div>
                    <div style={{ borderTop: `1px solid ${cp.widgetBorder}`, overflowY: "auto", maxHeight: cp.tableMaxHeight }}>
                      <table className="w-full text-left" style={{ tableLayout: "fixed" }}>
                        <colgroup>
                          <col style={{ width: "28%" }} />
                          <col style={{ width: "12%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "15%" }} />
                        </colgroup>
                        <thead>
                          <tr style={{ background: cp.tableHeaderBg, borderBottom: `1px solid ${cp.widgetBorder}` }}>
                            <th className="px-2 py-1.5 text-left" style={{ fontSize: cp.tableFontSize - 1, fontWeight: 700, color: cp.tableHeaderColor, textTransform: "uppercase" as const }}>Product</th>
                            <th className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize - 1, fontWeight: 700, color: cp.tableHeaderColor, textTransform: "uppercase" as const }}>Total</th>
                            <th className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize - 1, fontWeight: 700, color: COST_CATS[0].color, textTransform: "uppercase" as const }}>Ing</th>
                            <th className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize - 1, fontWeight: 700, color: COST_CATS[1].color, textTransform: "uppercase" as const }}>Proc</th>
                            <th className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize - 1, fontWeight: 700, color: COST_CATS[2].color, textTransform: "uppercase" as const }}>Orch</th>
                            <th className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize - 1, fontWeight: 700, color: COST_CATS[3].color, textTransform: "uppercase" as const }}>Stor</th>
                            <th className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize - 1, fontWeight: 700, color: cp.tableHeaderColor, textTransform: "uppercase" as const }}>Chg</th>
                            <th className="px-1 py-1.5 text-center" style={{ fontSize: cp.tableFontSize - 1, fontWeight: 700, color: cp.tableHeaderColor, textTransform: "uppercase" as const }}>12m</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedProducts.map((p: any) => {
                            const sparkMin = Math.min(...p.spark);
                            const sparkMax = Math.max(...p.spark) || 1;
                            const sparkH = 14, sparkW = 40;
                            const sparkLine = p.spark.map((v: number, i: number) => {
                              const x = (i / (p.spark.length - 1)) * sparkW;
                              const y = sparkH - ((v - sparkMin) / (sparkMax - sparkMin || 1)) * sparkH;
                              return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                            }).join(" ");
                            const isUp = p.delta >= 0;
                            return (
                              <tr key={p.id} className="cursor-pointer transition-colors" style={{ borderBottom: `1px solid ${cp.widgetBorder}44` }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#ffffff")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                onClick={e => { e.stopPropagation(); setSel({ kind: "product", id: p.id }); }}>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1" style={{ minWidth: 0 }}>
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.layerColors[p.product_type] || "#999" }} />
                                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                                      <div className="font-medium truncate" style={{ fontSize: cp.labelSize - 0.5, color: cfg.text }}>{p.name}</div>
                                      <div className="truncate" style={{ fontSize: cp.nsTableDomainSize, color: cp.mutedColor }}>{p.domain_name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-1 py-1.5 text-right font-bold" style={{ fontSize: cp.tableFontSize, color: cfg.text }}>${p.cost}</td>
                                <td className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize, color: COST_CATS[0].color }}>{p.ing}</td>
                                <td className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize, color: COST_CATS[1].color }}>{p.proc}</td>
                                <td className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize, color: COST_CATS[2].color }}>{p.orch}</td>
                                <td className="px-1 py-1.5 text-right" style={{ fontSize: cp.tableFontSize, color: COST_CATS[3].color }}>{p.stor}</td>
                                <td className="px-1 py-1.5 text-right">
                                  <span className="font-bold" style={{ fontSize: cp.tableFontSize, color: isUp ? cp.negColor : cp.posColor }}>{isUp ? "+" : ""}{p.delta}</span>
                                </td>
                                <td className="px-1 py-1.5 text-center">
                                  <svg width={sparkW} height={sparkH} viewBox={`0 0 ${sparkW} ${sparkH}`} className="inline-block">
                                    <path d={sparkLine} fill="none" stroke={isUp ? cp.negColor : cp.posColor} strokeWidth="1" strokeLinejoin="round" opacity="0.65" />
                                  </svg>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── TAB: CATALOGUE ── */}
            {panelTab === "catalogue" && !selApp && (() => {
              const BANNER_ICONS: Record<string, string> = {
                SOURCE_ALIGNED: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
                BUSINESS: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                CONSUMER_ALIGNED: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
              };

              if (selProduct) {
                const cs = cfg.cataloguePanel;
                const charScores = deriveCharScore(selProduct);
                const SCORECARD_KEYS = ["discoverable", "accessible", "trustworthy", "secure"] as const;
                const scAvg = Math.round(SCORECARD_KEYS.reduce((s, k) => s + (charScores[k] ?? 0), 0) / SCORECARD_KEYS.length);
                const bannerColor = cfg.layerColors[selProduct.product_type] || cfg.layerColors.SOURCE_ALIGNED;
                const SCORE_RUBRIC = [{ s: 5, l: "Exceptional", d: "All gates pass. SLA 99%+. Full docs & contracts." }, { s: 4, l: "Strong", d: "Minor gaps. Maintained, reliable for downstream." }, { s: 3, l: "Usable", d: "Baseline met. Some tests missing or late." }, { s: 2, l: "At Risk", d: "Recurring issues. Partial docs, needs attention." }, { s: 1, l: "Fragile", d: "Broken or unreliable. Failing checks." }];
                const cardShadowStyle = cs.selCardShadow ? "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)" : undefined;
                const catSelWidgetShell: React.CSSProperties = { background: cs.selWidgetBg, border: `1px solid ${cs.selWidgetBorder}`, borderRadius: cs.selCardRadius };
                return (
                  <div className="flex flex-col" style={{ gap: cs.selSectionGap }}>
                    <button onClick={() => setSel(null)} className="text-[10px] font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 cursor-pointer self-start"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>Clear selection</button>

                    <OverviewStyleProductBannerBlock
                      os={cfg.overviewPanel}
                      selProduct={selProduct}
                      domainColorMap={domainColorMap}
                      cfg={cfg}
                      bannerFooterExtra={(
                        <div className="relative group shrink-0">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center cursor-help" style={{ background: "rgba(255,255,255,0.2)" }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={cs.selBannerIconStroke} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                          </div>
                          <div className="absolute right-0 bottom-full mb-1.5 px-3 py-2 rounded-lg shadow-lg text-[9px] leading-snug opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30 w-48" style={{ background: "#1a1a1a", color: "#fff" }}>
                            <div className="font-bold mb-1">Rating Scale</div>
                            {SCORE_RUBRIC.map(r => <div key={r.s} className="flex gap-1 mb-0.5"><span className="font-bold shrink-0">{r.s}★</span><span className="opacity-70">{r.l}</span></div>)}
                          </div>
                        </div>
                      )}
                    />

                    {/* Ownership & Schema Contract */}
                    <div className="overflow-hidden" style={{ ...catSelWidgetShell, boxShadow: cardShadowStyle }}>
                      <div className="flex items-center gap-1.5" style={{ padding: `${cs.selCardHeaderPadY}px ${cs.selCardHeaderPadX}px`, background: hexWithOpacity(bannerColor, cs.selTintHeaderBg), borderBottom: `1px solid ${hexWithOpacity(bannerColor, cs.selTintHeaderRule)}` }}>
                        <svg width={cs.selDetailIconSize + 1} height={cs.selDetailIconSize + 1} viewBox="0 0 24 24" fill="none" stroke={cs.selDetailIconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        <span className="font-bold uppercase tracking-wider" style={{ fontSize: cs.selDetailLabelSize + 1, color: cs.selDetailSectionTitleColor || bannerColor }}>Product Details</span>
                      </div>
                      <div style={{ padding: cs.selCardBodyPadding }}>
                        {[
                          { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Owner", value: selProduct.owner || selProduct.domain_name },
                          { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064", label: "Domain", value: selProduct.domain_name, dot: domainColorMap[selProduct.domain_name] || "#999" },
                          { icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4", label: "Format", value: selProduct.product_type === "SOURCE_ALIGNED" ? "Raw / Schema-on-Read" : selProduct.product_type === "BUSINESS" ? "Normalized / Star Schema" : "Materialized View / API" },
                          { icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z", label: "Versioning", value: "Semantic (major.minor)" },
                          { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", label: "Refresh", value: selProduct.sla_freshness || (selProduct.product_type === "SOURCE_ALIGNED" ? "Near real-time" : "Scheduled / Hourly") },
                          { icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", label: "Retention", value: selProduct.product_type === "SOURCE_ALIGNED" ? "90 days + archived" : "Rolling 24 months" },
                        ].map((item, i) => (
                          <div key={item.label} className="flex items-center gap-2.5 py-1.5" style={{ borderBottom: i < 5 ? `1px solid ${hexWithOpacity(bannerColor, cs.selTintRowRule)}` : "none" }}>
                            <div className="rounded-md flex items-center justify-center shrink-0" style={{ width: cs.selDetailIconSize + 10, height: cs.selDetailIconSize + 10, background: hexWithOpacity(bannerColor, cs.selTintIconBg) }}>
                              <svg width={cs.selDetailIconSize} height={cs.selDetailIconSize} viewBox="0 0 24 24" fill="none" stroke={cs.selDetailIconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                            </div>
                            <span className="font-bold uppercase shrink-0 w-16" style={{ fontSize: cs.selDetailLabelSize, color: cs.selDetailLabelColor || "#9ca3af" }}>{item.label}</span>
                            <span className="font-semibold flex items-center gap-1 ml-auto text-right" style={{ fontSize: cs.selDetailValueSize, color: cs.selDetailValueColor || cfg.text }}>
                              {item.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.dot }} />}
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Product Scorecard */}
                    <div className="overflow-hidden" style={{ ...catSelWidgetShell, boxShadow: cardShadowStyle }}>
                      <div className="flex items-center gap-1.5" style={{ padding: `${cs.selCardHeaderPadY}px ${cs.selCardHeaderPadX}px`, background: hexWithOpacity(bannerColor, cs.selTintHeaderBg), borderBottom: `1px solid ${hexWithOpacity(bannerColor, cs.selTintHeaderRule)}` }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={cs.selScorecardIconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-bold uppercase tracking-wider" style={{ fontSize: cs.selDetailLabelSize + 1, color: cs.selScorecardTitleColor || bannerColor }}>Data Product Scorecard</span>
                        <span className="ml-auto font-bold" style={{ fontSize: cs.selScorecardValueSize + 2, color: cs.selScorecardAvgColor || (scAvg >= 80 ? cfg.green : scAvg >= 65 ? "#dab508" : cfg.red) }}>{scAvg}%</span>
                      </div>
                      <div className="grid grid-cols-2" style={{ padding: cs.selScorecardBodyPadding, gap: cs.selScorecardGridGap }}>
                        {SCORECARD_KEYS.map(k => {
                          const ch = DATA_PRODUCT_CHARS.find(c => c.key === k)!;
                          const val = charScores[k] ?? 0;
                          const col = val >= 85 ? cfg.green : val >= 70 ? "#dab508" : cfg.red;
                          return (
                            <div key={k} className="rounded-lg px-2 py-1.5" style={{ background: col + "08", border: `1px solid ${col}15` }}>
                              <div className="flex items-center gap-1 mb-0.5">
                                <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={cs.selScorecardIconStroke} strokeWidth="2"><path d={ch.icon} /></svg>
                                <span className="font-semibold truncate" style={{ fontSize: cs.selScorecardLabelSize, color: cfg.text }}>{ch.label}</span>
                                <span className="font-bold ml-auto" style={{ fontSize: cs.selScorecardValueSize, color: col }}>{val}%</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="rounded-full flex-1" style={{ height: cs.selScorecardBarHeight, background: col + "18" }}><div className="rounded-full" style={{ height: cs.selScorecardBarHeight, width: `${val}%`, background: col, opacity: 0.75 }} /></div>
                                <div className="relative group">
                                  <svg className="w-2.5 h-2.5 shrink-0 cursor-help opacity-40 hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                                  <div className="absolute right-0 bottom-full mb-1 px-2 py-1 rounded shadow-lg text-[8px] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30 w-36 whitespace-normal" style={{ background: "#1a1a1a", color: "#ccc" }}>{ch.desc}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const cp2 = cfg.cataloguePanel;
              const grouped: Record<string, any[]> = {};
              products.forEach((p: any) => { (grouped[p.product_type] ??= []).push(p); });
              const layerOrder = ["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"];
              const STAR_RUBRIC = [
                { stars: 5, label: "Exceptional", desc: "All gates pass. SLA 99%+. Full docs & contracts." },
                { stars: 4, label: "Strong", desc: "Minor gaps. Maintained, reliable for downstream." },
                { stars: 3, label: "Usable", desc: "Baseline met. Some tests missing or late." },
                { stars: 2, label: "At Risk", desc: "Recurring issues. Partial docs, needs attention." },
                { stars: 1, label: "Fragile", desc: "Broken or unreliable. Failing checks." },
              ];

              const activeItems = grouped[catActiveLayer] || [];
              const activeCol = cfg.layerColors[catActiveLayer] || cfg.layerColors.SOURCE_ALIGNED;

              return (
                <div style={{ gap: cp2.sectionGap }} className="flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold" style={{ color: cp2.headerTextColor, fontSize: cp2.titleSize }}>Product Catalogue</h2>
                      <span style={{ fontSize: cp2.subtitleSize, color: cp2.headerSubColor }}>{products.length} products · {domainOrder.length} domains</span>
                    </div>
                    <div className="relative">
                      <button onClick={() => setCatRubricOpen(o => !o)} className="cursor-pointer flex items-center justify-center rounded-full transition-colors" style={{ width: cp2.infoIconSize, height: cp2.infoIconSize, background: catRubricOpen ? cp2.infoIconActiveBg : cp2.infoIconBg, border: "none" }} title="Rating rubric">
                        <svg width={cp2.infoIconSize * 0.55} height={cp2.infoIconSize * 0.55} viewBox="0 0 24 24" fill="none" stroke={catRubricOpen ? cp2.infoIconActiveColor : cp2.infoIconColor} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                      </button>
                      {catRubricOpen && (
                        <div className="absolute right-0 top-7 z-30 rounded-xl shadow-xl p-3" style={{ width: cp2.rubricWidth, background: cp2.cardBg, border: `1px solid ${cp2.cardBorder}` }}>
                          <div style={{ fontSize: cp2.rubricTitleSize, fontWeight: 700, color: cp2.headerSubColor, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Rating Rubric</div>
                          {STAR_RUBRIC.map(item => (
                            <div key={item.stars} className="flex items-start gap-2 mb-2 last:mb-0">
                              <div className="shrink-0 pt-px"><StarRating stars={item.stars} size={cp2.rubricStarSize} /></div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold" style={{ fontSize: cp2.rubricLabelSize, color: starColor(item.stars) }}>{item.label}</span>
                                <span style={{ fontSize: cp2.rubricDescSize, color: cp2.metaColor }}> — {item.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layer Tabs */}
                  <div className="flex gap-2" style={{ padding: "2px", background: cp2.widgetBorder + "44", borderRadius: cp2.tabRadius + 2 }}>
                    {layerOrder.map(layer => {
                      const layerCol = cfg.layerColors[layer] || cfg.layerColors.SOURCE_ALIGNED;
                      const icon = BANNER_ICONS[layer] || BANNER_ICONS.SOURCE_ALIGNED;
                      const count = (grouped[layer] || []).length;
                      const active = catActiveLayer === layer;
                      return (
                        <button key={layer} onClick={() => setCatActiveLayer(layer)}
                          className="flex-1 relative overflow-hidden cursor-pointer flex items-center gap-2 justify-center"
                          style={{
                            height: cp2.tabHeight,
                            borderRadius: cp2.tabRadius,
                            border: "none",
                            background: active ? cp2.cardBg : "transparent",
                            boxShadow: active ? `0 1px 4px ${layerCol}30, 0 0 0 1px ${layerCol}22` : "none",
                            padding: "0 8px",
                            transition: "all 0.25s ease",
                          }}>
                          <div className="shrink-0 flex items-center justify-center rounded-md" style={{ width: cp2.nsTabIconWrap, height: cp2.nsTabIconWrap, background: active ? layerCol : layerCol + "18", transition: "all 0.25s ease" }}>
                            <svg style={{ width: cp2.nsTabIconSvg, height: cp2.nsTabIconSvg }} viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : layerCol} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                          </div>
                          <div className="flex flex-col items-start" style={{ minWidth: 0 }}>
                            <span className="font-bold uppercase tracking-wide truncate" style={{ fontSize: cp2.tabFontSize, color: active ? cp2.headerTextColor : cp2.tabInactiveTextColor, lineHeight: 1.2 }}>{LAYER_SHORT[layer]}</span>
                            <span className="font-semibold" style={{ fontSize: cp2.tabCountSize, color: active ? layerCol : cp2.metaColor, lineHeight: 1.1 }}>{count} products</span>
                          </div>
                          {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: 16, height: 2.5, borderRadius: 2, background: layerCol }} />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search + View Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cp2.searchPlaceholderColor} strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                      <input type="text" placeholder="Search products…" value={catSearch} onChange={e => setCatSearch(e.target.value)}
                        className="w-full outline-none" style={{ fontSize: cp2.searchFontSize, height: cp2.searchHeight, padding: "0 24px 0 26px", borderRadius: cp2.searchRadius, border: `1px solid ${cp2.searchBorder}`, background: cp2.searchBg, color: cp2.searchTextColor }} />
                      {catSearch && <button onClick={() => setCatSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" style={{ border: "none", background: "none", color: cp2.searchPlaceholderColor, fontSize: 12, lineHeight: 1 }}>&times;</button>}
                    </div>
                    <div className="flex rounded-md overflow-hidden shrink-0" style={{ border: `1px solid ${cp2.searchBorder}`, height: cp2.searchHeight }}>
                      {(["grid", "list"] as const).map(m => (
                        <button key={m} onClick={() => setCatViewMode(m)} className="cursor-pointer flex items-center justify-center transition-all" style={{ width: 26, background: catViewMode === m ? cp2.headerTextColor : "transparent", border: "none" }}>
                          {m === "grid" ? (
                            <svg width="11" height="11" viewBox="0 0 16 16" fill={catViewMode === m ? cp2.searchBg : cp2.metaColor}><rect x="0" y="0" width="7" height="7" rx="1.5" /><rect x="9" y="0" width="7" height="7" rx="1.5" /><rect x="0" y="9" width="7" height="7" rx="1.5" /><rect x="9" y="9" width="7" height="7" rx="1.5" /></svg>
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 16 16" fill={catViewMode === m ? cp2.searchBg : cp2.metaColor}><rect x="0" y="0" width="16" height="4" rx="1.5" /><rect x="0" y="6" width="16" height="4" rx="1.5" /><rect x="0" y="12" width="16" height="4" rx="1.5" /></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Grid / List */}
                  {(() => {
                    const q = catSearch.toLowerCase().trim();
                    const filtered = q ? activeItems.filter((p: any) => p.name.toLowerCase().includes(q) || (p.domain_name || "").toLowerCase().includes(q) || (p.owner || "").toLowerCase().includes(q)) : activeItems;

                    const renderCard = (p: any) => {
                      const st = qualityToStars(p.quality_score || 0);
                      const refresh = p.sla_freshness || (p.product_type === "SOURCE_ALIGNED" ? "Real-time" : p.product_type === "BUSINESS" ? "Hourly" : "Daily");
                      const format = p.product_type === "SOURCE_ALIGNED" ? "Schema-on-Read" : p.product_type === "BUSINESS" ? "Star Schema" : "Materialized View";
                      const domCol = domainColorMap[p.domain_name] || "#999";
                      const desc = p.description || (p.product_type === "SOURCE_ALIGNED" ? "Raw ingested data from upstream source system." : p.product_type === "BUSINESS" ? "Curated business entity, governed for cross-domain use." : "Consumer-ready view for reporting and analytics.");
                      const bannerIcon = BANNER_ICONS[p.product_type] || BANNER_ICONS.SOURCE_ALIGNED;
                      const warmBg = p.product_type === "SOURCE_ALIGNED" ? `${activeCol}12` : p.product_type === "BUSINESS" ? `${activeCol}14` : `${activeCol}10`;
                      return (
                        <div key={p.id} className="cursor-pointer transition-all overflow-hidden" style={{ background: cp2.cardBg, border: `1px solid ${cp2.cardBorder}`, borderRadius: cp2.cardRadius, boxShadow: cp2.cardShadow ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = cp2.cardHoverBg)}
                          onMouseLeave={e => (e.currentTarget.style.background = cp2.cardBg)}
                          onClick={() => setSel({ kind: "product", id: p.id })}>
                          {cp2.showBanner && (
                            <div className="relative overflow-hidden" style={{ padding: "10px 10px 8px", background: warmBg }}>
                              <div className="flex items-center gap-2">
                                <div className="shrink-0 flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: activeCol + "22" }}>
                                  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke={activeCol} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={bannerIcon} /></svg>
                                </div>
                                <span className="font-bold truncate flex-1" style={{ fontSize: cp2.cardNameSize, color: cp2.cardNameColor, lineHeight: 1.3 }}>{p.name}</span>
                              </div>
                              <svg className="absolute -right-1 -top-1 opacity-[0.07]" width="36" height="36" viewBox="0 0 24 24" fill={activeCol} stroke="none"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.4 7.4-6.4-4.8-6.4 4.8 2.4-7.4-6-4.6h7.6z" /></svg>
                              <svg className="absolute right-5 top-3 opacity-[0.04]" width="20" height="20" viewBox="0 0 24 24" fill={activeCol} stroke="none"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.4 7.4-6.4-4.8-6.4 4.8 2.4-7.4-6-4.6h7.6z" /></svg>
                            </div>
                          )}
                          {!cp2.showBanner && (
                            <div style={{ padding: "8px 10px 0" }}>
                              <span className="font-bold truncate block" style={{ fontSize: cp2.cardNameSize, color: cp2.cardNameColor }}>{p.name}</span>
                            </div>
                          )}
                          <div style={{ padding: cp2.showBanner ? "4px 10px 10px" : "4px 10px 10px" }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="inline-flex items-center gap-1 rounded-full" style={{ padding: "1px 7px 1px 5px", background: domCol + "18", fontSize: cp2.tagFontSize, fontWeight: 600, color: domCol }}>
                                <span className="rounded-full" style={{ width: cp2.domainDotSize, height: cp2.domainDotSize, background: domCol }} />
                                {p.domain_name}
                              </span>
                              <StarRating stars={st} size={cp2.starSize - 1} />
                            </div>
                            <div title={desc.length > 60 ? desc : undefined} style={{ fontSize: cp2.cardDescSize, color: cp2.descColor, lineHeight: 1.4, marginBottom: 4 }}>{desc.length > 60 ? desc.slice(0, 58) + "\u2026" : desc}</div>
                            <div style={{ height: 1, background: cp2.separatorColor, marginBottom: 5 }} />
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              <span style={{ fontSize: cp2.cardMetaSize, color: cp2.metaColor }}>{refresh}</span>
                              <span style={{ fontSize: cp2.cardMetaSize, color: cp2.metaColor }}>{format}</span>
                              {p.owner && <span style={{ fontSize: cp2.cardMetaSize, color: cp2.metaColor }}>{p.owner}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    const renderListRow = (p: any, idx: number) => {
                      const st = qualityToStars(p.quality_score || 0);
                      const refresh = p.sla_freshness || (p.product_type === "SOURCE_ALIGNED" ? "Real-time" : p.product_type === "BUSINESS" ? "Hourly" : "Daily");
                      const domCol = domainColorMap[p.domain_name] || "#999";
                      const desc = p.description || (p.product_type === "SOURCE_ALIGNED" ? "Raw ingested data from upstream source system." : p.product_type === "BUSINESS" ? "Curated business entity, governed for cross-domain use." : "Consumer-ready view for reporting and analytics.");
                      return (
                        <div key={p.id} className="cursor-pointer transition-colors flex items-center gap-2.5"
                          style={{ padding: "7px 10px", borderBottom: idx < filtered.length - 1 ? `1px solid ${cp2.separatorColor}` : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = cp2.cardHoverBg)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          onClick={() => setSel({ kind: "product", id: p.id })}>
                          {cp2.showBanner && <div className="shrink-0 rounded-sm" style={{ width: 3, height: 28, background: `linear-gradient(180deg, ${activeCol}, ${domCol})` }} />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-semibold truncate" style={{ fontSize: cp2.cardNameSize, color: cp2.cardNameColor }}>{p.name}</span>
                              <StarRating stars={st} size={cp2.starSize - 1} />
                            </div>
                            <div title={desc.length > 50 ? desc : undefined} style={{ fontSize: cp2.cardDescSize, color: cp2.descColor, lineHeight: 1.3, marginTop: 1 }}>{desc.length > 50 ? desc.slice(0, 48) + "\u2026" : desc}</div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full" style={{ padding: "0.5px 6px 0.5px 4px", background: domCol + "18", fontSize: cp2.tagFontSize, fontWeight: 600, color: domCol }}>
                                <span className="rounded-full" style={{ width: 4, height: 4, background: domCol }} />
                                {p.domain_name}
                              </span>
                              <span style={{ fontSize: cp2.tagFontSize, color: cp2.metaColor }}>{refresh}</span>
                              {p.owner && <><span style={{ fontSize: cp2.tagFontSize, color: cp2.separatorColor }}>·</span><span style={{ fontSize: cp2.tagFontSize, color: cp2.metaColor }}>{p.owner}</span></>}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div style={{ maxHeight: cp2.listMaxHeight, overflowY: "auto", paddingRight: 6 }}>
                        {catViewMode === "grid" ? (
                          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cp2.gridCols}, 1fr)`, gap: cp2.gridGap }}>
                            {filtered.map(renderCard)}
                          </div>
                        ) : (
                          <div style={{ borderRadius: cp2.cardRadius, border: `1px solid ${cp2.cardBorder}`, background: cp2.cardBg, overflow: "hidden" }}>
                            {filtered.map((p, i) => renderListRow(p, i))}
                          </div>
                        )}
                        {filtered.length === 0 && <div className="p-4 text-center" style={{ fontSize: cp2.cardMetaSize, color: cp2.metaColor }}>{q ? "No matching products." : "No products in this layer."}</div>}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* ── TAB: ASK AI ── */}
            {panelTab === "askai" && (() => {
              const SUGGESTED = selProduct
                ? [
                    `Is ${selProduct.name} pipeline healthy? Show me any failing models`,
                    `What upstream sources feed ${selProduct.name} and are any broken?`,
                    `Which downstream products are impacted if ${selProduct.name} fails?`,
                    `What are the quality issues with ${selProduct.name}?`,
                  ]
                : selApp
                ? [
                    `Is ${selApp.name} connector healthy or broken?`,
                    `Which source products does ${selApp.name} feed?`,
                    `What downstream impact would a ${selApp.name} failure cause?`,
                  ]
                : [
                    "Which data products have broken pipeline runs right now?",
                    "What applications have failing or paused connectors?",
                    "Show me the lineage impact of current broken pipelines",
                    "Which downstream products are affected by upstream failures?",
                    "What are the most critical pipeline warnings?",
                  ];
              return (
                <div className="flex flex-col" style={{ height: "calc(100% + 12px)", margin: "-6px -20px -6px -20px" }}>
                  {/* Messages area */}
                  <div ref={aiScrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
                    {aiMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center px-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#1a1a1a" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div className="font-bold text-[13px] mb-1" style={{ color: cfg.text }}>Ask Atlas</div>
                        <p className="text-[10px] text-gray-400 leading-relaxed mb-4 max-w-[260px]">
                          Ask anything about your data mesh — pipelines, lineage, failures, observability. Context-aware answers powered by Gemini.
                        </p>
                        <div className="space-y-1.5 w-full">
                          {SUGGESTED.map((q, i) => (
                            <button key={i} onClick={() => sendAiMessage(q)}
                              className="w-full text-left px-3 py-2 rounded-lg text-[10px] transition-all cursor-pointer hover:shadow-sm"
                              style={{ background: "#f6f6f6", border: "1px solid #e5e5e5", color: "#4b5563" }}>
                              <span className="opacity-50 mr-1.5">&#10132;</span>{q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] rounded-xl px-3 py-2 text-[11px] leading-[1.7] ${
                          msg.role === "user"
                            ? "bg-gray-800 text-white rounded-br-sm"
                            : "bg-gray-50 border border-gray-100 rounded-bl-sm"
                        }`} style={msg.role === "assistant" ? { color: cfg.text } : undefined}>
                          {msg.role === "assistant" ? (
                            <AiMarkdown text={msg.text || (aiStreaming && i === aiMessages.length - 1 ? "Thinking..." : "")} />
                          ) : msg.text}
                        </div>
                      </div>
                    ))}
                    {aiStreaming && aiMessages.length > 0 && aiMessages[aiMessages.length - 1].role === "assistant" && !aiMessages[aiMessages.length - 1].text && (
                      <div className="flex justify-start">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-bl-sm px-3 py-2">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input area */}
                  <div className="shrink-0 border-t border-gray-100 px-3 py-2.5 bg-white">
                    {aiMessages.length > 0 && (
                      <button onClick={() => { setAiMessages([]); if (aiAbortRef.current) aiAbortRef.current.abort(); }}
                        className="text-[9px] text-gray-400 hover:text-gray-600 mb-1.5 cursor-pointer flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m-7 5v6m4-6v6M5 6l1 14h12l1-14" /></svg>
                        Clear chat
                      </button>
                    )}
                    <div className="flex gap-1.5 items-end">
                      <textarea
                        value={aiInput}
                        onChange={e => setAiInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(aiInput); } }}
                        placeholder={selProduct ? `Ask about ${selProduct.name}...` : selApp ? `Ask about ${selApp.name}...` : "Ask about your data mesh..."}
                        className="flex-1 resize-none rounded-lg border border-gray-200 px-2.5 py-2 text-[11px] placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                        style={{ color: cfg.text, minHeight: 36, maxHeight: 100 }}
                        rows={1}
                      />
                      <button
                        onClick={() => aiStreaming ? aiAbortRef.current?.abort() : sendAiMessage(aiInput)}
                        disabled={!aiStreaming && !aiInput.trim()}
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background: aiStreaming ? "#ef4444" : "#1a1a1a", color: "white" }}>
                        {aiStreaming ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[8px] text-gray-300">Gemini 2.5 Flash-Lite</span>
                      {selProduct && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-400 font-medium">Context: {selProduct.name}</span>}
                      {selApp && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-400 font-medium">Context: {selApp.name}</span>}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          {qualityDrilldown && (() => {
            const qd = cfg.qualityPanel;
            return (
            <div className="absolute inset-0 bg-white/92 backdrop-blur-[2px] z-20 flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold" style={{ color: cfg.text, fontSize: qd.drillTitleSize }}>{qualityDrilldown.title}</div>
                  <div className="text-gray-400 mt-0.5 leading-[1.5]" style={{ fontSize: qd.drillDescSize }}>{qualityDrilldown.description}</div>
                </div>
                <button type="button" onClick={() => setQualityDrilldown(null)} className="font-bold text-gray-400 hover:text-gray-600 cursor-pointer shrink-0" style={{ fontSize: qd.drillCloseSize }}>Close</button>
              </div>
              <div className="p-5 overflow-y-auto">
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  <div className="rounded-lg p-2 text-center" style={{ background: qd.cardBg, border: `1px solid ${qd.widgetBorder}` }}>
                    <span className="font-black block tabular-nums" style={{ color: cfg.text, fontSize: qd.drillKpiValueSize }}>{qualityDrilldown.testsRun}</span>
                    <span className="font-semibold block uppercase" style={{ color: qd.headerSubColor, fontSize: qd.drillKpiLabelSize, lineHeight: 1.35 }}>Tests</span>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: cfg.green + "08", border: `1px solid ${qd.widgetBorder}` }}>
                    <span className="font-black block tabular-nums" style={{ color: cfg.green, fontSize: qd.drillKpiValueSize }}>{qualityDrilldown.passed}</span>
                    <span className="font-semibold block uppercase" style={{ color: cfg.green, fontSize: qd.drillKpiLabelSize, lineHeight: 1.35 }}>Passed</span>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: cfg.red + "08", border: `1px solid ${qd.widgetBorder}` }}>
                    <span className="font-black block tabular-nums" style={{ color: cfg.red, fontSize: qd.drillKpiValueSize }}>{qualityDrilldown.failed}</span>
                    <span className="font-semibold block uppercase" style={{ color: cfg.red, fontSize: qd.drillKpiLabelSize, lineHeight: 1.35 }}>Failed</span>
                  </div>
                </div>
                <div className="font-bold text-gray-400 uppercase tracking-wider mb-2" style={{ fontSize: qd.drillSectionHeaderSize }}>Failed Tests</div>
                {qualityDrilldown.failures.length > 0 ? (
                  <div className="space-y-2">
                    {qualityDrilldown.failures.map((failure, idx) => (
                      <div key={`${failure.name}-${idx}`} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                          <span className="font-semibold" style={{ color: cfg.text, fontSize: qd.drillFailureNameSize }}>{failure.name}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded-full font-bold uppercase ${failure.severity === "high" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`} style={{ fontSize: Math.max(6, qd.drillKpiLabelSize) }}>{failure.severity}</span>
                        </div>
                        <div className="leading-[1.6]" style={{ color: cfg.red, fontSize: qd.drillFailureIssueSize }}>{failure.issue}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-green-50 p-4 text-center" style={{ color: cfg.green, fontSize: qd.drillEmptyStateSize }}>No failed tests for this KPI.</div>
                )}
              </div>
            </div>
            );
          })()}
          </div>
          </div>
        </div>
      </div>
    </div>

      {/* Bottom Description — uses exact Nav background (--nav-bg from settings, e.g. #fffef5) */}
      <section
        className="border-t border-mesh-border"
        style={{ background: "var(--nav-bg, var(--color-mesh-bg, #f4f4f4))" }}
      >
        <div className="max-w-[1728px] mx-auto px-3 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-mesh-border bg-white/85 backdrop-blur-[2px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-mesh-accent mb-2">About</div>
              <div className="space-y-3 text-[12px] text-mesh-text-muted leading-[1.85]">
                <p>
                  Created by Naveen Mithare, MeshAtlas is a Data Mesh Observability personal project focused on making
                  enterprise metadata easier to understand and explore.
                </p>
                <p>
                  It brings lineage, quality, ownership, and health into one interactive map so both business and
                  technical teams can quickly understand how the mesh is behaving.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-mesh-border bg-white/85 backdrop-blur-[2px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-mesh-accent mb-2">Data &amp; Methodology</div>
              <div className="space-y-3 text-[11px] text-mesh-text-muted leading-[1.8]">
                <p>
                  The dataset is generated by AI to mock a realistic enterprise data mesh. Applications produce
                  source-aligned products, source products feed business products, and business products feed
                  consumer-facing products through explicit lineage edges.
                </p>
                <p>
                  The radial layout encodes this upstream-to-downstream progression from the outer ring toward the
                  inner ring. Flow lines show dependency paths, while the right-hand analytical views expose quality,
                  cost, and pipeline context for each selected node.
                </p>
                <p>
                  This combined topology + context approach improves observability by making impact analysis faster:
                  teams can see where issues originate, what downstream assets are exposed, and which domains carry
                  concentrated operational risk.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-mesh-border bg-white/85 backdrop-blur-[2px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-mesh-accent mb-2">How to Use</div>
              <div className="space-y-2.5 text-[11px] text-mesh-text-muted leading-[1.75]">
                <p><strong className="text-mesh-text font-semibold">Search products</strong> to jump directly to a data product and center your analysis.</p>
                <p><strong className="text-mesh-text font-semibold">Click nodes</strong> to inspect lineage, quality posture, and pipeline implications in the right panel.</p>
                <p><strong className="text-mesh-text font-semibold">Trace flows radially</strong> from upstream application edges to downstream consumer products to understand blast radius and dependency depth.</p>
                <p><strong className="text-mesh-text font-semibold">Ask AI</strong> for deeper insights — use the AI chat panel to ask questions about any product, domain, or lineage path and get contextual answers grounded in the mesh data.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-mesh-border/80 text-[11px] text-mesh-text-muted flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Naveen Mithare. All rights reserved.</span>
            <span>Built with love by Naveen ❤️</span>
          </div>
        </div>
      </section>
    </div>
  );
}
