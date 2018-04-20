import * as webpack from "webpack"
import * as ConcatSource from "webpack-sources"

export class WrapContent {
  private header = ""
  private footer = ""

  constructor(header = "", footer = "") {
    this.header = header
    this.footer = footer
  }

  public apply(compiler: webpack.Compiler) {
    compiler.plugin("compilation", compilation => {
      compilation.plugin("optimize-chunk-assets", (chunks: any[], done: any) => {
        chunks.forEach(chunk => {
          chunk.files.forEach((fileName: string) => {
            if (chunk.name === "main") {
              compilation.assets[fileName] = new ConcatSource.ConcatSource(
                this.header,
                compilation.assets[fileName],
                this.footer
              )
            }
          })
        })
        done()
      })
    })
  }
}
