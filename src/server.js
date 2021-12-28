import http from "http";
import { WebSocketServer } from "ws";
import express from "express";
import { parse } from "path";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`🚀 Listening on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  //닉네임 안정한 사람들을 위해 소켓이 연결될 때 닉네임 생성해 주자.
  socket["nickname"] = "anonymous";
  console.log("Connected to Browser ✅");
  socket.on("close", () => {
    console.log("Disconnected from the Browser ❌");
  });
  //소켓이 메시지를 보낼때 까지 기다리는 곳
  socket.on("message", (msg) => {
    //String인 msg를 받아서 JS Object형태인 msg로 바꾸기
    const message = JSON.parse(msg);
    switch (message.type) {
      case "new_msg":
        //메세지 타입이: new_msg 일때 페이로드
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload}`)
        );
        break;
      case "nickname":
        //이제 이 payload, 즉 닉네임을 socket안에 넣어줘야 한다.
        //소켓이 누군지 알아야 하니까!!
        socket["nickname"] = message.payload;
        //소켓에 새로운 item 추가하자. 소켓은 기본적으로 오브젝트(객체)라서 원하는거 더 추가할 수 있음
        break;
    }
  });
});

server.listen(3000, handleListen);
