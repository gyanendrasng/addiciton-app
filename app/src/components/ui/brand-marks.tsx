import Svg, { Path } from 'react-native-svg';

/**
 * Third-party sign-in marks.
 *
 * Both are the official artwork, reproduced as vectors so they stay crisp and
 * need no bundled PNGs. Neither may be recoloured, restyled or redrawn —
 * Google's and Apple's brand guidelines both forbid it, and a wrong mark is a
 * review rejection.
 */

/** Google's four-colour "G". Full colour only, on a light or dark surface. */
export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}

/**
 * The Apple logo, for the rare case a custom button is needed.
 *
 * The sign-in screen uses Apple's own `AppleAuthenticationButton` instead —
 * their HIG requires it where it's available, and it draws this mark itself.
 */
export function AppleMark({ size = 20, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.05 12.54c-.02-2.24 1.83-3.32 1.91-3.37-1.04-1.52-2.66-1.73-3.23-1.75-1.38-.14-2.69.81-3.39.81-.7 0-1.78-.79-2.93-.77-1.5.02-2.89.87-3.66 2.22-1.56 2.71-.4 6.72 1.12 8.92.74 1.07 1.63 2.27 2.8 2.23 1.12-.05 1.55-.72 2.9-.72 1.35 0 1.73.72 2.91.7 1.2-.02 1.97-1.09 2.71-2.17.85-1.24 1.2-2.44 1.22-2.5-.03-.01-2.34-.9-2.36-3.6z"
      />
      <Path
        fill={color}
        d="M14.86 5.6c.61-.74 1.02-1.77.91-2.8-.88.04-1.95.59-2.58 1.33-.57.65-1.06 1.7-.93 2.7.98.08 1.99-.5 2.6-1.23z"
      />
    </Svg>
  );
}
