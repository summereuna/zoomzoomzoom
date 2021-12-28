//브라우저에서 백엔드와 커넥션을 열어줌
const socket = new WebSocket(`ws://${window.location.host}`);
//app.js의 socket은 서버로의 연결(connection to the server)을 뜻한다.

//2-2. connection이 open일 때 사용하는 listener
socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
});

//2-3. 메세지를 받을 때 사용하는 listener
//socket.addEventListener() 사용해서 메세지 받음
socket.addEventListener("message", (message) => {
  console.log(`💌 New message: "${message.data}" from the Server`);
});

//2-4. 서버가 오프라인 됐을 때 사용하는 listener
socket.addEventListener("close", () => {
  console.log("Disconnected from Server ❌");
});

//4-1. 10초 뒤에 프론트엔드에서 백엔드로 메세지 보내기
setTimeout(() => {
  socket.send("Hello from the Browser!");
}, 10000);
