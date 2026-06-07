// Offscreen document — handles MediaRecorder (service workers can't)

let mediaRecorder = null;
let chunks = [];
let startTime = null;

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'captureStream') {
    await startCapture(message.streamId);
  }

  if (message.action === 'stopCapture') {
    stopCapture();
  }
});

async function startCapture(streamId) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });

    // Pick best available codec
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    mediaRecorder = new MediaRecorder(stream, { mimeType });
    chunks = [];
    startTime = Date.now();

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const blob = new Blob(chunks, { type: mimeType });
      const reader = new FileReader();
      reader.onloadend = () => {
        chrome.runtime.sendMessage({
          action: 'recordingComplete',
          audioData: reader.result, // base64 data URL
          duration,
          mimeType,
        });
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorder.start(2000); // collect in 2-second chunks
  } catch (err) {
    chrome.runtime.sendMessage({ action: 'captureError', error: err.message });
  }
}

function stopCapture() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}
