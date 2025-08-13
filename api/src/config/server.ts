import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import cors from "cors";
import apiRoutes from "../routes/api";

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
