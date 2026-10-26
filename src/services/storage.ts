// ============================================================
// MtrTV - Storage Service
// Persistent storage using AsyncStorage
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PLAYLISTS: '@mtrtv_playlists',
  CHANNELS: '@mtrtv_channels',
  FAVORITES: '@mtrtv_favorites',
  HISTORY: '@mtrtv_history',
  EPG_SOURCES: '@mtrtv_epg_sources',
  EPG_DATA: '@mtrtv_epg_data',
  SETTINGS: '@mtrtv_settings',
  PLAYER_SETTINGS: '@mtrtv_player_settings',
  HIDDEN_GROUPS: '@mtrtv_hidden_groups',
  LOCKED_CHANNELS: '@mtrtv_locked_channels',
  WATCH_POSITIONS: '@mtrtv_watch_positions',
  RECORDINGS: '@mtrtv_recordings',
  CHANNEL_ORDER: '@mtrtv_channel_order',
  LAST_CHANNEL: '@mtrtv_last_channel',
  SERIES: '@mtrtv_series',
};

export const storage = {
  async save<T>(key: string, data: T): Promise<void> {
    try {
      const json = JSON.stringify(data);
      await AsyncStorage.setItem(key, json);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  },

  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const json = await AsyncStorage.getItem(key);
      return json ? JSON.parse(json) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultValue;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = Object.values(KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export { KEYS };
export default storage;
