// Content script — injected into Google Meet pages
// Shows a floating indicator when a recording is in progress

let indicator = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'showRecordingIndicator') {
    showIndicator();
  }
  if (message.action === 'hideRecordingIndicator') {
    hideIndicator();
  }
});

function showIndicator() {
  if (indicator) return;
  indicator = document.createElement('div');
  indicator.id = 'ai-coach-indicator';
  indicator.innerHTML = `
    <span style="
      display:inline-flex;align-items:center;gap:6px;
      background:rgba(0,0,0,0.8);color:white;
      padding:6px 12px;border-radius:20px;font-size:12px;font-family:sans-serif;
      border:1px solid rgba(239,68,68,0.5);
    ">
      <span style="width:8px;height:8px;border-radius:50%;background:#ef4444;
        animation:pulse 1.4s ease-in-out infinite;display:inline-block;"></span>
      AI Sales Coach recording
    </span>
    <style>
      @keyframes pulse {
        0%,100%{opacity:1;transform:scale(1)}
        50%{opacity:0.5;transform:scale(1.2)}
      }
    </style>
  `;
  Object.assign(indicator.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '999999',
    pointerEvents: 'none',
  });
  document.body.appendChild(indicator);
}

function hideIndicator() {
  if (indicator) {
    indicator.remove();
    indicator = null;
  }
}
