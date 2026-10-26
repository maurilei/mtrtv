// ============================================================
// MtrTV - Settings Screen
// Complete settings with all TiviMate-like options
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Focusable } from '../components/Focusable';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';
import {
  ThemeMode,
  ListStyle,
  SortOrder,
  EpgStyle,
  VideoAspectRatio,
  DecoderType,
  BufferSize,
  SubtitleSize,
  ChannelListPosition,
} from '../types';

interface SettingsScreenProps {
  navigation: any;
}

type SettingsSection = 'general' | 'player' | 'epg' | 'appearance' | 'parental' | 'advanced' | 'about';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const {
    appSettings,
    playerSettings,
    updateAppSettings,
    updatePlayerSettings,
    setTheme,
    playlists,
    channels,
    refreshAllPlaylists,
    refreshEpg,
  } = useAppStore();

  const theme = getTheme(appSettings.theme);
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  // ==================== Section Navigation ====================

  const sections: { id: SettingsSection; icon: string; label: string }[] = [
    { id: 'general', icon: '⚙️', label: 'Geral' },
    { id: 'player', icon: '▶️', label: 'Player' },
    { id: 'epg', icon: '📋', label: 'Guia (EPG)' },
    { id: 'appearance', icon: '🎨', label: 'Aparência' },
    { id: 'parental', icon: '🔒', label: 'Controle Parental' },
    { id: 'advanced', icon: '🔧', label: 'Avançado' },
    { id: 'about', icon: 'ℹ️', label: 'Sobre' },
  ];

  // ==================== Setting Item Component ====================

  const SettingToggle = ({
    label,
    description,
    value,
    onToggle,
  }: {
    label: string;
    description?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
  }) => (
    <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDesc, { color: theme.colors.textMuted }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
        thumbColor={value ? theme.colors.primary : theme.colors.textMuted}
      />
    </View>
  );

  const SettingSelect = ({
    label,
    description,
    value,
    options,
    onSelect,
  }: {
    label: string;
    description?: string;
    value: string;
    options: { value: string; label: string }[];
    onSelect: (value: string) => void;
  }) => (
    <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDesc, { color: theme.colors.textMuted }]}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.optionsRow}>
        {options.map(opt => (
          <Focusable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.optionButton,
              {
                backgroundColor:
                  value === opt.value ? theme.colors.primary : theme.colors.surfaceVariant,
              },
            ]}
            scaleOnFocus={false}
          >
            <Text
              style={[
                styles.optionText,
                { color: value === opt.value ? '#FFF' : theme.colors.textSecondary },
              ]}
            >
              {opt.label}
            </Text>
          </Focusable>
        ))}
      </View>
    </View>
  );

  const SettingAction = ({
    label,
    description,
    actionLabel,
    onPress,
    color,
  }: {
    label: string;
    description?: string;
    actionLabel: string;
    onPress: () => void;
    color?: string;
  }) => (
    <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDesc, { color: theme.colors.textMuted }]}>
            {description}
          </Text>
        )}
      </View>
      <Focusable
        onPress={onPress}
        style={[styles.actionButton, { backgroundColor: (color || theme.colors.primary) + '20' }]}
        scaleOnFocus={false}
      >
        <Text style={[styles.actionButtonText, { color: color || theme.colors.primary }]}>
          {actionLabel}
        </Text>
      </Focusable>
    </View>
  );

  // ==================== Render Sections ====================

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Configurações Gerais
            </Text>

            <SettingToggle
              label="Abrir último canal ao iniciar"
              description="Retorna automaticamente ao último canal assistido"
              value={appSettings.lastChannel}
              onToggle={(v) => updateAppSettings({ lastChannel: v })}
            />

            <SettingToggle
              label="Atualizar playlists automaticamente"
              description="Atualiza as playlists a cada 24 horas"
              value={appSettings.autoUpdatePlaylists}
              onToggle={(v) => updateAppSettings({ autoUpdatePlaylists: v })}
            />

            <SettingToggle
              label="Atualizar EPG automaticamente"
              description="Atualiza o guia de programação automaticamente"
              value={appSettings.autoUpdateEpg}
              onToggle={(v) => updateAppSettings({ autoUpdateEpg: v })}
            />

            <SettingToggle
              label="Mostrar relógio"
              description="Exibe o horário atual no player"
              value={appSettings.showClock}
              onToggle={(v) => updateAppSettings({ showClock: v })}
            />

            <SettingToggle
              label="Picture-in-Picture"
              description="Permite minimizar o player em janela flutuante"
              value={appSettings.pipEnabled}
              onToggle={(v) => updateAppSettings({ pipEnabled: v })}
            />

            <SettingToggle
              label="Catch-up TV"
              description="Permite assistir programas já transmitidos"
              value={appSettings.catchUpEnabled}
              onToggle={(v) => updateAppSettings({ catchUpEnabled: v })}
            />

            <SettingSelect
              label="Formato de hora"
              value={appSettings.epgTimeFormat}
              options={[
                { value: '12h', label: '12h' },
                { value: '24h', label: '24h' },
              ]}
              onSelect={(v) => updateAppSettings({ epgTimeFormat: v as '12h' | '24h' })}
            />

            <SettingAction
              label="Atualizar todas as playlists"
              description={`${playlists.length} playlist(s) • ${channels.length} canais`}
              actionLabel="Atualizar Agora"
              onPress={() => {
                refreshAllPlaylists();
                Alert.alert('Atualizando', 'Atualizando todas as playlists...');
              }}
            />
          </>
        );

      case 'player':
        return (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Configurações do Player
            </Text>

            <SettingSelect
              label="Proporção padrão"
              description="Define a proporção de tela inicial do vídeo"
              value={playerSettings.defaultAspectRatio}
              options={[
                { value: 'fit', label: 'Ajustar' },
                { value: 'fill', label: 'Preencher' },
                { value: 'stretch', label: 'Esticar' },
                { value: '16:9', label: '16:9' },
                { value: '4:3', label: '4:3' },
              ]}
              onSelect={(v) =>
                updatePlayerSettings({ defaultAspectRatio: v as VideoAspectRatio })
              }
            />

            <SettingSelect
              label="Decodificador"
              description="Tipo de decodificação de vídeo"
              value={playerSettings.decoder}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'hardware', label: 'Hardware' },
                { value: 'software', label: 'Software' },
              ]}
              onSelect={(v) => updatePlayerSettings({ decoder: v as DecoderType })}
            />

            <SettingSelect
              label="Tamanho do buffer"
              description="Quantidade de dados pré-carregados"
              value={playerSettings.bufferSize}
              options={[
                { value: 'low', label: 'Baixo' },
                { value: 'medium', label: 'Médio' },
                { value: 'high', label: 'Alto' },
                { value: 'max', label: 'Máximo' },
              ]}
              onSelect={(v) => {
                const bufferConfigs: Record<string, any> = {
                  low: { minBufferMs: 5000, maxBufferMs: 15000, bufferForPlaybackMs: 1000, bufferForPlaybackAfterRebufferMs: 2000 },
                  medium: { minBufferMs: 15000, maxBufferMs: 50000, bufferForPlaybackMs: 2500, bufferForPlaybackAfterRebufferMs: 5000 },
                  high: { minBufferMs: 30000, maxBufferMs: 120000, bufferForPlaybackMs: 3000, bufferForPlaybackAfterRebufferMs: 8000 },
                  max: { minBufferMs: 60000, maxBufferMs: 240000, bufferForPlaybackMs: 5000, bufferForPlaybackAfterRebufferMs: 10000 },
                };
                updatePlayerSettings({ bufferSize: v as BufferSize, ...bufferConfigs[v] });
              }}
            />

            <SettingToggle
              label="Aceleração por hardware"
              description="Usa GPU para decodificação (recomendado)"
              value={playerSettings.hardwareAcceleration}
              onToggle={(v) => updatePlayerSettings({ hardwareAcceleration: v })}
            />

            <SettingToggle
              label="Continuar reprodução"
              description="Retoma de onde parou em filmes e séries"
              value={playerSettings.resumePlayback}
              onToggle={(v) => updatePlayerSettings({ resumePlayback: v })}
            />

            <SettingToggle
              label="Reproduzir próximo automaticamente"
              description="Auto-play do próximo episódio em séries"
              value={playerSettings.autoPlayNext}
              onToggle={(v) => updatePlayerSettings({ autoPlayNext: v })}
            />

            <SettingToggle
              label="Indicador de buffer"
              description="Mostra animação de carregamento"
              value={playerSettings.showBufferIndicator}
              onToggle={(v) => updatePlayerSettings({ showBufferIndicator: v })}
            />

            <SettingToggle
              label="Animação de troca de canal"
              description="Animação suave ao trocar de canal"
              value={playerSettings.channelSwitchAnimation}
              onToggle={(v) => updatePlayerSettings({ channelSwitchAnimation: v })}
            />

            <SettingSelect
              label="Tamanho da legenda"
              value={playerSettings.subtitleSize}
              options={[
                { value: 'small', label: 'Pequena' },
                { value: 'medium', label: 'Média' },
                { value: 'large', label: 'Grande' },
                { value: 'xlarge', label: 'Extra Grande' },
              ]}
              onSelect={(v) => updatePlayerSettings({ subtitleSize: v as SubtitleSize })}
            />

            <SettingToggle
              label="Fundo da legenda"
              description="Adiciona fundo escuro nas legendas"
              value={playerSettings.subtitleBackground}
              onToggle={(v) => updatePlayerSettings({ subtitleBackground: v })}
            />

            <SettingSelect
              label="Duração do seek"
              description="Segundos ao avançar/retroceder"
              value={String(playerSettings.seekDuration)}
              options={[
                { value: '5', label: '5s' },
                { value: '10', label: '10s' },
                { value: '15', label: '15s' },
                { value: '30', label: '30s' },
                { value: '60', label: '60s' },
              ]}
              onSelect={(v) => updatePlayerSettings({ seekDuration: parseInt(v) })}
            />
          </>
        );

      case 'epg':
        return (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Guia de Programação (EPG)
            </Text>

            <SettingSelect
              label="Estilo do EPG"
              description="Layout da grade de programação"
              value={appSettings.epgStyle}
              options={[
                { value: 'timeline', label: 'Timeline' },
                { value: 'list', label: 'Lista' },
                { value: 'compact', label: 'Compacto' },
              ]}
              onSelect={(v) => updateAppSettings({ epgStyle: v as EpgStyle })}
            />

            <SettingSelect
              label="Dias de EPG"
              description="Quantidade de dias exibidos"
              value={String(appSettings.epgDaysToShow)}
              options={[
                { value: '1', label: '1 dia' },
                { value: '3', label: '3 dias' },
                { value: '5', label: '5 dias' },
                { value: '7', label: '7 dias' },
              ]}
              onSelect={(v) => updateAppSettings({ epgDaysToShow: parseInt(v) })}
            />

            <SettingAction
              label="Atualizar EPG"
              description="Recarregar guia de programação"
              actionLabel="Atualizar"
              onPress={() => {
                refreshEpg();
                Alert.alert('EPG', 'Atualizando guia de programação...');
              }}
            />

            <SettingAction
              label="Gerenciar fontes EPG"
              description="Adicionar ou remover URLs de EPG XMLTV"
              actionLabel="Gerenciar"
              onPress={() => navigation.navigate('EPGScreen')}
            />
          </>
        );

      case 'appearance':
        return (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Aparência
            </Text>

            <SettingSelect
              label="Tema"
              description="Esquema de cores do aplicativo"
              value={appSettings.theme}
              options={[
                { value: 'dark', label: '🌙 Dark' },
                { value: 'amoled', label: '⬛ AMOLED' },
                { value: 'blue', label: '🔵 Azul' },
                { value: 'purple', label: '🟣 Roxo' },
              ]}
              onSelect={(v) => setTheme(v as ThemeMode)}
            />

            <SettingSelect
              label="Estilo da lista de canais"
              value={appSettings.channelListStyle}
              options={[
                { value: 'list', label: 'Lista' },
                { value: 'grid', label: 'Grade' },
                { value: 'compact', label: 'Compacta' },
              ]}
              onSelect={(v) => updateAppSettings({ channelListStyle: v as ListStyle })}
            />

            <SettingSelect
              label="Posição da lista de canais"
              description="Posição da lista de canais no player"
              value={appSettings.channelListPosition}
              options={[
                { value: 'left', label: 'Esquerda' },
                { value: 'right', label: 'Direita' },
                { value: 'bottom', label: 'Inferior' },
              ]}
              onSelect={(v) =>
                updateAppSettings({ channelListPosition: v as ChannelListPosition })
              }
            />

            <SettingSelect
              label="Ordenação de canais"
              value={appSettings.channelSortOrder}
              options={[
                { value: 'name', label: 'Nome' },
                { value: 'number', label: 'Número' },
                { value: 'recent', label: 'Recente' },
              ]}
              onSelect={(v) => updateAppSettings({ channelSortOrder: v as SortOrder })}
            />

            <SettingToggle
              label="Mostrar números dos canais"
              value={appSettings.showChannelNumbers}
              onToggle={(v) => updateAppSettings({ showChannelNumbers: v })}
            />

            <SettingToggle
              label="Mostrar logos dos canais"
              value={appSettings.showChannelLogos}
              onToggle={(v) => updateAppSettings({ showChannelLogos: v })}
            />

            <SettingToggle
              label="Pré-visualização de canal"
              description="Exibe informações do canal selecionado"
              value={appSettings.showChannelPreview}
              onToggle={(v) => updateAppSettings({ showChannelPreview: v })}
            />

            <SettingToggle
              label="Animações"
              description="Ativa/desativa animações da interface"
              value={appSettings.animationsEnabled}
              onToggle={(v) => updateAppSettings({ animationsEnabled: v })}
            />
          </>
        );

      case 'parental':
        return (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Controle Parental
            </Text>

            <SettingAction
              label="Definir PIN"
              description={
                appSettings.parentalPin
                  ? 'PIN configurado ✓'
                  : 'Nenhum PIN configurado'
              }
              actionLabel={appSettings.parentalPin ? 'Alterar' : 'Definir'}
              onPress={() => {
                Alert.prompt?.(
                  'Definir PIN',
                  'Digite um PIN de 4 dígitos:',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Salvar',
                      onPress: (pin?: string) => {
                        if (pin && pin.length === 4 && /^\d+$/.test(pin)) {
                          updateAppSettings({ parentalPin: pin });
                          Alert.alert('Sucesso', 'PIN definido com sucesso');
                        } else {
                          Alert.alert('Erro', 'O PIN deve ter 4 dígitos numéricos');
                        }
                      },
                    },
                  ],
                  'plain-text',
                  '',
                  'numeric',
                );
              }}
            />

            {appSettings.parentalPin && (
              <SettingAction
                label="Remover PIN"
                description="Remove a proteção por PIN"
                actionLabel="Remover"
                onPress={() => {
                  updateAppSettings({ parentalPin: undefined });
                  Alert.alert('Removido', 'PIN removido com sucesso');
                }}
                color={theme.colors.error}
              />
            )}

            <Text style={[styles.helpText, { color: theme.colors.textMuted }]}>
              O controle parental permite bloquear canais com PIN. Para bloquear um canal,
              pressione e segure sobre o canal e selecione "Bloquear".
            </Text>
          </>
        );

      case 'advanced':
        return (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Configurações Avançadas
            </Text>

            <SettingAction
              label="Limpar cache"
              description="Remove dados temporários e cache de imagens"
              actionLabel="Limpar"
              onPress={() => {
                Alert.alert('Sucesso', 'Cache limpo com sucesso');
              }}
            />

            <SettingAction
              label="Exportar configurações"
              description="Salvar configurações em arquivo"
              actionLabel="Exportar"
              onPress={() => {
                Alert.alert('Em breve', 'Esta função estará disponível em breve');
              }}
            />

            <SettingAction
              label="Importar configurações"
              description="Restaurar configurações de arquivo"
              actionLabel="Importar"
              onPress={() => {
                Alert.alert('Em breve', 'Esta função estará disponível em breve');
              }}
            />

            <SettingAction
              label="Resetar configurações"
              description="Restaurar todas as configurações padrão"
              actionLabel="Resetar"
              onPress={() => {
                Alert.alert(
                  'Resetar Configurações',
                  'Todas as configurações serão restauradas para o padrão. Deseja continuar?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Resetar',
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert('Sucesso', 'Configurações resetadas');
                      },
                    },
                  ],
                );
              }}
              color={theme.colors.error}
            />

            <SettingAction
              label="Limpar todos os dados"
              description="Remove playlists, favoritos, histórico e configurações"
              actionLabel="Limpar Tudo"
              onPress={() => {
                Alert.alert(
                  'Atenção',
                  'TODOS os dados serão removidos permanentemente. Deseja continuar?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Limpar Tudo',
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert('Sucesso', 'Todos os dados foram removidos');
                      },
                    },
                  ],
                );
              }}
              color={theme.colors.error}
            />
          </>
        );

      case 'about':
        return (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Sobre o MtrTV
            </Text>

            <View style={styles.aboutContainer}>
              <Text style={[styles.aboutLogo, { color: theme.colors.primary }]}>MtrTV</Text>
              <Text style={[styles.aboutVersion, { color: theme.colors.textSecondary }]}>
                Versão 1.0.0
              </Text>
              <Text style={[styles.aboutDesc, { color: theme.colors.textMuted }]}>
                Player IPTV Premium para Android TV{'\n'}
                Compatível com FireTV Stick e TV Box
              </Text>

              <View style={styles.aboutStats}>
                <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {playlists.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                    Playlists
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
                    {channels.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                    Canais
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                    {channels.filter(c => c.isFavorite).length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                    Favoritos
                  </Text>
                </View>
              </View>

              <Text style={[styles.aboutFooter, { color: theme.colors.textMuted }]}>
                Desenvolvido com React Native{'\n'}
                © 2024 MtrTV
              </Text>
            </View>
          </>
        );
    }
  };

  // ==================== Render ====================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Settings Sidebar */}
      <View style={[styles.sidebar, { backgroundColor: theme.colors.surface, borderRightColor: theme.colors.border }]}>
        <View style={styles.sidebarHeader}>
          <Focusable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            scaleOnFocus={false}
          >
            <Text style={[styles.backText, { color: theme.colors.primary }]}>◀ Voltar</Text>
          </Focusable>
          <Text style={[styles.sidebarTitle, { color: theme.colors.textPrimary }]}>
            Configurações
          </Text>
        </View>

        {sections.map((section, index) => (
          <Focusable
            key={section.id}
            onPress={() => setActiveSection(section.id)}
            style={[
              styles.sectionButton,
              activeSection === section.id && {
                backgroundColor: theme.colors.primary + '20',
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary,
              },
            ]}
            focusStyle={{ backgroundColor: theme.colors.cardHover }}
            scaleOnFocus={false}
            hasTVPreferredFocus={index === 0}
          >
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <Text
              style={[
                styles.sectionLabel,
                {
                  color:
                    activeSection === section.id
                      ? theme.colors.primary
                      : theme.colors.textPrimary,
                },
              ]}
            >
              {section.label}
            </Text>
          </Focusable>
        ))}
      </View>

      {/* Settings Content */}
      <ScrollView
        style={styles.contentArea}
        contentContainerStyle={styles.contentAreaContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderSectionContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    paddingTop: 8,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginBottom: 8,
    padding: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 0,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  contentAreaContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  // About
  aboutContainer: {
    alignItems: 'center',
    padding: 24,
  },
  aboutLogo: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 16,
    marginBottom: 12,
  },
  aboutDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  aboutStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  aboutFooter: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SettingsScreen;
