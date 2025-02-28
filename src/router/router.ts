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
      const layer = createLayer(path, route.dispatch.bind(route));

      layer.route = route;
      stack.push(layer);

      return route;
    },

    /**
     * Handle an incoming request by finding a matching route
     * @param {Request} req - The incoming request object
     * @returns {Promise<Response>} A response object
     */
    async handle(req: Request): Promise<Response> {
      const method = req.method.toLowerCase();
      const url = new URL(req.url);
      const pathname = url.pathname;

      for (const layer of stack) {
        if (layer.match(pathname) && layer.route) {
          const route = layer.route;

          if (route.methods[method]) {
            const responseContext: ResponseContext = {
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

            await route.dispatch(req, responseContext);

            if (responseContext._response) {
              return responseContext._response;
            }

            return new Response("OK", { status: 200 });
          }
        }
      }

      return new Response("Not Found", { status: 404 });
    },
  };

  return router;
}
