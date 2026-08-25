import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";
import { ensureUsersTable } from "./models/usermodel.js";
import { ensureClassesTable } from "./models/classModel.js";
import { ensureSectionsTable } from "./models/sectionModel.js";
import classRoutes from "./routes/classRoute.js";


const PORT = process.env.PORT || 3000;
pool.connect()
  .then(() => {
    console.log("Database connected successfully!");
    return ensureUsersTable();
  })
  .then(() => {
    return ensureClassesTable();
  })
  .then(() => {
    return ensureSectionsTable();
  })
  .then(() => {
    console.log("Database tables are ready.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
  });