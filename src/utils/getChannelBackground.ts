export const getChannelBackground = (channelName: string): string => {
    switch (channelName.toLowerCase()) {
      case 'luzu tv':
        return '#ffffff'; // white for transparent logos
      case 'blender':
        return '#181818'; // black background logo
      case 'vorterix':
        return '#0a0a09'; // purple-ish dark gray
      case 'olga':
        return '#ffffff'; // yellow-ish
      default:
        return '#f1f5f9'; // fallback gray
    }
  };