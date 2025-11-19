// Utility functions to extract channel names/usernames from streaming service URLs

export const extractTwitchChannel = (url: string): string | null => {
  if (!url) return null;
  
  // Twitch URLs can be:
  // https://www.twitch.tv/channelname
  // https://twitch.tv/channelname
  // https://www.twitch.tv/videos/... (video URL, not channel)
  
  const match = url.match(/(?:twitch\.tv\/)([^/?]+)/);
  if (match && match[1] && match[1] !== 'videos' && match[1] !== 'directory') {
    return match[1];
  }
  
  return null;
};

export const extractKickChannel = (url: string): string | null => {
  if (!url) return null;
  
  // Kick URLs can be:
  // https://kick.com/channelname
  // https://www.kick.com/channelname
  
  const match = url.match(/(?:kick\.com\/)([^/?]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
};

export const extractYouTubeChannel = (url: string): string | null => {
  if (!url) return null;
  
  // For YouTube, we use the existing extractVideoId function
  // But for channel URLs like https://www.youtube.com/@channelname/live
  // we want to extract the channel name
  if (url.includes('@')) {
    const match = url.match(/@([^/?]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

