import concurrently from "concurrently";
import {
  readConfigFile, runProxy, runServices
} from "./handler";

const file = readConfigFile();

const services = file.services;
const httpPort = file.port || 3000;
const stage = file.stage || "dev";

const commands = runServices(services, httpPort, stage);

const result = concurrently(commands, {
  killOthers: ["failure", "success"]
});

result.result
  .then(() => {
    console.log("All services exited successfully.");
  })
  .catch((err) => {
    console.error("A service failed to start or crashed:", err);
    process.exit(1);
  });

process.on("SIGINT", () => {
  console.log("");
  process.exit(1);
});

runProxy(services, httpPort, stage);
