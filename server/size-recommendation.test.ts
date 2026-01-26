import { describe, it, expect, beforeEach } from "vitest";
import {
  recommendSize,
  getAvailableSizes,
  getSizeChart,
  BodyMeasurements,
} from "./services/sizeRecommendation";

describe("Size Recommendation System", () => {
  describe("recommendSize", () => {
    it("should recommend size 30 for average measurements", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.recommendedSize).toBe(30);
      expect(recommendation.confidence).toBeGreaterThan(50);
      expect(recommendation.explanation).toBeTruthy();
    });

    it("should recommend size 24 for smaller measurements", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 32,
        chestWidth: 28,
        waistWidth: 20,
        hipWidth: 28,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.recommendedSize).toBe(24);
      expect(recommendation.confidence).toBeGreaterThan(50);
    });

    it("should recommend size 50 for larger measurements", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 45,
        chestWidth: 54,
        waistWidth: 46,
        hipWidth: 54,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.recommendedSize).toBe(50);
      expect(recommendation.confidence).toBeGreaterThan(50);
    });

    it("should provide alternative sizes", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.alternativeSizes).toBeDefined();
      expect(Array.isArray(recommendation.alternativeSizes)).toBe(true);
    });

    it("should include measurements in recommendation", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.measurements).toEqual(measurements);
    });

    it("should handle different clothing types", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
      };

      const upperRec = await recommendSize(measurements, "upper");
      const lowerRec = await recommendSize(measurements, "lower");
      const comboRec = await recommendSize(measurements, "combo");

      expect(upperRec.recommendedSize).toBeDefined();
      expect(lowerRec.recommendedSize).toBeDefined();
      expect(comboRec.recommendedSize).toBeDefined();
    });

    it("should have high confidence for exact size chart match", async () => {
      // Size 30 measurements from chart
      const measurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.confidence).toBeGreaterThan(70);
    });

    it("should have lower confidence for measurements between sizes", async () => {
      // Measurements between size 30 and 32
      const measurements: BodyMeasurements = {
        shoulderWidth: 35.5,
        chestWidth: 35,
        waistWidth: 27,
        hipWidth: 35,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.confidence).toBeLessThan(100);
    });

    it("should recommend closest size when measurements are off-chart", async () => {
      // Very small measurements
      const measurements: BodyMeasurements = {
        shoulderWidth: 25,
        chestWidth: 20,
        waistWidth: 15,
        hipWidth: 20,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.recommendedSize).toBe(24);
    });

    it("should handle height parameter", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
        height: 170,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.measurements.height).toBe(170);
    });
  });

  describe("getAvailableSizes", () => {
    it("should return array of available sizes", () => {
      const sizes = getAvailableSizes();

      expect(Array.isArray(sizes)).toBe(true);
      expect(sizes.length).toBeGreaterThan(0);
    });

    it("should return sizes in ascending order", () => {
      const sizes = getAvailableSizes();

      for (let i = 1; i < sizes.length; i++) {
        expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
      }
    });

    it("should include sizes 24-50", () => {
      const sizes = getAvailableSizes();

      expect(sizes).toContain(24);
      expect(sizes).toContain(50);
    });

    it("should have consistent size increments", () => {
      const sizes = getAvailableSizes();

      for (let i = 1; i < sizes.length; i++) {
        const diff = sizes[i] - sizes[i - 1];
        expect(diff).toBe(2); // Sizes increment by 2
      }
    });
  });

  describe("getSizeChart", () => {
    it("should return size chart object", () => {
      const chart = getSizeChart();

      expect(typeof chart).toBe("object");
      expect(Object.keys(chart).length).toBeGreaterThan(0);
    });

    it("should have measurements for all available sizes", () => {
      const chart = getSizeChart();
      const sizes = getAvailableSizes();

      for (const size of sizes) {
        expect(chart[size]).toBeDefined();
        expect(chart[size].shoulderWidth).toBeDefined();
        expect(chart[size].chestWidth).toBeDefined();
        expect(chart[size].waistWidth).toBeDefined();
        expect(chart[size].hipWidth).toBeDefined();
      }
    });

    it("should have increasing measurements for larger sizes", () => {
      const chart = getSizeChart();
      const sizes = getAvailableSizes();

      for (let i = 1; i < sizes.length; i++) {
        const prevSize = sizes[i - 1];
        const currSize = sizes[i];

        expect(chart[currSize].shoulderWidth).toBeGreaterThan(
          chart[prevSize].shoulderWidth
        );
        expect(chart[currSize].chestWidth).toBeGreaterThan(
          chart[prevSize].chestWidth
        );
        expect(chart[currSize].waistWidth).toBeGreaterThan(
          chart[prevSize].waistWidth
        );
        expect(chart[currSize].hipWidth).toBeGreaterThan(
          chart[prevSize].hipWidth
        );
      }
    });

    it("should have realistic measurements", () => {
      const chart = getSizeChart();

      for (const [size, measurements] of Object.entries(chart)) {
        // Shoulder width should be between 30-50cm
        expect(measurements.shoulderWidth).toBeGreaterThanOrEqual(30);
        expect(measurements.shoulderWidth).toBeLessThanOrEqual(50);

        // Chest width should be between 25-60cm
        expect(measurements.chestWidth).toBeGreaterThanOrEqual(25);
        expect(measurements.chestWidth).toBeLessThanOrEqual(60);

        // Waist width should be between 15-50cm
        expect(measurements.waistWidth).toBeGreaterThanOrEqual(15);
        expect(measurements.waistWidth).toBeLessThanOrEqual(50);

        // Hip width should be between 25-60cm
        expect(measurements.hipWidth).toBeGreaterThanOrEqual(25);
        expect(measurements.hipWidth).toBeLessThanOrEqual(60);
      }
    });
  });

  describe("Confidence Scoring", () => {
    it("should give 100% confidence for exact measurements", async () => {
      // Exact size 30 measurements
      const measurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.confidence).toBe(100);
    });

    it("should decrease confidence as measurements deviate", async () => {
      const baselineMeasurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
      };

      const baseline = await recommendSize(baselineMeasurements);

      const deviatedMeasurements: BodyMeasurements = {
        shoulderWidth: 35 + 5,
        chestWidth: 34 + 5,
        waistWidth: 26 + 5,
        hipWidth: 34 + 5,
      };

      const deviated = await recommendSize(deviatedMeasurements);

      expect(deviated.confidence).toBeLessThan(baseline.confidence);
    });

    it("should have confidence between 0 and 100", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 35,
        chestWidth: 34,
        waistWidth: 26,
        hipWidth: 34,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small measurements", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 20,
        chestWidth: 15,
        waistWidth: 10,
        hipWidth: 15,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.recommendedSize).toBe(24);
    });

    it("should handle very large measurements", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 60,
        chestWidth: 80,
        waistWidth: 70,
        hipWidth: 80,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.recommendedSize).toBe(50);
    });

    it("should handle uneven measurements", async () => {
      const measurements: BodyMeasurements = {
        shoulderWidth: 32,
        chestWidth: 50,
        waistWidth: 20,
        hipWidth: 45,
      };

      const recommendation = await recommendSize(measurements);

      expect(recommendation.recommendedSize).toBeDefined();
      expect(recommendation.recommendedSize).toBeGreaterThanOrEqual(24);
      expect(recommendation.recommendedSize).toBeLessThanOrEqual(50);
    });
  });
});
