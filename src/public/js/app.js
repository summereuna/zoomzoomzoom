const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("muteBtn");
const cameraBtn = document.getElementById("cameraBtn");
const camerasSelect = document.getElementById("cameras");

//전역 변수
let myStream;
let muted = false;
let cameraOff = false;

//사용자의 카메라 장치 가져오는 함수
async function getCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    //device의 kind가 "videoinput"인 device만 필터링해서 가져오기
    const cameras = devices.filter((device) => device.kind === "videoinput");
    //현재 선택된 카메라, 즉 어플리케이션 처음 들어갈 때 선택되어 있는 카메라
    const currentCamera = myStream.getVideoTracks()[0];
    //카메라스 안에 있는 각각의 카메라 아이템에게 적용 해라~
    cameras.forEach((camera) => {
      //새로운 옵션 생성
      const option = document.createElement("option");
      //옵션의 밸류 값으로 각 camera의 deviceId 를 넣어주자.
      option.value = camera.deviceId;
      //옵션의 text 값으로 각 camera의 label을 넣어주자.
      option.innerText = camera.label;
      //현재 카메라의 label이 cameras에 있는 label과 같다면 그 label이 선택되게하자.
      //이 함수는 어플리케이션 처음 시작할 때만 실행됨
      //이렇게 하면 stream의 현재 카메라와 paint할 때의 카메라 옵션이 같게 잘 나온다.
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      //만들어진 옵션을 camerasSelect 안에 넣어주면 된다.
      camerasSelect.appendChild(option);
    });
  } catch (err) {
    console.log(err);
  }
}

//stream 가져오기(비디오, 오디오)
//argument로 deviceId 보내기
async function getMedia(deviceId) {
  //처음에 devicdId 없이 getMedia가 호출되기 때문에 이에 대한 constraints 설정을 전면카메라(셀피) 우선으로 해주자.
  const initialConstraints = { audio: true, video: { facingMode: "user" } };
  //셀렉트 후 deviceId가 있는 채로 getMedia가 호출될 때
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    //삼항연산자 사용해서 deviceId 있는 경우와 없는 경우 사용할 Constraints 설정하기
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    //Media를 get한 후, getCamera 호출
    //내가 가진 카메라를 옵션으로 페인팅해주는 getCamera를 deviceId가 없을 때 즉, 첨 딱 한번만 실행되게 해주기
    if (!deviceId) {
      await getCamera();
    }
  } catch (err) {
    console.log(err);
  }
}

//stream 호출하기
getMedia();

//muteBtn 클릭 시 작동하는 핸들러
function handleMuteClick() {
  //버튼 클릭 시 오디오 track에 track.enabled을 현재 값과 반대 값이 되게 하기
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

//cameraBtn 클릭 시 작동하는 핸들러
function handleCameraClick() {
  //버튼 클릭 시 비디오 track에 track.enabled을 현재 값과 반대 값이 되게 하기
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  } else {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  }
}

//카메라 선택 바꾸면 작동하는 핸들러: 각 카메라 deviceId 사용해 stream 바꿔주기
async function handleCameraChange() {
  await getMedia(camerasSelect.value);
}

//컨트롤 버튼에 이벤트 추가
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
//카메라 선택하면 이벤트 추가
camerasSelect.addEventListener("iput", handleCameraChange);
