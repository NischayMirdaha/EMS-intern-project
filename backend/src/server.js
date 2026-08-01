import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";
import { ensureUsersTable, ensureDefaultAdminUser } from "./models/usermodel.js";
import { ensureStaffTable } from "./staff/staffModel.js";


const PORT = process.env.PORT || 3000;
pool.connect()
    .then(() => {
        console.log("Database connected successfully!");
        return ensureUsersTable();
    })
    .then(() => ensureStaffTable())
    .then(() => ensureDefaultAdminUser())
    .then(() => {
        console.log("Database tables are ready.");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
    });
