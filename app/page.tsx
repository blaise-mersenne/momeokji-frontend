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
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [targetTime, setTargetTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setTargetTime(`${hours}:${minutes}`);
  }, []);

  useEffect(() => {
    if (!targetTime) return;
    fetchRestaurants();
  }, [targetTime]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("restaurants").select("*");
    if (error) {
      setIsLoading(false);
      return;
    }

    const filtered = (data || []).filter((place: Restaurant) => {
      // 영업시간 데이터가 없는 경우 기본적으로 노출시킵니다.
      if (!place.open_at || !place.close_at) return true;
      const open = place.open_at.substring(0, 5);
      const close = place.close_at.substring(0, 5);
      return targetTime >= open && targetTime <= close;
    });

    setRestaurants(filtered.slice(0, 5));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#D1E9F6] p-4 font-['Pretendard','Noto_Sans_KR',sans-serif]">
      <div className="max-w-md mx-auto">
        
        <header className="mb-6 pt-8 pb-4">
          <h1 className="text-[24px] font-extrabold text-[#495057] leading-tight tracking-[-0.02em] mb-2">
            오늘의 맞춤 추천
          </h1>
          <p className="text-[16px] text-[#495057]/70 font-medium">당신의 취향에 맞춰 선별했어요</p>
          
          <div className="mt-6 bg-white/50 backdrop-blur-sm p-4 rounded-[16px] border border-white/20">
            <label className="text-xs font-bold text-[#495057] mb-2 block uppercase tracking-wider">Target Time</label>
            <input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="w-full bg-transparent text-[20px] font-bold text-[#495057] focus:outline-none"
            />
          </div>
        </header>

        <main className="flex flex-col gap-[12px]">
          {isLoading ? (
            <div className="text-center py-20 text-[#495057]/50 font-semibold">큐레이션 엔진 가동 중...</div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-20 bg-white/30 rounded-[16px] text-[#495057]/50">조건에 맞는 식당이 없습니다.</div>
          ) : (
            restaurants.map((place) => (
              <div key={place.id} className="bg-white p-5 rounded-[16px] shadow-[0_10px_20px_rgba(0,0,0,0.05)] border border-white/10 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h3 className="text-[18px] font-bold text-[#495057] leading-tight mb-1">{place.name}</h3>
                    {/* [수정된 부분] 안전장치 ?. 추가 및 시간이 없을 때의 대체 텍스트 마련 */}
                    <span className="text-[13px] text-[#ACB5BD] font-medium">
                      ⏰ {place.open_at?.substring(0, 5) || "시간미상"} ~ {place.close_at?.substring(0, 5) || "시간미상"}
                    </span>
                  </div>
                  <div className="bg-[#FF6B00] text-white text-[14px] font-black px-3 py-1 rounded-full shadow-lg shadow-[#FF6B00]/20">
                    {place.base_score}%
                  </div>
                </div>

                <div className="h-[1px] bg-gray-50 w-full" />

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      try {
                        return JSON.parse(place.condition_tags || "[]").map((tag: string, i: number) => (
                          <span key={i} className="bg-gray-50 text-[#495057] text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-gray-100">
                            {tag}
                          </span>
                        ));
                      } catch (e) { return null; }
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      try {
                        return JSON.parse(place.taste_tags || "[]").map((tag: string, i: number) => (
                          <span key={i} className="bg-[#FF6B00]/5 text-[#FF6B00] text-[12px] font-bold px-2.5 py-1 rounded-lg border border-[#FF6B00]/10">
                            {tag}
                          </span>
                        ));
                      } catch (e) { return null; }
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}