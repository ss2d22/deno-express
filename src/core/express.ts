/**
 * @file express.ts
 * @description Main entry point for the framework.
 * @author Sriram Sundar
 */

import { App, createApp } from "./app.ts";

/**
 * Creates a new application
 * @returns {App} A configured application instance with HTTP method handlers.
 */
export function createApplication(): App {
  return createApp();
}

export default createApplication;
