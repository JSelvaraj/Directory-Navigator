// https://nodejs.org/docs/latest-v8.x/api/fs.html
let fs = require("fs");
// https://nodejs.org/docs/latest-v8.x/api/http.html
let http = require("http");
// https://nodejs.org/docs/latest-v8.x/api/os.html
let os = require("os");
// https://nodejs.org/docs/latest-v8.x/api/process.html
let process = require("process");
// https://www.npmjs.com/package/ws
let ws = require("ws"); // npm install ws

let dlj = require("./dir_list_json.js");

let G_port = process.getuid(); /** type "id" on Linux for uid value **/
if (G_port < 1024) G_port += 10000; // do not use privileged ports

function serveApp(request, response) {
  console.log(request.url);
  if (request.url === "/") {
    fs.readFile(__dirname + "/index.html",
      function (error, data) {
        if (error) {
          response.writeHead(500);
          response.end("Error loading index.html");
        }
        else {
          console.log("Main Loaded Successfully");
          response.writeHead(200, { "Content-Type": "text/html" });
          response.end(data);
        }
      });
  } else if (request.url === "/dir_list.css") {
    fs.readFile("dir_list.css",
      function (error, data) {
        if (error) {
          console.log(error);
          response.writeHead(500);
          response.end("Error loading index.html");
        }
        else {
          console.log("CSS loaded successfully")
          response.writeHead(200, { 'Content-Type': 'text/css' });
          response.write(data);
          response.end();
        }
      })
  }  else if (request.url === "/dir_list_json.js") {
    fs.readFile("dir_list_json.js",
      function (error, data) {
        if (error) {
          console.log(error);
          response.writeHead(500);
          response.end("Error loading index.html");
        } else {
          console.log("Javascript loaded successfully")
          response.writeHead(200, { 'Content-Type': 'text/javascript' });
          response.write(data);
          response.end();
        }
      }
    )
   } else if (request.url !== "/favicon.ico") { //I don't know why but for some reason the server gets requests for favicon.ico when I run it.
    fs.readFile(request.url,
            function (error, data) {
        if (error) {
          console.log(error);
          response.writeHead(500);
          response.end("Error loading index.html");
        } else {
          console.log("Page loaded successfully")
          response.writeHead(200, { 'Content-Type': 'text/html' });
          response.write(data);
          response.end();
      }
    });
  }
    
};

let httpServer = http.createServer(serveApp).listen(G_port, os.hostname());
let wsServer = new ws.Server({ server: httpServer });

/**
 * The on connection event occurs when a client connects to the server.
 * 
 * On initially connecting it presents the Client with the root directory then each request it gets from
 * the client on that connection should be for a new directory, each time it will send a JSON object of the 
 * directory(the JSON object will have been converted to a string) to the client.
 */
wsServer.on("connection", function (ws) {
  dlj.getDirInfo(__dirname + "/test1Dir", (error, result) => { // result is dirFileList
    if (error) { console.log(error); }
    else {
      let dirInfo = result;
      let message = { "response": "dirinfo", "info":dirInfo};

      let m_tx = JSON.stringify(message);
      ws.send(m_tx);
    }
  });


  ws.on("message", function (data) {
    let object = JSON.parse(data);
    console.log("Message received");
    try {
      if (object["request"] == "dirinfo") {
        if (object["dirpath"] != __dirname) { //This if is so the client can't go to a parent folder above the root directory provided.
          dlj.getDirInfo(object["dirpath"], (error, result) => { // result is dirFileList
            if (error) { console.log(error); }
            else {
              let dirInfo = result;
              let message = { "response": "dirinfo", "info":dirInfo};
  
              let m_tx = JSON.stringify(message);
              ws.send(m_tx);
            }
          });
        } else {
          console.log("User trying to access beyond root directory.")
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
});



console.log("-- server is running: " + os.hostname() + ":" + G_port);



