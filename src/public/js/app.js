const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

//handleMessageSubmit함수
function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("input");
  const value = input.value;
  //백엔드로 메세지 보내는 new_message 이벤트
  //❗️인자로 방 이름도 같이 보내주자.
  //cb fn으로는 addMessage 함수 호출하는 함수 만들기
  socket.emit("new_message", value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = document.querySelector("h3");
  h3.innerText = `Room: ${roomName}`;
  //1. form 찾아서 submit이벤트 추가하기
  const msgForm = room.querySelector("form");
  msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

//welcome 이벤트랑 연결중이면, 펑션 실행
socket.on("welcome", () => {
  addMessage(`Someone joined ${roomName}!`);
});

//bye 이벤트
socket.on("bye", () => {
  addMessage(`Someone left ${roomName}!`);
});

//백엔드에서 new_message 이벤트 받기
socket.on("new_message", addMessage);
//위 코드랑 아래 코드는 같은 거임 ㅇㅇ!
//socket.on("new_message", (msg) => {addMessage(msg)});
