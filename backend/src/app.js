import express from "express";
import cors from "cors";
import userRoutes from "./routes/userroute.js";
import assignmentRoutes from "./routes/assignmentRoute.js";
import assignmentSubmissionRoutes from "./routes/assignmentSubmissionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/assignment-submissions", assignmentSubmissionRoutes);
app.use("/api/assignments", assignmentRoutes);

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.use("/api/users", userRoutes);

export default app;
