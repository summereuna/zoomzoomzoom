const socket = io();

// #1. Video Call Code
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("muteBtn");
const cameraBtn = document.getElementById("cameraBtn");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

// 전역 변수
let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

// getCameras: 사용자의 카메라 장치 가져오기
async function getCameras() {
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
    //Media를 get한 후, getCameras 호출
    //내가 가진 카메라를 옵션으로 페인팅해주는 getCameras를 deviceId가 없을 때 즉, 첨 딱 한번만 실행되게 해주기
    if (!deviceId) {
      await getCameras();
    }
  } catch (err) {
    console.log(err);
  }
}

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
  //1. getMedia()로 새로운 디바이스 아이디로 새로운 Stream 생성헤서 내 화면 바꿈ㅇㅇ
  await getMedia(camerasSelect.value);
  //2.여기 부터는 상대방 화면에도 내가 바꾼 화면의 스트림의 비디오 트랙 얻어서 그 바뀐 트랙을 넣어주는 거임
  //그렇기 때문에 getMedia()코드 이후로 받는 video Track은 새로운 디바이스로 가져온 바뀐 트랙인 것!
  if (myPeerConnection) {
    //3. myStream에서 업데이트된 비디오 트랙 배열의 첫번째 가져오자.
    const videoTrack = myStream.getVideoTracks()[0];
    //4. myPeerConnection에서 senders 어떻게 생겼나 확인
    //console.log(myPeerConnection.getSenders());
    //5. myPeerConnection이 있다면
    // 피어커넥션의 비디오 센더를 가져와라!
    //즉, myPeerConnection의 senders에서 sender의 track의 kind가 "video"인 sender를 찾아와라
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    //6. 피어커넥션의 비디오 센더 잘 찾아와 지는지 확인
    //console.log(videoSender);
    //7. myPeerConnection의 비디오 sender를 myStream에서 바꾼 videoTrack으로 대체하기
    //그러면 상대방이 보는 내 화면도 내가 바꾼걸로 업데이트 된다.
    videoSender.replaceTrack(videoTrack);
  }
}

//컨트롤 버튼에 이벤트 추가
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
//카메라 선택하면 이벤트 추가
camerasSelect.addEventListener("iput", handleCameraChange);

/* Welcome Form (join a room) */
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

//룸에 입장하면 호출되는 startMedia
//🔥 1. 양쪽 브라우저에서 돌아가는 코드는 바로 이 부분!!
//양쪽 브라우저에서 방에 참가하면, 방이 비어있든 말든 상관 없이 이 코드 실행함
async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  //그러고 나서 getMedia 호출해서 카메라/마이크 등 불러오기
  await getMedia();
  //3. makeConnection 호출
  makeConnection();
}

//사용자가 입력한 roomName 서버에 넘겨주고, 서버에서 룸에 입장시킴
async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  // 소켓 아이오에 사용자가 적은 payload가 방 이름으로 방 입장하게 하기
  socket.emit("join_room", input.value);
  //roomName에 사용자가 입력한 값 넣어주기
  roomName = input.value;
  //인풋 창 비워주기
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

/* Socket code */
//🌸Peer A인 브라우저에서만 실행되는 코드: offer 생성해 setLocalDescription하고 offer 보냄
socket.on("welcome", async () => {
  //1. offer를 하는 주체에 데이터 채널을 만들면 된다.
  //2. (주의) offer 만들기 전에 데이터 채널 만들어야 한다.
  //"chat"이라는 채널의 데이터 채널을 만들어 peer A의 myDataChannel를 정의한다.
  myDataChannel = myPeerConnection.createDataChannel("chat");
  /*아래 코드랑 같은 뜻임
  myDataChannel.addEventListener("message", (e) => {
    console.log(e);
  });
  */
  //3. peer A의 데이터채널이 메세지를 받으면 콘솔에 이벤트를 찍어보자.
  //myDataChannel.addEventListener("message", console.log);
  //4. peer A의 데이터채널이 메세지를 받으면 이벤트의 data를 콘솔에 찍는다.
  //그러면 peer B가 myDataChannel.send()로 보낸 문자가 들어 있는 것을 확인할 수 있다.
  myDataChannel.addEventListener("message", (event) => console.log(event.data));
  //5. 데이터 채널 만들었다고 콘솔에 찍기
  console.log("made data channel");
  //offer 생성
  const offer = await myPeerConnection.createOffer();
  //offer로 연결 구성
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  // offer를 Peer B인 브라우저로 보내기 위해 offer와 roomName 서버에 보내기
  socket.emit("offer", offer, roomName);
});

