/**
 * Package classification — the ONLY place that maps a package id to
 * 'individual' | 'business'. Anything else in the codebase that needs this
 * fact must import from here. Prevents the trap called out by the client:
 * pkg_100_credits (business, R385) and pkg_10_credits (individual, R45)
 * use the same id prefix and cannot be distinguished by string manipulation.
 */

export type PackageCategory = "individual" | "business";

export interface ClassifiedPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // cents
  currency: string;
  category: PackageCategory;
}

/**
 * Canonical list. Must stay in sync with PAYMENT_PACKAGES in
 * server/yoko-payment.ts — a compile-time check there will fail if a
 * package is added to PAYMENT_PACKAGES without a category.
 */
export const CLASSIFIED_PACKAGES: ClassifiedPackage[] = [
  // Individual — R45, R80, R150
  { id: "pkg_5_credits",  name: "5 Try-Ons",  credits: 5,  price: 500,    currency: "ZAR", category: "individual" },
  { id: "pkg_10_credits",  name: "10 Try-Ons",  credits: 10,  price: 4500,    currency: "ZAR", category: "individual" },
  { id: "pkg_20_credits",  name: "20 Try-Ons",  credits: 20,  price: 8000,    currency: "ZAR", category: "individual" },
  { id: "pkg_50_credits",  name: "50 Try-Ons",  credits: 50,  price: 15000,   currency: "ZAR", category: "individual" },

  // Business — R385 to R18,600
  { id: "pkg_100_credits",   name: "100 Try-Ons",    credits: 100,   price: 38500,   currency: "ZAR", category: "business" },
  { id: "pkg_200_credits",   name: "200 Try-Ons",    credits: 200,   price: 75000,   currency: "ZAR", category: "business" },
  { id: "pkg_500_credits",   name: "500 Try-Ons",    credits: 500,   price: 135000,  currency: "ZAR", category: "business" },
  { id: "pkg_1000_credits",  name: "1000 Try-Ons",   credits: 1000,  price: 220000,  currency: "ZAR", category: "business" },
  { id: "pkg_5000_credits",  name: "5000 Try-Ons",   credits: 5000,  price: 625000,  currency: "ZAR", category: "business" },
  { id: "pkg_20000_credits", name: "20000 Try-Ons",  credits: 20000, price: 1860000, currency: "ZAR", category: "business" },
];

const BY_ID = new Map(CLASSIFIED_PACKAGES.map((p) => [p.id, p]));

export function getClassifiedPackage(id: string): ClassifiedPackage | undefined {
  return BY_ID.get(id);
}

/**
 * Resolve a package by id, verifying the caller's claimed category and
 * amount match the canonical record. Throws on any mismatch — this is the
 * server-side trust boundary the client file requires.
 */
export function verifyPackage(
  packageId: string,
  claimedCategory: PackageCategory,
  claimedAmountCents: number
): ClassifiedPackage {
  const pkg = BY_ID.get(packageId);
  if (!pkg) throw new Error(`Unknown package: ${packageId}`);
  if (pkg.category !== claimedCategory) {
    throw new Error(
      `Package category mismatch for ${packageId}: claimed ${claimedCategory}, canonical ${pkg.category}`
    );
  }
  if (pkg.price !== claimedAmountCents) {
    throw new Error(
      `Package amount mismatch for ${packageId}: claimed ${claimedAmountCents}, canonical ${pkg.price}`
    );
  }
  return pkg;
}