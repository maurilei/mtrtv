// ============================================================
// MtrTV - M3U / M3U8 Playlist Parser
// Handles standard M3U, extended M3U, and Xtream Codes API
// ============================================================

import axios from 'axios';
import { Channel, PlaylistSource, Series, Season, Episode } from '../types';

interface ParsedPlaylist {
  channels: Channel[];
  groups: string[];
}

/**
 * Parse M3U/M3U8 content into structured channel data
 */
export const parseM3UContent = (
  content: string,
  playlistId: string,
): ParsedPlaylist => {
  const lines = content.split('\n').map(line => line.trim());
  const channels: Channel[] = [];
  const groupsSet = new Set<string>();
  let channelNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      const nextLine = lines[i + 1];
      if (!nextLine || nextLine.startsWith('#')) continue;

      const channel = parseExtinfLine(line, nextLine, playlistId, channelNumber);
      channels.push(channel);
      groupsSet.add(channel.group);
      channelNumber++;
      i++; // Skip URL line
    }
  }

  return {
    channels,
    groups: Array.from(groupsSet).sort(),
  };
};

/**
 * Parse a single #EXTINF line into a Channel object
 */
const parseExtinfLine = (
  extinfLine: string,
  url: string,
  playlistId: string,
  number: number,
): Channel => {
  // Extract attributes from EXTINF line
  const tvgName = extractAttribute(extinfLine, 'tvg-name');
  const tvgLogo = extractAttribute(extinfLine, 'tvg-logo');
  const tvgId = extractAttribute(extinfLine, 'tvg-id');
  const tvgGroup = extractAttribute(extinfLine, 'group-title');
  const tvgChNo = extractAttribute(extinfLine, 'tvg-chno');
  const catchupSource = extractAttribute(extinfLine, 'catchup-source');

  // Extract display name (after the last comma)
  const commaIndex = extinfLine.lastIndexOf(',');
  const displayName = commaIndex >= 0
    ? extinfLine.substring(commaIndex + 1).trim()
    : tvgName || 'Unknown Channel';

  // Determine stream type from URL or group
  const streamType = detectStreamType(url, tvgGroup || '');

  const channelId = `${playlistId}_${number}_${displayName.replace(/\s+/g, '_')}`;

  return {
    id: channelId,
    name: displayName || tvgName || 'Unknown',
    url: url.trim(),
    logo: tvgLogo || undefined,
    group: tvgGroup || 'Sem Grupo',
    epgId: tvgId || undefined,
    number: tvgChNo ? parseInt(tvgChNo, 10) : number,
    streamType,
    isFavorite: false,
    isLocked: false,
    playlistId,
  };
};

/**
 * Extract an attribute value from an EXTINF line
 */
const extractAttribute = (line: string, attribute: string): string | undefined => {
  const regex = new RegExp(`${attribute}="([^"]*)"`, 'i');
  const match = line.match(regex);
  return match ? match[1] : undefined;
};

/**
 * Detect stream type from URL and group name
 */
const detectStreamType = (url: string, group: string): 'live' | 'movie' | 'series' => {
  const lowerUrl = url.toLowerCase();
  const lowerGroup = group.toLowerCase();

  if (
    lowerUrl.includes('/movie/') ||
    lowerGroup.includes('movie') ||
    lowerGroup.includes('filme') ||
    lowerGroup.includes('vod') ||
    lowerUrl.endsWith('.mp4') ||
    lowerUrl.endsWith('.mkv') ||
    lowerUrl.endsWith('.avi')
  ) {
    return 'movie';
  }

  if (
    lowerUrl.includes('/series/') ||
    lowerGroup.includes('series') ||
    lowerGroup.includes('série')
  ) {
    return 'series';
  }

  return 'live';
};

/**
 * Fetch and parse M3U playlist from URL
 */
export const fetchAndParsePlaylist = async (
  playlist: PlaylistSource,
): Promise<ParsedPlaylist> => {
  try {
    if (playlist.type === 'xtream') {
      return await fetchXtreamPlaylist(playlist);
    }

    const response = await axios.get(playlist.url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'MtrTV/1.0',
      },
      responseType: 'text',
    });

    return parseM3UContent(response.data, playlist.id);
  } catch (error: any) {
    console.error('Error fetching playlist:', error.message);
    throw new Error(`Erro ao carregar playlist: ${error.message}`);
  }
};

/**
 * Fetch channels from Xtream Codes API
 */
