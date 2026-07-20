export default function Toast({ text }: { text: string }) {
  return (
    <div style={{
      position: "absolute", bottom: 96, left: "50%", transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.8)", color: "#fff",
      fontSize: 14, fontWeight: 600,
      padding: "10px 20px", borderRadius: 999,
      whiteSpace: "nowrap", zIndex: 200,
    }}>
      {text}
    </div>
  );
}
