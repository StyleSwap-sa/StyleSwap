import postgres from 'postgres';

const sql = postgres('postgresql://styleswap_db_vl4j_user:hki0oDENdrUsKTpa0X1kG6biW9819sV1@dpg-d6c2ofsr85hc73drr9s0-a/styleswap_db_vl4j', {
  ssl: 'require'
});

try {
  console.log('🔄 Connecting to PostgreSQL...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      "openId" VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      "loginMethod" VARCHAR(50),
      role VARCHAR(50) DEFAULT 'user',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "lastSignedIn" TIMESTAMP,
      phone VARCHAR(20),
      "user_type" VARCHAR(50),
      "currentBoutiqueId" INTEGER,
      "freeTrialUsed" BOOLEAN DEFAULT FALSE,
      "freeTrialUsedAt" TIMESTAMP,
      "freeTrialExpiresAt" TIMESTAMP
    )
  `;
  
  console.log('✅ Users table created successfully!');
  await sql.end();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
