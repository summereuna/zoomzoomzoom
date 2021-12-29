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
    //1. roomName 방에 참가
    socket.join(roomName);
    //2. 프론트엔드에 있는 showRoom() 실행
    done();
    //3. 방에 참가하면 참가했다는 것을 모든 사람에게 알려주기
    //"welcome"이벤트를 방금 참여한 방, roomName에 있는 모든 사람들에게 emit하기
    //이제 프론트엔드에서 이 이벤트에 반응하도록 만들면 된다.
    socket.to(roomName).emit("welcome");
    //4. 유저가 서버와 연결이 끊어지기 전에 굿바이 메세지 보내기
    //유저가 disconnecting되면 모든 rooms에 forEach를 써서, 내가 참여하고 있는 방의 모든 사람들에게 종료 evnet를 보내자.
    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => socket.to(room).emit("bye"));
      //socket.rooms을 콘솔에 찍어보면 Set(1)...
      //중복되는 요소가 없는 array인 Set이 뜬다.
      //그래서 forEach를 쓸 수 있는 거다.
      //여기에는 참여하고 있는 방의 ID와 방의 이름을 볼 수 있다.
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
