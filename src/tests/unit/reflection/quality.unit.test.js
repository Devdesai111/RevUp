'use strict';

// ─── Task 45: quality.service unit tests (pure math, no mocks) ───────────────

const { calculateBaselineQuality, validateAIQualityScore } =
  require('../../../services/reflection/quality.service');

// Helper: generate a text with approximately N words
const wordsOf = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

describe('calculateBaselineQuality', () => {
  it('< 50 words gets baseline 20', () => {
    const { baselineScore, wordCount } = calculateBaselineQuality(wordsOf(30), new Date('2024-01-15T22:30:00'));
    expect(wordCount).toBe(30);
    expect(baselineScore).toBe(20);  // no time bonus at 22:30
  });

  it('< 50 words before 10PM gets baseline 25 (20 + 5 bonus)', () => {
    const { baselineScore } = calculateBaselineQuality(wordsOf(30), new Date('2024-01-15T20:00:00'));
    expect(baselineScore).toBe(25);
  });

  it('50-99 words gets baseline 40 (no bonus)', () => {
    const { baselineScore, wordCount } = calculateBaselineQuality(wordsOf(75), new Date('2024-01-15T22:30:00'));
    expect(wordCount).toBe(75);
    expect(baselineScore).toBe(40);
  });

  it('100-199 words gets baseline 60 (no bonus)', () => {
    const { baselineScore } = calculateBaselineQuality(wordsOf(150), new Date('2024-01-15T22:30:00'));
    expect(baselineScore).toBe(60);
  });

  it('200-299 words gets baseline 75 (no bonus)', () => {
    const { baselineScore } = calculateBaselineQuality(wordsOf(250), new Date('2024-01-15T22:30:00'));
    expect(baselineScore).toBe(75);
  });

  it('≥ 300 words gets baseline 85 (no bonus)', () => {
    const { baselineScore } = calculateBaselineQuality(wordsOf(350), new Date('2024-01-15T22:30:00'));
    expect(baselineScore).toBe(85);
  });

  it('250 words before 10PM → baseline 80 (75 + 5)', () => {
    const { baselineScore } = calculateBaselineQuality(wordsOf(250), new Date('2024-01-15T09:00:00'));
    expect(baselineScore).toBeGreaterThanOrEqual(75);  // master plan: "250-word text gets baseline 75+"
    expect(baselineScore).toBe(80);
  });

  it('defaults submittedAt to now (does not throw)', () => {
    expect(() => calculateBaselineQuality('hello world short text')).not.toThrow();
  });

  it('returns wordCount accurately', () => {
    const { wordCount } = calculateBaselineQuality('one two three four five', new Date('2024-01-15T22:30:00'));
    expect(wordCount).toBe(5);
  });
});

describe('validateAIQualityScore', () => {
  it('returns AI score when within ±20 of baseline', () => {
    expect(validateAIQualityScore(50, 60)).toBe(50);
    expect(validateAIQualityScore(60, 60)).toBe(60);
    expect(validateAIQualityScore(70, 60)).toBe(70);
  });

  it('clamps to baseline - 20 when AI score is too low', () => {
    expect(validateAIQualityScore(20, 60)).toBe(40);   // 20 < 60-20=40 → clamp to 40
    expect(validateAIQualityScore(0, 60)).toBe(40);
  });

  it('clamps to baseline + 20 when AI score is too high', () => {
    expect(validateAIQualityScore(100, 60)).toBe(80);  // 100 > 60+20=80 → clamp to 80
  });

  it('never returns below 0', () => {
    expect(validateAIQualityScore(-10, 10)).toBe(0);   // max(0, 10-20)=0
  });

  it('never returns above 100', () => {
    expect(validateAIQualityScore(110, 90)).toBe(100); // min(100, 90+20)=100
  });

  it('returns exact boundary values correctly', () => {
    expect(validateAIQualityScore(40, 60)).toBe(40);   // exactly at min boundary
    expect(validateAIQualityScore(80, 60)).toBe(80);   // exactly at max boundary
  });
});
