import { describe, it, expect } from 'vitest';

describe('Smoke Test', () => {
  it('should pass basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have correct environment', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});
