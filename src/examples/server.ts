/**
 * @file server.ts
 * @description Example usage for testing for now will make this proper examples for demo later
 * @author Sriram Sundar
 */

import express from "../core/express.ts";

const app = express();

app.get("/", async (_req, res) => {
  await res.status(200).send("Hello World!");
});

app.get("/json", async (_req, res) => {
  await res.json({
    message: "Hello World!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/echo", async (req, res) => {
  const url = new URL(req.url);
  const message = url.searchParams.get("message") || "No message provided";
  await res.send(`You said: ${message}`);
});

app.listen(3000, () => console.log("Example app listening on port 3000!"));
