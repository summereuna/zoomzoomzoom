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

const handleListen = () => console.log(`🚀 Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
