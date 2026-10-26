// ============================================================
// MtrTV - Home Screen
// Main screen with sidebar navigation and channel list
// ============================================================

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  BackHandler,
  Animated,
} from 'react-native';
import { Focusable } from '../components/Focusable';
import ChannelListItem from '../components/ChannelListItem';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import { Channel, ChannelGroup } from '../types';
import { getCurrentAndNextPrograms } from '../services/epgParser';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

type TabType = 'channels' | 'favorites' | 'history' | 'movies' | 'series' | 'settings';

const SIDEBAR_WIDTH = 80;
const CHANNEL_LIST_WIDTH = 320;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const {
    channels,
    groups,
    appSettings,
    playlists,
    epgPrograms,
    history,
    currentChannel,
    setCurrentChannel,
    addToHistory,
    getFavorites,
    getLiveChannels,
    getMovies,
    getFilteredChannels,
    setSearchQuery,
  } = useAppStore();

  const theme = getTheme(appSettings.theme);
  const [activeTab, setActiveTab] = useState<TabType>('channels');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showGroupsList, setShowGroupsList] = useState(true);

  // ==================== Navigation Tabs ====================

  const tabs: { id: TabType; icon: string; label: string }[] = [
    { id: 'channels', icon: '📺', label: 'Canais' },
    { id: 'favorites', icon: '⭐', label: 'Favoritos' },
    { id: 'history', icon: '🕐', label: 'Histórico' },
    { id: 'movies', icon: '🎬', label: 'Filmes' },
    { id: 'series', icon: '📀', label: 'Séries' },
    { id: 'settings', icon: '⚙️', label: 'Config.' },
  ];

  // ==================== Channel Data ====================

  const displayChannels = useMemo(() => {
    switch (activeTab) {
      case 'channels':
        if (selectedGroup) {
          return getFilteredChannels().filter(c => c.group === selectedGroup && c.streamType === 'live');
        }
        return getFilteredChannels().filter(c => c.streamType === 'live');
      case 'favorites':
        return getFavorites();
      case 'history':
        return history;
      case 'movies':
        return getMovies();
      default:
        return [];
    }
  }, [activeTab, selectedGroup, channels, history, getFilteredChannels, getFavorites, getMovies]);

  const visibleGroups = useMemo(() => {
    return groups.filter(g => !g.isHidden && g.channels.some(c => c.streamType === 'live'));
  }, [groups]);

  // ==================== Handlers ====================

  const handleChannelPress = useCallback(
    (channel: Channel) => {
      setCurrentChannel(channel);
      const channelsList = displayChannels;
      navigation.navigate('Player', { channel, channels: channelsList });
    },
    [displayChannels, navigation, setCurrentChannel],
  );

  const handleChannelLongPress = useCallback(
    (channel: Channel) => {
      // Show context menu for long press
      // Toggle favorite as quick action
      useAppStore.getState().toggleFavorite(channel.id);
    },
    [],
  );

  const handleTabPress = useCallback(
    (tab: TabType) => {
      if (tab === 'settings') {
        navigation.navigate('Settings');
        return;
      }
      setActiveTab(tab);
      setSelectedGroup(null);
    },
    [navigation],
  );

  // ==================== Back Handler ====================

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedGroup) {
        setSelectedGroup(null);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [selectedGroup]);

  // ==================== Render ====================

  const renderChannelItem = useCallback(
    ({ item, index }: { item: Channel; index: number }) => (
      <ChannelListItem
        channel={item}
        isActive={currentChannel?.id === item.id}
        onPress={handleChannelPress}
        onLongPress={handleChannelLongPress}
        hasTVPreferredFocus={index === 0 && !selectedGroup}
      />
    ),
    [currentChannel, handleChannelPress, handleChannelLongPress, selectedGroup],
  );

  const renderGroupItem = useCallback(
    ({ item, index }: { item: ChannelGroup; index: number }) => (
      <Focusable
        onPress={() => setSelectedGroup(item.name)}
        style={[
          styles.groupItem,
          {
            backgroundColor:
              selectedGroup === item.name
                ? theme.colors.primary + '25'
                : theme.colors.surface,
            borderLeftWidth: selectedGroup === item.name ? 3 : 0,
            borderLeftColor: theme.colors.primary,
          },
        ]}
        focusStyle={{ backgroundColor: theme.colors.cardHover }}
        scaleOnFocus={false}
        hasTVPreferredFocus={index === 0}
      >
        <Text
          style={[
            styles.groupName,
            {
              color:
                selectedGroup === item.name
                  ? theme.colors.primary
                  : theme.colors.textPrimary,
            },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.groupCount, { color: theme.colors.textMuted }]}>
          {item.channels.filter(c => c.streamType === 'live').length}
        </Text>
      </Focusable>
    ),
    [selectedGroup, theme],
  );

  const keyExtractor = useCallback((item: Channel | ChannelGroup) => {
    return 'id' in item ? item.id : item.name;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sidebar Navigation */}
      <View style={[styles.sidebar, { backgroundColor: theme.colors.navBackground }]}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: theme.colors.primary }]}>M</Text>
          <Text style={[styles.logoSubtext, { color: theme.colors.textSecondary }]}>TV</Text>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <Focusable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={[
                styles.tabButton,
                activeTab === tab.id && {
                  backgroundColor: theme.colors.primary + '20',
                  borderLeftWidth: 3,
                  borderLeftColor: theme.colors.primary,
                },
              ]}
              focusStyle={{ backgroundColor: theme.colors.cardHover }}
              scaleOnFocus={false}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === tab.id
                        ? theme.colors.primary
                        : theme.colors.navInactive,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Focusable>
          ))}
        </View>

        {/* Playlist Selector */}
        <Focusable
          onPress={() => navigation.navigate('PlaylistManager')}
          style={styles.playlistButton}
          focusStyle={{ backgroundColor: theme.colors.cardHover }}
          scaleOnFocus={false}
        >
          <Text style={styles.playlistIcon}>📋</Text>
          <Text style={[styles.playlistLabel, { color: theme.colors.textMuted }]}>
            Listas
          </Text>
        </Focusable>
      </View>

      {/* Groups Panel */}
      {activeTab === 'channels' && showGroupsList && !selectedGroup && (
        <View
          style={[
            styles.groupsPanel,
            { backgroundColor: theme.colors.surface, borderRightColor: theme.colors.border },
          ]}
        >
          <View style={styles.groupsHeader}>
            <Text style={[styles.groupsTitle, { color: theme.colors.textPrimary }]}>
              Grupos
            </Text>
            <Text style={[styles.groupsCount, { color: theme.colors.textMuted }]}>
              {visibleGroups.length}
            </Text>
          </View>

          {/* All Channels option */}
          <Focusable
            onPress={() => setSelectedGroup(null)}
            style={[
              styles.groupItem,
              {
                backgroundColor: !selectedGroup
                  ? theme.colors.primary + '25'
                  : theme.colors.surface,
              },
            ]}
            focusStyle={{ backgroundColor: theme.colors.cardHover }}
            scaleOnFocus={false}
          >
            <Text
              style={[
                styles.groupName,
                { color: !selectedGroup ? theme.colors.primary : theme.colors.textPrimary },
              ]}
            >
              📺 Todos os Canais
            </Text>
            <Text style={[styles.groupCount, { color: theme.colors.textMuted }]}>
              {channels.filter(c => c.streamType === 'live').length}
            </Text>
          </Focusable>

          <FlatList
            data={visibleGroups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.name}
            showsVerticalScrollIndicator={false}
            style={styles.groupsList}
          />
        </View>
      )}

      {/* Main Content - Channel List */}
      <View style={styles.mainContent}>
        {/* Header */}
        <View
          style={[
            styles.contentHeader,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <View style={styles.headerLeft}>
            {selectedGroup && (
              <Focusable
                onPress={() => setSelectedGroup(null)}
                style={styles.backButton}
                scaleOnFocus={false}
              >
                <Text style={[styles.backIcon, { color: theme.colors.primary }]}>◀</Text>
              </Focusable>
            )}
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              {selectedGroup ||
                (activeTab === 'channels'
                  ? 'Canais ao Vivo'
                  : activeTab === 'favorites'
                  ? 'Favoritos'
                  : activeTab === 'history'
                  ? 'Histórico'
                  : activeTab === 'movies'
                  ? 'Filmes & VOD'
                  : 'Séries')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={[styles.channelCount, { color: theme.colors.textSecondary }]}>
              {displayChannels.length} canais
            </Text>
            <Focusable
              onPress={() => navigation.navigate('Search')}
              style={styles.searchButton}
              scaleOnFocus={false}
            >
              <Text style={[styles.searchIcon, { color: theme.colors.textSecondary }]}>🔍</Text>
            </Focusable>
          </View>
        </View>

        {/* Channel List */}
        {displayChannels.length > 0 ? (
          <FlatList
            data={displayChannels}
            renderItem={renderChannelItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={15}
            windowSize={11}
            removeClippedSubviews={true}
            style={styles.channelList}
            contentContainerStyle={styles.channelListContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'favorites'
                ? '⭐'
                : activeTab === 'history'
                ? '🕐'
                : playlists.length === 0
                ? '📋'
                : '📺'}
            </Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              {playlists.length === 0
                ? 'Nenhuma playlist adicionada'
                : activeTab === 'favorites'
                ? 'Nenhum favorito'
                : activeTab === 'history'
                ? 'Nenhum histórico'
                : 'Nenhum canal encontrado'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              {playlists.length === 0
                ? 'Adicione uma playlist M3U para começar'
                : activeTab === 'favorites'
                ? 'Pressione e segure um canal para favoritar'
                : 'Tente uma busca diferente'}
            </Text>
            {playlists.length === 0 && (
              <Focusable
                onPress={() => navigation.navigate('PlaylistManager')}
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                hasTVPreferredFocus
              >
                <Text style={styles.addButtonText}>+ Adicionar Playlist</Text>
              </Focusable>
            )}
          </View>
        )}
      </View>

      {/* Preview Panel (right side) */}
      {currentChannel && appSettings.showChannelPreview && (
        <View
          style={[
            styles.previewPanel,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderLeftColor: theme.colors.border,
            },
          ]}
        >
          {currentChannel.logo && (
            <Image
              source={{ uri: currentChannel.logo }}
              style={styles.previewLogo}
              resizeMode="contain"
            />
          )}
          <Text style={[styles.previewName, { color: theme.colors.textPrimary }]}>
            {currentChannel.name}
          </Text>
          <Text style={[styles.previewGroup, { color: theme.colors.textSecondary }]}>
            {currentChannel.group}
          </Text>

          {/* EPG Info */}
          {(() => {
            const { current, next } = getCurrentAndNextPrograms(
              epgPrograms,
              currentChannel.epgId || '',
            );
            return (
              <>
                {current && (
                  <View style={styles.previewEpg}>
                    <Text style={[styles.previewEpgLabel, { color: theme.colors.primary }]}>
                      AGORA
                    </Text>
                    <Text
                      style={[styles.previewEpgTitle, { color: theme.colors.textPrimary }]}
                      numberOfLines={2}
                    >
                      {current.title}
                    </Text>
                  </View>
                )}
                {next && (
                  <View style={styles.previewEpg}>
                    <Text style={[styles.previewEpgLabel, { color: theme.colors.secondary }]}>
                      PRÓXIMO
                    </Text>
                    <Text
                      style={[styles.previewEpgTitle, { color: theme.colors.textPrimary }]}
                      numberOfLines={2}
                    >
                      {next.title}
                    </Text>
                  </View>
                )}
              </>
            );
          })()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  // Sidebar
  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingVertical: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
  },
  logoSubtext: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -4,
  },
  tabsContainer: {
    flex: 1,
    width: '100%',
  },
  tabButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderLeftWidth: 0,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  playlistButton: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  playlistIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  playlistLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  // Groups Panel
  groupsPanel: {
    width: 200,
    borderRightWidth: 1,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupsCount: {
    fontSize: 12,
  },
  groupsList: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginVertical: 1,
    borderRadius: 6,
    borderLeftWidth: 0,
  },
  groupName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  groupCount: {
    fontSize: 11,
    marginLeft: 8,
  },
  // Main Content
  mainContent: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelCount: {
    fontSize: 12,
  },
  searchButton: {
    padding: 4,
  },
  searchIcon: {
    fontSize: 18,
  },
  channelList: {
    flex: 1,
  },
  channelListContent: {
    paddingVertical: 4,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Preview Panel
  previewPanel: {
    width: 250,
    padding: 16,
    borderLeftWidth: 1,
    alignItems: 'center',
  },
  previewLogo: {
    width: 100,
    height: 75,
    marginBottom: 12,
    borderRadius: 8,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewGroup: {
    fontSize: 12,
    marginBottom: 16,
  },
  previewEpg: {
    width: '100%',
    marginBottom: 12,
  },
  previewEpgLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  previewEpgTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default HomeScreen;
