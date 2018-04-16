import { tsBuiltPath } from "../../utils/structor-config"
import { tsPlusBabel } from "../../utils/ts-plus-babel"

export const pluginBuild = async (projectRootPath: string) => {
  await tsPlusBabel(projectRootPath, "src/**/*.{tsx,ts}", tsBuiltPath.dir)
}
