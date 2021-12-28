const messageList = document.querySelector("ul");
const messageForm = document.querySelector("form");

const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
  //1. 새로운 메시지 받으면 먼서 새 li 만들기
  const li = document.createElement("li");
  //2. message.data를 li 안에 넣기
  li.innerText = message.data;
  //3. li를 ul 안에 넣기
  messageList.append(li);
});
socket.addEventListener("close", () => {
  console.log("Disconnected from Server ❌");
});

function handleSubmit(event) {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(input.value);
  input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
