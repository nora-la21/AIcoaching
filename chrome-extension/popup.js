// Popup script

const DEFAULT_SERVER = 'http://localhost:3000';

let isRecording = false;
let timerInterval = null;
let elapsedSeconds = 0;
let lastAnalysis = null;
let meetTabId = null;

// DOM refs
const notMeet = document.getElementById('notMeet');
const onMeet = document.getElementById('onMeet');
const processingPanel = document.getElementById('processingPanel');
const processingText = document.getElementById('processingText');
const resultsPanel = document.getElementById('resultsPanel');
const recordBtn = document.getElementById('recordBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const timerEl = document.getElementById('timer');
const settingsPanel = document.getElementById('settingsPanel');
const settingsToggle = document.getElementById('settingsToggle');
const headerSub = document.getElementById('headerSub');

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  await loadSettings();

  // Find active Google Meet tab
  const tabs = await chrome.tabs.query({ url: 'https://meet.google.com/*' });

  if (tabs.length === 0) {
    showPanel('notMeet');
    return;
  }

  meetTabId = tabs[0].id;
  headerSub.textContent = 'Google Meet';

  // Check if we're already recording
  const status = await new Promise((resolve) =>
    chrome.runtime.sendMessage({ action: 'getStatus' }, resolve)
  );

  if (status?.isRecording) {
    setRecordingState(true);
  }

  showPanel('onMeet');
}

// ── Settings ──────────────────────────────────────────────────────────────────

async function loadSettings() {
  const data = await chrome.storage.local.get(['serverUrl', 'userName', 'productDesc']);
  document.getElementById('serverUrl').value = data.serverUrl || DEFAULT_SERVER;
  document.getElementById('userName').value = data.userName || '';
  document.getElementById('productDesc').value = data.productDesc || '';
}

document.getElementById('saveSettings').addEventListener('click', async () => {
  await chrome.storage.local.set({
    serverUrl: document.getElementById('serverUrl').value.trim() || DEFAULT_SERVER,
    userName: document.getElementById('userName').value.trim(),
    productDesc: document.getElementById('productDesc').value.trim(),
  });
  settingsPanel.style.display = 'none';
  document.getElementById('mainPanel').style.display = '';
  showToast('Settings saved');
});

settingsToggle.addEventListener('click', () => {
  const isOpen = settingsPanel.style.display !== 'none';
  settingsPanel.style.display = isOpen ? 'none' : 'block';
  document.getElementById('mainPanel').style.display = isOpen ? '' : 'none';
});

// ── Recording controls ────────────────────────────────────────────────────────

recordBtn.addEventListener('click', async () => {
  if (!isRecording) {
    await startRecording();
  } else {
    await stopRecording();
  }
});

async function startRecording() {
  if (!meetTabId) return;

  const response = await new Promise((resolve) =>
    chrome.runtime.sendMessage({ action: 'startRecording', tabId: meetTabId }, resolve)
  );

  if (response?.error) {
    showError(response.error);
    return;
  }

  setRecordingState(true);

  // Show indicator on the Meet page
  chrome.tabs.sendMessage(meetTabId, { action: 'showRecordingIndicator' });
}

async function stopRecording() {
  const response = await new Promise((resolve) =>
    chrome.runtime.sendMessage({ action: 'stopRecording' }, resolve)
  );

  if (response?.error) {
    showError(response.error);
    return;
  }

  setRecordingState(false);
  if (meetTabId) chrome.tabs.sendMessage(meetTabId, { action: 'hideRecordingIndicator' });

  showPanel('processingPanel');
  processingText.textContent = 'Processing audio...';
}

function setRecordingState(recording) {
  isRecording = recording;

  if (recording) {
    recordBtn.className = 'record-btn stop';
    recordBtn.innerHTML = '⏹ Stop Recording';
    statusDot.className = 'status-dot red';
    statusText.textContent = 'Recording...';
    timerEl.style.display = '';
    elapsedSeconds = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      timerEl.textContent = formatTime(elapsedSeconds);
    }, 1000);
  } else {
    recordBtn.className = 'record-btn start';
    recordBtn.innerHTML = '🎙️ Start Recording';
    statusDot.className = 'status-dot green';
    statusText.textContent = 'Google Meet detected';
    timerEl.style.display = 'none';
    clearInterval(timerInterval);
  }
}

