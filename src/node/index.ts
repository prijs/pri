import * as build from "./build"
import * as commands from "./commands"
import * as context from "./context"
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
  context
}

export * from "../utils/structor-config"
