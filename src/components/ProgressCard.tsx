import React from 'react';

interface ProgressCardProps {
  percentage: number;
  label: string;
  count?: number;
  color?: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ percentage, label, count, color }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (3 / 4) * circumference;
  const progress = (percentage / 100) * arcLength;

  const cx = 80;
  const cy = 80;

  // Container width to position labels
  const containerWidth = 160; // same as svg width

  // Labels order between 0% and 100%
  const intermediateLabels = ['Done', 'Not Started', 'Pending'];

  // Calculate even spacing for intermediate labels between left gap and right gap
  // Leave some padding on left and right for 0% and 100%
  const paddingLeft = 10;  // px from left edge for 0%
  const paddingRight = 10; // px from right edge for 100%
  const availableWidth = containerWidth - paddingLeft - paddingRight;

  // Calculate intermediate labels positions evenly spaced inside availableWidth
  const intermediatePositions = intermediateLabels.map(
    (_, i) => paddingLeft + ((i + 1) * availableWidth) / (intermediateLabels.length + 1)
  );

  const getBackgroundColor = () => {
    if (percentage === 100) return '#d1fae5';
    if (label.toLowerCase().includes('not started')) return '#ffffff';
    if (label.toLowerCase().includes('pending')) return '#ede9fe';
    return '#ffffff';
  };

  const getStrokeColor = () => {
    if (percentage === 100) return '#059669';
    if (label.toLowerCase().includes('not started')) return '#6b7280';
    if (label.toLowerCase().includes('pending')) return '#8b5cf6';
    if (label.toLowerCase().includes('done')) return '#059669';
    return '#6366f1';
  };

  const strokeColor = color ?? getStrokeColor();
  const backgroundColor = getBackgroundColor();

  return (
    <div
      className="p-4 sm:p-6 rounded-xl shadow-md w-full max-w-[200px] sm:max-w-[220px] flex flex-col items-center relative"
      style={{ backgroundColor }}
    >
      <svg
        width={containerWidth}
        height="100"
        viewBox={`0 0 ${containerWidth} 100`}
        className="mb-2 sm:h-[120px]"
      >
        {/* Background 3/4 circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference - arcLength / 4}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Progress 3/4 circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth="10"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference - progress - arcLength / 4}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* Percentage inside arc */}
        <text
          x={cx}
          y={count !== undefined ? 60 : 65}
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill={strokeColor}
          dominantBaseline="middle"
          className="sm:text-[28px]"
        >
          {percentage}%
        </text>

        {/* Count display if provided */}
        {count !== undefined && (
          <text
            x={cx}
            y={80}
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#6b7280"
            dominantBaseline="middle"
            className="sm:text-[14px]"
          >
            ({count} tasks)
          </text>
        )}

        {/* Label below percentage */}
        <text
          x={cx}
          y={count !== undefined ? 95 : 90}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill={strokeColor}
          dominantBaseline="middle"
          className="sm:text-[16px]"
        >
          {label}
        </text>
      </svg>

      {/* Labels below arc */}
      <div
        className="w-full relative mt-1"
        style={{ height: '24px', padding: '0 10px' }}
      >
        {/* 0% aligned left */}
        <span
          className="text-xs text-gray-400 select-none absolute"
          style={{
            left: paddingLeft,
            top: 0,
            transform: 'translateX(0)', // left edge aligned
            whiteSpace: 'nowrap',
          }}
        >
          0%
        </span>

        {/* 100% aligned right */}
        <span
          className="text-xs text-gray-400 select-none absolute"
          style={{
            right: paddingRight,
            top: 0,
            transform: 'translateX(0)', // right edge aligned
            whiteSpace: 'nowrap',
          }}
        >
          100%
        </span>

        {/* Intermediate labels evenly spaced */}
        {intermediateLabels.map((text, idx) => (
          <span
            key={text}
            className="text-xs text-gray-400 select-none absolute"
            style={{
              left: intermediatePositions[idx],
              top: 20,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProgressCard;
