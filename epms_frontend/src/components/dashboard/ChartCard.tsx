import React from "react";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E4E6EC",
        borderRadius: 12,
        padding: "16px 18px",
        height: "100%",
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 16 }}>
        {title}
      </p>
      <div style={{ height: 300, width: "100%" }}>{children}</div>
    </div>
  );
};

export default ChartCard;
