"use client";

import { useEffect, useState } from "react";

/** Empty string = inherit default; null = not a complete color yet (partial edit). */
export function tryCommitColorText(raw: string): string | null {
  const t = raw.trim();
  if (t === "") return "";
  if (/^#[0-9a-fA-F]{6}$/i.test(t)) return t.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/i.test(t)) {
    const s = t.slice(1);
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase();
  }
  return null;
}

/** Valid #rgb / #rrggbb for native color input (always 6-digit hex). */
function hexForColorPicker(v: string): string {
  const c = tryCommitColorText(v);
  if (c === "" || c === null) return "#000000";
  return c;
}

export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10px] font-medium text-gray-700">{label}</span>
      <button onClick={() => onChange(!value)} className={`w-8 h-[18px] rounded-full cursor-pointer transition-colors relative ${value ? "bg-gray-800" : "bg-gray-200"}`}>
        <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${value ? "left-[16px]" : "left-[2px]"}`} />
      </button>
    </div>
  );
}

export function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] font-medium text-gray-700 flex-1 truncate">{label}</span>
      <input
        type="text"
        value={text}
        onChange={e => {
          const raw = e.target.value;
          setText(raw);
          const c = tryCommitColorText(raw);
          if (c !== null) onChange(c);
        }}
        onBlur={() => {
          const c = tryCommitColorText(text);
          if (c !== null) onChange(c);
          else setText(value);
        }}
        className="w-[62px] px-1 py-0.5 rounded border border-gray-200 text-[9px] font-mono text-gray-600 text-center focus:outline-none focus:ring-1 focus:ring-gray-300 shrink-0"
        placeholder="default"
        title="Leave empty to use the default color"
      />
      <input
        type="color"
        value={hexForColorPicker(value)}
        onChange={e => {
          const next = e.target.value.toLowerCase();
          onChange(next);
          setText(next);
        }}
        className="w-5 h-5 rounded border border-gray-200 cursor-pointer p-0 shrink-0"
        title="Sets an explicit hex color"
      />
    </div>
  );
}

export function PreciseNumberInput({
  value,
  min,
  max,
  inputStep,
  onChange,
  className,
}: {
  value: number;
  min: number;
  max: number;
  inputStep: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [editText, setEditText] = useState(() => String(value));
  const displayValue = focused ? editText : String(value);
  const commit = () => {
    const n = parseFloat(String(editText).replace(",", "."));
    if (Number.isNaN(n)) {
      setEditText(String(value));
      return;
    }
    let v = Math.min(max, Math.max(min, n));
    if (inputStep > 0) v = Math.round(v / inputStep) * inputStep;
    v = Number(v.toFixed(6));
    onChange(v);
    setEditText(String(v));
  };
  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={e => setEditText(e.target.value)}
      onFocus={() => {
        setFocused(true);
        setEditText(String(value));
      }}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={e => {
        if (e.key === "Enter") {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  inputStep,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
  /** When set, shows a numeric field so values between slider steps are reachable */
  inputStep?: number;
}) {
  const fine = inputStep ?? (step >= 1 ? 1 : step);
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5 gap-1">
        <span className="text-[10px] font-medium text-gray-700 shrink min-w-0">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <PreciseNumberInput
            value={value}
            min={min}
            max={max}
            inputStep={fine}
            onChange={onChange}
            className="w-[52px] px-1 py-0.5 rounded border border-gray-200 text-[9px] font-mono text-gray-700 text-right focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          {unit != null && unit !== "" && <span className="text-[9px] font-bold text-gray-400 tabular-nums">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-600"
      />
    </div>
  );
}

export function SliderRowWithInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  inputStep,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
  /** Step applied when committing the number field (can be finer than the range `step`) */
  inputStep?: number;
}) {
  const is = inputStep ?? step;
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5 gap-1">
        <span className="text-[10px] font-medium text-gray-700 shrink-0">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <PreciseNumberInput
            value={value}
            min={min}
            max={max}
            inputStep={is}
            onChange={onChange}
            className="w-[56px] px-1 py-0.5 rounded border border-gray-200 text-[9px] font-mono text-gray-700 text-right focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          {unit ? <span className="text-[9px] text-gray-400">{unit}</span> : null}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-600"
      />
    </div>
  );
}
