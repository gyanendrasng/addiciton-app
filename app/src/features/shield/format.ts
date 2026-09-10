/** "9 pm", "midnight" — hours as people say them. */
export function fmtHour(h: number): string {
  if (h >= 24) return 'midnight';
  const x = h % 12 === 0 ? 12 : h % 12;
  return `${x} ${h < 12 ? 'am' : 'pm'}`;
}

/** "9:45 pm" */
export function fmtTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const x = h % 12 === 0 ? 12 : h % 12;
  return `${x}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
