import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";
import { ensureUsersTable } from "./models/usermodel.js";
import { ensureQuestionPapersTable } from "./models/questionPaperModel.js";

const PORT = process.env.PORT || 5000;

pool
  .connect()
  .then(() => {
    console.log("Database connected successfully!");
    return ensureUsersTable();
  })
  .then(() => {
    return ensureQuestionPapersTable();
  })
  .then(() => {
    console.log("Database tables are ready.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });