#!/usr/bin/env node
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const sampleGarments = [
  {
    name: "Classic Black T-Shirt",
    description: "Premium cotton t-shirt perfect for casual everyday wear",
    category: "shirt",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    price: "R199",
    currency: "ZAR",
    isActive: 1,
  },
  {
    name: "Denim Blue Jeans",
    description: "Classic fit denim jeans with comfortable stretch fabric",
    category: "pants",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop",
    price: "R499",
    currency: "ZAR",
    isActive: 1,
  },
  {
    name: "Floral Summer Dress",
    description: "Light and breezy floral dress perfect for summer occasions",
    category: "dress",
    imageUrl: "https://images.unsplash.com/photo-1595777712802-8d0e5f8e6d4e?w=500&h=500&fit=crop",
    price: "R599",
    currency: "ZAR",
    isActive: 1,
  },
  {
    name: "Leather Jacket",
    description: "Premium leather jacket for a sophisticated look",
    category: "jacket",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop",
    price: "R1299",
    currency: "ZAR",
    isActive: 1,
  },
  {
    name: "White Sneakers",
    description: "Comfortable and stylish white sneakers for everyday wear",
    category: "shoes",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
    price: "R799",
    currency: "ZAR",
    isActive: 1,
  },
  {
    name: "Elegant Evening Gown",
    description: "Sophisticated black evening gown for special occasions",
    category: "dress",
    imageUrl: "https://images.unsplash.com/photo-1595777712802-8d0e5f8e6d4e?w=500&h=500&fit=crop",
    price: "R1999",
    currency: "ZAR",
    isActive: 1,
  },
  {
    name: "Casual Linen Shirt",
    description: "Breathable linen shirt perfect for warm weather",
    category: "shirt",
    imageUrl: "https://images.unsplash.com/photo-1596399676397-d9214b65b42d?w=500&h=500&fit=crop",
    price: "R349",
    currency: "ZAR",
    isActive: 1,
  },
  {
    name: "Athletic Leggings",
    description: "High-waisted leggings with moisture-wicking technology",
    category: "pants",
    imageUrl: "https://images.unsplash.com/photo-1506629082632-11c0b11bbd53?w=500&h=500&fit=crop",
    price: "R449",
    currency: "ZAR",
    isActive: 1,
  },
];

async function seedGarments() {
  try {
    console.log("🌱 Seeding sample garments...");
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);

    // Insert garments
    for (const garment of sampleGarments) {
      await connection.execute(
        `INSERT INTO garments (name, description, category, imageUrl, price, currency, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          garment.name,
          garment.description,
          garment.category,
          garment.imageUrl,
          garment.price,
          garment.currency,
          garment.isActive,
        ]
      );
    }

    console.log("✅ Successfully seeded", sampleGarments.length, "garments!");
    await connection.end();
  } catch (error) {
    console.error("❌ Error seeding garments:", error);
    process.exit(1);
  }
}

seedGarments();
