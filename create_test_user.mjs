import { createConnection } from "mysql2/promise";

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL);
const connection = await createConnection({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.substring(1),
  ssl: { rejectUnauthorized: false },
  port: parseInt(dbUrl.port || "3306"),
});

try {
  // Create test owner user (StyleSwap owner)
  const ownerEmail = "owner@styleswap.com";
  const ownerName = "StyleSwap Owner";
  const ownerOpenId = `styleswap-owner-${Date.now()}`;

  // Check if owner exists
  const [ownerRows] = await connection.query(
    "SELECT * FROM users WHERE email = ?",
    [ownerEmail]
  );

  if (ownerRows.length === 0) {
    await connection.query(
      "INSERT INTO users (openId, name, email, loginMethod, role, userType) VALUES (?, ?, ?, ?, ?, ?)",
      [ownerOpenId, ownerName, ownerEmail, "test", "admin", "merchant"]
    );
    console.log("✅ Created owner user: owner@styleswap.com");
  } else {
    console.log("⚠️  Owner user already exists: owner@styleswap.com");
  }

  // Create test customer user
  const customerEmail = "customer@test.com";
  const customerName = "Test Customer";
  const customerOpenId = `test-customer-${Date.now()}`;

  const [customerRows] = await connection.query(
    "SELECT * FROM users WHERE email = ?",
    [customerEmail]
  );

  if (customerRows.length === 0) {
    await connection.query(
      "INSERT INTO users (openId, name, email, loginMethod, role, userType) VALUES (?, ?, ?, ?, ?, ?)",
      [customerOpenId, customerName, customerEmail, "test", "user", "customer"]
    );
    console.log("✅ Created customer user: customer@test.com");
  } else {
    console.log("⚠️  Customer user already exists: customer@test.com");
  }

  // Create test boutique user
  const boutiqueEmail = "boutique@test.com";
  const boutiqueName = "Test Boutique";
  const boutiqueOpenId = `test-boutique-${Date.now()}`;

  const [boutiqueRows] = await connection.query(
    "SELECT * FROM users WHERE email = ?",
    [boutiqueEmail]
  );

  if (boutiqueRows.length === 0) {
    await connection.query(
      "INSERT INTO users (openId, name, email, loginMethod, role, userType) VALUES (?, ?, ?, ?, ?, ?)",
      [boutiqueOpenId, boutiqueName, boutiqueEmail, "test", "merchant", "merchant"]
    );
    console.log("✅ Created boutique user: boutique@test.com");
  } else {
    console.log("⚠️  Boutique user already exists: boutique@test.com");
  }

  console.log("\n✅ Test users setup complete!");
  console.log("\n📝 Test Credentials:");
  console.log("   Owner Dashboard: owner@styleswap.com");
  console.log("   Customer Dashboard: customer@test.com");
  console.log("   Boutique Dashboard: boutique@test.com");
} catch (error) {
  console.error("❌ Error creating test users:", error.message);
} finally {
  await connection.end();
}
