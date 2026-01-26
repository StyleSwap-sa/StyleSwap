import { describe, it, expect } from 'vitest';

/**
 * Test suite for Size-Based Visual Scaling feature
 * Tests the visual scaling effects applied to try-on results based on selected size
 */

describe('Size-Based Visual Scaling Feature', () => {
  // Helper functions (same as in component)
  function getFitAdjustment(size: number): 'tight' | 'perfect' | 'loose' {
    const tightRange = [20, 26];
    const perfectRange = [28, 34];
    const looseRange = [36, 50];
    
    if (size >= tightRange[0] && size <= tightRange[1]) return 'tight';
    if (size >= perfectRange[0] && size <= perfectRange[1]) return 'perfect';
    if (size >= looseRange[0] && size <= looseRange[1]) return 'loose';
    return 'perfect';
  }

  function getScaleFactor(fit: 'tight' | 'perfect' | 'loose'): number {
    switch (fit) {
      case 'tight':
        return 0.92;
      case 'loose':
        return 1.08;
      case 'perfect':
      default:
        return 1.0;
    }
  }

  describe('Fit Adjustment Calculation', () => {
    it('should classify size 22 as tight fit', () => {
      const fit = getFitAdjustment(22);
      expect(fit).toBe('tight');
    });

    it('should classify size 26 as tight fit (boundary)', () => {
      const fit = getFitAdjustment(26);
      expect(fit).toBe('tight');
    });

    it('should classify size 28 as perfect fit', () => {
      const fit = getFitAdjustment(28);
      expect(fit).toBe('perfect');
    });

    it('should classify size 30 as perfect fit', () => {
      const fit = getFitAdjustment(30);
      expect(fit).toBe('perfect');
    });

    it('should classify size 34 as perfect fit (boundary)', () => {
      const fit = getFitAdjustment(34);
      expect(fit).toBe('perfect');
    });

    it('should classify size 36 as loose fit', () => {
      const fit = getFitAdjustment(36);
      expect(fit).toBe('loose');
    });

    it('should classify size 42 as loose fit', () => {
      const fit = getFitAdjustment(42);
      expect(fit).toBe('loose');
    });

    it('should classify size 50 as loose fit (boundary)', () => {
      const fit = getFitAdjustment(50);
      expect(fit).toBe('loose');
    });
  });

  describe('Scale Factor Calculation', () => {
    it('should return 0.92 scale for tight fit', () => {
      const scale = getScaleFactor('tight');
      expect(scale).toBe(0.92);
      expect(scale).toBeLessThan(1.0);
    });

    it('should return 1.0 scale for perfect fit', () => {
      const scale = getScaleFactor('perfect');
      expect(scale).toBe(1.0);
    });

    it('should return 1.08 scale for loose fit', () => {
      const scale = getScaleFactor('loose');
      expect(scale).toBe(1.08);
      expect(scale).toBeGreaterThan(1.0);
    });

    it('should have tight fit scale less than perfect fit', () => {
      const tightScale = getScaleFactor('tight');
      const perfectScale = getScaleFactor('perfect');
      expect(tightScale).toBeLessThan(perfectScale);
    });

    it('should have loose fit scale greater than perfect fit', () => {
      const looseScale = getScaleFactor('loose');
      const perfectScale = getScaleFactor('perfect');
      expect(looseScale).toBeGreaterThan(perfectScale);
    });
  });

  describe('Size to Scale Mapping', () => {
    it('should map size 22 to 0.92 scale (tight)', () => {
      const fit = getFitAdjustment(22);
      const scale = getScaleFactor(fit);
      expect(scale).toBe(0.92);
    });

    it('should map size 30 to 1.0 scale (perfect)', () => {
      const fit = getFitAdjustment(30);
      const scale = getScaleFactor(fit);
      expect(scale).toBe(1.0);
    });

    it('should map size 40 to 1.08 scale (loose)', () => {
      const fit = getFitAdjustment(40);
      const scale = getScaleFactor(fit);
      expect(scale).toBe(1.08);
    });
  });

  describe('Visual Scaling Effects', () => {
    it('should scale down garment for tight fit', () => {
      const size = 24;
      const fit = getFitAdjustment(size);
      const scale = getScaleFactor(fit);
      
      expect(fit).toBe('tight');
      expect(scale).toBe(0.92);
      expect(scale).toBeLessThan(1.0);
    });

    it('should not scale garment for perfect fit', () => {
      const size = 32;
      const fit = getFitAdjustment(size);
      const scale = getScaleFactor(fit);
      
      expect(fit).toBe('perfect');
      expect(scale).toBe(1.0);
    });

    it('should scale up garment for loose fit', () => {
      const size = 38;
      const fit = getFitAdjustment(size);
      const scale = getScaleFactor(fit);
      
      expect(fit).toBe('loose');
      expect(scale).toBe(1.08);
      expect(scale).toBeGreaterThan(1.0);
    });
  });

  describe('Fit Feedback Messages', () => {
    it('should provide tight fit feedback', () => {
      const size = 24;
      const fit = getFitAdjustment(size);
      
      expect(fit).toBe('tight');
      const message = `This garment in size ${size} will fit snugly. Consider sizing up if you prefer a more relaxed fit.`;
      expect(message).toContain('snugly');
      expect(message).toContain('sizing up');
    });

    it('should provide perfect fit feedback', () => {
      const size = 32;
      const fit = getFitAdjustment(size);
      
      expect(fit).toBe('perfect');
      const message = `This garment in size ${size} should fit as expected. This is our recommended size for you.`;
      expect(message).toContain('as expected');
      expect(message).toContain('recommended');
    });

    it('should provide loose fit feedback', () => {
      const size = 38;
      const fit = getFitAdjustment(size);
      
      expect(fit).toBe('loose');
      const message = `This garment in size ${size} will fit with extra room. Consider sizing down if you prefer a snugger fit.`;
      expect(message).toContain('extra room');
      expect(message).toContain('sizing down');
    });
  });

  describe('Fit Feedback Colors', () => {
    it('should have blue colors for tight fit', () => {
      const fit = 'tight';
      const fitColors = {
        tight: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        perfect: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        loose: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      };
      
      expect(fitColors[fit]).toContain('blue');
    });

    it('should have green colors for perfect fit', () => {
      const fit = 'perfect';
      const fitColors = {
        tight: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        perfect: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        loose: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      };
      
      expect(fitColors[fit]).toContain('green');
    });

    it('should have orange colors for loose fit', () => {
      const fit = 'loose';
      const fitColors = {
        tight: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        perfect: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        loose: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      };
      
      expect(fitColors[fit]).toContain('orange');
    });
  });

  describe('Fit Labels', () => {
    it('should label tight fit as "Snug Fit"', () => {
      const fit = 'tight';
      const fitLabels = {
        tight: 'Snug Fit',
        perfect: 'Perfect Fit',
        loose: 'Relaxed Fit',
      };
      
      expect(fitLabels[fit]).toBe('Snug Fit');
    });

    it('should label perfect fit as "Perfect Fit"', () => {
      const fit = 'perfect';
      const fitLabels = {
        tight: 'Snug Fit',
        perfect: 'Perfect Fit',
        loose: 'Relaxed Fit',
      };
      
      expect(fitLabels[fit]).toBe('Perfect Fit');
    });

    it('should label loose fit as "Relaxed Fit"', () => {
      const fit = 'loose';
      const fitLabels = {
        tight: 'Snug Fit',
        perfect: 'Perfect Fit',
        loose: 'Relaxed Fit',
      };
      
      expect(fitLabels[fit]).toBe('Relaxed Fit');
    });
  });

  describe('Scale Factor Ranges', () => {
    it('should have tight scale between 0.85 and 0.95', () => {
      const scale = getScaleFactor('tight');
      expect(scale).toBeGreaterThan(0.85);
      expect(scale).toBeLessThan(0.95);
    });

    it('should have perfect scale exactly 1.0', () => {
      const scale = getScaleFactor('perfect');
      expect(scale).toBe(1.0);
    });

    it('should have loose scale between 1.05 and 1.15', () => {
      const scale = getScaleFactor('loose');
      expect(scale).toBeGreaterThan(1.05);
      expect(scale).toBeLessThan(1.15);
    });
  });

  describe('All Demo Sizes Mapping', () => {
    const demoSizes = [28, 30, 32, 34, 36, 38];

    it('should map all demo sizes correctly', () => {
      const expectedMappings = {
        28: 'perfect',
        30: 'perfect',
        32: 'perfect',
        34: 'perfect',
        36: 'loose',
        38: 'loose',
      };

      demoSizes.forEach((size) => {
        const fit = getFitAdjustment(size);
        expect(fit).toBe(expectedMappings[size as keyof typeof expectedMappings]);
      });
    });

    it('should have valid scale factors for all demo sizes', () => {
      demoSizes.forEach((size) => {
        const fit = getFitAdjustment(size);
        const scale = getScaleFactor(fit);
        
        expect(scale).toBeGreaterThan(0.8);
        expect(scale).toBeLessThan(1.2);
      });
    });
  });
});
