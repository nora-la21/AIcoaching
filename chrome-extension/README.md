# AI Sales Coach — Chrome Extension

Records your Google Meet calls and sends them to the AI Sales Coach app for transcription and coaching analysis.

## Requirements

- The AI Sales Coach app must be running (locally or deployed)
- A `GROQ_API_KEY` in your app's `.env.local` (used for Whisper transcription)

## Install in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder

The extension icon appears in your Chrome toolbar.

## Setup

1. Click the extension icon
2. Click the ⚙️ gear icon
3. Set **App Server URL**:
   - Local development: `http://localhost:3000`
   - Deployed (Railway): your Railway app URL
4. Enter your **Name** and **Product** (what you sell)
5. Click **Save Settings**

## How to record a call

1. Join a Google Meet call
2. Click the extension icon — it detects Google Meet automatically
3. Click **Start Recording**
4. Chrome will ask you to share the tab — select the Meet tab and click Share
5. A red indicator appears on the Meet page while recording
6. When the call ends, click **Stop Recording**
7. The extension transcribes and analyzes the call (~15-30 seconds)
8. View score, strengths, improvements, and mistake corrections in the popup
9. Click **Open in App** for the full analysis with follow-up email

## Permissions explained

| Permission | Why |
|---|---|
| `tabCapture` | Records the audio from your Google Meet tab |
| `offscreen` | Required for MediaRecorder in Manifest V3 service workers |
| `storage` | Saves your server URL and name settings |
| `activeTab` | Reads the current tab to detect Google Meet |

## Troubleshooting

**"Failed to get stream ID"** — Make sure you clicked Share on the correct tab when Chrome asked.

**"Transcription requires a GROQ_API_KEY"** — Add `GROQ_API_KEY=your_key` to your app's `.env.local` and restart the server. Get a free key at console.groq.com.

**Extension doesn't detect Google Meet** — Make sure you're on `meet.google.com` (not `hangouts.google.com`).

**Analysis looks generic** — Fill in your Name and Product in the extension settings for more relevant coaching tips.
