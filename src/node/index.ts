import * as build from "./build"
import * as commands from "./commands"
import * as pipe from "./pipe"
import * as project from "./project"

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
   * Pipes
   */
  pipe
}
