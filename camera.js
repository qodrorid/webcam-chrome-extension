'use strict';

console.log('camera script');

/* globals MediaRecorder */

// This code is adapted from
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos


var PHOTO_WIDTH = 960;



var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;
var intervalTimer;
var startTime;
var finishTime;


var gumVideo = document.querySelector('video#gum');
var $finishBtn = document.querySelector('#finish');
var canvas = document.querySelector('#canvas');


// var recordButton = document.querySelector('button#record');
// var playButton = document.querySelector('button#play');
// var downloadButton = document.querySelector('button#download');
// recordButton.onclick = toggleRecording;
// playButton.onclick = play;
// downloadButton.onclick = download;

// window.isSecureContext could be used for Chrome
// var isSecureOrigin = location.protocol === 'https:' || location.host === 'localhost';
// if (!isSecureOrigin) {
//   alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' + '\n\nChanging protocol to HTTPS');
//   location.protocol = 'HTTPS';
// }

// Use old-style gUM to avoid requirement to enable the
// Enable experimental Web Platform features flag in Chrome 49

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var constraints = {
  audio: false,
  video: true
};

navigator.getUserMedia(constraints, successCallback, errorCallback);


function successCallback(stream) {
  console.log('getUserMedia() got stream: ', stream);
  window.stream = stream;
  if (window.URL) {
    gumVideo.src = window.URL.createObjectURL(stream);
  } else {
    gumVideo.src = stream;
  }
}


function errorCallback(error) {
  console.log('navigator.getUserMedia error: ', error);
}

// navigator.mediaDevices.getUserMedia(constraints)
// .then(function(stream) {
//   console.log('getUserMedia() got stream: ', stream);
//   window.stream = stream; // make available to browser console
//   if (window.URL) {
//     gumVideo.src = window.URL.createObjectURL(stream);
//   } else {
//     gumVideo.src = stream;
//   }
// }).catch(function(error) {
//   console.log('navigator.getUserMedia error: ', error);
// });


function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}


function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}


// The nested try blocks will be simplified when Chrome 47 moves to Stable
function startRecording() {
  var options = {
    audioBitsPerSecond : 128000,
    videoBitsPerSecond : 250000,
    mimeType: 'video/webm',
  };
  recordedBlobs = [];
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e0) {
    console.log('Unable to create MediaRecorder with options Object: ', e0);
    try {
      options = {
        audioBitsPerSecond : 128000,
        videoBitsPerSecond : 2500000,
        mimeType: 'video/webm,codecs=vp9',
      };
      mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e1) {
      console.log('Unable to create MediaRecorder with options Object: ', e1);
      try {
        options = 'video/vp8'; // Chrome 47
        mediaRecorder = new MediaRecorder(window.stream, options);
      } catch (e2) {
        alert('MediaRecorder is not supported by this browser.\n\n' + 'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
        console.error('Exception while creating MediaRecorder:', e2);
        return;
      }
    }
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  // recordButton.textContent = 'Stop Recording';
  // playButton.disabled = true;
  // downloadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data

  startTimer();

  console.log('MediaRecorder started', mediaRecorder);
}


function takeSnapshot() {
  console.log('take snapshot pressed');

  upload();
}


function upload() {
  var width = PHOTO_WIDTH;
  var height = gumVideo.videoHeight / (gumVideo.videoWidth/width);

  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);

  var context = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  context.drawImage(gumVideo, 0, 0, width, height);

  var dataUrl = canvas.toDataURL('image/png');

  chrome.runtime.getBackgroundPage( (backgroundPage) => {
    backgroundPage.uploadDataUrl(dataUrl);
    window.close();
  });
}


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.id == 'close-camera-window') {
    console.log('close-camera-window');
    window.close();
  }
});


function init() {
  $finishBtn.addEventListener('click', function() {
    takeSnapshot();
  });
}


init();

