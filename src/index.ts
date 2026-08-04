import "dotenv/config"
import app from "./app";

const PORT = Number(process.env.PORT) || 3000;
const env = process.env.NODE_ENV || "development"

app.listen(PORT, () => {
    console.log(`running on port ${PORT} in ${env} mode`)
})
