import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B00',    // CTA, 매칭점수 등 액션 컬러
          // CDO님 텍스트 명세 기준(#D1E9F6). 피그마 시안 기준 연회색으로 원하시면 '#F9FAFB'로 변경하시면 됩니다.
          bg: '#D1E9F6',         
          card: '#FFFFFF',       // 카드 뷰 배경
        },
        text: {
          main: '#495057',       // H1, 본문 등 메인 텍스트
          sub: '#ACB5BD',        // 거리, 시간 등 부가 정보
          tag: '#495057',        // 태그 텍스트
        },
        ui: {
          tagBg: '#F1F3F5',      // 태그 배경
        }
      },
      borderRadius: {
        'card': '16px',          // 공통 카드 곡률
      },
      letterSpacing: {
        'tight-brand': '-0.02em', // 로고 및 강조 타이틀용 자간
      }
    },
  },
  plugins: [],
};

export default config;