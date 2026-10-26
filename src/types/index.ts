// ============================================================
// MtrTV - IPTV Player Types
// Complete type definitions for the entire application
// ============================================================

// ==================== Playlist Types ====================

export interface PlaylistSource {
  id: string;
  name: string;
  url: string;
  type: 'm3u' | 'm3u8' | 'xtream';
  // Xtream Codes API fields
  xtreamHost?: string;
  xtreamUsername?: string;
  xtreamPassword?: string;
  // Metadata
  addedAt: number;
  updatedAt: number;
  autoUpdate: boolean;
  updateIntervalHours: number;
  channelCount?: number;
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group: string;
  epgId?: string;
  number?: number;
  // Stream info
  streamType: 'live' | 'movie' | 'series';
  // User data
  isFavorite: boolean;
  isLocked: boolean;
  lastWatched?: number;
  watchPosition?: number; // For VOD resume
  // Source playlist reference
  playlistId: string;
}

export interface ChannelGroup {
  name: string;
  channels: Channel[];
  logo?: string;
  isHidden: boolean;
  order: number;
}

// ==================== EPG Types ====================

export interface EpgProgram {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  category?: string;
  icon?: string;
  isNew?: boolean;
  rating?: string;
  season?: number;
  episode?: number;
}

export interface EpgSource {
  id: string;
  name: string;
  url: string;
  autoUpdate: boolean;
  updateIntervalHours: number;
  lastUpdated?: number;
}

// ==================== Series Types ====================

export interface Series {
  id: string;
  name: string;
  cover?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  rating?: string;
  seasons: Season[];
  playlistId: string;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  url: string;
  plot?: string;
  duration?: number;
  logo?: string;
  watchPosition?: number;
  isWatched: boolean;
}

// ==================== Player Types ====================

export type VideoAspectRatio = 'fit' | 'fill' | 'stretch' | '16:9' | '4:3' | 'original';
export type DecoderType = 'hardware' | 'software' | 'auto';
export type SubtitleSize = 'small' | 'medium' | 'large' | 'xlarge';
export type BufferSize = 'low' | 'medium' | 'high' | 'max';

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  aspectRatio: VideoAspectRatio;
  isFullscreen: boolean;
  showControls: boolean;
  showInfo: boolean;
  showEpg: boolean;
  subtitleTrack: number;
  audioTrack: number;
  playbackSpeed: number;
}

export interface PlayerSettings {
  defaultAspectRatio: VideoAspectRatio;
  decoder: DecoderType;
  bufferSize: BufferSize;
  subtitleSize: SubtitleSize;
  subtitleColor: string;
  subtitleBackground: boolean;
  autoPlayNext: boolean;
  resumePlayback: boolean;
  hardwareAcceleration: boolean;
  defaultVolume: number;
  seekDuration: number; // seconds
  channelSwitchAnimation: boolean;
  showBufferIndicator: boolean;
  // Buffer settings (ms)
  minBufferMs: number;
  maxBufferMs: number;
  bufferForPlaybackMs: number;
  bufferForPlaybackAfterRebufferMs: number;
}

// ==================== App Settings Types ====================

export type ThemeMode = 'dark' | 'amoled' | 'blue' | 'purple';
export type ListStyle = 'list' | 'grid' | 'compact';
export type SortOrder = 'name' | 'number' | 'recent' | 'custom';
export type EpgStyle = 'timeline' | 'list' | 'compact';
export type ChannelListPosition = 'left' | 'right' | 'bottom';

export interface AppSettings {
  // Theme
  theme: ThemeMode;
  // Channel list
  channelListStyle: ListStyle;
  channelSortOrder: SortOrder;
  showChannelNumbers: boolean;
  showChannelLogos: boolean;
  channelListPosition: ChannelListPosition;
  // EPG
  epgStyle: EpgStyle;
  epgTimeFormat: '12h' | '24h';
  epgDaysToShow: number;
  // General
  language: string;
  startOnBoot: boolean;
  lastChannel: boolean;
  parentalPin?: string;
  autoUpdatePlaylists: boolean;
  autoUpdateEpg: boolean;
  // Picture in Picture
  pipEnabled: boolean;
  // Catch-up
  catchUpEnabled: boolean;
  catchUpDays: number;
  // UI
  showClock: boolean;
  showChannelPreview: boolean;
  animationsEnabled: boolean;
  transparencyLevel: number; // 0-100
}

// ==================== Recording Types ====================

export interface Recording {
  id: string;
  channelId: string;
  channelName: string;
  programTitle: string;
  startTime: number;
  endTime: number;
  filePath?: string;
  status: 'scheduled' | 'recording' | 'completed' | 'failed';
}

// ==================== Navigation Types ====================

export type RootStackParamList = {
  Home: undefined;
  Player: { channel: Channel; channels?: Channel[] };
  Settings: undefined;
  PlaylistManager: undefined;
  AddPlaylist: { playlist?: PlaylistSource };
  EPGScreen: undefined;
  Favorites: undefined;
  History: undefined;
  Search: undefined;
  ChannelGroups: { playlistId?: string };
  SeriesDetail: { series: Series };
  VOD: undefined;
  CatchUp: { channel: Channel };
  ParentalControl: undefined;
  PlayerSettings: undefined;
  About: undefined;
};

// ==================== Remote Control Types ====================

export interface RemoteKeyEvent {
  keyCode: number;
  action: 'up' | 'down';
}

export const REMOTE_KEYS = {
  UP: 19,
  DOWN: 20,
  LEFT: 21,
  RIGHT: 22,
  CENTER: 23,
  ENTER: 66,
  BACK: 4,
  MENU: 82,
  PLAY_PAUSE: 85,
  STOP: 86,
  NEXT: 87,
  PREVIOUS: 88,
  FAST_FORWARD: 90,
  REWIND: 89,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  MUTE: 164,
  CHANNEL_UP: 166,
  CHANNEL_DOWN: 167,
  INFO: 165,
  GUIDE: 172,
  RED: 183,
  GREEN: 184,
  YELLOW: 185,
  BLUE: 186,
  ZERO: 7,
  ONE: 8,
  TWO: 9,
  THREE: 10,
  FOUR: 11,
  FIVE: 12,
  SIX: 13,
  SEVEN: 14,
  EIGHT: 15,
  NINE: 16,
} as const;