// ── Listen for audio from background ─────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'audioReady') {
    handleAudioReady(message.audioData, message.duration, message.mimeType);
  }
  if (message.action === 'captureError') {
    showPanel('onMeet');
    showError(message.error);
  }
});

async function handleAudioReady(audioDataUrl, duration, mimeType) {
  processingText.textContent = 'Transcribing with Whisper...';

  const { serverUrl, userName, productDesc } = await chrome.storage.local.get(['serverUrl', 'userName', 'productDesc']);
  const base = serverUrl || DEFAULT_SERVER;

  try {
    // Convert base64 data URL to Blob
    const res = await fetch(audioDataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'recording.webm', { type: mimeType || 'audio/webm' });

    // Step 1: Transcribe
    const formData = new FormData();
    formData.append('audio', file);

    const transcribeRes = await fetch(`${base}/api/transcribe`, { method: 'POST', body: formData });
    if (!transcribeRes.ok) {
      const err = await transcribeRes.json();
      throw new Error(err.error || 'Transcription failed');
    }
    const { transcript } = await transcribeRes.json();

    processingText.textContent = 'Analyzing your call...';

    // Step 2: Analyze
    const analyzeRes = await fetch(`${base}/api/analyze-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        salespersonName: userName || 'the salesperson',
        productDescription: productDesc || 'the product',
      }),
    });
    if (!analyzeRes.ok) {
      const err = await analyzeRes.json();
      throw new Error(err.error || 'Analysis failed');
    }

    const { analysis } = await analyzeRes.json();
    lastAnalysis = { analysis, transcript, duration };

    showResults(analysis);
  } catch (err) {
    showPanel('onMeet');
    showError(err.message || 'Processing failed. Check your app server is running.');
  }
}

function showResults(analysis) {
  showPanel('resultsPanel');

  document.getElementById('scoreNum').textContent = analysis.score ?? '—';
  document.getElementById('scoreSummary').textContent = analysis.summary || '';

  const strengthsList = document.getElementById('strengthsList');
  strengthsList.innerHTML = (analysis.strengths || []).map(
    (s) => `<div class="list-item green">${escHtml(s)}</div>`
  ).join('');

  const improvementsList = document.getElementById('improvementsList');
  improvementsList.innerHTML = (analysis.improvements || []).map(
    (s) => `<div class="list-item orange">${escHtml(s)}</div>`
  ).join('');

  const mistakesList = document.getElementById('mistakesList');
  mistakesList.innerHTML = (analysis.mistakes || []).slice(0, 3).map(
    (m) => `
      <div class="mistake-card">
        <div class="mistake-said">✗ <span>"${escHtml(m.whatWasSaid)}"</span></div>
        <div class="mistake-instead">✓ <span>"${escHtml(m.whatToSayInstead)}"</span></div>
      </div>
    `
  ).join('');
}

// ── Footer buttons ────────────────────────────────────────────────────────────

document.getElementById('newRecordingBtn').addEventListener('click', () => {
  lastAnalysis = null;
  showPanel('onMeet');
});

document.getElementById('openAppBtn').addEventListener('click', async () => {
  const { serverUrl } = await chrome.storage.local.get('serverUrl');
  const base = serverUrl || DEFAULT_SERVER;
  chrome.tabs.create({ url: `${base}/real-calls` });
});

document.getElementById('openUpload')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const { serverUrl } = await chrome.storage.local.get('serverUrl');
  const base = serverUrl || DEFAULT_SERVER;
  chrome.tabs.create({ url: `${base}/real-calls` });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function showPanel(id) {
  for (const pid of ['notMeet', 'onMeet', 'processingPanel', 'resultsPanel']) {
    document.getElementById(pid).style.display = pid === id ? '' : 'none';
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showError(msg) {
  const err = document.createElement('div');
  err.style.cssText = 'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:8px 12px;border-radius:8px;font-size:12px;margin-top:8px;';
  err.textContent = msg;
  document.querySelector('.body')?.appendChild(err);
  setTimeout(() => err.remove(), 5000);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#22c55e;padding:6px 12px;border-radius:8px;font-size:11px;text-align:center;margin-top:8px;';
  t.textContent = msg;
  document.querySelector('.body')?.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();
