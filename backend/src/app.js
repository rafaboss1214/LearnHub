const cors = require("cors");
const express = require("express");
const env = require("./config/env");
const authRoutes = require("./routes/auth-routes");
const healthRoutes = require("./routes/health-routes");
const projectRoutes = require("./routes/project-routes");
const { notFound, errorHandler } = require("./middleware/error-handler");

function corsOptions() {
  if (env.CORS_ORIGIN.trim() === "*") return { origin: true };
  return {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
  };
}

const app = express();

app.disable("x-powered-by");
app.use(cors(corsOptions()));
app.use(express.json({ limit: "100kb" }));
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
