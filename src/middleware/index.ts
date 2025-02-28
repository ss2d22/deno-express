/**
 * @file index.ts
 * @description Initialization middleware for the framework.
 * This middleware enhances the request and response objects.
 * @author Sriram Sundar
 */

import { RouteHandler, ResponseContext, App } from "../core/app.ts";

/**
 * Creates the initialization middleware for the application
 * @param {App} app - The application instance
 * @returns {RouteHandler} The initialization middleware
 */
export function init(app: App): RouteHandler {
  /**
   * initialization middleware
   * @param {Request} req - The request object
   * @param {ResponseContext} res - The response context
   * @param {Function} next - The next middleware function
   */
  return function expressInit(
    req: Request,
    res: ResponseContext,
    next?: () => void
  ): void {
    if (app.responseExtensions) {
      Object.assign(res, app.responseExtensions);
    }

    console.log("Express init middleware executed!");

    next?.();
  };
}
