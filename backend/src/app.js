import express from "express";
import cors from "cors";
import userRoutes from "./routes/userroute.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.use("/api/users", userRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/online-classes", onlineClassRoutes);
app.use("/api/forums", forumRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
