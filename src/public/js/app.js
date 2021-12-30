const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function handleMessageSubmit(event) {
  event.preventDefault();
  //쿼리셀렉터는 첫번째꺼 가져오니까 #msg Form 안에 input 가져오도록 수정
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#nickname input");
  //input.value를 백엔드에 보내줬음, 이제 백엔드에 handler 만들어줘야함!
  socket.emit("nickname", input.value);
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
  //msgForm 아이디 넣어서 가져오기
  const msgForm = room.querySelector("#msg");
  //#name form 가져오기
  const nicknameForm = room.querySelector("#nickname");
  msgForm.addEventListener("submit", handleMessageSubmit);
  nicknameForm.addEventListener("submit", handleNicknameSubmit);
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
//1. 백엔드에서 보낸 socket.nickname 사용하기 위해 user로 인자 받아오기
//방에 몇명인지 새롭게 계산한 수(백엔드에서 보낸 countUserInRoom(roomName))인 newCount도 받아옴
socket.on("welcome", (user, newCount) => {
  //타이틀에 newCount 추가하기
  const h3 = document.querySelector("h3");
  h3.innerText = `Room: ${roomName} (${newCount})`;
  addMessage(`${user} joined room: ${roomName}!`);
});

//bye 이벤트
//2. 백엔드에서 보낸 socket.nickname 사용하기 위해 user로 인자 받아오기
//방에 몇명인지 새롭게 계산한 수(백엔드에서 보낸 countUserInRoom(room) - 1)인 newCount도 받아옴
socket.on("bye", (user, newCount) => {
  //타이틀에 newCount 추가하기
  const h3 = document.querySelector("h3");
  h3.innerText = `Room: ${roomName} (${newCount})`;
  addMessage(`${user} left room: ${roomName}!`);
});

//백엔드에서 new_message 이벤트 받기
socket.on("new_message", addMessage);
//위 코드랑 아래 코드는 같은 거임 ㅇㅇ!
//socket.on("new_message", (msg) => {addMessage(msg)});

//백엔드에서 room_change 이벤트 받기
//room_change 발생하면 rooms 배열을 받을 수 있다.
//welcome의 ul을 받아서 roomList로 만들자.
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  //룸리스트를 항상 비워줘야함 그러면 새로운 다른 방 생길 때 기존에 있었던거랑 중복 출력 안됨
  //항상 새로운 리스트가 되도록 꼼수를 쓰자 ^^!
  roomList.innerHTML = "";
  //룸리스트가 비면, rooms가 없는 상태로 오면,
  //즉 앱에 room이 하나도 없으면 걍 리턴시켜서 페인팅 안되게하기.
  if (rooms.lenght === 0) {
    //roomList.innerHTML = "";
    return;
  }
  //받아온 room 배열에 forEach로 각각의 room에 li element 만들기
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
