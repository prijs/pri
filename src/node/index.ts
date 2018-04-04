import * as build from "./build"
import * as commands from "./commands"
import * as context from "./context"
import * as devService from "./dev-service"
import * as project from "./project/index"

export const pri = {
  /**
   * Operate cli commands
   */
  commands,
  /**
   * Build configs
   */
  build,
  /**
   * Project management
   */
  project,
  /**
   * Context operate
   */
  context,
  /**
   * Register dev service
   */
  devService,
}

export * from "../utils/structor-config"
