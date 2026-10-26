// ============================================================
// MtrTV - Global State Store (Zustand)
// Central state management for the entire app
// ============================================================

import { create } from 'zustand';
import {
  PlaylistSource,
  Channel,
  ChannelGroup,
  EpgProgram,
  EpgSource,
  AppSettings,
  PlayerSettings,
  Series,
  Recording,
  ThemeMode,
} from '../types';
import storage, { KEYS } from '../services/storage';
import { fetchAndParsePlaylist } from '../services/m3uParser';
import { fetchAndParseEpg } from '../services/epgParser';

// ==================== Default Settings ====================

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  channelListStyle: 'list',
  channelSortOrder: 'number',
  showChannelNumbers: true,
  showChannelLogos: true,
  channelListPosition: 'left',
  epgStyle: 'timeline',
  epgTimeFormat: '24h',
  epgDaysToShow: 3,
  language: 'pt-BR',
  startOnBoot: false,
  lastChannel: true,
  autoUpdatePlaylists: true,
  autoUpdateEpg: true,
  pipEnabled: true,
  catchUpEnabled: true,
  catchUpDays: 7,
  showClock: true,
  showChannelPreview: true,
  animationsEnabled: true,
  transparencyLevel: 85,
};

const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  defaultAspectRatio: 'fit',
  decoder: 'auto',
  bufferSize: 'medium',
  subtitleSize: 'medium',
  subtitleColor: '#FFFFFF',
  subtitleBackground: true,
  autoPlayNext: true,
  resumePlayback: true,
  hardwareAcceleration: true,
  defaultVolume: 100,
  seekDuration: 10,
  channelSwitchAnimation: true,
  showBufferIndicator: true,
  minBufferMs: 15000,
  maxBufferMs: 50000,
  bufferForPlaybackMs: 2500,
  bufferForPlaybackAfterRebufferMs: 5000,
};

// ==================== Store Types ====================

interface AppState {
  // Data
  playlists: PlaylistSource[];
  channels: Channel[];
  groups: ChannelGroup[];
  epgSources: EpgSource[];
  epgPrograms: EpgProgram[];
  series: Series[];
  recordings: Recording[];
  history: Channel[];
  
  // Settings
  appSettings: AppSettings;
  playerSettings: PlayerSettings;
  
  // UI State
  isLoading: boolean;
  loadingMessage: string;
  activePlaylistId: string | null;
  currentChannel: Channel | null;
  searchQuery: string;
  lastChannelId: string | null;
  
  // Actions - Playlists
  addPlaylist: (playlist: PlaylistSource) => Promise<void>;
  removePlaylist: (id: string) => Promise<void>;
  updatePlaylist: (playlist: PlaylistSource) => Promise<void>;
  refreshPlaylist: (id: string) => Promise<void>;
  refreshAllPlaylists: () => Promise<void>;
  setActivePlaylist: (id: string | null) => void;
  
  // Actions - Channels
  toggleFavorite: (channelId: string) => Promise<void>;
  toggleLock: (channelId: string) => Promise<void>;
  setCurrentChannel: (channel: Channel | null) => void;
  addToHistory: (channel: Channel) => Promise<void>;
  updateWatchPosition: (channelId: string, position: number) => Promise<void>;
  
  // Actions - Groups
  toggleGroupHidden: (groupName: string) => Promise<void>;
  reorderGroups: (groups: ChannelGroup[]) => Promise<void>;
  
  // Actions - EPG
  addEpgSource: (source: EpgSource) => Promise<void>;
  removeEpgSource: (id: string) => Promise<void>;
  refreshEpg: () => Promise<void>;
  
  // Actions - Settings
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updatePlayerSettings: (settings: Partial<PlayerSettings>) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  
  // Actions - Recordings
  addRecording: (recording: Recording) => Promise<void>;
  removeRecording: (id: string) => Promise<void>;
  
  // Actions - Search
  setSearchQuery: (query: string) => void;
  
  // Actions - Init
  initialize: () => Promise<void>;
  
  // Computed
  getFavorites: () => Channel[];
  getChannelsByGroup: (group: string) => Channel[];
  getLiveChannels: () => Channel[];
  getMovies: () => Channel[];
  getFilteredChannels: () => Channel[];
}

