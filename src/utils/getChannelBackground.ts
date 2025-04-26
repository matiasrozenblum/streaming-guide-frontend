export const getChannelBackground = (channelName: string): string => {
    switch (channelName.toLowerCase()) {
      case 'luzu tv':
        return '#ffffff'; // white for transparent logos
      case 'blender':
        return '#181818'; // black background logo
      case 'vorterix':
        return '#0a0a09'; // purple-ish dark gray
      case 'olga':
        return '#ffffff'; // white for transparent logos
      case 'gelatina':
        return '#000000'; // black
      case 'urbana play':
        return '#000000'; // black
      case 'bondi live':
        return '#4a22d2'; // purple
      case 'la casa streaming':
        return 'linear-gradient(to bottom, #030917, #263A45)';
      case 'un poco de ruido':
        return '#343732'; // gray
      case 'carajo':
        return '#ffffff'; // white
      case 'republica z':
        return '#000000'; // black
      case 'futurock':
        return '#76e8ab'; // water green
      case 'neura':
        return '#091491'; // blue
      default:
        return '#f1f5f9'; // fallback gray
    }
  };