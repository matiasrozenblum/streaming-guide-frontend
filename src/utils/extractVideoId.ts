// src/utils/extractVideoId.ts

export const extractVideoId = (url: string): string | null => {
    if (!url) return null;
  
    // If it's a channel live URL (e.g., https://www.youtube.com/@luzutv/live)
    if (url.includes('@')) {
      return url;
    }
  
    // For embedded URLs (e.g., https://www.youtube.com/embed/7Yssk7558EI?autoplay=1)
    if (url.includes('/embed/')) {
      const match = url.match(/\/embed\/([^?]+)/);
      return match ? match[1] : null;
    }
  
    // For regular YouTube video URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  