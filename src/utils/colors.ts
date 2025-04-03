const channelColors = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#F44336', // Red
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4', // Cyan
  '#E91E63', // Pink
  '#FF9A68', // Peach Orange
];

export const getColorForChannel = (index: number): string => {
  return channelColors[index % channelColors.length];
};