import Svg, { Rect } from "react-native-svg";

/**
 * Simplified Tempo logo as a tab bar icon — 5 vertical bars
 * matching the app icon's sound-wave pattern.
 */
export function TempoLogoIcon({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  // Bar heights as proportions of the viewBox (24x24), matching the app icon silhouette
  const bars = [
    { x: 2, height: 10 },
    { x: 6.5, height: 16 },
    { x: 11, height: 20 },
    { x: 15.5, height: 16 },
    { x: 20, height: 10 },
  ];
  const barWidth = 2;
  const radius = 1;

  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {bars.map((bar) => (
        <Rect
          fill={color}
          height={bar.height}
          key={bar.x}
          rx={radius}
          width={barWidth}
          x={bar.x}
          y={12 - bar.height / 2}
        />
      ))}
    </Svg>
  );
}
