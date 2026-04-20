"use client"; // 상호작용(클릭 이벤트)을 위해 클라이언트 컴포넌트로 선언

import React, { useState } from 'react';

interface RestaurantData {
  name: string;
  base_score: number;
  condition_tags: string[];
  taste_tags: string[];
}

interface CardProps {
  data: RestaurantData;
}

export default function FoodRecommendationCard({ data }: CardProps) {
  // 태그 접힘/펼침 상태를 관리하는 변수 (기본값: false/접힘)
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      
      {/* 🟢 메인 카드 영역 (좌우 분할 레이아웃) */}
      <div className="flex gap-4">
        
        {/* 좌측: 썸네일 이미지 (프로토타입 기준 정방형) */}
        <div className="w-[100px] h-[100px] bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
          <span className="text-[10px] text-gray-400 text-center px-2">이미지<br/>영역</span>
        </div>

        {/* 우측: 정보 영역 */}
        <div className="flex-1 flex flex-col justify-between py-0.5">
          
          {/* 1행: 메뉴명 & 매칭율 */}
          <div className="flex justify-between items-start">
            <h2 className="text-[16px] font-bold text-gray-900 leading-tight">
              {data.name}
            </h2>
            <span className="text-orange-500 font-bold text-[14px] ml-2 flex-shrink-0">
              {data.base_score}%
            </span>
          </div>

          {/* 2행: 식당명 */}
          <p className="text-[13px] text-gray-500 mt-1">
            할머니 손맛 (테스트 식당)
          </p>

          {/* 3행: 부가정보 & 태그 펼침 버튼 */}
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[12px] text-gray-400">
              350m • 도보 15분
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-medium px-2 py-1 bg-gray-50 text-gray-600 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? '태그 닫기 ⌃' : '추천 이유 ⌄'}
            </button>
          </div>

          {/* 4행: 가격 */}
          <div className="mt-1.5 text-[15px] font-semibold text-gray-900">
            9,000원
          </div>

        </div>
      </div>

      {/* 🟢 접힘/펼침 태그 영역 (아코디언) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
          <p className="text-[11px] text-gray-500 mb-2">
            💡 알고리즘이 이 메뉴를 추천한 이유
          </p>
          <div className="flex flex-col gap-2">
            
            {/* 1열: 운영/조건 태그 */}
            <div className="flex flex-wrap gap-1.5">
              {data.condition_tags.map((tag, idx) => (
                <span key={`cond-${idx}`} className="px-2.5 py-1 text-[11px] bg-[#F1F3F5] text-[#495057] rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            {/* 2열: 취향/속성 태그 */}
            <div className="flex flex-wrap gap-1.5">
              {data.taste_tags.map((tag, idx) => (
                <span key={`taste-${idx}`} className="px-2.5 py-1 text-[11px] font-medium bg-[#eef2ff] text-[#4f46e5] rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}