const fetchXtreamPlaylist = async (
  playlist: PlaylistSource,
): Promise<ParsedPlaylist> => {
  const { xtreamHost, xtreamUsername, xtreamPassword } = playlist;
  if (!xtreamHost || !xtreamUsername || !xtreamPassword) {
    throw new Error('Credenciais Xtream incompletas');
  }

  const baseUrl = xtreamHost.replace(/\/+$/, '');
  const channels: Channel[] = [];
  const groupsSet = new Set<string>();

  try {
    // Fetch live streams
    const liveResponse = await axios.get(
      `${baseUrl}/player_api.php?username=${xtreamUsername}&password=${xtreamPassword}&action=get_live_streams`,
      { timeout: 30000 },
    );

    // Fetch categories
    const categoriesResponse = await axios.get(
      `${baseUrl}/player_api.php?username=${xtreamUsername}&password=${xtreamPassword}&action=get_live_categories`,
      { timeout: 30000 },
    );

    const categoriesMap: Record<string, string> = {};
    if (Array.isArray(categoriesResponse.data)) {
      categoriesResponse.data.forEach((cat: any) => {
        categoriesMap[cat.category_id] = cat.category_name;
      });
    }

    if (Array.isArray(liveResponse.data)) {
      liveResponse.data.forEach((stream: any, index: number) => {
        const group = categoriesMap[stream.category_id] || 'Sem Grupo';
        groupsSet.add(group);

        channels.push({
          id: `${playlist.id}_live_${stream.stream_id || index}`,
          name: stream.name || 'Unknown',
          url: `${baseUrl}/live/${xtreamUsername}/${xtreamPassword}/${stream.stream_id}.ts`,
          logo: stream.stream_icon || undefined,
          group,
          epgId: stream.epg_channel_id || undefined,
          number: stream.num || index + 1,
          streamType: 'live',
          isFavorite: false,
          isLocked: false,
          playlistId: playlist.id,
        });
      });
    }

    // Fetch VOD
    try {
      const vodResponse = await axios.get(
        `${baseUrl}/player_api.php?username=${xtreamUsername}&password=${xtreamPassword}&action=get_vod_streams`,
        { timeout: 30000 },
      );

      const vodCategoriesResponse = await axios.get(
        `${baseUrl}/player_api.php?username=${xtreamUsername}&password=${xtreamPassword}&action=get_vod_categories`,
        { timeout: 30000 },
      );

      const vodCategoriesMap: Record<string, string> = {};
      if (Array.isArray(vodCategoriesResponse.data)) {
        vodCategoriesResponse.data.forEach((cat: any) => {
          vodCategoriesMap[cat.category_id] = cat.category_name;
        });
      }

      if (Array.isArray(vodResponse.data)) {
        vodResponse.data.forEach((stream: any, index: number) => {
          const group = vodCategoriesMap[stream.category_id] || 'Filmes';
          groupsSet.add(group);

          const ext = stream.container_extension || 'mp4';
          channels.push({
            id: `${playlist.id}_vod_${stream.stream_id || index}`,
            name: stream.name || 'Unknown',
            url: `${baseUrl}/movie/${xtreamUsername}/${xtreamPassword}/${stream.stream_id}.${ext}`,
            logo: stream.stream_icon || undefined,
            group,
            number: stream.num || channels.length + 1,
            streamType: 'movie',
            isFavorite: false,
            isLocked: false,
            playlistId: playlist.id,
          });
        });
      }
    } catch {
      // VOD may not be available
    }
  } catch (error: any) {
    throw new Error(`Erro Xtream API: ${error.message}`);
  }

  return {
    channels,
    groups: Array.from(groupsSet).sort(),
  };
};

/**
 * Fetch series from Xtream API
 */
export const fetchXtreamSeries = async (
  playlist: PlaylistSource,
): Promise<Series[]> => {
  const { xtreamHost, xtreamUsername, xtreamPassword } = playlist;
  if (!xtreamHost || !xtreamUsername || !xtreamPassword) return [];

  const baseUrl = xtreamHost.replace(/\/+$/, '');
  const series: Series[] = [];

  try {
    const response = await axios.get(
      `${baseUrl}/player_api.php?username=${xtreamUsername}&password=${xtreamPassword}&action=get_series`,
      { timeout: 30000 },
    );

    if (Array.isArray(response.data)) {
      for (const s of response.data.slice(0, 200)) {
        try {
          const infoResponse = await axios.get(
            `${baseUrl}/player_api.php?username=${xtreamUsername}&password=${xtreamPassword}&action=get_series_info&series_id=${s.series_id}`,
            { timeout: 15000 },
          );

          const info = infoResponse.data;
          const seasons: Season[] = [];

          if (info.episodes) {
            Object.keys(info.episodes).forEach(seasonNum => {
              const episodes: Episode[] = info.episodes[seasonNum].map((ep: any) => ({
                id: `${playlist.id}_ep_${ep.id}`,
                episodeNumber: ep.episode_num || 0,
                title: ep.title || `Episode ${ep.episode_num}`,
                url: `${baseUrl}/series/${xtreamUsername}/${xtreamPassword}/${ep.id}.${ep.container_extension || 'mp4'}`,
                plot: ep.info?.plot || undefined,
                duration: ep.info?.duration ? parseDuration(ep.info.duration) : undefined,
                logo: ep.info?.movie_image || undefined,
                watchPosition: 0,
                isWatched: false,
              }));

              seasons.push({
                seasonNumber: parseInt(seasonNum, 10),
                episodes,
              });
            });
          }

          series.push({
            id: `${playlist.id}_series_${s.series_id}`,
            name: s.name || 'Unknown Series',
            cover: s.cover || undefined,
            plot: info.info?.plot || undefined,
            cast: info.info?.cast || undefined,
            director: info.info?.director || undefined,
            genre: info.info?.genre || s.genre || undefined,
            releaseDate: info.info?.releaseDate || undefined,
            rating: info.info?.rating || undefined,
            seasons,
            playlistId: playlist.id,
          });
        } catch {
          // Skip individual series on error
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching series:', error.message);
  }

  return series;
};

const parseDuration = (duration: string): number => {
  const parts = duration.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return parseInt(duration) || 0;
};
