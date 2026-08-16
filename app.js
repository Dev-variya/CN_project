import { readFile, readdir, open } from "node:fs/promises";
import http from "node:http";
import mime from "mime-types";
import path from "node:path";

const httpServer = http.createServer(async (req, res) => {
  try {
    // URL and query string separate
    const [url, queryString] = req.url.split("?");

    // Parse query parameters
    const queryParam = {};

    if (queryString) {
      queryString.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        queryParam[key] = value;
      });
    }

    // Root directory
    if (url === "/") {
      await serveFile(url, res);
      return;
    }

    // Favicon
    if (url === "/favicon.ico") {
      res.statusCode = 404;
      res.end();
      return;
    }

    // File/folder path
    const filePath = `./storage${decodeURIComponent(url)}`;

    const fileHandle = await open(filePath);
    const stats = await fileHandle.stat();

    // =========================
    // DIRECTORY
    // =========================

    if (stats.isDirectory()) {
      await fileHandle.close();
      await serveFile(url, res);
      return;
    }

    const readStream = fileHandle.createReadStream();

    const contentType =
      mime.contentType(path.basename(decodeURIComponent(url)));

    res.setHeader(
      "Content-Type",
      contentType || "application/octet-stream"
    );

    res.setHeader("Content-Length", stats.size);

    // Only download when action=download
    if (queryParam.action === "download") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(
          decodeURIComponent(url)
        )}"`
      );
    }

    // Send file
    readStream.pipe(res);

    // Close file after reading
    readStream.on("end", async () => {
      await fileHandle.close();
    });

    readStream.on("error", async (err) => {
      console.error(err);

      await fileHandle.close();

      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  } catch (err) {
    console.log(err.message);

    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

httpServer.listen(80, "0.0.0.0", () => {
  console.log(
    "server started at port:",
    httpServer.address().port
  );
});


async function serveFile(url, res) {
  const currentUrl = decodeURIComponent(url);

  const directoryPath = `./storage${currentUrl}`;

  const itemsData = await readdir(directoryPath);

  let dynamicHtml = "";

  itemsData.forEach((item) => {
    // Correct path for nested folders
    const itemPath =
      `${currentUrl === "/" ? "" : currentUrl + "/"}${encodeURIComponent(item)}`;

    dynamicHtml += `
      <div class="file-item">

        <span class="file-name">
          📄 ${item}
        </span>

        <div class="actions">

          <a
            class="btn open-btn"
            href="${itemPath}?action=open"
          >
            Open
          </a>

          <a
            class="btn download-btn"
            href="${itemPath}?action=download"
          >
            Download
          </a>

        </div>

      </div>
    `;
  });

  const UI = await readFile("./UI.html", "utf-8");

  res.statusCode = 200;

  res.setHeader(
    "Content-Type",
    "text/html; charset=utf-8"
  );

  res.end(
    UI.replace("${dynamicHTML}", dynamicHtml)
  );
}