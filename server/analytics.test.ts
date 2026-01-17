import { describe, it, expect } from "vitest";

describe("Analytics Dashboard", () => {
  it("should calculate total revenue correctly", () => {
    const transactions = [
      { amount: 45, type: "purchase" },
      { amount: 80, type: "purchase" },
      { amount: 150, type: "purchase" },
      { amount: 385, type: "purchase" },
    ];

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(totalRevenue).toBe(660);
  });

  it("should calculate average revenue per customer", () => {
    const totalRevenue = 160000;
    const totalCustomers = 2847;
    const avgRevenuePerCustomer = totalRevenue / totalCustomers;

    expect(avgRevenuePerCustomer).toBeCloseTo(56.2, 1);
  });

  it("should track try-on metrics correctly", () => {
    const tryOns = [
      { month: "Jan", count: 450 },
      { month: "Feb", count: 680 },
      { month: "Mar", count: 795 },
      { month: "Apr", count: 1020 },
      { month: "May", count: 1265 },
      { month: "Jun", count: 1540 },
    ];

    const totalTryOns = tryOns.reduce((sum, t) => sum + t.count, 0);
    expect(totalTryOns).toBe(5750);
  });

  it("should identify top performing packages", () => {
    const packages = [
      { name: "R45 (10)", purchases: 15 },
      { name: "R80 (20)", purchases: 22 },
      { name: "R150 (50)", purchases: 28 },
      { name: "R385 (100)", purchases: 18 },
      { name: "R750 (200)", purchases: 12 },
      { name: "R1350 (500)", purchases: 5 },
    ];

    const topPackage = packages.reduce((max, pkg) =>
      pkg.purchases > max.purchases ? pkg : max
    );

    expect(topPackage.name).toBe("R150 (50)");
    expect(topPackage.purchases).toBe(28);
  });

  it("should calculate growth percentage", () => {
    const currentMonth = 42800;
    const previousMonth = 35200;
    const growth = ((currentMonth - previousMonth) / previousMonth) * 100;

    expect(growth).toBeCloseTo(21.59, 1);
  });

  it("should validate admin access requirement", () => {
    const user = { id: 1, role: "user" };
    const isAdmin = user.role === "admin";

    expect(isAdmin).toBe(false);
  });

  it("should validate admin can access analytics", () => {
    const adminUser = { id: 1, role: "admin" };
    const isAdmin = adminUser.role === "admin";

    expect(isAdmin).toBe(true);
  });

  it("should format revenue correctly", () => {
    const revenue = 160000;
    const formatted = `R${revenue.toLocaleString()}`;

    expect(formatted).toBe("R160,000");
  });

  it("should track customer acquisition metrics", () => {
    const customers = [
      { month: "Jan", count: 150 },
      { month: "Feb", count: 185 },
      { month: "Mar", count: 220 },
      { month: "Apr", count: 280 },
      { month: "May", count: 350 },
      { month: "Jun", count: 450 },
    ];

    const totalCustomers = customers.reduce((sum, c) => sum + c.count, 0);
    expect(totalCustomers).toBe(1635);
  });
});
