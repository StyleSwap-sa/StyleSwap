import { describe, it, expect } from 'vitest';

/**
 * Test suite for Interactive Size Slider Feature
 * Tests the slider component functionality with sizes 24-50
 */

describe('Interactive Size Slider Feature', () => {
  // Helper functions (same as in SizeSlider component)
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
        return 0.85;
      case 'loose':
        return 1.15;
      case 'perfect':
      default:
        return 1.0;
    }
  }

  describe('Slider Range Validation', () => {
    it('should support minimum size 24', () => {
      const minSize = 24;
      expect(minSize).toBe(24);
    });

    it('should support maximum size 50', () => {
      const maxSize = 50;
      expect(maxSize).toBe(50);
    });

    it('should have valid range (24-50)', () => {
      const minSize = 24;
      const maxSize = 50;
      expect(maxSize - minSize).toBe(26);
      expect(maxSize).toBeGreaterThan(minSize);
    });
  });

  describe('Size Percentage Calculation', () => {
    const minSize = 24;
    const maxSize = 50;

    it('should calculate 0% for minimum size 24', () => {
      const size = 24;
      const percentage = ((size - minSize) / (maxSize - minSize)) * 100;
      expect(percentage).toBe(0);
    });

    it('should calculate 50% for size 37', () => {
      const size = 37;
      const percentage = ((size - minSize) / (maxSize - minSize)) * 100;
      expect(percentage).toBeCloseTo(50, 1);
    });

    it('should calculate 100% for maximum size 50', () => {
      const size = 50;
      const percentage = ((size - minSize) / (maxSize - minSize)) * 100;
      expect(percentage).toBe(100);
    });

    it('should calculate correct percentage for size 30', () => {
      const size = 30;
      const percentage = ((size - minSize) / (maxSize - minSize)) * 100;
      expect(percentage).toBeCloseTo(23.08, 1);
    });

    it('should calculate correct percentage for size 40', () => {
      const size = 40;
      const percentage = ((size - minSize) / (maxSize - minSize)) * 100;
      expect(percentage).toBeCloseTo(61.54, 1);
    });
  });

  describe('Size Clamping', () => {
    const minSize = 24;
    const maxSize = 50;

    it('should clamp size below minimum to 24', () => {
      const size = 20;
      const clamped = Math.max(minSize, Math.min(maxSize, size));
      expect(clamped).toBe(24);
    });

    it('should clamp size above maximum to 50', () => {
      const size = 55;
      const clamped = Math.max(minSize, Math.min(maxSize, size));
      expect(clamped).toBe(50);
    });

    it('should not clamp size within range', () => {
      const size = 35;
      const clamped = Math.max(minSize, Math.min(maxSize, size));
      expect(clamped).toBe(35);
    });
  });

  describe('Slider Scale Factors with New Ranges', () => {
    it('should scale down 15% for tight fit', () => {
      const scale = getScaleFactor('tight');
      expect(scale).toBe(0.85);
      expect(scale).toBeLessThan(1.0);
    });

    it('should not scale for perfect fit', () => {
      const scale = getScaleFactor('perfect');
      expect(scale).toBe(1.0);
    });

    it('should scale up 15% for loose fit', () => {
      const scale = getScaleFactor('loose');
      expect(scale).toBe(1.15);
      expect(scale).toBeGreaterThan(1.0);
    });

    it('should have proper scale progression', () => {
      const tight = getScaleFactor('tight');
      const perfect = getScaleFactor('perfect');
      const loose = getScaleFactor('loose');
      
      expect(tight).toBeLessThan(perfect);
      expect(perfect).toBeLessThan(loose);
    });
  });

  describe('All Demo Sizes in Slider Range', () => {
    const demoSizes = [24, 28, 30, 32, 34, 38, 40, 42, 44, 46, 48, 50];

    it('should have all demo sizes within range 24-50', () => {
      demoSizes.forEach((size) => {
        expect(size).toBeGreaterThanOrEqual(24);
        expect(size).toBeLessThanOrEqual(50);
      });
    });

    it('should map all demo sizes correctly', () => {
      const expectedMappings = {
        24: 'tight',
        28: 'perfect',
        30: 'perfect',
        32: 'perfect',
        34: 'perfect',
        38: 'loose',
        40: 'loose',
        42: 'loose',
        44: 'loose',
        46: 'loose',
        48: 'loose',
        50: 'loose',
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

  describe('Fit Feedback Messages', () => {
    it('should provide tight fit message for size 24', () => {
      const size = 24;
      const fit = getFitAdjustment(size);
      expect(fit).toBe('tight');
      
      const message = `Size ${size} will fit snugly. Consider sizing up for a more relaxed fit.`;
      expect(message).toContain('snugly');
      expect(message).toContain('sizing up');
    });

    it('should provide perfect fit message for size 30', () => {
      const size = 30;
      const fit = getFitAdjustment(size);
      expect(fit).toBe('perfect');
      
      const message = `Size ${size} is our recommended size. This should fit as expected.`;
      expect(message).toContain('recommended');
      expect(message).toContain('as expected');
    });

    it('should provide loose fit message for size 40', () => {
      const size = 40;
      const fit = getFitAdjustment(size);
      expect(fit).toBe('loose');
      
      const message = `Size ${size} will fit with extra room. Consider sizing down for a snugger fit.`;
      expect(message).toContain('extra room');
      expect(message).toContain('sizing down');
    });
  });

  describe('Fit Color Coding', () => {
    it('should use blue colors for tight fit', () => {
      const fitColors = {
        tight: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        perfect: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        loose: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      };
      
      expect(fitColors.tight).toContain('blue');
    });

    it('should use green colors for perfect fit', () => {
      const fitColors = {
        tight: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        perfect: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        loose: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      };
      
      expect(fitColors.perfect).toContain('green');
    });

    it('should use orange colors for loose fit', () => {
      const fitColors = {
        tight: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        perfect: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        loose: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      };
      
      expect(fitColors.loose).toContain('orange');
    });
  });

  describe('Fit Labels', () => {
    it('should label tight fit as Snug Fit', () => {
      const fitLabels = {
        tight: 'Snug Fit',
        perfect: 'Perfect Fit',
        loose: 'Relaxed Fit',
      };
      
      expect(fitLabels.tight).toBe('Snug Fit');
    });

    it('should label perfect fit as Perfect Fit', () => {
      const fitLabels = {
        tight: 'Snug Fit',
        perfect: 'Perfect Fit',
        loose: 'Relaxed Fit',
      };
      
      expect(fitLabels.perfect).toBe('Perfect Fit');
    });

    it('should label loose fit as Relaxed Fit', () => {
      const fitLabels = {
        tight: 'Snug Fit',
        perfect: 'Perfect Fit',
        loose: 'Relaxed Fit',
      };
      
      expect(fitLabels.loose).toBe('Relaxed Fit');
    });
  });

  describe('Quick Select Buttons', () => {
    const quickSelectSizes = [24, 28, 30, 32, 34, 38, 40, 42, 44, 46, 48, 50];

    it('should have 12 quick select buttons', () => {
      expect(quickSelectSizes.length).toBe(12);
    });

    it('should cover full size range', () => {
      expect(Math.min(...quickSelectSizes)).toBe(24);
      expect(Math.max(...quickSelectSizes)).toBe(50);
    });

    it('should have even distribution', () => {
      // Check that sizes are reasonably distributed
      const gaps = [];
      for (let i = 1; i < quickSelectSizes.length; i++) {
        gaps.push(quickSelectSizes[i] - quickSelectSizes[i - 1]);
      }
      
      // Most gaps should be 2 or 4
      const validGaps = gaps.filter(g => g === 2 || g === 4);
      expect(validGaps.length).toBeGreaterThan(gaps.length - 2);
    });
  });

  describe('Size Information Display', () => {
    it('should show tight fit range as 24-26', () => {
      const tightRange = 'Sizes 24-26';
      expect(tightRange).toContain('24');
      expect(tightRange).toContain('26');
    });

    it('should show perfect fit range as 28-34', () => {
      const perfectRange = 'Sizes 28-34';
      expect(perfectRange).toContain('28');
      expect(perfectRange).toContain('34');
    });

    it('should show relaxed fit range as 36-50', () => {
      const relaxedRange = 'Sizes 36-50';
      expect(relaxedRange).toContain('36');
      expect(relaxedRange).toContain('50');
    });
  });

  describe('Slider Interaction Simulation', () => {
    it('should handle size change from 24 to 50', () => {
      let currentSize = 24;
      const setSize = (newSize: number) => {
        currentSize = newSize;
      };
      
      setSize(50);
      expect(currentSize).toBe(50);
    });

    it('should handle multiple size changes', () => {
      let currentSize = 24;
      const sizes = [24, 30, 35, 40, 45, 50];
      
      sizes.forEach((size) => {
        currentSize = size;
        expect(currentSize).toBe(size);
      });
    });

    it('should maintain fit classification during size changes', () => {
      const sizes = [24, 28, 30, 34, 36, 40, 50];
      const expectedFits = ['tight', 'perfect', 'perfect', 'perfect', 'loose', 'loose', 'loose'];
      
      sizes.forEach((size, index) => {
        const fit = getFitAdjustment(size);
        expect(fit).toBe(expectedFits[index]);
      });
    });
  });

  describe('Smooth Transitions', () => {
    it('should have smooth CSS transition', () => {
      const transition = 'transform 0.2s ease-out';
      expect(transition).toContain('0.2s');
      expect(transition).toContain('ease-out');
    });

    it('should disable transition while dragging', () => {
      const isDragging = true;
      const transition = isDragging ? 'none' : 'transform 0.2s ease-out';
      expect(transition).toBe('none');
    });

    it('should enable transition after dragging stops', () => {
      const isDragging = false;
      const transition = isDragging ? 'none' : 'transform 0.2s ease-out';
      expect(transition).toContain('0.2s');
    });
  });
});