//🌼서버에서 Peer A의 offer를 전달 받은 다른 Peer들에서 실행되는 코드: offer 받고 answer 생성하여 보냄
socket.on("offer", async (offer) => {
  //다른 peer는 data channel을 만들 필요가 없다. 다른 피어는 이벤트 듣는 리스너 만들면 됨 ㅇㅇ
  /*아래 코드랑 같은 코드
  myPeerConnection.addEventListener("datachannel", (data) => {
    console.log(data);
  });
  */
  //1. myPeerConnection에 데이터 채널 이벤트 리스너 만들기: 데이터 채널의 데이터를 콘솔에 출력
  //myPeerConnection.addEventListener("datachannel", console.log);
  //이렇게 하면 peer B는 peer A가 만든 데이터 채널의 data를 얻어 오는 것을 볼 수 있다.
  //콘솔을 보면 channel 이라고 적힌 키 값을 확인하면 peer A가 보낸 데이터 채널 값을 알 수 있다.
  //2. 내 연결에 새로운 data channel(peer A꺼)이 있으면, 채널을 받아서 peer B의 myDataChannel에 넣어주자.
  myPeerConnection.addEventListener("datachannel", (event) => {
    //2-1. myDataChannel에 event의 channel 값을 넣어주자.
    //peer A에서 보내주는 이벤트의 채널 값을 peer B의 myDataChannel로 정의 한다.
    myDataChannel = event.channel;
    //3. peer B의 데이터채널이 메세지를 받으면 콘솔에 이벤트를 찍어보자.
    // myDataChannel.addEventListener("message", console.log);
    //4. peer B의 데이터채널이 메세지를 받으면 이벤트의 data를 콘솔에 찍는다.
    //그러면 peer A가 myDataChannel.send()로 보낸 문자가 들어 있는 것을 확인할 수 있다.
    myDataChannel.addEventListener("message", (event) =>
      console.log(event.data)
    );
  });
  console.log("received the offer");
  //console.log(offer);
  //Peer B가 offer를 받아서 remoteDescription 설정함
  myPeerConnection.setRemoteDescription(offer);
  //answer 생성_앞에 await 달아 줄 것
  const answer = await myPeerConnection.createAnswer();
  //console.log(answer);
  //answer로 LocalDescription 설정하기
  myPeerConnection.setLocalDescription(answer);
  //서버에 answer 보내기
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

//🌸서버에서 보낸 answer를 다시 Peer A가 받음 ㅇㅇ!
socket.on("answer", (answer) => {
  console.log("received the answer");
  //peer A가 answer를 받아서 remoteDescription 설정함
  myPeerConnection.setRemoteDescription(answer);
});

//서버에서 보낸 ice 받기
socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

/* RTC code */
//실제로 연결 만드는 함수
function makeConnection() {
  // 양쪽 브라우저에 peer-to-peer 연결 위해 구성
  //인자로 스턴서버 넣어주자.
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          //"stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  //myPeerConnection을 만들면 바로 event listen하기
  myPeerConnection.addEventListener("icecandidate", handleIce);
  //연결을 만들때, 이벤트 리스너 만들자.
  myPeerConnection.addEventListener("addstream", handleAddStream);
  //양쪽 브라우저에서 카메라와 마이크의 데이터 stream을 받아서 그것들을 연결 안에 집어 넣음
  //console.log(myStream.getTracks());
  //각각의 트랙들을 myPeerConnection에 각각의 track을 addTrack(track) 해주면 된다.
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  //console.log(data);
  console.log("sent candidate");
  //Peer들 끼리 서로 candidate를 주고 받을 수 있도록 보내기
  socket.emit("ice", data.candidate, roomName);
}

//이벤트의 데이터를 불러오자.
function handleAddStream(data) {
  //console.log("got a stream from my peer");
  //console.log("Peer's Stream:", data.stream);
  //console.log("My Stream:", myStream);
  const peerFace = document.getElementById("peerFace");
  //상대방의 stream을 비디오의 srcObject에 넣어주기!
  peerFace.srcObject = data.stream;
}
