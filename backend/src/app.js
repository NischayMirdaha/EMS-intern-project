import express from "express";
import cors from "cors";
import userRoutes from "./routes/userroute.js";
import classRoutes from "./routes/classRoute.js";
import sectionRoutes from "./routes/sectionRoute.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);

export default app;
