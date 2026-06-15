import { extractVideoId } from './extractVideoId';
import { extractTwitchChannel, extractKickChannel } from './extractStreamChannel';

export type ParsedStreamService = 'youtube' | 'twitch' | 'kick';

export interface ParsedStreamUrl {
  service: ParsedStreamService;
  embedPath: string;
}

export function parseStreamUrl(url: string): ParsedStreamUrl | null {
  if (!url) return null;

  const twitchChannel = extractTwitchChannel(url);
  if (twitchChannel) return { service: 'twitch', embedPath: twitchChannel };

  const kickChannel = extractKickChannel(url);
  if (kickChannel) return { service: 'kick', embedPath: kickChannel };

  try {
    const urlObj = new URL(url);
    const listId = urlObj.searchParams.get('list');
    if (listId) return { service: 'youtube', embedPath: `videoseries?list=${listId}` };
  } catch {
    // invalid URL
  }

  const videoId = extractVideoId(url);
  if (videoId) return { service: 'youtube', embedPath: videoId };

  return null;
}
