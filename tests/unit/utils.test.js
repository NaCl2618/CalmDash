import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load utils.js and execute it to define functions
const utilsCode = readFileSync(join(process.cwd(), 'app/js/utils.js'), 'utf-8');

// Use Function constructor to load the code and export functions
const setupUtils = new Function(utilsCode + '\nreturn { generateUUID, escapeHTML, formatDate, formatTime, getTimeSelectorHTML };');
const utils = setupUtils();

// Assign to global scope
const { generateUUID, escapeHTML, formatDate, formatTime, getTimeSelectorHTML } = utils;
global.generateUUID = generateUUID;
global.escapeHTML = escapeHTML;
global.formatDate = formatDate;
global.formatTime = formatTime;
global.getTimeSelectorHTML = getTimeSelectorHTML;

describe('Utils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate UUIDs of correct length', () => {
      const uuid = generateUUID();
      expect(uuid.length).toBe(36); // 32 chars + 4 hyphens
    });
  });

  describe('escapeHTML', () => {
    it('should escape ampersand', () => {
      expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than sign', () => {
      expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
    });

    it('should escape greater than sign', () => {
      expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
    });

    it('should escape double quotes', () => {
      expect(escapeHTML('Say "Hello"')).toBe('Say &quot;Hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHTML("It's fine")).toBe("It&#39;s fine");
    });

    it('should escape all special characters together', () => {
      const malicious = '<script>alert("XSS & hack\'s")</script>';
      const escaped = escapeHTML(malicious);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS &amp; hack&#39;s&quot;)&lt;/script&gt;');
    });

    it('should handle empty string', () => {
      expect(escapeHTML('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(escapeHTML(null)).toBe('');
      expect(escapeHTML(undefined)).toBe('');
    });

    it('should not modify safe strings', () => {
      expect(escapeHTML('Hello World')).toBe('Hello World');
    });

    it('should convert non-string values to string', () => {
      expect(escapeHTML(123)).toBe('123');
    });
  });

  describe('formatDate', () => {
    it('should format date with YYYY', () => {
      const date = new Date('2026-03-15');
      const formatted = formatDate(date, 'YYYY');
      expect(formatted).toBe('2026');
    });

    it('should format date with MM', () => {
      const date = new Date('2026-03-15');
      const formatted = formatDate(date, 'MM');
      expect(formatted).toBe('03');
    });

    it('should format date with DD', () => {
      const date = new Date('2026-03-05');
      const formatted = formatDate(date, 'DD');
      expect(formatted).toBe('05');
    });

    it('should format date with day of week (ddd)', () => {
      const date = new Date('2026-01-29'); // Thursday
      const formatted = formatDate(date, 'ddd');
      expect(formatted).toBe('목');
    });

    it('should format complete date pattern', () => {
      const date = new Date('2026-01-29'); // Thursday
      const formatted = formatDate(date, 'YYYY. MM. DD. (ddd)');
      expect(formatted).toBe('2026. 01. 29. (목)');
    });

    it('should handle different date patterns', () => {
      const date = new Date('2026-12-25');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-12-25');
      expect(formatDate(date, 'DD/MM/YYYY')).toBe('25/12/2026');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2026-01-05');
      const formatted = formatDate(date, 'YYYY. MM. DD.');
      expect(formatted).toBe('2026. 01. 05.');
    });
  });

  describe('formatTime', () => {
    it('should format time with 24-hour format (HH:mm)', () => {
      const date = new Date('2026-01-29T14:30:00');
      const formatted = formatTime(date, 'HH:mm');
      expect(formatted).toBe('14:30');
    });

    it('should pad single digit hours and minutes', () => {
      const date = new Date('2026-01-29T09:05:00');
      const formatted = formatTime(date, 'HH:mm');
      expect(formatted).toBe('09:05');
    });

    it('should format time with 12-hour format (hh:mm)', () => {
      const date = new Date('2026-01-29T14:30:00');
      const formatted = formatTime(date, 'hh:mm');
      expect(formatted).toBe('02:30');
    });

    it('should format time with AM/PM indicator', () => {
      const morningDate = new Date('2026-01-29T09:30:00');
      expect(formatTime(morningDate, 'A hh:mm')).toBe('오전 09:30');

      const afternoonDate = new Date('2026-01-29T14:30:00');
      expect(formatTime(afternoonDate, 'A hh:mm')).toBe('오후 02:30');
    });

    it('should handle midnight correctly', () => {
      const midnight = new Date('2026-01-29T00:00:00');
      expect(formatTime(midnight, 'HH:mm')).toBe('00:00');
      expect(formatTime(midnight, 'A hh:mm')).toBe('오전 12:00');
    });

    it('should handle noon correctly', () => {
      const noon = new Date('2026-01-29T12:00:00');
      expect(formatTime(noon, 'HH:mm')).toBe('12:00');
      expect(formatTime(noon, 'A hh:mm')).toBe('오후 12:00');
    });

    it('should format complete time pattern', () => {
      const date = new Date('2026-01-29T15:45:00');
      const formatted = formatTime(date, 'A hh:mm');
      expect(formatted).toBe('오후 03:45');
    });
  });

  describe('getTimeSelectorHTML', () => {
    it('should generate HTML with default values', () => {
      const html = getTimeSelectorHTML('start');
      expect(html).toContain('name="start_hour"');
      expect(html).toContain('name="start_min"');
      expect(html).toContain('selected>08시');
      expect(html).toContain('selected>00분');
    });

    it('should generate HTML with custom default values', () => {
      const html = getTimeSelectorHTML('end', '14', '30');
      expect(html).toContain('selected>14시');
      expect(html).toContain('selected>30분');
    });

    it('should include all 24 hours', () => {
      const html = getTimeSelectorHTML('test');
      for (let i = 0; i < 24; i++) {
        const hour = String(i).padStart(2, '0');
        expect(html).toContain(`<option value="${hour}"`);
      }
    });

    it('should include 5-minute intervals', () => {
      const html = getTimeSelectorHTML('test');
      const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
      minutes.forEach(min => {
        expect(html).toContain(`<option value="${min}"`);
      });
    });

    it('should have proper select element structure', () => {
      const html = getTimeSelectorHTML('test');
      expect(html).toContain('<select');
      expect(html).toContain('class="flex-grow p-2 border-2 border-black font-mono"');
      expect(html).toContain('</select>');
    });

    it('should include separator between hour and minute', () => {
      const html = getTimeSelectorHTML('test');
      expect(html).toContain('<span class="font-bold">:</span>');
    });
  });
});
