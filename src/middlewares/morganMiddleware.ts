import morgan, { type StreamOptions } from "morgan";
import Logger from "../lib/logger";

const stream: StreamOptions = {
  write: (message) => Logger.http(message),
};
const skip = () => {
  const env = process.env.NODE_ENV ?? "development";
  return env === "test";
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] chars - :response-time ms [morgan]",
  {
    stream,
    skip,
  },
);
export default morganMiddleware;
