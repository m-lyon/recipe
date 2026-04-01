import { describe, expect, it } from 'vitest';

import { formatTime } from '@recipe/utils/time';

describe('formatTime', () => {
    it('formats minutes only', () => expect(formatTime(30)).toBe('30 min'));
    it('formats hours only', () => expect(formatTime(60)).toBe('1 hr'));
    it('formats hours and minutes', () => expect(formatTime(90)).toBe('1 hr 30 min'));
    it('formats 1 minute', () => expect(formatTime(1)).toBe('1 min'));
    it('formats multiple hours', () => expect(formatTime(150)).toBe('2 hr 30 min'));
});
