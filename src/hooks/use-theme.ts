/**
 * The app is dark-only (Eclipse & Moss). Keep this hook so screens do not need
 * to know that light mode no longer exists.
 */

import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors.dark;
}
