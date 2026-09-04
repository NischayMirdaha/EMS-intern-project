import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";
import { ensureClassesTable } from "./models/classModel.js";
import { ensureSectionsTable } from "./models/sectionModel.js";
import classRoutes from "./routes/classRoute.js";
import { ensureAssignmentsTable } from "./models/assignmentModel.js";
import { ensureSubmissionsTable } from "./models/submissionModel.js";
import {ensureOnlineClassesTable} from "./models/onlineClassModel.js"
import { ensureUsersTable, ensureSuperAdminUser } from "./models/usermodel.js";
import { ensureStaffTable } from "./staff/staffModel.js";
import { ensureStudentTables } from "./student/studentModel.js";

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
    .then(() => ensureAssignmentsTable())
    .then(() => ensureSubmissionsTable())
    .then(() => ensureOnlineClassesTable())
    .then(() => ensureStaffTable())
    .then(() => ensureStudentTables())
    .then(() => ensureSuperAdminUser())

    .then(() => {
        console.log("Database tables are ready.");
    })
     .catch((err) => {
    console.error("Database initialization failed:", err);
  });


    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    })

 


