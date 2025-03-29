const channelColors = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#F44336', // Red
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4', // Cyan
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

export const getColorForChannel = (index: number): string => {
  return channelColors[index % channelColors.length];
};