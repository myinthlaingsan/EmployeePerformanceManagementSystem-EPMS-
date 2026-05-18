import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue:   { bg: "#EEF3FD", text: "#1A56DB" },
  green:  { bg: "#EAF3DE", text: "#27500A" },
  orange: { bg: "#FAEEDA", text: "#633806" },
  red:    { bg: "#FCEBEB", text: "#791F1F" },
  indigo: { bg: "#EEF3FD", text: "#1A56DB" },
  purple: { bg: "#F1EFE8", text: "#444441" },
};

const DashboardStatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "blue",
}) => {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.blue;

  const trendStyle: React.CSSProperties | null = trend
    ? trend.isUp
      ? { background: "#EAF3DE", color: "#27500A" }
      : { background: "#FCEBEB", color: "#791F1F" }
    : null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E4E6EC",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      {/* Top row: icon square + trend badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: colors.bg,
            color: colors.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {trend && trendStyle && (
          <span
            style={{
              ...trendStyle,
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 6px",
              borderRadius: 5,
            }}
          >
            {trend.isUp ? "↑" : "↓"} {trend.value}%
          </span>
        )}
      </div>

      {/* Stat value */}
      <p
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: "#111827",
          lineHeight: 1,
          marginTop: 8,
        }}
      >
        {value}
      </p>

      {/* Stat label */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 400,
          color: "#9EA3B0",
          marginTop: 3,
        }}
      >
        {title}
      </p>
    </div>
  );
};

export default DashboardStatCard;
