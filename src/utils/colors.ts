const channelColors = [
  '#2196F3', // Blue
  '#00C853', // Green
  '#FF1744', // Red
  '#D500F9', // Purple
  '#FF9100', // Orange
  '#00B8D4', // Cyan
  '#E91E63', // Pink
  '#FA8072', // Peach Orange
];

export const getColorForChannel = (index: number): string => {
  return channelColors[index % channelColors.length];
};