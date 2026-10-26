// ============================================================
// MtrTV - Search Screen
// Search channels across all playlists
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Focusable } from '../components/Focusable';
import ChannelListItem from '../components/ChannelListItem';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import { Channel } from '../types';

interface SearchScreenProps {
  navigation: any;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { channels, currentChannel, setCurrentChannel, appSettings } = useAppStore();
  const theme = getTheme(appSettings.theme);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return channels.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        (c.number && String(c.number).includes(q)),
    );
  }, [query, channels]);

  const handleChannelPress = useCallback(
    (channel: Channel) => {
      setCurrentChannel(channel);
      navigation.navigate('Player', { channel, channels: results });
    },
    [results, navigation, setCurrentChannel],
  );

  const renderChannelItem = useCallback(
    ({ item }: { item: Channel }) => (
      <ChannelListItem
        channel={item}
        isActive={currentChannel?.id === item.id}
        onPress={handleChannelPress}
      />
    ),
    [currentChannel, handleChannelPress],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Focusable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          scaleOnFocus={false}
        >
          <Text style={[styles.backText, { color: theme.colors.primary }]}>◀ Voltar</Text>
        </Focusable>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar canais, filmes, séries..."
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Focusable
              onPress={() => setQuery('')}
              style={styles.clearButton}
              scaleOnFocus={false}
            >
              <Text style={[styles.clearText, { color: theme.colors.textMuted }]}>✕</Text>
            </Focusable>
          )}
        </View>

        <Text style={[styles.resultCount, { color: theme.colors.textSecondary }]}>
          {results.length} resultado{results.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Results */}
      {results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderChannelItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={15}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            {query.trim()
              ? 'Nenhum resultado encontrado'
              : 'Digite para buscar'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            {query.trim()
              ? `Não encontramos resultados para "${query}"`
              : 'Busque por nome de canal, grupo ou número'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 16,
  },
  resultCount: {
    fontSize: 12,
    minWidth: 80,
    textAlign: 'right',
  },
  listContent: {
    paddingVertical: 8,
  },
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
  },
});

export default SearchScreen;
