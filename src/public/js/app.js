const socket = io();

const myFace = document.getElementById("myFace");
//0. 가져오기
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");

let myStream;
//2. 전역변수 만들기
//음소거 여부를 추적할 수 있는 variable
//처음에 소리가 나는 상태로 시작하기 때문에 디폴트로 false를 준다.
let muted = false;
//카메라 on/off 여부를 추적할 수 있는 variable
//처음에 화면이 켜진 상태로 시작하기 때문에 디폴트로 false를 준다.
let cameraOff = false;

async function getMedia() {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    myFace.srcObject = myStream;
  } catch (err) {
    console.log(err);
  }
}

getMedia();

//3. 핸들러에 전역변수 적용해서 버튼 클릭 시 바뀌게 해주기
function handleMuteClick() {
  console.log(myStream.getAudioTracks());
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = true;
  }
}

//1. 버튼에 이벤트 추가
//mute 버튼 클릭 시 음소거되고, 텍스트 Unmute로 바꾸기
//camera 버튼 클릭 시 카메라 끄고, 텍스트 Turn Camera On으로 바꾸기
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
