import "dotenv/config";
import app from "./app";

const portFromEnv = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : Number.NaN;
const PORT = Number.isFinite(portFromEnv) ? portFromEnv : 3000;
const env = process.env.NODE_ENV ?? "development";

app.listen(PORT, () => {
  console.log(`running on port ${PORT} in ${env} mode`);
});
