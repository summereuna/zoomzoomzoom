import http from "http";
//import { WebSocketServer } from "ws";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  socket.onAny((event) => {
    console.log(`Socket event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome");
    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => socket.to(room).emit("bye"));
    });
    //백엔드에서 새로운 메세지 받았을 때
    socket.on("new_message", (msg, roomName, done) => {
      //해당하는 방에 있는 모두에게(나를 제외한) 프론트엔드에서 받아온 msg 보내라
      socket.to(roomName).emit("new_message", msg);
      done();
    });
  });
});

const handleListen = () => console.log(`🚀 Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);

/* WebSocket으로 구축한 서버
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
*/
