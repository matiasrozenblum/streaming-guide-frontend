// Light theme colors (darker/more saturated for better contrast on light backgrounds)
const lightThemeChannelColors = [
  '#1565C0', // Blue - darker
  '#2E7D32', // Green - darker
  '#C62828', // Red - darker
  '#7B1FA2', // Purple - darker
  '#EF6C00', // Orange - darker
  '#00838F', // Cyan - darker
  '#AD1457', // Pink - darker
  '#D84315', // Salmon/Red-Orange - darker
];

// Dark theme colors (brighter/more vibrant for better contrast on dark backgrounds)
const darkThemeChannelColors = [
  '#42A5F5', // Blue - brighter
  '#66BB6A', // Green - brighter
  '#EF5350', // Red - brighter
  '#AB47BC', // Purple - brighter
  '#FFA726', // Orange - brighter
  '#26C6DA', // Cyan - brighter
  '#EC407A', // Pink - brighter
  '#FF7043', // Salmon/Red-Orange - brighter
];

export const getColorForChannel = (index: number, mode: 'light' | 'dark'): string => {
  const colors = mode === 'light' ? lightThemeChannelColors : darkThemeChannelColors;
  return colors[index % colors.length];
};