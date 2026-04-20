import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CDO 지정 '뭐먹지' 전용 브랜드 컬러
        brand: {
          primary: "#FF6B00", // 메인 오렌지
          bg: "#F1F3F5",      // 태그 배경색
          text: "#495057",    // 태그 텍스트색
          black: "#1A1A1A",   // 강조 텍스트
          gray: "#8E8E93",    // 부가 정보
        },
      },
      borderRadius: {
        'card': '20px',
        'chip': '100px',
      },
      boxShadow: {
        'momeokji': '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;