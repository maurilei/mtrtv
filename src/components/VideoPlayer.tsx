// ============================================================
// MtrTV - Video Player Component
// Full-featured video player with ExoPlayer backend
// ============================================================

import React, { useRef, useState, useCallback, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  BackHandler,
  StatusBar,
  Platform,
} from 'react-native';
import Video, {
  OnLoadData,
  OnProgressData,
  OnBufferData,
  TextTrack,
  AudioTrack,
  VideoRef,
  ResizeMode,
} from 'react-native-video';
import { Focusable } from './Focusable';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import {
  Channel,
  VideoAspectRatio,
  PlayerState,
} from '../types';
import { getCurrentAndNextPrograms, getProgramProgress } from '../services/epgParser';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerProps {
  channel: Channel;
  channels?: Channel[];
  onBack?: () => void;
  onChannelChange?: (channel: Channel) => void;
}

const aspectRatioMap: Record<VideoAspectRatio, ResizeMode> = {
  fit: ResizeMode.CONTAIN,
  fill: ResizeMode.COVER,
  stretch: ResizeMode.STRETCH,
  '16:9': ResizeMode.CONTAIN,
  '4:3': ResizeMode.CONTAIN,
  original: ResizeMode.NONE,
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  channels = [],
  onBack,
  onChannelChange,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelSwitchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  const { playerSettings, appSettings, epgPrograms, addToHistory, updateWatchPosition } =
    useAppStore();
  const theme = getTheme(appSettings.theme);

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: true,
    isPaused: false,
    isBuffering: true,
    duration: 0,
    currentTime: 0,
    volume: playerSettings.defaultVolume / 100,
    isMuted: false,
    aspectRatio: playerSettings.defaultAspectRatio,
    isFullscreen: true,
    showControls: true,
    showInfo: false,
    showEpg: false,
    subtitleTrack: -1,
    audioTrack: 0,
    playbackSpeed: 1,
  });

  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [channelNumberInput, setChannelNumberInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get current EPG info
  const { current: currentProgram, next: nextProgram } = getCurrentAndNextPrograms(
    epgPrograms,
    channel.epgId || '',
  );
  const programProgress = currentProgram ? getProgramProgress(currentProgram) : 0;

  // ==================== Controls Visibility ====================

  const showControls = useCallback(() => {
    setPlayerState(prev => ({ ...prev, showControls: true }));
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }

    controlsTimeout.current = setTimeout(() => {
      hideControls();
    }, 5000);
  }, []);

  const hideControls = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPlayerState(prev => ({ ...prev, showControls: false, showInfo: false }));
    });
  }, []);

  const toggleInfo = useCallback(() => {
    setPlayerState(prev => ({ ...prev, showInfo: !prev.showInfo }));
    showControls();
  }, [showControls]);

  // ==================== Playback Controls ====================

  const togglePlayPause = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
      isPlaying: prev.isPaused,
    }));
    showControls();
  }, [showControls]);

  const seekForward = useCallback(() => {
    if (videoRef.current && channel.streamType !== 'live') {
      const newTime = playerState.currentTime + playerSettings.seekDuration;
      videoRef.current.seek(Math.min(newTime, playerState.duration));
      showControls();
    }
  }, [playerState.currentTime, playerState.duration, playerSettings.seekDuration, showControls]);

  const seekBackward = useCallback(() => {
    if (videoRef.current && channel.streamType !== 'live') {
      const newTime = playerState.currentTime - playerSettings.seekDuration;
      videoRef.current.seek(Math.max(newTime, 0));
      showControls();
    }
  }, [playerState.currentTime, playerSettings.seekDuration, showControls]);

  const changeVolume = useCallback(
    (delta: number) => {
      setPlayerState(prev => ({
        ...prev,
        volume: Math.max(0, Math.min(1, prev.volume + delta)),
        isMuted: false,
      }));
      showControls();
    },
    [showControls],
  );

  const toggleMute = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    showControls();
  }, [showControls]);

  const cycleAspectRatio = useCallback(() => {
    const ratios: VideoAspectRatio[] = ['fit', 'fill', 'stretch', '16:9', '4:3'];
    const currentIndex = ratios.indexOf(playerState.aspectRatio);
    const nextRatio = ratios[(currentIndex + 1) % ratios.length];
    setPlayerState(prev => ({ ...prev, aspectRatio: nextRatio }));
    showControls();
  }, [playerState.aspectRatio, showControls]);

  const cycleAudioTrack = useCallback(() => {
    if (audioTracks.length > 1) {
      const nextTrack = (playerState.audioTrack + 1) % audioTracks.length;
      setPlayerState(prev => ({ ...prev, audioTrack: nextTrack }));
      showControls();
    }
  }, [audioTracks, playerState.audioTrack, showControls]);

  const cycleSubtitleTrack = useCallback(() => {
    const nextTrack =
      playerState.subtitleTrack >= textTracks.length - 1
        ? -1
        : playerState.subtitleTrack + 1;
    setPlayerState(prev => ({ ...prev, subtitleTrack: nextTrack }));
    showControls();
  }, [textTracks, playerState.subtitleTrack, showControls]);

  const changePlaybackSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playerState.playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlayerState(prev => ({ ...prev, playbackSpeed: nextSpeed }));
    showControls();
  }, [playerState.playbackSpeed, showControls]);

  // ==================== Channel Switching ====================

  const switchChannel = useCallback(
    (direction: 'up' | 'down') => {
      if (channels.length === 0) return;
      const currentIndex = channels.findIndex(c => c.id === channel.id);
      let newIndex;

      if (direction === 'up') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : channels.length - 1;
      } else {
        newIndex = currentIndex < channels.length - 1 ? currentIndex + 1 : 0;
      }

      onChannelChange?.(channels[newIndex]);
      showControls();
    },
    [channels, channel, onChannelChange, showControls],
  );

  // ==================== Video Events ====================

  const onLoad = useCallback(
    (data: OnLoadData) => {
      setPlayerState(prev => ({
        ...prev,
        duration: data.duration,
        isBuffering: false,
      }));
      setAudioTracks(data.audioTracks || []);
      setTextTracks(data.textTracks || []);
      setError(null);

      // Resume playback position for VOD
      if (channel.watchPosition && playerSettings.resumePlayback && channel.streamType !== 'live') {
        videoRef.current?.seek(channel.watchPosition);
      }

      // Add to history
      addToHistory(channel);
    },
    [channel, playerSettings.resumePlayback, addToHistory],
  );

  const onProgress = useCallback(
    (data: OnProgressData) => {
      setPlayerState(prev => ({
        ...prev,
        currentTime: data.currentTime,
      }));

      // Save watch position for VOD content
      if (channel.streamType !== 'live' && data.currentTime > 0) {
        updateWatchPosition(channel.id, data.currentTime);
      }
    },
    [channel, updateWatchPosition],
  );

  const onBuffer = useCallback((data: OnBufferData) => {
    setPlayerState(prev => ({ ...prev, isBuffering: data.isBuffering }));
  }, []);

  const onError = useCallback((error: any) => {
    console.error('Player error:', error);
    setError('Erro ao reproduzir. Tente novamente.');
    setPlayerState(prev => ({ ...prev, isBuffering: false }));
  }, []);

  // ==================== Back Handler ====================

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (playerState.showInfo || playerState.showEpg) {
        setPlayerState(prev => ({ ...prev, showInfo: false, showEpg: false }));
        return true;
      }
      if (playerState.showControls) {
        hideControls();
        return true;
      }
      onBack?.();
      return true;
    });

    return () => backHandler.remove();
  }, [playerState.showControls, playerState.showInfo, playerState.showEpg, hideControls, onBack]);

  // Hide status bar
  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    showControls();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, []);

  // ==================== Time Formatting ====================

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatClock = (): string => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // ==================== Buffer Config ====================

  const bufferConfig = {
    minBufferMs: playerSettings.minBufferMs,
    maxBufferMs: playerSettings.maxBufferMs,
    bufferForPlaybackMs: playerSettings.bufferForPlaybackMs,
    bufferForPlaybackAfterRebufferMs: playerSettings.bufferForPlaybackAfterRebufferMs,
  };

  // ==================== Render ====================

  return (
    <View style={styles.container}>
      {/* Video */}
      <Video
        ref={videoRef}
        source={{ uri: channel.url }}
        style={styles.video}
        resizeMode={aspectRatioMap[playerState.aspectRatio]}
        paused={playerState.isPaused}
        volume={playerState.isMuted ? 0 : playerState.volume}
        rate={playerState.playbackSpeed}
        onLoad={onLoad}
        onProgress={onProgress}
        onBuffer={onBuffer}
        onError={onError}
        bufferConfig={bufferConfig}
        selectedAudioTrack={{
          type: 'index',
          value: playerState.audioTrack,
        }}
        selectedTextTrack={
          playerState.subtitleTrack >= 0
            ? { type: 'index', value: playerState.subtitleTrack }
            : { type: 'disabled' }
        }
        subtitleStyle={{
          fontSize: playerSettings.subtitleSize === 'small' ? 16 :
            playerSettings.subtitleSize === 'medium' ? 22 :
            playerSettings.subtitleSize === 'large' ? 28 : 34,
          subtitlesFollowVideo: true,
          paddingBottom: 20,
        }}
        playInBackground={false}
        playWhenInactive={false}
        reportBandwidth={true}
        maxBitRate={0} // Unlimited
      />

      {/* Buffering Indicator */}
      {playerState.isBuffering && playerSettings.showBufferIndicator && (
        <View style={styles.bufferingContainer}>
          <View style={styles.bufferingSpinner}>
            <Text style={styles.bufferingText}>⟳</Text>
          </View>
          <Text style={[styles.bufferingLabel, { color: theme.colors.textPrimary }]}>
            Carregando...
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Focusable
            onPress={() => {
              setError(null);
              setPlayerState(prev => ({ ...prev, isBuffering: true }));
            }}
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            hasTVPreferredFocus
          >
            <Text style={styles.retryText}>Tentar Novamente</Text>
          </Focusable>
        </View>
      )}

      {/* Controls Overlay */}
      <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
        {/* Top Bar */}
        <View style={[styles.topBar, { backgroundColor: theme.colors.playerControls }]}>
          <View style={styles.topBarContent}>
            {/* Channel Info */}
            <View style={styles.channelInfo}>
              {channel.logo && (
                <Image
                  source={{ uri: channel.logo }}
                  style={styles.channelLogo}
                  resizeMode="contain"
                />
              )}
              <View style={styles.channelText}>
                <Text style={[styles.channelName, { color: theme.colors.textPrimary }]}>
                  {channel.number ? `${channel.number}. ` : ''}
                  {channel.name}
                </Text>
                {currentProgram && (
                  <Text
                    style={[styles.programName, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {currentProgram.title}
                  </Text>
                )}
              </View>
            </View>

            {/* Right Info */}
            <View style={styles.topBarRight}>
              <Text style={[styles.aspectLabel, { color: theme.colors.secondary }]}>
                {playerState.aspectRatio.toUpperCase()}
              </Text>
              {playerState.playbackSpeed !== 1 && (
                <Text style={[styles.speedLabel, { color: theme.colors.warning }]}>
                  {playerState.playbackSpeed}x
                </Text>
              )}
              {appSettings.showClock && (
                <Text style={[styles.clock, { color: theme.colors.textPrimary }]}>
                  {formatClock()}
                </Text>
              )}
            </View>
          </View>

          {/* EPG Progress */}
          {currentProgram && (
            <View style={styles.epgProgressContainer}>
              <Text style={[styles.programTime, { color: theme.colors.textMuted }]}>
                {new Date(currentProgram.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <View style={[styles.epgProgress, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.epgProgressFill,
                    {
                      width: `${programProgress}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.programTime, { color: theme.colors.textMuted }]}>
                {new Date(currentProgram.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Controls - VOD Only */}
        {channel.streamType !== 'live' && (
          <View style={[styles.bottomBar, { backgroundColor: theme.colors.playerControls }]}>
            {/* Seek Bar */}
            <View style={styles.seekBarContainer}>
              <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                {formatTime(playerState.currentTime)}
              </Text>
              <View style={[styles.seekBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.seekBarFill,
                    {
                      width: playerState.duration
                        ? `${(playerState.currentTime / playerState.duration) * 100}%`
                        : '0%',
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.seekBarThumb,
                    {
                      left: playerState.duration
                        ? `${(playerState.currentTime / playerState.duration) * 100}%`
                        : '0%',
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                {formatTime(playerState.duration)}
              </Text>
            </View>

            {/* Playback Controls */}
            <View style={styles.playbackControls}>
              <Focusable
                onPress={seekBackward}
                style={styles.controlButton}
              >
                <Text style={styles.controlIcon}>⏪</Text>
              </Focusable>

              <Focusable
                onPress={togglePlayPause}
                style={[styles.controlButton, styles.playButton]}
                hasTVPreferredFocus
              >
                <Text style={styles.playIcon}>
                  {playerState.isPaused ? '▶️' : '⏸️'}
                </Text>
              </Focusable>

              <Focusable
                onPress={seekForward}
                style={styles.controlButton}
              >
                <Text style={styles.controlIcon}>⏩</Text>
              </Focusable>
            </View>
          </View>
        )}

        {/* Side Controls */}
        <View style={styles.sideControls}>
          <Focusable onPress={cycleAspectRatio} style={styles.sideButton}>
            <Text style={[styles.sideButtonText, { color: theme.colors.textPrimary }]}>📐</Text>
          </Focusable>
          <Focusable onPress={cycleAudioTrack} style={styles.sideButton}>
            <Text style={[styles.sideButtonText, { color: theme.colors.textPrimary }]}>🔊</Text>
          </Focusable>
          <Focusable onPress={cycleSubtitleTrack} style={styles.sideButton}>
            <Text style={[styles.sideButtonText, { color: theme.colors.textPrimary }]}>💬</Text>
          </Focusable>
          {channel.streamType !== 'live' && (
            <Focusable onPress={changePlaybackSpeed} style={styles.sideButton}>
              <Text style={[styles.sideButtonText, { color: theme.colors.textPrimary }]}>⚡</Text>
            </Focusable>
          )}
        </View>
      </Animated.View>

      {/* Channel Info Overlay (Info button) */}
      {playerState.showInfo && (
        <View style={[styles.infoOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            {channel.logo && (
              <Image source={{ uri: channel.logo }} style={styles.infoLogo} resizeMode="contain" />
            )}
            <Text style={[styles.infoChannelName, { color: theme.colors.textPrimary }]}>
              {channel.name}
            </Text>
            <Text style={[styles.infoGroup, { color: theme.colors.textSecondary }]}>
              {channel.group}
            </Text>

            {currentProgram && (
              <View style={styles.infoEpg}>
                <Text style={[styles.infoLabel, { color: theme.colors.primary }]}>AGORA</Text>
                <Text style={[styles.infoProgramTitle, { color: theme.colors.textPrimary }]}>
                  {currentProgram.title}
                </Text>
                {currentProgram.description && (
                  <Text
                    style={[styles.infoProgramDesc, { color: theme.colors.textSecondary }]}
                    numberOfLines={3}
                  >
                    {currentProgram.description}
                  </Text>
                )}
              </View>
            )}

            {nextProgram && (
              <View style={styles.infoEpg}>
                <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>
                  PRÓXIMO
                </Text>
                <Text style={[styles.infoProgramTitle, { color: theme.colors.textPrimary }]}>
                  {nextProgram.title}
                </Text>
              </View>
            )}

            {/* Track Info */}
            <View style={styles.trackInfo}>
              {audioTracks.length > 0 && (
                <Text style={[styles.trackText, { color: theme.colors.textMuted }]}>
                  🔊 Áudio: {audioTracks[playerState.audioTrack]?.language || 'Padrão'} ({audioTracks.length} faixas)
                </Text>
              )}
              {textTracks.length > 0 && (
                <Text style={[styles.trackText, { color: theme.colors.textMuted }]}>
                  💬 Legendas: {playerState.subtitleTrack >= 0
                    ? textTracks[playerState.subtitleTrack]?.language || 'Ativada'
                    : 'Desativada'} ({textTracks.length} faixas)
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// We need to add the Image import
import { Image } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelLogo: {
    width: 48,
    height: 36,
    marginRight: 12,
    borderRadius: 4,
  },
  channelText: {
    flex: 1,
  },
  channelName: {
    fontSize: 20,
    fontWeight: '700',
  },
  programName: {
    fontSize: 14,
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aspectLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  speedLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  clock: {
    fontSize: 18,
    fontWeight: '600',
  },
  epgProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  programTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  epgProgress: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  epgProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
  },
  seekBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'center',
  },
  seekBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  seekBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  seekBarThumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  controlButton: {
    padding: 8,
    borderRadius: 24,
  },
  playButton: {
    padding: 12,
  },
  controlIcon: {
    fontSize: 24,
  },
  playIcon: {
    fontSize: 32,
  },
  sideControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -60 }],
    gap: 8,
  },
  sideButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideButtonText: {
    fontSize: 20,
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingSpinner: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingText: {
    fontSize: 36,
    color: '#FFF',
  },
  bufferingLabel: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  infoCard: {
    padding: 24,
    borderRadius: 16,
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
  },
  infoLogo: {
    width: 80,
    height: 60,
    marginBottom: 12,
  },
  infoChannelName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoGroup: {
    fontSize: 14,
    marginBottom: 16,
  },
  infoEpg: {
    width: '100%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoProgramTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoProgramDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  trackInfo: {
    width: '100%',
    marginTop: 12,
    gap: 4,
  },
  trackText: {
    fontSize: 12,
  },
});

export default memo(VideoPlayer);
