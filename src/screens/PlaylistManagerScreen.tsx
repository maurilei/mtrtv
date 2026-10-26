// ============================================================
// MtrTV - Playlist Manager Screen
// Add, edit, remove and manage IPTV playlists
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Focusable } from '../components/Focusable';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import { PlaylistSource } from '../types';

interface PlaylistManagerScreenProps {
  navigation: any;
}

const PlaylistManagerScreen: React.FC<PlaylistManagerScreenProps> = ({ navigation }) => {
  const {
    playlists,
    addPlaylist,
    removePlaylist,
    refreshPlaylist,
    setActivePlaylist,
    activePlaylistId,
    appSettings,
    isLoading,
    loadingMessage,
  } = useAppStore();

  const theme = getTheme(appSettings.theme);

  const [showAddForm, setShowAddForm] = useState(false);
  const [playlistType, setPlaylistType] = useState<'m3u' | 'xtream'>('m3u');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    xtreamHost: '',
    xtreamUsername: '',
    xtreamPassword: '',
  });

  // ==================== Add Playlist ====================

  const handleAddPlaylist = useCallback(async () => {
    if (playlistType === 'm3u') {
      if (!formData.name.trim() || !formData.url.trim()) {
        Alert.alert('Erro', 'Preencha o nome e a URL da playlist');
        return;
      }
    } else {
      if (
        !formData.name.trim() ||
        !formData.xtreamHost.trim() ||
        !formData.xtreamUsername.trim() ||
        !formData.xtreamPassword.trim()
      ) {
        Alert.alert('Erro', 'Preencha todos os campos do Xtream Codes');
        return;
      }
    }

    const newPlaylist: PlaylistSource = {
      id: `playlist_${Date.now()}`,
      name: formData.name.trim(),
      url:
        playlistType === 'xtream'
          ? `${formData.xtreamHost.trim()}/get.php?username=${formData.xtreamUsername.trim()}&password=${formData.xtreamPassword.trim()}&type=m3u_plus`
          : formData.url.trim(),
      type: playlistType,
      xtreamHost: playlistType === 'xtream' ? formData.xtreamHost.trim() : undefined,
      xtreamUsername: playlistType === 'xtream' ? formData.xtreamUsername.trim() : undefined,
      xtreamPassword: playlistType === 'xtream' ? formData.xtreamPassword.trim() : undefined,
      addedAt: Date.now(),
      updatedAt: Date.now(),
      autoUpdate: true,
      updateIntervalHours: 24,
    };

    try {
      await addPlaylist(newPlaylist);
      setShowAddForm(false);
      setFormData({ name: '', url: '', xtreamHost: '', xtreamUsername: '', xtreamPassword: '' });
      Alert.alert('Sucesso', `Playlist "${newPlaylist.name}" adicionada com sucesso!`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao adicionar playlist');
    }
  }, [formData, playlistType, addPlaylist]);

  // ==================== Remove Playlist ====================

  const handleRemovePlaylist = useCallback(
    (playlist: PlaylistSource) => {
      Alert.alert(
        'Remover Playlist',
        `Deseja remover "${playlist.name}"? Todos os canais desta playlist serão removidos.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => removePlaylist(playlist.id),
          },
        ],
      );
    },
    [removePlaylist],
  );

  // ==================== Render ====================

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Focusable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          scaleOnFocus={false}
        >
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>◀ Voltar</Text>
        </Focusable>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Gerenciar Playlists
        </Text>
        <Focusable
          onPress={() => setShowAddForm(true)}
          style={[styles.addHeaderButton, { backgroundColor: theme.colors.primary }]}
          scaleOnFocus={false}
        >
          <Text style={styles.addHeaderButtonText}>+ Nova Playlist</Text>
        </Focusable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Loading Indicator */}
        {isLoading && (
          <View style={[styles.loadingBanner, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
              ⟳ {loadingMessage || 'Carregando...'}
            </Text>
          </View>
        )}

        {/* Add Form */}
        {showAddForm && (
          <View style={[styles.addForm, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>
              Adicionar Playlist
            </Text>

            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <Focusable
                onPress={() => setPlaylistType('m3u')}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      playlistType === 'm3u' ? theme.colors.primary : theme.colors.surfaceVariant,
                  },
                ]}
                scaleOnFocus={false}
                hasTVPreferredFocus={playlistType === 'm3u'}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: playlistType === 'm3u' ? '#FFF' : theme.colors.textSecondary },
                  ]}
                >
                  M3U / M3U8
                </Text>
              </Focusable>
              <Focusable
                onPress={() => setPlaylistType('xtream')}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      playlistType === 'xtream' ? theme.colors.primary : theme.colors.surfaceVariant,
                  },
                ]}
                scaleOnFocus={false}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: playlistType === 'xtream' ? '#FFF' : theme.colors.textSecondary },
                  ]}
                >
                  Xtream Codes
                </Text>
              </Focusable>
            </View>

            {/* Name Field */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Nome</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Ex: Minha Lista IPTV"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            {playlistType === 'm3u' ? (
              // M3U URL Field
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                  URL da Playlist
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={formData.url}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, url: text }))}
                  placeholder="http://exemplo.com/lista.m3u"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            ) : (
              // Xtream Codes Fields
              <>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                    Servidor (Host)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={formData.xtreamHost}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, xtreamHost: text }))}
                    placeholder="http://servidor.com:8080"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.fieldRow}>
                  <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                      Usuário
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.surfaceVariant,
                          color: theme.colors.textPrimary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      value={formData.xtreamUsername}
                      onChangeText={(text) =>
                        setFormData(prev => ({ ...prev, xtreamUsername: text }))
                      }
                      placeholder="username"
                      placeholderTextColor={theme.colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                      Senha
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.surfaceVariant,
                          color: theme.colors.textPrimary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      value={formData.xtreamPassword}
                      onChangeText={(text) =>
                        setFormData(prev => ({ ...prev, xtreamPassword: text }))
                      }
                      placeholder="password"
                      placeholderTextColor={theme.colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                    />
                  </View>
                </View>
              </>
            )}

            {/* Form Actions */}
            <View style={styles.formActions}>
              <Focusable
                onPress={() => {
                  setShowAddForm(false);
                  setFormData({ name: '', url: '', xtreamHost: '', xtreamUsername: '', xtreamPassword: '' });
                }}
                style={[styles.formButton, { backgroundColor: theme.colors.surfaceVariant }]}
                scaleOnFocus={false}
              >
                <Text style={[styles.formButtonText, { color: theme.colors.textSecondary }]}>
                  Cancelar
                </Text>
              </Focusable>
              <Focusable
                onPress={handleAddPlaylist}
                style={[styles.formButton, { backgroundColor: theme.colors.primary }]}
                scaleOnFocus={false}
              >
                <Text style={styles.formButtonTextWhite}>Adicionar</Text>
              </Focusable>
            </View>
          </View>
        )}

        {/* Playlists List */}
        {playlists.length > 0 ? (
          playlists.map((playlist) => (
            <View
              key={playlist.id}
              style={[
                styles.playlistCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderLeftWidth: activePlaylistId === playlist.id ? 4 : 0,
                  borderLeftColor: theme.colors.primary,
                },
              ]}
            >
              <View style={styles.playlistInfo}>
                <View style={styles.playlistHeader}>
                  <Text style={[styles.playlistName, { color: theme.colors.textPrimary }]}>
                    {playlist.name}
                  </Text>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: theme.colors.primary + '20' },
                    ]}
                  >
                    <Text style={[styles.typeBadgeText, { color: theme.colors.primary }]}>
                      {playlist.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.playlistUrl, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {playlist.type === 'xtream'
                    ? `${playlist.xtreamHost} • ${playlist.xtreamUsername}`
                    : playlist.url}
                </Text>

                <View style={styles.playlistMeta}>
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                    📺 {playlist.channelCount || 0} canais
                  </Text>
                  <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                    🔄 {formatDate(playlist.updatedAt)}
                  </Text>
                </View>
              </View>

              {/* Playlist Actions */}
              <View style={styles.playlistActions}>
                <Focusable
                  onPress={() => setActivePlaylist(playlist.id)}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        activePlaylistId === playlist.id
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant,
                    },
                  ]}
                  scaleOnFocus={false}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color:
                          activePlaylistId === playlist.id
                            ? '#FFF'
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {activePlaylistId === playlist.id ? '✓ Ativa' : 'Ativar'}
                  </Text>
                </Focusable>

                <Focusable
                  onPress={() => refreshPlaylist(playlist.id)}
                  style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]}
                  scaleOnFocus={false}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
                    🔄 Atualizar
                  </Text>
                </Focusable>

                <Focusable
                  onPress={() => handleRemovePlaylist(playlist)}
                  style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
                  scaleOnFocus={false}
                >
                  <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                    🗑 Remover
                  </Text>
                </Focusable>
              </View>
            </View>
          ))
        ) : (
          !showAddForm && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                Nenhuma playlist cadastrada
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                Adicione uma playlist M3U ou Xtream Codes para começar a assistir
              </Text>
              <Focusable
                onPress={() => setShowAddForm(true)}
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
                hasTVPreferredFocus
              >
                <Text style={styles.emptyButtonText}>+ Adicionar Primeira Playlist</Text>
              </Focusable>
            </View>
          )
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginLeft: 16,
  },
  addHeaderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addHeaderButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  // Loading
  loadingBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Add Form
  addForm: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  formButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  formButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formButtonTextWhite: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Playlist Card
  playlistCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playlistInfo: {
    marginBottom: 12,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  playlistUrl: {
    fontSize: 12,
    marginBottom: 8,
  },
  playlistMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
  },
  playlistActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 400,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PlaylistManagerScreen;
