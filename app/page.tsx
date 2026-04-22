"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

interface Restaurant {
  id: number;
  name: string;
  base_score: number;
  open_at: string;
  close_at: string;
  condition_tags: string;
  taste_tags: string;
  rating?: number;
  distance_km?: number;
  price?: number;
}

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    )
  : null;

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

// ── Icons ────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-mid)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconChevron({ dir = "down", color = "var(--orange-deep)" }: { dir?: "up" | "down"; color?: string }) {
  const d = dir === "down" ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6";
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ── GlobalHeader ─────────────────────────────────────────────

function GlobalHeader() {
  return (
    <header style={{
      height: 56, flexShrink: 0,
      borderBottom: "1px solid var(--border)",
      padding: "0 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{
        fontFamily: '"Noto Sans KR", sans-serif',
        fontWeight: 900, fontSize: 22,
        color: "var(--orange-bright)",
        letterSpacing: "-0.5px",
      }}>
        뭐먹지
      </span>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "var(--bg-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconUser />
      </div>
    </header>
  );
}

// ── ModeTabs ─────────────────────────────────────────────────

const TABS = [
  { id: "dineout",  label: "외식하기",   icon: "🍽️" },
  { id: "homecook", label: "집밥 해먹기", icon: "🏠" },
];

function ModeTabs({ mode, setMode }: { mode: string; setMode: (m: string) => void }) {
  return (
    <div style={{
      display: "flex", background: "var(--bg-2)",
      borderRadius: 999, padding: 4, height: 52,
    }}>
      {TABS.map((tab) => {
        const active = mode === tab.id;
        return (
          <button key={tab.id} onClick={() => setMode(tab.id)} style={{
            flex: 1, height: 44, borderRadius: 999, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontSize: 14, fontWeight: 700,
            background: active ? "var(--orange-hot)" : "transparent",
            color: active ? "#fff" : "var(--text-mid)",
            boxShadow: active ? "var(--shadow-2)" : "none",
            transition: "all .18s ease",
          }}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── HintBubble ───────────────────────────────────────────────

function HintBubble({ text }: { text: string }) {
  return (
    <div style={{
      background: "var(--bg-2)",
      color: "var(--ink-2)",
      fontSize: 14, lineHeight: "22px",
      padding: "14px 18px",
      borderRadius: "8px 24px 24px 24px",
      maxWidth: 336,
    }}>
      {text}
    </div>
  );
}

// ── RecommendCard ─────────────────────────────────────────────

function RecommendCard({
  place, expanded, onToggle,
}: {
  place: Restaurant;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tags = [
    ...parseTags(place.condition_tags),
    ...parseTags(place.taste_tags),
  ];

  return (
    <div onClick={onToggle} style={{
      borderRadius: 16, background: "#fff",
      boxShadow: "var(--shadow-1)",
      cursor: "pointer", overflow: "hidden",
      transition: "box-shadow .2s",
    }}>
      <div style={{ display: "flex", gap: 12, padding: 14, alignItems: "stretch" }}>

        {/* 썸네일 */}
        <div style={{
          width: 84, height: 84, borderRadius: 12, flexShrink: 0,
          background: "var(--bg-2)", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase" }}>
            no img
          </span>
          {/* 매칭 뱃지 */}
          <div style={{
            position: "absolute", top: 6, left: 6,
            height: 20, padding: "0 7px", borderRadius: 6,
            background: "var(--orange)", color: "#fff",
            fontSize: 11, fontWeight: 700, letterSpacing: -0.2,
            display: "inline-flex", alignItems: "center",
          }}>
            {place.base_score}%
          </div>
        </div>

        {/* 우측 컬럼 */}
        <div style={{
          flex: 1, minWidth: 0,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", gap: 6,
        }}>
          {/* Row 1: 이름 + 가격 */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 16, fontWeight: 700, color: "var(--ink)", lineHeight: "20px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {place.name}
              </div>
              <div style={{
                fontSize: 12, color: "var(--text-muted)", lineHeight: "16px", marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                오늘의 추천
              </div>
            </div>
            <div style={{
              fontSize: 15, fontWeight: 700, color: "var(--ink)",
              lineHeight: "20px", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {place.price ? place.price.toLocaleString() : "9,000"}원
            </div>
          </div>

          {/* Row 2: 메타 + 태그 칩 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              color: "var(--text-mid)", fontSize: 11,
              minWidth: 0, overflow: "hidden",
            }}>
              <span>⭐ {place.rating ?? "4.8"}</span>
              <span style={{ color: "var(--border-2)" }}>•</span>
              <span>🕒 {place.open_at?.substring(0, 5) ?? "11:00"}</span>
              <span style={{ color: "var(--border-2)" }}>•</span>
              <span style={{ whiteSpace: "nowrap" }}>📍 {place.distance_km ?? "1.2"}km</span>
            </div>
            {tags.length > 0 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                height: 22, flexShrink: 0, padding: "0 8px", borderRadius: 999,
                background: expanded ? "var(--orange)" : "var(--orange-pale)",
                color: expanded ? "#fff" : "var(--orange-deep)",
                fontSize: 11, fontWeight: 600,
              }}>
                +{tags.length}
                <IconChevron dir={expanded ? "up" : "down"} color={expanded ? "#fff" : "var(--orange-deep)"} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 확장 태그 영역 */}
      {expanded && tags.length > 0 && (
        <>
          <div style={{ height: 1, background: "var(--border)", margin: "0 14px" }} />
          <div style={{ padding: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((tag, i) => (
              <span key={i} style={{
                height: 32, padding: "0 14px", borderRadius: 999,
                background: "var(--bg)", color: "var(--text)",
                fontSize: 14, fontWeight: 500,
                display: "inline-flex", alignItems: "center",
              }}>
                #{tag}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── FAB ──────────────────────────────────────────────────────

function FAB() {
  return (
    <button style={{
      position: "absolute", right: 20, bottom: 24,
      width: 56, height: 56, borderRadius: "50%",
      background: "var(--orange-hot)", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)",
    }}>
      <IconSearch />
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [mode, setMode] = useState("dineout");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      if (!supabase) { setIsLoading(false); return; }
      const { data, error } = await supabase.from("restaurants").select("*");
      if (!error) setRestaurants((data || []).slice(0, 7));
      setIsLoading(false);
    };
    fetchRestaurants();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", justifyContent: "center" }}>
      <div style={{
        width: "100%", maxWidth: 390,
        background: "#fff",
        position: "relative",
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
      }}>
        <GlobalHeader />

        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>
          {/* 상단 고정 영역 */}
          <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 24 }}>
            <ModeTabs mode={mode} setMode={setMode} />
            <HintBubble text="오늘 하루 힘들었죠? 따뜻한 국물 요리 어때요?" />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: "28px" }}>
                오늘의 맞춤 추천
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
                당신의 취향에 맞춰 선별했어요
              </div>
            </div>
          </div>

          {/* 카드 목록 */}
          <div style={{ padding: "12px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
            {isLoading ? (
              <div style={{ textAlign: "center", paddingTop: 80, color: "var(--text-muted)" }}>
                데이터 로딩 중...
              </div>
            ) : restaurants.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 80, color: "var(--text-muted)" }}>
                추천 결과가 없습니다
              </div>
            ) : (
              restaurants.map((place, i) => (
                <RecommendCard
                  key={place.id}
                  place={place}
                  expanded={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                />
              ))
            )}
          </div>
        </div>

        <FAB />
      </div>
    </div>
  );
}
