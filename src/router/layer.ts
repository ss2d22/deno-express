/**
 * @file layer.ts
 * @description Implements layer functionality.
 * Layers are the building blocks of the routing system, containing path matching
 * and handler execution logic.
 * @author Sriram Sundar
 */

import { RouteHandler, ResponseContext } from "../core/app.ts";
import { Route } from "./route.ts";
import { NextFunction } from "./router.ts";

/**
 * Layer type definition that represents a handler for a specific path
 */
export interface Layer {
  /** The path pattern for this layer */
  path: string;

  /** The handler function for this layer */
  handle: RouteHandler;

  /** The HTTP method this layer responds to (if a method handler) */
  method?: string;

  /** The associated Route object (if this is a route path layer) */
  route?: Route;

  /** Layer name (for middleware identification) */
  name?: string;

  /** Check if this layer matches the given path */
  match: (path: string) => boolean;

  /** Handle a request with this layer's handler */
  handleRequest: (
    req: Request,
    res: ResponseContext,
    next: NextFunction
  ) => Promise<void> | void;
}

/**
 * Normalizes a path by ensuring it starts with a / and has no trailing /
 * @param {string} path - The path to normalize
 * @returns {string} The normalized path
 */
function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path;
}

/**
 * Creates a new layer function for handling route matching and request handling
 * @param {string} path - The path pattern to match
 * @param {RouteHandler} handler - The request handler function
 * @returns {Layer} The layer object with methods for matching and handling
 */
export function createLayer(path: string, handler: RouteHandler): Layer {
  const normalizedPath = normalizePath(path);

  const handlerName = handler.name || "<anonymous>";

  const layer: Layer = {
    path: normalizedPath,
    handle: handler,
    method: undefined,
    route: undefined,
    name: handlerName,

    /**
     * Check if this layer matches the given path
     * @param {string} requestPath - The path to match against
     * @returns {boolean} True if the path matches, false otherwise
     */
    match(requestPath: string): boolean {
      const normalizedRequestPath = normalizePath(requestPath);

      if (this.route === undefined) {
        return true;
      }

      if (this.route && this.route.path === normalizedRequestPath) {
        return true;
      }

      if (this.path === "*") {
        return true;
      }

      return false;
    },

    /**
     * Handle a request with this layer's handler
     * @param {Request} req - The incoming request
     * @param {ResponseContext} res - The response context
     * @param {NextFunction} next - The next function for middleware chaining
     * @returns {Promise<void> | void}
     */
    handleRequest(
      req: Request,
      res: ResponseContext,
      next: NextFunction
    ): Promise<void> | void {
      try {
        return this.handle(req, res, next);
      } catch (err) {
        console.error("Layer error:", err);
        throw err;
      }
    },
  };

  return layer;
}
