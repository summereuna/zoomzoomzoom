import http from "http";
import { WebSocketServer } from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`🚀 Listening on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

//1. fake DB: 몇 명이 서버랑 연결되어 있는지 알아보기 위해 가짜 디비 만듦
//누군가 이 서버에 연결하면, 그 connection을 이 배열에 넣자.
const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  //2. 소켓츠에 연결된 커넥션(크롬/브레이브...등의 소켓)을 넣어준다.
  //이렇게 하면 받은 메시지를 다른 모든 socket들에게도 전달할 수 있다.
  console.log("Connected to Browser ✅");
  socket.on("close", () => {
    console.log("Disconnected from the Browser ❌");
  });
  socket.on("message", (message) => {
    //3. 각 브라우저는 aSocket으로 표시하고 메세지 보내기
    //이렇게 하면 연결된 모든 socket들에 접근할 수 있다.
    sockets.forEach((aSocket) => aSocket.send(message.toString()));
  });
});

server.listen(3000, handleListen);
