import * as fs from "fs"
import * as http from "http"
import * as open from "opn";
import * as path from "path"
import * as portfinder from "portfinder";
import * as url from "url"
import * as zlib from "zlib"
import { getConfig } from "../../utils/project-config"
import { CommandBuild } from "../build"

const projectRootPath = process.cwd();

export const CommandPreview = async () => {
  const config = getConfig(projectRootPath, "prod")

  const validatePort = await portfinder.getPortPromise()

  await CommandBuild()

  await http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || "")
    let pathname = path.join(projectRootPath, "dist", parsedUrl.pathname || "")
    let ext = path.parse(pathname).ext

    // Root is index.html
    if (parsedUrl.pathname === "/" && ext === "") {
      ext = ".html"
    }

    // maps file extention to MIME typere
    const map = new Map<string, string>()
    map.set(".ico", "image/x-icon")
    map.set(".html", "text/html")
    map.set(".js", "application/javascript")
    map.set(".json", "application/json")
    map.set(".css", "text/css")
    map.set(".png", "image/png")
    map.set(".jpg", "image/jpeg")
    map.set(".wav", "audio/wav")
    map.set(".mp3", "audio/mpeg")
    map.set(".svg", "image/svg+xml")
    map.set(".pdf", "application/pdf")
    map.set(".doc", "application/msword")

    if (!fs.existsSync(pathname)) {
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return
    }

    // If is a directory search for index file matching the extention
    if (fs.statSync(pathname).isDirectory()) {
      pathname = path.join(pathname, "/index" + ext)
    }

    // Read file from file system
    fs.readFile(pathname, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // If the file is found, set Content-type and send data
        res.setHeader("Content-type", map.get(ext) || "text/plain");
        res.setHeader("Content-Encoding", "gzip")

        zlib.gzip(data, (_, result) => {
          res.end(result);
        });
      }
    });
  }).listen(validatePort)

  open(`http://localhost:${validatePort}`)
}
