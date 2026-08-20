import { readFile, readdir, open } from "node:fs/promises";
import http from "node:http";
import mime from "mime-types";
import path from "node:path";

const httpServer = http.createServer(async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const [url, queryString] = req.url.split("?");
    const queryParam = {};

    if (queryString) {
      queryString.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        queryParam[key] = value;
      });
    }

    if (url === "/favicon.ico") {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (url === "/") {
      await serveFile(url, res);
      return;
    }

    const filePath = `./storage${decodeURIComponent(url)}`;
    const fileHandle = await open(filePath);
    const stats = await fileHandle.stat();

    if (stats.isDirectory()) {
      await fileHandle.close();
      await serveFile(url, res);
      return;
    }

    const readStream = fileHandle.createReadStream();
    const fileName = path.basename(url);
    const contentType = mime.contentType(fileName);

    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Content-Length", stats.size);
    if (queryParam.action === "download") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${decodeURIComponent(url)}"`,
      );
    }

    readStream.pipe(res);

    readStream.on("end", async () => {
      await fileHandle.close();
    });
    readStream.on("error", async () => {
      console.error(err);
      await fileHandle.close();
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  } catch (err) {
    console.log(err.message);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

httpServer.listen(80, "0.0.0.0", () => {
  console.log("server started at port:", httpServer.address().port);
});

async function serveFile(url, res) {
  const currentUrl = decodeURIComponent(url);
  const directoryPath = `./storage${currentUrl}`;
  const itemsData = await readdir(directoryPath, { withFileTypes: true });

  const result = itemsData.map((item) => ({
    name: item.name,
    type: item.isDirectory() ? "directory" : "file",
  }));

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(result));
}
