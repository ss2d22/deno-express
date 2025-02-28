/**
 * @file server.ts
 * @description Example usage for testing for now will make this proper examples for demo later
 * @author Sriram Sundar
 */

import express from "../core/express.ts";

const app = express();

app.get("/", async (_req, res) => {
  await res.send("Hello world from /");
});

app.get("/2", async (_req, res) => {
  await res.send("Hello world from /2");
});

app.post("/post", async (_req, res) => {
  await res.send("Data from post :)");
});

app.get("/greet", async (req, res) => {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "Guest";
  await res.send(`Hello, ${name}!`);
});

app.get("/json", async (_req, res) => {
  await res.json({
    message: "This is JSON data",
    timestamp: new Date().toISOString(),
  });
});

app.get("/created", async (_req, res) => {
  await res.status(201).send("Resource created successfully");
});

console.log("Starting enhanced server on port 3000");
app.listen(3000, () =>
  console.log("Enhanced server running on http://localhost:3000")
);