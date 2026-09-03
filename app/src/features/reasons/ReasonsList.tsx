import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { addReason, archiveReason, reorderReasons, updateReason, useReasons } from '@/db/repo/reasons';
import { springs } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const layout = LinearTransition.duration(springs.swap.duration);

export function ReasonsList({ compact = false }: { compact?: boolean }) {
  const { reasons } = useReasons();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const move = (i: number, dir: -1 | 1) => {
    const ids = reasons.map((r) => r.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorderReasons(ids);
  };

  return (
    <View style={s.wrap}>
      {reasons.map((r, i) => (
        <Animated.View key={r.id} layout={layout} style={s.row}>
          {editing === r.id ? (
            <TextInput
              value={editText}
              onChangeText={setEditText}
              autoFocus
              style={s.editInput}
              onBlur={async () => {
                const t = editText.trim();
                if (t && t !== r.text) await updateReason(r.id, t);
                setEditing(null);
              }}
              onSubmitEditing={async () => {
                const t = editText.trim();
                if (t && t !== r.text) await updateReason(r.id, t);
                setEditing(null);
              }}
            />
          ) : (
            <Tap
              haptic="none"
              style={s.textTap}
              onPress={() => {
                if (compact) return;
                setEditing(r.id);
                setEditText(r.text);
              }}>
              <Text style={s.text}>{r.text}</Text>
            </Tap>
          )}
          {!compact && (
            <View style={s.actions}>
              <Tap haptic="none" onPress={() => move(i, -1)} style={s.action} accessibilityLabel="Move up">
                <Text style={s.actionGlyph}>↑</Text>
              </Tap>
              <Tap haptic="none" onPress={() => move(i, 1)} style={s.action} accessibilityLabel="Move down">
                <Text style={s.actionGlyph}>↓</Text>
              </Tap>
              <Tap haptic="light" onPress={() => archiveReason(r.id)} style={s.action} accessibilityLabel="Remove">
                <Text style={[s.actionGlyph, { color: palette.textFaint }]}>×</Text>
              </Tap>
            </View>
          )}
        </Animated.View>
      ))}
      {!compact && (
        <Animated.View layout={layout} style={s.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a reason…"
            placeholderTextColor={palette.textFaint}
            style={s.addInput}
            returnKeyType="done"
            onSubmitEditing={async () => {
              const t = draft.trim();
              if (!t) return;
              await addReason(t);
              setDraft('');
            }}
          />
          <Tap
            haptic="light"
            onPress={async () => {
              const t = draft.trim();
              if (!t) return;
              await addReason(t);
              setDraft('');
            }}
            style={[s.addBtn, !draft.trim() && { opacity: 0.4 }]}>
            <Text style={s.addLabel}>Add</Text>
          </Tap>
        </Animated.View>
      )}
      {reasons.length === 0 && compact && <Text style={s.empty}>Add the reasons you’re doing this.</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface2,
    borderRadius: 12,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    minHeight: 52,
  },
  textTap: { flex: 1, paddingVertical: 12 },
  text: { color: palette.text, fontSize: 16, fontFamily: type.bodyMed, lineHeight: 22 },
  editInput: { flex: 1, color: palette.text, fontSize: 16, fontFamily: type.bodyMed, paddingVertical: 12 },
  actions: { flexDirection: 'row' },
  action: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  actionGlyph: { color: palette.textDim, fontSize: 18 },
  addRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  addInput: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: palette.surface2,
    color: palette.text,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: type.body,
  },
  addBtn: { height: 52, paddingHorizontal: 18, borderRadius: 12, backgroundColor: hues.reasons.solid, justifyContent: 'center' },
  addLabel: { color: hues.reasons.ink, fontFamily: type.bodySemi, fontSize: 15 },
  empty: { color: palette.textFaint, fontFamily: type.body, fontSize: 14 },
});
