import React, { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { MedicalTheme } from '../constants/medicalTheme';
import DisclaimerFooter from '../components/DisclaimerFooter';
import ScreenHeader from '../components/ScreenHeader';
import {
  PredictionSession,
  clearPredictionHistory,
  deletePredictionSession,
  getPredictionHistory,
} from '../lib/storage';
import { RootStackParamList } from '../types/navigation';

type SessionCardProps = {
  session: PredictionSession;
  onView: () => void;
  onDelete: () => void;
};

type PendingHistoryAction =
  | { type: 'clear_all' }
  | { type: 'delete_one'; sessionId: string };

function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} | ${time}`;
}

function SessionCard({ session, onView, onDelete }: SessionCardProps) {
  const previewSymptoms = session.selectedSymptoms.slice(0, 6);
  const remainingCount = Math.max(0, session.selectedSymptoms.length - previewSymptoms.length);

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formatDate(session.createdAt)}</Text>
          <View style={styles.cardMetaRow}>
            <View style={styles.symptomCountBadge}>
              <Text style={styles.symptomCountText}>
                {session.selectedSymptoms.length} symptom
                {session.selectedSymptoms.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
              onPress={onDelete}
              hitSlop={8}
            >
              <Text style={styles.deleteButtonText}>X</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryTextBlock}>
            <Text style={styles.summaryLabel}>Recorded Symptoms</Text>
            <Text style={styles.modelsText}>
              {session.predictions.length} model{session.predictions.length !== 1 ? 's' : ''} run
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]}
            onPress={onView}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>

        <View style={styles.symptomsWrap}>
          {previewSymptoms.map((symptom) => (
            <View key={symptom} style={styles.symptomChip}>
              <Text style={styles.symptomChipText} numberOfLines={1}>
                {symptom}
              </Text>
            </View>
          ))}
          {remainingCount > 0 ? (
            <View style={styles.symptomChipMuted}>
              <Text style={styles.symptomChipMutedText}>+{remainingCount} more</Text>
            </View>
          ) : null}
        </View>

      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'History'>>();
  const [sessions, setSessions] = useState<PredictionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingHistoryAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPredictionHistory();
    setSessions(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = (id: string) => {
    setPendingAction({ type: 'delete_one', sessionId: id });
  };

  const handleClearAll = () => {
    setPendingAction({ type: 'clear_all' });
  };

  const handleOpenSession = (session: PredictionSession) => {
    navigation.navigate('Results', {
      mode: 'multi',
      predictions: session.predictions,
      selectedSymptoms: session.selectedSymptoms,
    });
  };

  const closeConfirmation = () => {
    setPendingAction(null);
  };

  const confirmHistoryAction = async () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === 'clear_all') {
      await clearPredictionHistory();
      setSessions([]);
      setPendingAction(null);
      return;
    }

    await deletePredictionSession(pendingAction.sessionId);
    setSessions((prev) => prev.filter((session) => session.id !== pendingAction.sessionId));
    setPendingAction(null);
  };

  const confirmationTitle =
    pendingAction?.type === 'clear_all' ? 'Remove all history?' : 'Remove this history?';
  const confirmationBody =
    pendingAction?.type === 'clear_all'
      ? 'This will permanently remove every saved history session.'
      : 'This will permanently remove this saved history session.';
  const confirmationButtonLabel =
    pendingAction?.type === 'clear_all' ? 'Remove All' : 'Remove';

  return (
    <View style={styles.root}>
      <ScreenHeader title="History" />
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Session History</Text>
              {sessions.length > 0 ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.clearAllButton,
                    pressed && styles.clearAllButtonPressed,
                  ]}
                  onPress={handleClearAll}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.subtitle}>
              {sessions.length > 0
                ? `${sessions.length} saved session${sessions.length !== 1 ? 's' : ''} | use View to reopen full results.`
                : 'Your past prediction sessions will appear here.'}
            </Text>
            <View style={styles.historyBanner}>
              <Ionicons name="time-outline" size={16} color={MedicalTheme.colors.teal} />
              <Text style={styles.historyBannerText}>
                Each session stores the selected symptoms and the number of models run. Full
                prediction details appear only after tapping View.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onView={() => handleOpenSession(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="time-outline" size={30} color={MedicalTheme.colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyBody}>
                Run a prediction and your session will be automatically saved here.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
                onPress={() => navigation.navigate('Predict')}
              >
                <Text style={styles.emptyButtonText}>Start a Prediction</Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      <DisclaimerFooter style={styles.footer} />

      <Modal
        transparent
        visible={!!pendingAction}
        animationType="fade"
        onRequestClose={closeConfirmation}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeConfirmation}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>{confirmationTitle}</Text>
            <Text style={styles.modalBody}>{confirmationBody}</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalPressed]}
                onPress={closeConfirmation}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalConfirmButton, pressed && styles.modalPressed]}
                onPress={confirmHistoryAction}
              >
                <Text style={styles.modalConfirmText}>{confirmationButtonLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MedicalTheme.colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.xl,
    flexGrow: 1,
    minWidth: '100%',
  },
  header: {
    marginBottom: MedicalTheme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
  },
  subtitle: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.alertRed + '35',
    backgroundColor: MedicalTheme.colors.alertRedBg,
  },
  clearAllButtonPressed: {
    opacity: 0.75,
  },
  clearAllText: {
    color: MedicalTheme.colors.alertRed,
    fontSize: 12,
    fontWeight: '700',
  },
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: MedicalTheme.colors.tealLight,
    borderRadius: MedicalTheme.radius.md,
    padding: MedicalTheme.spacing.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.teal + '20',
    marginTop: MedicalTheme.spacing.md,
  },
  historyBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MedicalTheme.colors.teal,
  },
  card: {
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    marginBottom: MedicalTheme.spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...MedicalTheme.shadow.md,
  },
  cardAccent: {
    width: 3,
    backgroundColor: MedicalTheme.colors.primary,
  },
  cardBody: {
    flex: 1,
    padding: MedicalTheme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: MedicalTheme.spacing.sm,
    gap: 12,
  },
  cardDate: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symptomCountBadge: {
    backgroundColor: MedicalTheme.colors.background,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
  },
  symptomCountText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: MedicalTheme.colors.background,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: MedicalTheme.colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: MedicalTheme.colors.border,
    marginBottom: MedicalTheme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  summaryTextBlock: {
    flex: 1,
    gap: 3,
  },
  summaryLabel: {
    color: MedicalTheme.colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modelsText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  symptomsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    maxWidth: '100%',
    backgroundColor: MedicalTheme.colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  symptomChipText: {
    color: MedicalTheme.colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
  symptomChipMuted: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: MedicalTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '25',
  },
  symptomChipMutedText: {
    color: MedicalTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: MedicalTheme.colors.primaryLight,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.primary + '30',
    marginTop: 8,
  },
  viewButtonPressed: {
    opacity: 0.78,
  },
  viewButtonText: {
    color: MedicalTheme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: MedicalTheme.spacing.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: MedicalTheme.colors.surface,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: MedicalTheme.spacing.lg,
    ...MedicalTheme.shadow.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MedicalTheme.colors.text,
    marginBottom: 8,
  },
  emptyBody: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: MedicalTheme.spacing.xl,
  },
  emptyButton: {
    backgroundColor: MedicalTheme.colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: MedicalTheme.radius.lg,
    ...MedicalTheme.shadow.sm,
  },
  emptyButtonPressed: {
    opacity: 0.85,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: MedicalTheme.spacing.lg,
    paddingBottom: MedicalTheme.spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: MedicalTheme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: MedicalTheme.colors.surface,
    borderRadius: MedicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    padding: MedicalTheme.spacing.lg,
    ...MedicalTheme.shadow.lg,
  },
  modalTitle: {
    color: MedicalTheme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalBody: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: MedicalTheme.spacing.lg,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: MedicalTheme.radius.md,
    borderWidth: 1,
    borderColor: MedicalTheme.colors.border,
    backgroundColor: MedicalTheme.colors.background,
  },
  modalConfirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: MedicalTheme.radius.md,
    backgroundColor: MedicalTheme.colors.alertRed,
  },
  modalCancelText: {
    color: MedicalTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalPressed: {
    opacity: 0.8,
  },
});
