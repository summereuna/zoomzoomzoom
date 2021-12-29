const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

//메세지 출력하는 함수 만들기
function addMessage(message) {
  //ul가져와서
  const ul = room.querySelector("ul");
  //li만들어서 메세지 적어주고
  const li = document.createElement("li");
  li.innerText = message;
  //li를 ul에 넣어주기
  ul.appendChild(li);
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = document.querySelector("h3");
  h3.innerText = `Room: ${roomName}`;
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
