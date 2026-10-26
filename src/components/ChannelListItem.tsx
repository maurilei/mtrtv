// ============================================================
// MtrTV - Channel List Item Component
// Individual channel item in the sidebar list
// ============================================================

import React, { memo, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Focusable } from './Focusable';
import { Channel, EpgProgram } from '../types';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import { getCurrentAndNextPrograms, getProgramProgress } from '../services/epgParser';

interface ChannelListItemProps {
  channel: Channel;
  isActive: boolean;
  onPress: (channel: Channel) => void;
  onLongPress?: (channel: Channel) => void;
  style?: ViewStyle;
  showEpg?: boolean;
  hasTVPreferredFocus?: boolean;
}

const ChannelListItem: React.FC<ChannelListItemProps> = ({
  channel,
  isActive,
  onPress,
  onLongPress,
  style,
  showEpg = true,
  hasTVPreferredFocus = false,
}) => {
  const { appSettings, epgPrograms } = useAppStore();
  const theme = getTheme(appSettings.theme);

  const { current: currentProgram } = useMemo(
    () =>
      showEpg
        ? getCurrentAndNextPrograms(epgPrograms, channel.epgId || '')
        : { current: undefined },
    [epgPrograms, channel.epgId, showEpg],
  );

  const progress = currentProgram ? getProgramProgress(currentProgram) : 0;

  return (
    <Focusable
      onPress={() => onPress(channel)}
      onLongPress={() => onLongPress?.(channel)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={[
        styles.container,
        {
          backgroundColor: isActive
            ? theme.colors.primary + '30'
            : theme.colors.surface,
          borderLeftWidth: isActive ? 3 : 0,
          borderLeftColor: theme.colors.primary,
        },
        style,
      ]}
      focusStyle={{
        backgroundColor: theme.colors.cardHover,
      }}
      scaleOnFocus={false}
    >
      <View style={styles.content}>
        {/* Channel Number */}
        {appSettings.showChannelNumbers && (
          <View style={[styles.numberContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.number, { color: theme.colors.textSecondary }]}>
              {channel.number}
            </Text>
          </View>
        )}

        {/* Channel Logo */}
        {appSettings.showChannelLogos && channel.logo ? (
          <Image
            source={{ uri: channel.logo }}
            style={styles.logo}
            resizeMode="contain"
            defaultSource={require('../assets/channel_placeholder.png')}
          />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.logoText, { color: theme.colors.textMuted }]}>
              {channel.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Channel Info */}
        <View style={styles.info}>
          <Text
            style={[
              styles.name,
              {
                color: isActive ? theme.colors.primary : theme.colors.textPrimary,
                fontWeight: isActive ? '700' : '500',
              },
            ]}
            numberOfLines={1}
          >
            {channel.name}
          </Text>

          {currentProgram && (
            <View style={styles.epgContainer}>
              <Text
                style={[styles.programTitle, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {currentProgram.title}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Indicators */}
        <View style={styles.indicators}>
          {channel.isFavorite && (
            <Text style={[styles.indicator, { color: theme.colors.accent }]}>★</Text>
          )}
          {channel.isLocked && (
            <Text style={[styles.indicator, { color: theme.colors.warning }]}>🔒</Text>
          )}
        </View>
      </View>
    </Focusable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberContainer: {
    width: 36,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  number: {
    fontSize: 12,
    fontWeight: '600',
  },
  logo: {
    width: 40,
    height: 30,
    borderRadius: 4,
    marginRight: 10,
  },
  logoPlaceholder: {
    width: 40,
    height: 30,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
  },
  epgContainer: {
    marginTop: 2,
  },
  programTitle: {
    fontSize: 11,
    marginBottom: 2,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  indicators: {
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    fontSize: 14,
  },
});

export default memo(ChannelListItem);
