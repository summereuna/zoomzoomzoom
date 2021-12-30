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

//public rooms을 주는 fn
function publicRooms() {
  //1. adapter 안에 있는 sids랑 rooms가져오기
  //const sids = wsServer.sockets.adapter.sids;
  //const sids = wsServer.sockets.adapter.rooms;
  //ES6로 작성...^^ sockets 안으로 들어가서 adapter 안으로 들어가서 시드랑 룸 가져옴 = wsServer안에서
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  //2. public rooms list 만들기
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      //그러면 퍼블릭룸 어레이에 키 넣어라
      publicRooms.push(key);
    }
  });
  //3. publicRooms 반환해 주기
  return publicRooms;
}
//wsServer.sockets.adapter로 부터 sids와 rooms을 가져와서 룸의 키=sids의 키가 일치하지 않는 키를 찾아서 퍼블릭룸 어레이에 넣어주었다.

//방에 몇명 들어가 있는지 확인하는 fn
function countUserInRoom(roomName) {
  //가끔 roomName 못 찾을 수도 있으니까 ? 넣어주기
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
  /* ? 넣어주면 이런 뜻임 ㅇㅇ (Optional chaining)
  if(wsServer.sockets.adapter.rooms.get(roomName)){
return wsServer.sockets.adapter.rooms.get(roomName).size
} else {
return undefined;
}
*/
}

wsServer.on("connection", (socket) => {
  //2. socket에 연결되면 소켓에 Anonymous 닉네임 넣어주기
  socket["nickname"] = "Anonymous";
  socket.onAny((event) => {
    console.log(`Socket event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    //3-2. 닉네임도 같이보내서 ~가 방에 입장했다고 알려주기
    socket
      .to(roomName)
      .emit("welcome", socket.nickname, countUserInRoom(roomName));
    //모든 소켓, 즉 모든 방에 방 새로 생겼다고 알려주기
    //"room_change"이벤트를 보내고,
    //이 이벤트의 payload로 publicRooms 함수의 결과를 보내자.
    //즉, 현재 서버 안에 있는 모든 방의 array를 payload로 보내자.
    wsServer.sockets.emit("room_change", publicRooms());
    //이제 프론트엔드에서 작업 고고
    socket.on("disconnecting", () => {
      //3-3. 닉네임도 같이보내서 ~가 방에 입장했다고 알려주기
      socket.rooms.forEach((room) =>
        socket.to(room).emit("bye", socket.nickname, countUserInRoom(room) - 1)
      );
    });
    socket.on("disconnect", () => {
      //클라이언트가 종료 메세지를 방에 있는 소켓들에게 보낸 다음에,
      //모든 소켓, 즉 모든 방에게 room이 변경됐다고 알려주자.
      wsServer.sockets.emit("room_change", publicRooms());
    });
    //백엔드에서 새로운 메세지 받았을 때
    socket.on("new_message", (msg, roomName, done) => {
      //해당하는 방에 있는 모두에게(나를 제외한) 프론트엔드에서 받아온 msg 보내라
      //3-1. 이때 "닉네임: 메세지"가 되도록 닉네임도 같이 보내주기
      socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
      done();
    });
    //1. 닉네임 받는 핸들러
    //"nickname" 이벤트가 발생하면 nickname을 가져와서 socket에 저장하기
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
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
