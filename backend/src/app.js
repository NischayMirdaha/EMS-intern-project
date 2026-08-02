import express from "express";
import cors from "cors";
import userRoutes from "./routes/userroute.js";
import staffRoutes from "./routes/staffRoute.js";
import studentRoutes from "./routes/studentRoute.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.use("/api/users", userRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/students", studentRoutes);

export default app;
