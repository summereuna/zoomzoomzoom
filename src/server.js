import http from "http";
import { WebSocketServer } from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`✅ Listening on http://localhost:3000`);

const server = http.createServer(app);
//백엔드에 websocket server 만들었다.
const wss = new WebSocketServer({ server });

//1. connection 이벤트 listen: 이벤트 발생하면 브라우저와 연결됐다고 로그 출력
//커넥션 생기면 socket에서 누가 연결 했는지 알 수 있다. JS는 방금 연결된 socket을 넣어준다.
wss.on("connection", (socket) => {
  console.log("Connected to Browser ✅");
  //3. 소켓이 커넥션 종료(브라우저 탭 닫거나, 컴퓨터가 잠자기 모드 들어가거나...)
  //브라우저/클라이언트로부터 연결 끊겼다고 로그 출력하기
  socket.on("close", () => {
    console.log("Disconnected from the Browser ❌");
  });
  //4-2. 특정 소켓에서 메세지를 기다리고 있음 (on~~)
  //이 특정 **소켓**에 이벤트리스너 등록함(wws가 아니라/wws는 서버 전체를 위한거고 소켓은 백엔드와 연결된 각 브라우저를 위한 거임): message 이벤트 ㅇㅇ
  //왜냐하면 이 이벤트리스너는 백엔드와 연결한 각 브라우저를 위한 것이기 때문임
  //socket.on("message" 는 특정 socket에서 메세지 받았을 때 발생한다.
  //프론트 엔드에서 보낸 메세지 받기
  //socket.on()으로 메세지 받음
  socket.on("message", (message) => {
    console.log(`💌 New message: "${message}" from the Browser`);
  });
  //2-1. send a message to the browser
  socket.send("Hello!");
});

server.listen(3000, handleListen);
