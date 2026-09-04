import express from "express";
import cors from "cors";
import userRoutes from "./routes/userroute.js";
import classRoutes from "./routes/classRoute.js";
import sectionRoutes from "./routes/sectionRoute.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import onlineClassRoutes from "./routes/onlineClassRoutes.js"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import assignmentSubmissionRoutes from "./routes/assignmentSubmissionRoutes.js";
import staffRoutes from "./routes/staffRoute.js";
import studentRoutes from "./routes/studentRoute.js";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/assignment-submissions", assignmentSubmissionRoutes);


app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/online-classes", onlineClassRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/students", studentRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
