/**
 * @file router.ts
 * @description Implements router functionality.
 * The router manages route storage and request dispatching.
 * @author Sriram Sundar
 */

import { ResponseContext } from "../core/app.ts";
import { createRoute, Route } from "./route.ts";
import { createLayer, Layer } from "./layer.ts";

/**
 * Router configuration options
 */
export interface RouterOptions {
  /** Whether routes should be case sensitive */
  caseSensitive?: boolean;
  /** Whether routes should match strictly (exact trailing slashes) */
  strict?: boolean;
}

/**
 * Router type definition
 */
export interface Router {
  /** Stack of Layer objects representing routes */
  stack: Layer[];

  /** Router configuration options */
  options: RouterOptions;

  /** Create a new route for the given path */
  route: (path: string) => Route;

  /** Handle an incoming request by finding a matching route */
  handle: (req: Request) => Promise<Response>;
}

/**
 * Next function type for middleware chaining
 */
export type NextFunction = () => void;

/**
 * Gets the pathname from the request URL
 * @param {Request} req - The request object
 * @returns {string} The URL pathname or "/" on error
 */
function getPathname(req: Request): string {
  try {
    return new URL(req.url).pathname;
  } catch (err) {
    console.error("Error parsing URL:", err);
    return "/";
  }
}

/**
 * Attempts to match a layer against a path
 * @param {Layer} layer - The layer to match
 * @param {string} path - The path to match against
 * @returns {boolean|Error} true if matched, false or Error otherwise
 */
function matchLayer(layer: Layer, path: string): boolean | Error {
  try {
    return layer.match(path);
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Creates a response context for handling responses
 */
function createResponseContext(): ResponseContext {
  return {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    async send(body: string) {
      await Promise.resolve();

      this._response = new Response(body, {
        status: this.statusCode || 200,
        headers: this.headers,
      });
      return this._response;
    },
    async json(body: unknown) {
      await Promise.resolve();

      this.headers.set("Content-Type", "application/json");
      this._response = new Response(JSON.stringify(body), {
        status: this.statusCode || 200,
        headers: this.headers,
      });
      return this._response;
    },
    headers: new Headers(),
    _response: null,
  };
}

/**
 * Creates a router function for managing routes and handling requests
 * @param {RouterOptions} [options={}] - Optional configuration options
 * @returns {Router} The router object with methods for route management
 */
export function createRouter(options: RouterOptions = {}): Router {
  const stack: Layer[] = [];

  const router: Router = {
    stack,
    options,

    /**
     * Create a new route for the given path
     * @param {string} path - The route path to match
     * @returns {Route} A new Route for the path
     */
    route(path: string): Route {
      const route = createRoute(path);
      const layer = createLayer(path, (req, res, next) => {
        if (route.dispatch) {
          return route.dispatch(req, res, next || (() => {}));
        }
      });

      layer.route = route;
      stack.push(layer);

      return route;
    },

    /**
     * Handle an incoming request by finding a matching route
     * @param {Request} req - The incoming request object
     * @returns {Promise<Response>} A response object
     */
    handle(req: Request): Promise<Response> {
      const method = req.method.toLowerCase();
      const path = getPathname(req);
      const responseContext = createResponseContext();

      return new Promise((resolve) => {
        let idx = 0;

        const next: NextFunction = () => {
          let match: boolean | Error;
          let layer: Layer | undefined;
          let route: Route | undefined;

          while (idx < stack.length) {
            layer = stack[idx++];
            match = matchLayer(layer, path);

            if (match !== true) {
              continue;
            }

            route = layer.route;

            if (!route) {
              // TODO: handle non-route leyrs (like middleware)
              continue;
            }

            if (route.methods[method]) {
              try {
                Promise.resolve(layer.handleRequest(req, responseContext, next))
                  .then(() => {
                    if (responseContext._response) {
                      resolve(responseContext._response);
                    }
                  })
                  .catch((err) => {
                    console.error("Route error:", err);
                    resolve(
                      new Response("Internal Server Error", { status: 500 })
                    );
                  });

                return; 
              } catch (err) {
                console.error("Route error:", err);
                resolve(new Response("Internal Server Error", { status: 500 }));
                return;
              }
            }
          }

          if (!responseContext._response) {
            resolve(new Response("Not Found", { status: 404 }));
          } else {
            resolve(responseContext._response);
          }
        };

        next();
      });
    },
  };

  return router;
}
