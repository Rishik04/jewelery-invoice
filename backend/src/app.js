import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import * as dotenv from "dotenv";
dotenv.config();

// import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FE_URL,
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/invoice", invoiceRoutes);

// app.use(errorMiddleware);

export default app;
