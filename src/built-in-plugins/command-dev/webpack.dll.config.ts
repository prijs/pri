import * as crypto from "crypto"
import * as path from "path"
import * as webpack from "webpack"
import * as yargs from "yargs"

const projectRootPath = yargs.argv.env.projectRootPath
const dllOutPath = yargs.argv.env.dllOutPath
const dllFileName = yargs.argv.env.dllFileName
const dllMainfestName = yargs.argv.env.dllMainfestName

const stats = {
  warnings: false,
  version: false,
  modules: false,
  entrypoints: false,
  hash: false
}

export default {
  entry: {
    library: [
      "react",
      "react-dom",
      "lodash",
      "dob",
      "dob-react",
      "antd",
      "highlight.js",
      "markdown-it",
      "react-hot-loader",
      "react-loadable",
      "react-router-dom",
      "styled-components",
      "history/createBrowserHistory",
      "pri/client"
    ]
  },

  output: {
    filename: dllFileName,
    path: dllOutPath,
    library: "library"
  },

  plugins: [
    new webpack.DllPlugin({
      path: path.join(dllOutPath, dllMainfestName),
      name: "library"
    })
  ],

  module: {
    rules: [
      {
        test: /\.css/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },

  resolve: {
    modules: [
      // From project node_modules
      path.join(projectRootPath, "node_modules"),
      // Self node_modules
      path.join(__dirname, "../../../node_modules")
    ],
    extensions: [".js", ".jsx", ".tsx", ".ts", ".scss", ".less", ".css"]
  },

  resolveLoader: {
    modules: [
      // From project node_modules
      path.join(projectRootPath, "node_modules"),
      // Self node_modules
      path.join(__dirname, "../../../node_modules")
    ]
  },

  stats
}
