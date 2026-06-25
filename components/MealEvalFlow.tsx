"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

export type EvalValue = "bad" | "okay" | "good";

const EVAL_OPTIONS: { value: EvalValue; label: string }[] = [
  { value: "bad", label: "내 입맛 아님 😞" },
  { value: "okay", label: "그냥저냥 😐" },
  { value: "good", label: "완전 내 스타일 😍" },
];

const EVAL_RESULT_TEXT: Record<EvalValue, string> = {
  bad: "내 입맛 아님으로 기록했어요 😞",
  okay: "그냥저냥으로 기록했어요 😐",
  good: "완전 내 스타일로 기록했어요 😍",
};

interface SliderField {
  key: "eval_spicy" | "eval_salty" | "eval_sweet" | "eval_greasy";
  label: string;
  min: string;
  max: string;
}

const SLIDER_FIELDS: SliderField[] = [
  { key: "eval_spicy", label: "매운맛", min: "전혀 안 매움", max: "매우 매움" },
  { key: "eval_salty", label: "짠맛", min: "전혀 안 짬", max: "매우 짬" },
  { key: "eval_sweet", label: "단맛", min: "전혀 안 달음", max: "매우 달음" },
  { key: "eval_greasy", label: "기름진맛", min: "전혀 안 기름짐", max: "매우 기름짐" },
];

type Phase =
  | "gate"
  | "simple"
  | "skippedSimple"
  | "resultOnly"
  | "detailPrompt"
  | "detailForm"
  | "detailDone";

interface MealEvalFlowProps {
  recordId: string;
  initialEvalSimple?: EvalValue | null;
  startGated?: boolean;
  onToast?: (text: string) => void;
}

export default function MealEvalFlow({
  recordId, initialEvalSimple = null, startGated = false, onToast,
}: MealEvalFlowProps) {
  const [phase, setPhase] = useState<Phase>(
    initialEvalSimple ? "resultOnly" : startGated ? "gate" : "simple"
  );
  const [simpleValue, setSimpleValue] = useState<EvalValue | null>(initialEvalSimple);
  const [sliders, setSliders] = useState({
    eval_spicy: 3, eval_salty: 3, eval_sweet: 3, eval_greasy: 3,
  });

  async function handleSelectSimple(value: EvalValue) {
    const { error } = await supabase
      .from("food_logs")
      .update({ eval_simple: value })
      .eq("id", recordId);

    if (error) {
      console.error("[Supabase] eval_simple 업데이트 실패:", error);
      return;
    }

    setSimpleValue(value);
    setPhase("detailPrompt");
  }

  async function handleSaveDetail() {
    const { error } = await supabase
      .from("food_logs")
      .update(sliders)
      .eq("id", recordId);

    if (error) {
      console.error("[Supabase] 상세 평가 저장 실패:", error);
      return;
    }

    setPhase("detailDone");
    onToast?.("상세 평가가 저장되었어요!");
  }

  if (phase === "gate") {
    return (
      <button onClick={() => setPhase("simple")} style={gateButtonStyle}>
        평가하기
      </button>
    );
  }

  if (phase === "simple") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {EVAL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelectSimple(opt.value)}
            style={evalButtonStyle}
          >
            {opt.label}
          </button>
        ))}
        <button onClick={() => setPhase("skippedSimple")} style={skipTextButtonStyle}>
          나중에 평가할게요
        </button>
      </div>
    );
  }

  if (phase === "skippedSimple") {
    return null;
  }

  if (phase === "resultOnly" || phase === "detailDone") {
    return (
      <div style={{ fontSize: 13, color: "var(--text-mid)" }}>
        {simpleValue ? EVAL_RESULT_TEXT[simpleValue] : "평가 없음"}
      </div>
    );
  }

  if (phase === "detailPrompt") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 13, color: "var(--text-mid)" }}>
          {simpleValue && EVAL_RESULT_TEXT[simpleValue]}
        </div>
        <button onClick={() => setPhase("detailForm")} style={detailPromptButtonStyle}>
          상세 평가 남기기 🔽
        </button>
      </div>
    );
  }

  // phase === "detailForm"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "6px 0" }}>
      {SLIDER_FIELDS.map((field) => (
        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 12, color: "var(--ink)", fontWeight: 600,
          }}>
            <span>{field.label}</span>
            <span style={{ color: "var(--orange-hot)" }}>{sliders[field.key]}</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={sliders[field.key]}
            onChange={(e) =>
              setSliders((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))
            }
            style={{ width: "100%" }}
          />
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: "var(--text-muted)",
          }}>
            <span>{field.min}</span>
            <span>{field.max}</span>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSaveDetail} style={saveButtonStyle}>
          저장
        </button>
        <button onClick={() => setPhase("detailDone")} style={skipTextButtonStyle}>
          나중에 할게요
        </button>
      </div>
    </div>
  );
}

const gateButtonStyle: CSSProperties = {
  padding: "6px 10px", borderRadius: 999, border: "1px solid var(--orange-hot)",
  background: "#fff", color: "var(--orange-hot)",
  fontSize: 12, fontWeight: 700, cursor: "pointer",
};

const evalButtonStyle: CSSProperties = {
  padding: "6px 10px", borderRadius: 999, border: "1px solid var(--border)",
  background: "#fff", color: "var(--ink)",
  fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
};

const skipTextButtonStyle: CSSProperties = {
  padding: "6px 10px", borderRadius: 999, border: "none",
  background: "none", color: "var(--text-muted)",
  fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
};

const detailPromptButtonStyle: CSSProperties = {
  alignSelf: "flex-start", padding: "6px 10px", borderRadius: 999,
  border: "1px solid var(--border)", background: "var(--bg-2)",
  color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer",
};

const saveButtonStyle: CSSProperties = {
  padding: "8px 16px", borderRadius: 999, border: "none",
  background: "var(--orange-hot)", color: "#fff",
  fontSize: 13, fontWeight: 700, cursor: "pointer",
};
