/**
 * @file layer.ts
 * @description Implements layer functionality.
 * Layers are the building blocks of the routing system, containing path matching
 * and handler execution logic.
 * @author Sriram Sundar
 */

import { RouteHandler, ResponseContext } from "../core/app.ts";
import { Route } from "./route.ts";

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

  /** Check if this layer matches the given path */
  match: (path: string) => boolean;

  /** Handle a request with this layer's handler */
  handleRequest: (req: Request, res: ResponseContext) => Promise<void>;
}

/**
 * Creates a new layer function for handling route matching and request handling
 * @param {string} path - The path pattern to match
 * @param {RouteHandler} handler - The request handler function
 * @returns {Layer} The layer object with methods for matching and handling
 */
export function createLayer(path: string, handler: RouteHandler): Layer {
  const layer: Layer = {
    path,
    handle: handler,
    method: undefined,
    route: undefined,

    /**
     * Check if this layer matches the given path
     * @param {string} requestPath - The path to match against
     * @returns {boolean} True if the path matches, false otherwise
     */
    match(requestPath: string): boolean {
      // TODO: handle path patterns, params, etc.
      return this.path === requestPath || this.path === "*";
    },

    /**
     * Handle a request with this layer's handler
     * @param {Request} req - The incoming request
     * @param {ResponseContext} res - The response context
     * @returns {Promise<void>}
     */
    async handleRequest(req: Request, res: ResponseContext): Promise<void> {
      try {
        const result = this.handle(req, res);
        if (result instanceof Promise) {
          await result;
        }
      } catch (err) {
        console.error("Layer error:", err);
        throw err;
      }
    },
  };

  return layer;
}