// ==================== Store Implementation ====================

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  playlists: [],
  channels: [],
  groups: [],
  epgSources: [],
  epgPrograms: [],
  series: [],
  recordings: [],
  history: [],
  appSettings: DEFAULT_APP_SETTINGS,
  playerSettings: DEFAULT_PLAYER_SETTINGS,
  isLoading: false,
  loadingMessage: '',
  activePlaylistId: null,
  currentChannel: null,
  searchQuery: '',
  lastChannelId: null,

  // ==================== Initialize ====================
  initialize: async () => {
    set({ isLoading: true, loadingMessage: 'Carregando dados...' });
    
    try {
      const [
        playlists,
        channels,
        epgSources,
        epgPrograms,
        appSettings,
        playerSettings,
        history,
        recordings,
        lastChannelId,
        series,
      ] = await Promise.all([
        storage.load<PlaylistSource[]>(KEYS.PLAYLISTS, []),
        storage.load<Channel[]>(KEYS.CHANNELS, []),
        storage.load<EpgSource[]>(KEYS.EPG_SOURCES, []),
        storage.load<EpgProgram[]>(KEYS.EPG_DATA, []),
        storage.load<AppSettings>(KEYS.SETTINGS, DEFAULT_APP_SETTINGS),
        storage.load<PlayerSettings>(KEYS.PLAYER_SETTINGS, DEFAULT_PLAYER_SETTINGS),
        storage.load<Channel[]>(KEYS.HISTORY, []),
        storage.load<Recording[]>(KEYS.RECORDINGS, []),
        storage.load<string | null>(KEYS.LAST_CHANNEL, null),
        storage.load<Series[]>(KEYS.SERIES, []),
      ]);

      // Build groups from channels
      const groups = buildGroups(channels);

      set({
        playlists,
        channels,
        groups,
        epgSources,
        epgPrograms,
        appSettings: { ...DEFAULT_APP_SETTINGS, ...appSettings },
        playerSettings: { ...DEFAULT_PLAYER_SETTINGS, ...playerSettings },
        history,
        recordings,
        lastChannelId,
        series,
        isLoading: false,
        loadingMessage: '',
        activePlaylistId: playlists.length > 0 ? playlists[0].id : null,
      });
    } catch (error) {
      console.error('Error initializing store:', error);
      set({ isLoading: false, loadingMessage: '' });
    }
  },

  // ==================== Playlists ====================
  addPlaylist: async (playlist) => {
    set({ isLoading: true, loadingMessage: 'Carregando playlist...' });
    
    try {
      const result = await fetchAndParsePlaylist(playlist);
      playlist.channelCount = result.channels.length;
      playlist.updatedAt = Date.now();

      const { playlists, channels } = get();
      const newPlaylists = [...playlists, playlist];
      const newChannels = [...channels, ...result.channels];
      const groups = buildGroups(newChannels);

      set({
        playlists: newPlaylists,
        channels: newChannels,
        groups,
        activePlaylistId: playlist.id,
        isLoading: false,
        loadingMessage: '',
      });

      await Promise.all([
        storage.save(KEYS.PLAYLISTS, newPlaylists),
        storage.save(KEYS.CHANNELS, newChannels),
      ]);
    } catch (error: any) {
      set({ isLoading: false, loadingMessage: '' });
      throw error;
    }
  },

  removePlaylist: async (id) => {
    const { playlists, channels } = get();
    const newPlaylists = playlists.filter(p => p.id !== id);
    const newChannels = channels.filter(c => c.playlistId !== id);
    const groups = buildGroups(newChannels);

    set({
      playlists: newPlaylists,
      channels: newChannels,
      groups,
      activePlaylistId: newPlaylists.length > 0 ? newPlaylists[0].id : null,
    });

    await Promise.all([
      storage.save(KEYS.PLAYLISTS, newPlaylists),
      storage.save(KEYS.CHANNELS, newChannels),
    ]);
  },

  updatePlaylist: async (playlist) => {
    const { playlists } = get();
    const newPlaylists = playlists.map(p => (p.id === playlist.id ? playlist : p));

    set({ playlists: newPlaylists });
    await storage.save(KEYS.PLAYLISTS, newPlaylists);
  },

  refreshPlaylist: async (id) => {
    const { playlists, channels } = get();
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;

    set({ isLoading: true, loadingMessage: 'Atualizando playlist...' });

    try {
      const result = await fetchAndParsePlaylist(playlist);
      
      // Preserve user data (favorites, locks, watch positions)
      const oldChannelsMap = new Map(
        channels.filter(c => c.playlistId === id).map(c => [c.name, c]),
      );

      const updatedChannels = result.channels.map(ch => {
        const old = oldChannelsMap.get(ch.name);
        if (old) {
          return {
            ...ch,
            isFavorite: old.isFavorite,
            isLocked: old.isLocked,
            lastWatched: old.lastWatched,
            watchPosition: old.watchPosition,
          };
        }
        return ch;
      });

      const otherChannels = channels.filter(c => c.playlistId !== id);
      const newChannels = [...otherChannels, ...updatedChannels];
      const groups = buildGroups(newChannels);

      playlist.channelCount = updatedChannels.length;
      playlist.updatedAt = Date.now();

      const newPlaylists = playlists.map(p => (p.id === id ? playlist : p));

      set({
        playlists: newPlaylists,
        channels: newChannels,
        groups,
        isLoading: false,
        loadingMessage: '',
      });

      await Promise.all([
        storage.save(KEYS.PLAYLISTS, newPlaylists),
        storage.save(KEYS.CHANNELS, newChannels),
      ]);
    } catch (error: any) {
      set({ isLoading: false, loadingMessage: '' });
      console.error('Error refreshing playlist:', error);
    }
  },

  refreshAllPlaylists: async () => {
    const { playlists, refreshPlaylist } = get();
    for (const playlist of playlists) {
      await refreshPlaylist(playlist.id);
    }
  },

  setActivePlaylist: (id) => {
    set({ activePlaylistId: id });
  },

  // ==================== Channels ====================
  toggleFavorite: async (channelId) => {
    const { channels } = get();
    const newChannels = channels.map(c =>
      c.id === channelId ? { ...c, isFavorite: !c.isFavorite } : c,
    );

    set({ channels: newChannels });
    await storage.save(KEYS.CHANNELS, newChannels);
  },

  toggleLock: async (channelId) => {
    const { channels } = get();
    const newChannels = channels.map(c =>
      c.id === channelId ? { ...c, isLocked: !c.isLocked } : c,
    );

    set({ channels: newChannels });
    await storage.save(KEYS.CHANNELS, newChannels);
  },

  setCurrentChannel: (channel) => {
    set({ currentChannel: channel });
    if (channel) {
      storage.save(KEYS.LAST_CHANNEL, channel.id);
    }
  },

  addToHistory: async (channel) => {
    const { history } = get();
    const filtered = history.filter(c => c.id !== channel.id);
    const updatedChannel = { ...channel, lastWatched: Date.now() };
    const newHistory = [updatedChannel, ...filtered].slice(0, 100);

    set({ history: newHistory });
    await storage.save(KEYS.HISTORY, newHistory);
  },

  updateWatchPosition: async (channelId, position) => {
    const { channels } = get();
    const newChannels = channels.map(c =>
      c.id === channelId ? { ...c, watchPosition: position } : c,
    );

    set({ channels: newChannels });
    await storage.save(KEYS.CHANNELS, newChannels);
  },

  // ==================== Groups ====================
  toggleGroupHidden: async (groupName) => {
    const { groups } = get();
    const newGroups = groups.map(g =>
      g.name === groupName ? { ...g, isHidden: !g.isHidden } : g,
    );

    set({ groups: newGroups });
    await storage.save(KEYS.HIDDEN_GROUPS, newGroups.filter(g => g.isHidden).map(g => g.name));
  },

  reorderGroups: async (groups) => {
    set({ groups });
    await storage.save(KEYS.CHANNEL_ORDER, groups.map(g => g.name));
  },

  // ==================== EPG ====================
  addEpgSource: async (source) => {
    const { epgSources } = get();
    const newSources = [...epgSources, source];

    set({ epgSources: newSources });
    await storage.save(KEYS.EPG_SOURCES, newSources);
  },

  removeEpgSource: async (id) => {
    const { epgSources } = get();
    const newSources = epgSources.filter(s => s.id !== id);

    set({ epgSources: newSources });
    await storage.save(KEYS.EPG_SOURCES, newSources);
  },

  refreshEpg: async () => {
    const { epgSources } = get();
    if (epgSources.length === 0) return;

    set({ isLoading: true, loadingMessage: 'Atualizando guia de programação...' });

    try {
      const allPrograms: EpgProgram[] = [];

      for (const source of epgSources) {
        try {
          const programs = await fetchAndParseEpg(source);
          allPrograms.push(...programs);
        } catch (error) {
          console.error(`Error fetching EPG from ${source.name}:`, error);
        }
      }

      set({
        epgPrograms: allPrograms,
        isLoading: false,
        loadingMessage: '',
      });

      await storage.save(KEYS.EPG_DATA, allPrograms);
    } catch (error) {
      set({ isLoading: false, loadingMessage: '' });
    }
  },

  // ==================== Settings ====================
  updateAppSettings: async (settings) => {
    const { appSettings } = get();
    const newSettings = { ...appSettings, ...settings };

    set({ appSettings: newSettings });
    await storage.save(KEYS.SETTINGS, newSettings);
  },

  updatePlayerSettings: async (settings) => {
    const { playerSettings } = get();
    const newSettings = { ...playerSettings, ...settings };

    set({ playerSettings: newSettings });
    await storage.save(KEYS.PLAYER_SETTINGS, newSettings);
  },

  setTheme: async (theme) => {
    const { appSettings } = get();
    const newSettings = { ...appSettings, theme };

    set({ appSettings: newSettings });
    await storage.save(KEYS.SETTINGS, newSettings);
  },

  // ==================== Recordings ====================
  addRecording: async (recording) => {
    const { recordings } = get();
    const newRecordings = [...recordings, recording];

    set({ recordings: newRecordings });
    await storage.save(KEYS.RECORDINGS, newRecordings);
  },

  removeRecording: async (id) => {
    const { recordings } = get();
    const newRecordings = recordings.filter(r => r.id !== id);

    set({ recordings: newRecordings });
    await storage.save(KEYS.RECORDINGS, newRecordings);
  },

  // ==================== Search ====================
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // ==================== Computed ====================
  getFavorites: () => {
    const { channels } = get();
    return channels.filter(c => c.isFavorite);
  },

  getChannelsByGroup: (group) => {
    const { channels, activePlaylistId } = get();
    return channels.filter(
      c =>
        c.group === group &&
        (!activePlaylistId || c.playlistId === activePlaylistId),
    );
  },

  getLiveChannels: () => {
    const { channels, activePlaylistId } = get();
    return channels.filter(
      c =>
        c.streamType === 'live' &&
        (!activePlaylistId || c.playlistId === activePlaylistId),
    );
  },

  getMovies: () => {
    const { channels, activePlaylistId } = get();
    return channels.filter(
      c =>
        c.streamType === 'movie' &&
        (!activePlaylistId || c.playlistId === activePlaylistId),
    );
  },

  getFilteredChannels: () => {
    const { channels, searchQuery, activePlaylistId, groups } = get();
    const hiddenGroups = groups.filter(g => g.isHidden).map(g => g.name);

    let filtered = channels.filter(c => {
      if (activePlaylistId && c.playlistId !== activePlaylistId) return false;
      if (hiddenGroups.includes(c.group)) return false;
      return true;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.group.toLowerCase().includes(query),
      );
    }

    return filtered;
  },
}));

// ==================== Helper Functions ====================

const buildGroups = (channels: Channel[]): ChannelGroup[] => {
  const groupMap = new Map<string, Channel[]>();

  channels.forEach(channel => {
    const existing = groupMap.get(channel.group) || [];
    existing.push(channel);
    groupMap.set(channel.group, existing);
  });

  const groups: ChannelGroup[] = [];
  let order = 0;

  groupMap.forEach((groupChannels, name) => {
    groups.push({
      name,
      channels: groupChannels,
      isHidden: false,
      order: order++,
    });
  });

  return groups.sort((a, b) => a.name.localeCompare(b.name));
};

export default useAppStore;
