const socket = io();

const myFace = document.getElementById("myFace");

/*
이제 stream을 받아야 한다. 
stream은 비디오와 오디오가 결합된 거다 ㅇㅇ!


*/
//1. myStream 전역변수로 만들기
let myStream;

//2. 함수 생성
async function getMedia() {
  try {
    //2-1. navigator.mediaDevices.getUserMedia(constraints);
    //는 유저의 유저미디어 string을 준다.
    //constraints은 기본적으로 우리가 무엇을 얻고 싶은지이다. 오디오랑, 비디오!
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    //2-2.되는지 확인
    //console.log(myStream);
    //2-3. myStream을 video인 myFace 안에 넣어주자
    myFace.srcObject = myStream;
  } catch (err) {
    console.log(err);
  }
}

//3. 펑션 호출
getMedia();
