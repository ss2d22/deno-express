/**
 * @file app.ts
 * @description Defines the application structure, implements the core application interface with HTTP method handlers.
 * @author Sriram Sundar
 */

import methods from "./methods.ts";
import { createRouter, Router, NextFunction } from "../router/router.ts";

/**
 * Configuration options for the application.
 */
export interface AppOptions {
  /** Whether routes should be case sensitive */
  caseSensitive?: boolean;
  /** Whether routes should match strictly (exact trailing slashes) */
  strict?: boolean;
}

/**
 * application interface with HTTP method handlers.
 */
export interface App {
  /** Router instance that manages routes */
  _router?: Router;
  /** Application settings and configuration */
  settings: Record<string, unknown>;

  /**
   * Starts the HTTP server on the specified port.
   * @param {number} port - The port to listen on
   * @param {Function} [callback] - Optional callback function to execute when server starts
   */
  listen: (port: number, callback?: () => void) => void;

  /**
   * Handles incoming HTTP requests and routes them to the appropriate handler.
   * @param {Request} req - The incoming request object
   * @returns {Promise<Response>} A response object
   */
  handle: (req: Request) => Promise<Response>;

  /**
   * Registers a route handler for GET requests.
   * @param {string} path - The route path to match
   * @param {...RouteHandler} handlers - One or more handler functions
   * @returns {App} This app instance for chaining
   */
  get: (path: string, ...handlers: RouteHandler[]) => App;

  /**
   * Registers a route handler for POST requests.
   * @param {string} path - The route path to match
   * @param {...RouteHandler} handlers - One or more handler functions
   * @returns {App} This app instance for chaining
   */
  post: (path: string, ...handlers: RouteHandler[]) => App;

  /**
   * Registers a route handler for PUT requests.
   * @param {string} path - The route path to match
   * @param {...RouteHandler} handlers - One or more handler functions
   * @returns {App} This app instance for chaining
   */
  put: (path: string, ...handlers: RouteHandler[]) => App;

  /**
   * Registers a route handler for DELETE requests.
   * @param {string} path - The route path to match
   * @param {...RouteHandler} handlers - One or more handler functions
   * @returns {App} This app instance for chaining
   */
  delete: (path: string, ...handlers: RouteHandler[]) => App;

  /** other HTTP methods */
  [key: string]: unknown;
}

/**
 * Route handler function signature.
 */
export type RouteHandler = (
  req: Request,
  res: ResponseContext,
  next?: NextFunction
) => Promise<void> | void;

/**
 * Context for building and sending HTTP responses.
 */
export interface ResponseContext {
  /** HTTP status code for the response */
  statusCode?: number;

  /**
   * Sets the HTTP status code for the response.
   * @param {number} code - The HTTP status code
   * @returns {ResponseContext} This context for chaining
   */
  status: (code: number) => ResponseContext;

  /**
   * Sends a string response with the configured status and headers.
   * @param {string} body - The response body text
   * @returns {Promise<Response>} The created Response object
   */
  send: (body: string) => Promise<Response>;

  /**
   * Sends a JSON response with the configured status and headers.
   * @param {unknown} body - The object to serialize as JSON
   * @returns {Promise<Response>} The created Response object
   */
  json: (body: unknown) => Promise<Response>;

  /** Headers for the response */
  headers: Headers;

  /** The created Response object, if any */
  _response: Response | null;
}

/**
 * Creates a new application instance with all required methods.
 * @param {AppOptions} [options={}] - Optional configuration options
 * @returns {App} The configured application instance
 */
export function createApp(options: AppOptions = {}): App {
  let router: Router | undefined = undefined;
  const settings: Record<string, unknown> = {};

  const createMethodHandler = (method: string) => {
    return function (path: string, ...handlers: RouteHandler[]): App {
      if (!router) {
        router = createRouter(options);
      }

      const route = router.route(path);
      (route as unknown as Record<string, (...args: RouteHandler[]) => void>)[
        method
      ](...handlers);

      return app;
    };
  };

  const app: App = {
    get _router(): Router | undefined {
      return router;
    },

    set _router(r: Router | undefined) {
      router = r;
    },

    settings,

    listen(port: number, callback?: () => void): void {
      Deno.serve({ port }, (request) => {
        return app.handle(request);
      });

      if (callback) callback();
    },

    async handle(req: Request): Promise<Response> {
      if (!router) {
        router = createRouter(options);
      }

      return await router.handle(req);
    },

    get: createMethodHandler("get"),
    post: createMethodHandler("post"),
    put: createMethodHandler("put"),
    delete: createMethodHandler("delete"),
  };

  methods.forEach((method) => {
    if (!app[method]) {
      app[method] = createMethodHandler(method);
    }
  });

  return app;
}