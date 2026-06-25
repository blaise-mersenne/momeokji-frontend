"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

export type EvalValue = "bad" | "okay" | "good";

export interface DetailSliders {
  eval_spicy: number;
  eval_salty: number;
  eval_sweet: number;
  eval_greasy: number;
}

const DEFAULT_SLIDERS: DetailSliders = {
  eval_spicy: 3, eval_salty: 3, eval_sweet: 3, eval_greasy: 3,
};

const EVAL_OPTIONS: { value: EvalValue; label: string }[] = [
  { value: "bad", label: "내 입맛 아님 😞" },
  { value: "okay", label: "그냥저냥 😐" },
  { value: "good", label: "완전 내 스타일 😍" },
];

interface SliderField {
  key: keyof DetailSliders;
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

interface MealEvalFlowProps {
  recordId: string;
  initialEvalSimple?: EvalValue | null;
  initialDetail?: DetailSliders | null;
  onToast?: (text: string) => void;
}

export default function MealEvalFlow({
  recordId, initialEvalSimple = null, initialDetail = null, onToast,
}: MealEvalFlowProps) {
  // 단계 2: simpleValue === null → 먹음 기록 완료, 간단 평가 미완료 (간단 평가 버튼 상시 노출)
  // 단계 3: simpleValue 있음 + detail === null → 상세 평가 진행 전 (언제든 가능)
  // 단계 4: simpleValue 있음 + detail 있음 → 평가 완료
  const [simpleValue, setSimpleValue] = useState<EvalValue | null>(initialEvalSimple);
  const [detail, setDetail] = useState<DetailSliders | null>(initialDetail);
  const [sliders, setSliders] = useState<DetailSliders>(initialDetail ?? DEFAULT_SLIDERS);
  const [detailOpen, setDetailOpen] = useState(false);

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

    setDetail(sliders);
    setDetailOpen(false);
    onToast?.("상세 평가가 저장되었어요!");
  }

  // 단계 2: 먹음 기록 완료, 간단 평가 미완료
  if (simpleValue === null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={loggedBadgeStyle}>먹었어요 ✓</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EVAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelectSimple(opt.value)}
              style={evalButtonStyle(false)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 단계 3, 4: 간단 평가 완료
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={loggedBadgeStyle}>먹었어요 ✓</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {EVAL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelectSimple(opt.value)}
            style={evalButtonStyle(opt.value === simpleValue)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {detail ? (
        // 단계 3: 상세 평가까지 완료
        <div style={{ fontSize: 13, color: "var(--text-mid)" }}>
          상세 평가: 매운맛 {detail.eval_spicy} · 짠맛 {detail.eval_salty} · 단맛 {detail.eval_sweet} · 기름진맛 {detail.eval_greasy}
        </div>
      ) : (
        // 단계 2: 상세 평가 진행 전 (언제든 진입 가능)
        <>
          <button onClick={() => setDetailOpen((v) => !v)} style={detailPromptButtonStyle}>
            상세 평가 남기기 🔽
          </button>

          {detailOpen && (
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
                <button onClick={() => setDetailOpen(false)} style={skipTextButtonStyle}>
                  나중에 할게요
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const loggedBadgeStyle: CSSProperties = {
  alignSelf: "flex-start", padding: "6px 10px", borderRadius: 999,
  border: "1px solid var(--border)", background: "var(--bg-2)",
  color: "var(--text-muted)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
};

function evalButtonStyle(selected: boolean): CSSProperties {
  return {
    padding: "6px 10px", borderRadius: 999,
    border: selected ? "1px solid var(--orange-hot)" : "1px solid var(--border)",
    background: selected ? "var(--orange-hot)" : "#fff",
    color: selected ? "#fff" : "var(--ink)",
    fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  };
}

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
