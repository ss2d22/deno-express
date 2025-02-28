/**
 * @file route.ts
 * @description Implements route functionality.
 * Routes represent a single path with multiple HTTP method handlers.
 * @author Sriram Sundar
 */

import methods from "../core/methods.ts";
import { createLayer, Layer } from "./layer.ts";
import { RouteHandler, ResponseContext } from "../core/app.ts";

/**
 * Route type definition
 */
export interface Route {
  /** The route path pattern */
  path: string;

  /** Stack of Layer objects representing method handlers */
  stack: Layer[];

  /** Map of HTTP methods supported by this route */
  methods: Record<string, boolean>;

  /** Dispatch a request to this route's handlers */
  dispatch: (req: Request, res: ResponseContext) => Promise<void>;

  /** Generic method for adding handlers for a specific HTTP method */
  addMethod: (method: string, ...handlers: RouteHandler[]) => Route;

  /** Common HTTP method handlers */
  get: (...handlers: RouteHandler[]) => Route;
  post: (...handlers: RouteHandler[]) => Route;
  put: (...handlers: RouteHandler[]) => Route;
  delete: (...handlers: RouteHandler[]) => Route;
  patch: (...handlers: RouteHandler[]) => Route;
  head: (...handlers: RouteHandler[]) => Route;
  options: (...handlers: RouteHandler[]) => Route;

  /** Handlers for uncommon HTTP methods */
  [key: string]: unknown;
}

/**
 * Creates a new Route for a given path
 * @param {string} path - The route path pattern
 * @returns {Route} A route object with HTTP method handlers
 */
export function createRoute(path: string): Route {
  const stack: Layer[] = [];
  const methodsMap: Record<string, boolean> = {};

  const route: Route = {
    path,
    stack,
    methods: methodsMap,

    /**
     * Dispatch a request to this route's handlers
     * @param {Request} req - The incoming request
     * @param {ResponseContext} res - The response context
     * @returns {Promise<void>}
     */
    async dispatch(req: Request, res: ResponseContext): Promise<void> {
      if (stack.length === 0) {
        return;
      }

      // TODO: run through middleware chain, instead of just executing the first handler
      await stack[0].handleRequest(req, res);
    },

    /**
     * Generic method for adding handlers for a specific HTTP method
     * @param {string} method - The HTTP method (lowercase)
     * @param {RouteHandler[]} handlers - Handler functions
     * @returns {Route} This route for chaining
     */
    addMethod(method: string, ...handlers: RouteHandler[]): Route {
      handlers.forEach((handler) => {
        const layer = createLayer("/", handler);
        layer.method = method;
        methodsMap[method] = true;
        stack.push(layer);
      });

      return route;
    },

    get(...handlers: RouteHandler[]): Route {
      return route.addMethod("get", ...handlers);
    },

    post(...handlers: RouteHandler[]): Route {
      return route.addMethod("post", ...handlers);
    },

    put(...handlers: RouteHandler[]): Route {
      return route.addMethod("put", ...handlers);
    },

    delete(...handlers: RouteHandler[]): Route {
      return route.addMethod("delete", ...handlers);
    },

    patch(...handlers: RouteHandler[]): Route {
      return route.addMethod("patch", ...handlers);
    },

    head(...handlers: RouteHandler[]): Route {
      return route.addMethod("head", ...handlers);
    },

    options(...handlers: RouteHandler[]): Route {
      return route.addMethod("options", ...handlers);
    },
  };

  methods.forEach((method) => {
    if (!(method in route)) {
      route[method] = (...handlers: RouteHandler[]): Route => {
        return route.addMethod(method, ...handlers);
      };
    }
  });

  return route;
}
