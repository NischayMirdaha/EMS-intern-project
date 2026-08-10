import bcrypt from "bcrypt";
import pool from "../config/database.js";
import { ensureUsersTable } from "../models/usermodel.js";

async function seed() {
    try {
        await ensureUsersTable();

        const hashedPassword = await bcrypt.hash("Password123", 10);

        await pool.query(
            `
            INSERT INTO users (username, email, password, role, is_verified)
            VALUES ($1, $2, $3, $4, TRUE)
            ON CONFLICT (email) DO NOTHING
            `,
            [
                "Admin",
                "admin@example.com",
                hashedPassword,
                "admin"
            ]
        );

        console.log("✅ Database seeded successfully!");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();