import express from "express";
import cors from "cors";
import userRoutes from "./routes/userroute.js";
import classRoutes from "./routes/classRoute.js";
import sectionRoutes from "./routes/sectionRoute.js";
import examRoute from "./routes/examRoute.js";
import questionPaperRoute from "./routes/questionPaperRoute.js";
import onlineExamRoute from "./routes/onlineExamRoute.js";
import omrRoute from "./routes/omrRoute.js";
import resultRoute from "./routes/resultRoute.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/exams", examRoute);
app.use("/api/question-papers", questionPaperRoute);
app.use("/api/online-exams", onlineExamRoute);
app.use("/api/omr", omrRoute);
app.use("/api/results", resultRoute);

export default app;
