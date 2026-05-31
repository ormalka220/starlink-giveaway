import assert from 'node:assert/strict';
import test from 'node:test';
import { indexAtPointer, normalizeDegrees, targetAngleForIndex } from './wheelMath.ts';

const counts = [8, 11, 50];

for (const count of counts) {
  test(`round-trip index -> angle -> index for ${count} slices`, () => {
    for (let i = 0; i < count; i++) {
      const target = targetAngleForIndex(i, count, 0);
      const back = indexAtPointer(target, count);
      assert.equal(back, i, `index ${i} should round-trip at count ${count}, got ${back}, target=${target}`);
    }
  });
}

test('round-trip from non-zero starting angles', () => {
  const starts = [37, 180, 720, 1234.5];
  for (const start of starts) {
    for (let i = 0; i < 11; i++) {
      const target = targetAngleForIndex(i, 11, start);
      assert.equal(indexAtPointer(target, 11), i, `failed from start=${start}, index=${i}`);
    }
  }
});

test('normalizeDegrees wraps correctly', () => {
  assert.equal(normalizeDegrees(370), 10);
  assert.equal(normalizeDegrees(-10), 350);
});
