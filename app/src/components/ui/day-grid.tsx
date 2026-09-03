import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/theme/palette';

/**
 * 90 days as dots. Fills the width it is given: dot size is derived from the
 * measured container width, `cols` and `gap`. `marks` overrides single days.
 */
export function DayGrid({
  lit = 1,
  marks,
  gap = 7,
  cols = 18,
  total = 90,
}: {
  lit?: number;
  marks?: Record<number, 'relapse' | 'today'>;
  gap?: number;
  cols?: number;
  total?: number;
}) {
  const [width, setWidth] = useState(0);
  const dot = width > 0 ? Math.floor((width - (cols - 1) * gap) / cols) : 0;
  return (
    <View style={styles.grid} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {dot > 0 &&
        Array.from({ length: total }, (_, i) => {
          const mark = marks?.[i];
          const color =
            mark === 'relapse' ? palette.danger : i < lit ? palette.accent : palette.surface3;
          return (
            <View
              key={i}
              style={{
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                marginRight: (i + 1) % cols === 0 ? 0 : gap,
                marginBottom: gap,
                backgroundColor: color,
                borderWidth: mark === 'today' ? 1.5 : 0,
                borderColor: palette.text,
              }}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'stretch' },
});
