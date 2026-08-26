import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";
import { ensureUsersTable } from "./models/usermodel.js";
import { ensureAssignmentsTable } from "./models/assignmentModel.js";
import { ensureSubmissionsTable } from "./models/submissionModel.js";


const PORT = process.env.PORT || 3000;
pool.connect()
    .then(() => {
        console.log("Database connected successfully!");
        return ensureUsersTable();
    })
    .then(() => ensureAssignmentsTable())
    .then(() => ensureSubmissionsTable())
    .then(() => ensureOnlineClassesTable())
    .then(() => ensureForumTables())
    .then(() => {
        console.log("Database tables are ready.");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
    });

