// Background service worker — manages tab capture and offscreen document

let isRecording = false;
let offscreenReady = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startRecording') {
    handleStartRecording(message.tabId, sendResponse);
    return true; // keep channel open for async response
  }

  if (message.action === 'stopRecording') {
    handleStopRecording(sendResponse);
    return true;
  }

  if (message.action === 'recordingComplete') {
    // Forward audio data from offscreen → popup
    chrome.runtime.sendMessage({ action: 'audioReady', audioData: message.audioData, duration: message.duration });
  }

  if (message.action === 'getStatus') {
    sendResponse({ isRecording });
  }
});

async function handleStartRecording(tabId, sendResponse) {
  if (isRecording) {
    sendResponse({ error: 'Already recording.' });
    return;
  }

  try {
    // Create offscreen document for MediaRecorder (service workers can't use it)
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });

    if (existingContexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Recording tab audio for sales call analysis',
      });
    }

    offscreenReady = true;

    // Get stream ID for the target tab
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      if (chrome.runtime.lastError || !streamId) {
        sendResponse({ error: chrome.runtime.lastError?.message || 'Failed to get stream ID' });
        return;
      }

      // Send stream ID to offscreen document
      chrome.runtime.sendMessage({ action: 'captureStream', streamId });
      isRecording = true;
      sendResponse({ success: true });

      // Update badge
      chrome.action.setBadgeText({ text: '●' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    });
  } catch (err) {
    sendResponse({ error: err.message || 'Failed to start recording' });
  }
}

async function handleStopRecording(sendResponse) {
  if (!isRecording) {
    sendResponse({ error: 'Not recording.' });
    return;
  }

  chrome.runtime.sendMessage({ action: 'stopCapture' });
  isRecording = false;

  // Clear badge
  chrome.action.setBadgeText({ text: '' });

  sendResponse({ success: true });
}
