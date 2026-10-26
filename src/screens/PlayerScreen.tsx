// ============================================================
// MtrTV - Player Screen
// Full screen video player with channel list overlay
// ============================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  BackHandler,
} from 'react-native';
import VideoPlayer from '../components/VideoPlayer';
import ChannelListItem from '../components/ChannelListItem';
import { Focusable } from '../components/Focusable';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import { Channel } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHANNEL_LIST_WIDTH = 340;

interface PlayerScreenProps {
  navigation: any;
  route: {
    params: {
      channel: Channel;
      channels?: Channel[];
    };
  };
}

const PlayerScreen: React.FC<PlayerScreenProps> = ({ navigation, route }) => {
  const { channel: initialChannel, channels = [] } = route.params;
  const [currentChannel, setCurrentChannel] = useState<Channel>(initialChannel);
  const [showChannelList, setShowChannelList] = useState(false);
  const [showQuickInfo, setShowQuickInfo] = useState(false);
  const channelListAnim = useRef(new Animated.Value(-CHANNEL_LIST_WIDTH)).current;
  const quickInfoAnim = useRef(new Animated.Value(0)).current;
  const quickInfoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { appSettings, setCurrentChannel: setStoreChannel, addToHistory, epgPrograms } = useAppStore();
  const theme = getTheme(appSettings.theme);

  // ==================== Channel List Toggle ====================

  const toggleChannelList = useCallback(() => {
    const newState = !showChannelList;
    setShowChannelList(newState);

    Animated.spring(channelListAnim, {
      toValue: newState ? 0 : -CHANNEL_LIST_WIDTH,
      friction: 10,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [showChannelList, channelListAnim]);

  // ==================== Quick Info on Channel Switch ====================

  const showQuickChannelInfo = useCallback(() => {
    setShowQuickInfo(true);
    Animated.sequence([
      Animated.timing(quickInfoAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(quickInfoAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowQuickInfo(false));
  }, [quickInfoAnim]);

  // ==================== Channel Change ====================

  const handleChannelChange = useCallback(
    (channel: Channel) => {
      setCurrentChannel(channel);
      setStoreChannel(channel);
      addToHistory(channel);
      showQuickChannelInfo();

      if (showChannelList) {
        toggleChannelList();
      }
    },
    [setStoreChannel, addToHistory, showQuickChannelInfo, showChannelList, toggleChannelList],
  );

  const handleBack = useCallback(() => {
    if (showChannelList) {
      toggleChannelList();
      return;
    }
    navigation.goBack();
  }, [showChannelList, toggleChannelList, navigation]);

  // ==================== Back Handler ====================

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  // Set as current channel on mount
  useEffect(() => {
    setStoreChannel(currentChannel);
    addToHistory(currentChannel);
  }, []);

  // ==================== Render ====================

  const renderChannelItem = useCallback(
    ({ item, index }: { item: Channel; index: number }) => (
      <ChannelListItem
        channel={item}
        isActive={currentChannel.id === item.id}
        onPress={handleChannelChange}
        hasTVPreferredFocus={currentChannel.id === item.id}
      />
    ),
    [currentChannel, handleChannelChange],
  );

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <VideoPlayer
        channel={currentChannel}
        channels={channels}
        onBack={handleBack}
        onChannelChange={handleChannelChange}
      />

      {/* Channel List Overlay */}
      <Animated.View
        style={[
          styles.channelListOverlay,
          {
            transform: [{ translateX: channelListAnim }],
            backgroundColor: theme.colors.overlay,
          },
        ]}
      >
        <View
          style={[
            styles.channelListContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.channelListHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.channelListTitle, { color: theme.colors.textPrimary }]}>
              Canais
            </Text>
            <Text style={[styles.channelListCount, { color: theme.colors.textMuted }]}>
              {channels.length}
            </Text>
          </View>

          {/* Channel List */}
          <FlatList
            data={channels}
            renderItem={renderChannelItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={7}
            style={styles.channelFlatList}
            contentContainerStyle={styles.channelListContent}
          />
        </View>
      </Animated.View>

      {/* Quick Channel Info */}
      {showQuickInfo && (
        <Animated.View
          style={[
            styles.quickInfo,
            {
              opacity: quickInfoAnim,
              transform: [
                {
                  translateY: quickInfoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
              backgroundColor: theme.colors.surface + 'E0',
            },
          ]}
        >
          <View style={styles.quickInfoContent}>
            <View
              style={[
                styles.quickInfoNumber,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.quickInfoNumberText}>
                {currentChannel.number || '—'}
              </Text>
            </View>
            <View style={styles.quickInfoText}>
              <Text
                style={[styles.quickInfoName, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {currentChannel.name}
              </Text>
              <Text
                style={[styles.quickInfoGroup, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {currentChannel.group}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Channel List Toggle Button */}
      <Focusable
        onPress={toggleChannelList}
        style={[
          styles.channelListToggle,
          { backgroundColor: theme.colors.primary + '80' },
        ]}
        scaleOnFocus={false}
      >
        <Text style={styles.toggleIcon}>
          {showChannelList ? '◀' : '☰'}
        </Text>
      </Focusable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  channelListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: CHANNEL_LIST_WIDTH,
    zIndex: 10,
  },
  channelListContainer: {
    flex: 1,
    width: CHANNEL_LIST_WIDTH,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  channelListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  channelListTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  channelListCount: {
    fontSize: 12,
  },
  channelFlatList: {
    flex: 1,
  },
  channelListContent: {
    paddingVertical: 4,
  },
  quickInfo: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    transform: [{ translateX: -160 }],
    width: 320,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quickInfoNumber: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickInfoNumberText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  quickInfoText: {
    flex: 1,
  },
  quickInfoName: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickInfoGroup: {
    fontSize: 12,
    marginTop: 2,
  },
  channelListToggle: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  toggleIcon: {
    color: '#FFF',
    fontSize: 18,
  },
});

export default PlayerScreen;
