import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const coupons = [
  {
    code: "INVITE2GET5",
    description: "Invite 2 friends and get 5 free credits",
    creditsValue: 5,
    maxUses: 50,
  },
  {
    code: "ME2",
    description: "Get 2 free credits when invited by a friend",
    creditsValue: 2,
    maxUses: 100,
  },
  {
    code: "STYLECHAT2",
    description: "Get 2 free credits when invited via WhatsApp",
    creditsValue: 2,
    maxUses: 100,
  },
  {
    code: "STYLEVIP30",
    description: "VIP influencer exclusive - 30 free credits",
    creditsValue: 30,
    maxUses: 15,
  },
];

async function seedCoupons() {
  let connection;
  try {
    // Parse DATABASE_URL to extract connection details
    const url = new URL(process.env.DATABASE_URL);
    
    connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: "Amazon RDS" // Enable SSL for RDS
    });

    console.log("Connected to database");
    console.log("Seeding coupon codes...");
    
    for (const coupon of coupons) {
      const query = `
        INSERT INTO couponCodes (code, description, creditsValue, maxUses, isActive)
        VALUES (?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE creditsValue = VALUES(creditsValue), maxUses = VALUES(maxUses)
      `;
      
      await connection.execute(query, [
        coupon.code,
        coupon.description,
        coupon.creditsValue,
        coupon.maxUses
      ]);
      
      console.log(`✓ Created/Updated coupon: ${coupon.code}`);
    }
    
    console.log("✓ All coupons seeded successfully!");
    await connection.end();
  } catch (error) {
    console.error("Error seeding coupons:", error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

seedCoupons();
