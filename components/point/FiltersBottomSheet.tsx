import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import { Button } from '@/components/ui/Button';
import type { Theme } from '@/constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.72;
const ANIM_DURATION = 240;

/* ─── Types exportés ─────────────────────────────────────────────────── */

export type FilterSort = 'date_desc' | 'date_asc' | 'note_desc' | 'note_asc';
export type FilterPartnerStatus = 'all' | 'accepted' | 'pending' | 'rejected';
export type FilterMinNote = 0 | 5 | 7 | 9;
export type FilterPeriod = null | 7 | 30 | 365;

export interface FiltersState {
  minNote: FilterMinNote;
  partnerStatus: FilterPartnerStatus;
  period: FilterPeriod;
  sort: FilterSort;
}

export const DEFAULT_FILTERS: FiltersState = {
  minNote: 0,
  partnerStatus: 'all',
  period: null,
  sort: 'date_desc',
};

/** Nombre de filtres actifs (différents de leur valeur par défaut) */
export function countActiveFilters(f: FiltersState): number {
  let n = 0;
  if (f.minNote !== DEFAULT_FILTERS.minNote) n++;
  if (f.partnerStatus !== DEFAULT_FILTERS.partnerStatus) n++;
  if (f.period !== DEFAULT_FILTERS.period) n++;
  if (f.sort !== DEFAULT_FILTERS.sort) n++;
  return n;
}

/* ─── Composant ──────────────────────────────────────────────────────── */

interface Props {
  visible: boolean;
  filters: FiltersState;
  onApply: (f: FiltersState) => void;
  onClose: () => void;
}

export function FiltersBottomSheet({ visible, filters, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  /* État local — appliqué seulement au clic "Appliquer" */
  const [local, setLocal] = React.useState<FiltersState>(filters);

  /* Synchroniser l'état local quand le sheet s'ouvre */
  useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible]);

  /* Animation slide-from-bottom */
  const translateY = useRef(new Animated.Value(SHEET_H)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_H,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  function handleApply() {
    onApply(local);
    onClose();
  }

  function handleReset() {
    setLocal(DEFAULT_FILTERS);
  }

  /* ─── Helpers de rendu ── */

  function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <View style={styles.optionsRow}>{children}</View>
      </View>
    );
  }

  function Opt<T>({ value, current, onSelect, label }: {
    value: T; current: T; onSelect: (v: T) => void; label: string;
  }) {
    const active = value === current;
    return (
      <TouchableOpacity
        style={[styles.opt, active && styles.optActive]}
        onPress={() => onSelect(value)}
        activeOpacity={0.75}
      >
        <Text style={[styles.optText, active && styles.optTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 16 }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Titre */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filtres</Text>
        </View>

        {/* ── Statut du consentement ── */}
        <Section label="Statut">
          <Opt value="all" current={local.partnerStatus} onSelect={(v) => setLocal({ ...local, partnerStatus: v })} label="Tous" />
          <Opt value="accepted" current={local.partnerStatus} onSelect={(v) => setLocal({ ...local, partnerStatus: v })} label="Accepté" />
          <Opt value="pending" current={local.partnerStatus} onSelect={(v) => setLocal({ ...local, partnerStatus: v })} label="En attente" />
          <Opt value="rejected" current={local.partnerStatus} onSelect={(v) => setLocal({ ...local, partnerStatus: v })} label="Refusé" />
        </Section>

        {/* ── Note minimale ── */}
        <Section label="Note min.">
          <Opt value={0} current={local.minNote} onSelect={(v) => setLocal({ ...local, minNote: v })} label="Toutes" />
          <Opt value={5} current={local.minNote} onSelect={(v) => setLocal({ ...local, minNote: v })} label="5+" />
          <Opt value={7} current={local.minNote} onSelect={(v) => setLocal({ ...local, minNote: v })} label="7+" />
          <Opt value={9} current={local.minNote} onSelect={(v) => setLocal({ ...local, minNote: v })} label="9+" />
        </Section>

        {/* ── Période ── */}
        <Section label="Période">
          <Opt value={null} current={local.period} onSelect={(v) => setLocal({ ...local, period: v })} label="Tout" />
          <Opt value={7} current={local.period} onSelect={(v) => setLocal({ ...local, period: v })} label="7 jours" />
          <Opt value={30} current={local.period} onSelect={(v) => setLocal({ ...local, period: v })} label="30 jours" />
          <Opt value={365} current={local.period} onSelect={(v) => setLocal({ ...local, period: v })} label="12 mois" />
        </Section>

        {/* ── Tri ── */}
        <Section label="Tri">
          <Opt value="date_desc" current={local.sort} onSelect={(v) => setLocal({ ...local, sort: v })} label="Date ↓" />
          <Opt value="date_asc" current={local.sort} onSelect={(v) => setLocal({ ...local, sort: v })} label="Date ↑" />
          <Opt value="note_desc" current={local.sort} onSelect={(v) => setLocal({ ...local, sort: v })} label="Note ↓" />
          <Opt value="note_asc" current={local.sort} onSelect={(v) => setLocal({ ...local, sort: v })} label="Note ↑" />
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Button onPress={handleReset} variant="ghost" style={styles.footerBtn}>
            Réinitialiser
          </Button>
          <Button onPress={handleApply} variant="coral" style={styles.footerBtn}>
            Appliquer
          </Button>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */

const makeStyles = (T: Theme) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingHorizontal: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    backgroundColor: T.border,
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 24,
    letterSpacing: -0.5,
    color: T.text,
  },
  section: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  opt: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.border,
  },
  optActive: {
    borderColor: T.primary,
    backgroundColor: T.primary,
  },
  optText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  optTextActive: {
    color: T.text,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 20,
  },
  footerBtn: { flex: 1 },
});
