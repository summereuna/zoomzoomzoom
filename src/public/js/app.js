const messageList = document.querySelector("ul");
const nicknameForm = document.querySelector("#nickname");
const messageForm = document.querySelector("#message");

const socket = new WebSocket(`ws://${window.location.host}`);

//type과 payload를 받는 메세지 만드는 펑션: 메세지 전송하고 싶으면 이 펑션 호출하면 된다.
function makeMesssage(type, payload) {
  //msg 모양 오브젝트로 만들어 놓고
  const msg = { type, payload };
  //string으로 바꿔주기
  return JSON.stringify(msg);
}

socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
  const li = document.createElement("li");
  li.innerText = message.data;
  messageList.append(li);
});

socket.addEventListener("close", () => {
  console.log("Disconnected from Server ❌");
});

function handleSubmit(event) {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  //메세지 보내는 부분에 makeMessage 펑션 호출해서 type, payload 적어 놓기
  socket.send(makeMesssage("new_msg", input.value));
  input.value = "";
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = nicknameForm.querySelector("input");
  //닉네임 부분에 makeMessage 펑션 호출해서 type, payload 적어 놓기
  //이렇게 하면 백엔드로 메세지를 전송할 때 마다 string을 잘 전송하게 된다.
  socket.send(makeMesssage("nickname", input.value));
  input.value = "";
}

//handleNicknameSubmit에서 메시지를 전송하는데 내가 받고 싶은 type과 payload 형태로 전송해보자.

messageForm.addEventListener("submit", handleSubmit);
nicknameForm.addEventListener("submit", handleNicknameSubmit);
