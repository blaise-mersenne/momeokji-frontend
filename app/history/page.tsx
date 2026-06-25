"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface FoodLog {
  id: string;
  menu_name: string;
  eaten_at: string;
  eval_simple: string | null;
}

const EVAL_LABELS: Record<string, string> = {
  good: "완전 내 스타일 😍",
  okay: "그냥저냥 😐",
  bad: "내 입맛 아님 😞",
};

function formatEatenAt(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function HistoryItem({ log }: { log: FoodLog }) {
  return (
    <div style={{
      borderRadius: 16, background: "#fff",
      boxShadow: "var(--shadow-1)",
      padding: "16px 20px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
        {log.menu_name}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
        {formatEatenAt(log.eaten_at)}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-mid)" }}>
        {log.eval_simple ? EVAL_LABELS[log.eval_simple] ?? "평가 없음" : "평가 없음"}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("food_logs")
        .select("id, menu_name, eaten_at, eval_simple")
        .order("eaten_at", { ascending: false });

      if (error) {
        console.error("[Supabase] food_logs 조회 실패:", error);
        setFetchError(error.message);
        setLoading(false);
        return;
      }
      setLogs(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function renderList() {
    if (loading) {
      return (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          불러오는 중…
        </div>
      );
    }
    if (fetchError) {
      return (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          데이터를 불러오지 못했어요. {fetchError}
        </div>
      );
    }
    if (logs.length === 0) {
      return (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14, lineHeight: "22px" }}>
          아직 기록된 식사가 없어요. 메뉴를 추천받고 기록해보세요!
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {logs.map((log) => (
          <HistoryItem key={log.id} log={log} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", justifyContent: "center" }}>
      <div style={{
        width: "100%", maxWidth: 390,
        background: "#fff",
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
      }}>
        <header style={{
          height: 56, flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          padding: "0 20px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <IconBack />
          </Link>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
            나의 식사 기록
          </span>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {renderList()}
        </div>
      </div>
    </div>
  );
}
