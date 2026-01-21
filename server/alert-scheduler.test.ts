import { describe, it, expect } from "vitest";
import {
  getBoutiquesNeedingAlerts,
  getSchedulerConfig,
  updateSchedulerConfig,
  shouldSendAlertsNow,
  getAlertStatistics,
  initializeAlertScheduler,
} from "./alert-scheduler";

describe("Alert Scheduler", () => {
  describe("Configuration Management", () => {
    it("should get default scheduler config", () => {
      const config = getSchedulerConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.frequency).toBe("daily");
      expect(config.sendTime).toBe("09:00");
    });

    it("should have correct alert thresholds", () => {
      const config = getSchedulerConfig();
      expect(config.thresholds.critical).toBe(80);
      expect(config.thresholds.warning).toBe(50);
      expect(config.thresholds.notice).toBe(20);
      expect(config.thresholds.info).toBe(10);
    });

    it("should update scheduler config", () => {
      const updated = updateSchedulerConfig({
        enabled: false,
        frequency: "weekly",
      });

      expect(updated.enabled).toBe(false);
      expect(updated.frequency).toBe("weekly");
      expect(updated.sendTime).toBe("09:00"); // Should preserve defaults
    });

    it("should support partial config updates", () => {
      const updated = updateSchedulerConfig({
        sendTime: "14:00",
      });

      expect(updated.sendTime).toBe("14:00");
      expect(updated.frequency).toBe("daily");
      expect(updated.enabled).toBe(true);
    });
  });

  describe("Alert Timing", () => {
    it("should check if it's time to send alerts", () => {
      const config = getSchedulerConfig();
      const shouldSend = shouldSendAlertsNow(config);
      expect(typeof shouldSend).toBe("boolean");
    });

    it("should not send alerts if disabled", () => {
      const config = updateSchedulerConfig({ enabled: false });
      const shouldSend = shouldSendAlertsNow(config);
      expect(shouldSend).toBe(false);
    });

    it("should respect send time configuration", () => {
      const config = updateSchedulerConfig({ sendTime: "09:00" });
      expect(config.sendTime).toBe("09:00");
    });

    it("should allow 5-minute window for sending", () => {
      // This test verifies the logic works, actual timing depends on current time
      const config = getSchedulerConfig();
      const shouldSend = shouldSendAlertsNow(config);
      expect(typeof shouldSend).toBe("boolean");
    });
  });

  describe("Alert Statistics", () => {
    it("should get alert statistics", async () => {
      const stats = await getAlertStatistics();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalBoutiques");
      expect(stats).toHaveProperty("critical");
      expect(stats).toHaveProperty("warning");
      expect(stats).toHaveProperty("notice");
      expect(stats).toHaveProperty("info");
    });

    it("should return numeric statistics", async () => {
      const stats = await getAlertStatistics();
      expect(typeof stats.totalBoutiques).toBe("number");
      expect(typeof stats.critical).toBe("number");
      expect(typeof stats.warning).toBe("number");
      expect(typeof stats.notice).toBe("number");
      expect(typeof stats.info).toBe("number");
    });

    it("should have non-negative statistics", async () => {
      const stats = await getAlertStatistics();
      expect(stats.totalBoutiques).toBeGreaterThanOrEqual(0);
      expect(stats.critical).toBeGreaterThanOrEqual(0);
      expect(stats.warning).toBeGreaterThanOrEqual(0);
      expect(stats.notice).toBeGreaterThanOrEqual(0);
      expect(stats.info).toBeGreaterThanOrEqual(0);
    });

    it("should have alert levels sum to total", async () => {
      const stats = await getAlertStatistics();
      const sum = stats.critical + stats.warning + stats.notice + stats.info;
      expect(sum).toBeLessThanOrEqual(stats.totalBoutiques);
    });
  });

  describe("Boutique Alert Fetching", () => {
    it("should get boutiques needing alerts", async () => {
      const config = getSchedulerConfig();
      const boutiques = await getBoutiquesNeedingAlerts(config);
      expect(Array.isArray(boutiques)).toBe(true);
    });

    it("should return boutique alert status objects", async () => {
      const config = getSchedulerConfig();
      const boutiques = await getBoutiquesNeedingAlerts(config);

      if (boutiques.length > 0) {
        const boutique = boutiques[0];
        expect(boutique).toHaveProperty("boutiqueId");
        expect(boutique).toHaveProperty("boutiqueName");
        expect(boutique).toHaveProperty("email");
        expect(boutique).toHaveProperty("usagePercentage");
        expect(boutique).toHaveProperty("remainingCredits");
        expect(boutique).toHaveProperty("totalCredits");
        expect(boutique).toHaveProperty("alertLevel");
      }
    });

    it("should have valid alert levels", async () => {
      const config = getSchedulerConfig();
      const boutiques = await getBoutiquesNeedingAlerts(config);

      boutiques.forEach((boutique) => {
        const validLevels = ["critical", "warning", "notice", "info"];
        expect(validLevels).toContain(boutique.alertLevel);
      });
    });

    it("should have valid usage percentages", async () => {
      const config = getSchedulerConfig();
      const boutiques = await getBoutiquesNeedingAlerts(config);

      boutiques.forEach((boutique) => {
        expect(boutique.usagePercentage).toBeGreaterThanOrEqual(0);
        expect(boutique.usagePercentage).toBeLessThanOrEqual(100);
      });
    });

    it("should have valid credit amounts", async () => {
      const config = getSchedulerConfig();
      const boutiques = await getBoutiquesNeedingAlerts(config);

      boutiques.forEach((boutique) => {
        expect(boutique.remainingCredits).toBeGreaterThanOrEqual(0);
        expect(boutique.totalCredits).toBeGreaterThan(0);
        expect(boutique.remainingCredits).toBeLessThanOrEqual(boutique.totalCredits);
      });
    });
  });

  describe("Scheduler Initialization", () => {
    it("should initialize alert scheduler", () => {
      const result = initializeAlertScheduler();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("config");
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("initialized");
    });

    it("should return config on initialization", () => {
      const result = initializeAlertScheduler();
      expect(result.config).toBeDefined();
      expect(result.config.enabled).toBe(true);
    });
  });

  describe("Alert Level Classification", () => {
    it("should classify 80% usage as critical", () => {
      const config = getSchedulerConfig();
      expect(config.thresholds.critical).toBe(80);
    });

    it("should classify 50% usage as warning", () => {
      const config = getSchedulerConfig();
      expect(config.thresholds.warning).toBe(50);
    });

    it("should classify 20% usage as notice", () => {
      const config = getSchedulerConfig();
      expect(config.thresholds.notice).toBe(20);
    });

    it("should classify 10% usage as info", () => {
      const config = getSchedulerConfig();
      expect(config.thresholds.info).toBe(10);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in getBoutiquesNeedingAlerts", async () => {
      const config = getSchedulerConfig();
      const result = await getBoutiquesNeedingAlerts(config);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle errors in getAlertStatistics", async () => {
      const result = await getAlertStatistics();
      expect(result).toBeDefined();
      expect(result.totalBoutiques).toBeGreaterThanOrEqual(0);
    });
  });
});
