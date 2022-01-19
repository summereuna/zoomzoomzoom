import http from "http";
//import { WebSocketServer } from "ws";
//import SocketIO from "socket.io"; 대신
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));
//app.get("/room/:id", (_, res) => res.render("room"));

const httpServer = http.createServer(app);
//const wsServer = SocketIO(httpServer); 대신
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
//기본적으로 위의 URL에서 localhost 3000에 엑세스 할거다.
/*
온라인에서 Admin UI 실제로 테스트 할 수 있는 데모가 있다.
그리고 원한다면 내 server에 호스트할 수 있다.
위 처럼 cors 주면 데모가 작성하는데 필요한 환경설정은 완료!
*/

instrument(wsServer, {
  auth: false,
});

wsServer.on("connection", (socket) => {
  //닉네임 받기
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
  //프론트엔드에서 보낸 roomName 받아서
  socket.on("join_room", (roomName) => {
    //그 방에 조인 시키기
    socket.join(roomName);
    //그 방에 웰컴 에밋 보내기
    socket.to(roomName).emit("welcome", socket.nickname);
  });
  //프론트엔드에서 Peer A가 보낸 offer 서버에서 받기
  socket.on("offer", (offer, roomName) => {
    //해당하는 방으로(다른 peer 들에게) offer 전달하기
    socket.to(roomName).emit("offer", offer);
  });
  //프론트엔드에서 Peer B가 보낸 answer 서버에서 받기
  socket.on("answer", (answer, roomName) => {
    //해당하는 방으로 answer 전달하기
    socket.to(roomName).emit("answer", answer);
  });
  //🔥 백엔드에서 ice 에밋 받아서 같은 방으로 ice 보내기
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
  //연결 끊기면
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname)
    );
  });
  //새로운 메세지
  socket.on("new_msg", (msg, roomName, done) => {
    socket.to(roomName).emit("new_msg", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("left_room", (roomName, done) => {
    socket.to(roomName).emit("bye", socket.nickname);
    socket.leave(roomName);
    done();
  });
});

const handleListen = () => console.log(`🚀 Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
