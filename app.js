import { readFile, readdir, open } from "node:fs/promises";
import http from "node:http";

const httpServer = http.createServer(async (req, res) => {
   if (req.url == "/") {
     serveFile(req,res);
  } else if (req.url == "/favicon.ico") {
    res.statusCode = 404;
    res.end();
  }else {
    try {
      console.log(`./storage${decodeURIComponent(req.url)}`)
      const fileHandle = await open(`./storage${decodeURIComponent(req.url)}`);
      const stat = await fileHandle.stat();

      if (stat.isDirectory()) {
         serveFile(req,res);
      } else {
        const readStream = fileHandle.createReadStream();
        readStream.pipe(res);

        readStream.on("end", () => {
          fileHandle.close();
        });
        readStream.on("error", (err) => {
          console.error(err, "this is inside try catch error");
          res.statusCode = 500;
          res.end("Internal Server Error");
        });
      }
    } catch (err) {
      console.log(err.message);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }
});

httpServer.listen(80, "0.0.0.0", () => {
  console.log("server started at port:", httpServer.address().port);
});


async function serveFile(req , res){
      const itemsData = await readdir(`./storage${decodeURIComponent(req.url)}`);
      let dynamicHtml = "";
    itemsData.forEach((item) => {
      dynamicHtml += `<li><a href="${decodeURIComponent(req.url)=== "/" ? "" : decodeURIComponent(req.url) + "/"}${item}">${item}</a></li>`;
      console.log(`${decodeURIComponent(req.url)=== "/" ? "" : decodeURIComponent(req.url) + "/"}${item}`)
      console.log(req.url);
    });
    const UI = await readFile("./UI.html", "utf-8");
    res.statusCode = 200;
    res.end(UI.replace("${dynamicHTML}", dynamicHtml));
  } 
