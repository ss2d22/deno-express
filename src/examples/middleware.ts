/**
 * @file middleware.ts
 * @description example demonstrating all middleware features implemented so far.
 * @author Sriram Sundar
 */

import express from "../core/express.ts";
import { ResponseContext } from "../core/app.ts";
const app = express();

interface dataResponse extends ResponseContext {
  customData: {
    timestamp?: string;
    message?: string;
  };
}

const loggerMiddleware = (
  req: Request,
  _res: ResponseContext,
  next?: () => void
) => {
  const url = new URL(req.url);
  console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname}`);
  next?.();
};

const timingMiddleware = (
  req: Request,
  _res: ResponseContext,
  next?: () => void
) => {
  const start = performance.now();

  const cleanupFn = () => {
    const end = performance.now();
    console.log(
      `Request to ${new URL(req.url).pathname} took ${end - start}ms`
    );
  };

  setTimeout(cleanupFn, 0);

  next?.();
};

const headerMiddleware = (
  _req: Request,
  res: ResponseContext,
  next?: () => void
) => {
  res.headers.set("X-Powered-By", "Deno Express");
  res.headers.set("X-Response-Time", new Date().toISOString());
  next?.();
};

const authMiddleware = (
  req: Request,
  res: ResponseContext,
  next?: () => void
) => {
  const url = new URL(req.url);
  const authToken = url.searchParams.get("token");

  if (authToken === "secret123") {
    console.log("Authentication successful");
    next?.();
  } else {
    console.log("Authentication failed");
    res.status(401).send("Unauthorized: Please provide a valid token");
  }
};

const errorMiddleware = (
  _req: Request,
  _res: ResponseContext,
  _next?: () => void
) => {
  throw new Error("Simulated error in middleware");
};

app.get("/", (_req, res) => {
  res.send("Welcome to the Middleware Example Server!");
});

app.get("/simple", loggerMiddleware, (_req, res) => {
  res.send("This route used the logger middleware");
});

app.get(
  "/chain",
  loggerMiddleware,
  timingMiddleware,
  headerMiddleware,
  (_req, res) => {
    res.send("This route used multiple middleware in sequence");
  }
);

app.get("/protected", loggerMiddleware, authMiddleware, (_req, res) => {
  res.send("You accessed the protected route successfully!");
});

app.get(
  "/data-passing",
  (_req, res, next) => {
    (res as dataResponse).customData = {
      timestamp: new Date().toISOString(),
      message: "Hello from previous middleware!",
    };
    next?.();
  },
  (_req, res) => {
    const data = (res as dataResponse).customData;
    res.json({
      receivedData: data,
      additionalMessage: "Data passing between middleware works!",
    });
  }
);

app.get(
  "/error",
  loggerMiddleware,
  (_req, _res, next) => {
    try {
      errorMiddleware(_req, _res, next);
    } catch (err) {
      console.error("Caught error:", err);
      next?.();
    }
  },
  (_req, res) => {
    res.send("Reached this handler despite an error in the middleware chain");
  }
);

app.get(
  "/early-response",
  loggerMiddleware,
  (_req, res, _next) => {
    res.send("Early response - the next middleware won't run");
  },
  (_req, _res) => {
    console.log("This should not be logged");
  }
);

app.get("/json", loggerMiddleware, headerMiddleware, (_req, res) => {
  res.json({
    success: true,
    message: "This is a JSON response",
    timestamp: new Date().toISOString(),
  });
});

app.get("/echo", (req, res) => {
  const url = new URL(req.url);
  const message = url.searchParams.get("message") || "No message provided";
  res.send(`You said: ${message}`);
});

app.post("/submit", loggerMiddleware, async (req, res) => {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      body = "Could not parse JSON body";
    }

    res.json({
      success: true,
      receivedData: body,
      message: "POST request processed successfully",
    });
  } catch (err) {
    console.error("Error processing POST:", err);
    res.status(400).json({
      success: false,
      message: "Error processing request",
    });
  }
});

const PORT = 3000;
console.log(`Starting comprehensive middleware example server on port ${PORT}`);
console.log("Try these endpoints:");
console.log("- GET /                   - Basic route");
console.log("- GET /simple             - Simple middleware");
console.log("- GET /chain              - Multiple middleware");
console.log(
  "- GET /protected          - Protected route (add ?token=secret123)"
);
console.log("- GET /data-passing       - Data passing between middleware");
console.log("- GET /error              - Error handling");
console.log("- GET /early-response     - Early response");
console.log("- GET /json               - JSON response");
console.log("- GET /echo?message=hello - URL parameters");
console.log("- POST /submit            - POST endpoint (send JSON body)");

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
