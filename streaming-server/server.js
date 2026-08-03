const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static'); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('🎥 Frontend Connected to WebSocket!');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const streamKey = url.searchParams.get('key');

  if (!streamKey) {
    console.error('❌ Error: YouTube stream key missing.');
    ws.close();
    return;
  }

  const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
  console.log(`🚀 Starting stream to YouTube...`);

  const ffmpeg = spawn(ffmpegPath, [
    '-fflags', '+nobuffer',
    '-analyzeduration', '0',
    '-probesize', '1024',
    '-f', 'matroska', 
    '-i', '-', 
    '-c:v', 'libx264', 
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-maxrate', '2500k',
    '-bufsize', '2500k',
    '-pix_fmt', 'yuv420p',
    '-g', '50', 
    '-c:a', 'aac', 
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'flv', 
    rtmpUrl
  ]);

  ffmpeg.stderr.on('data', (data) => {
    console.log(`🛠️ FFmpeg Debug: ${data.toString()}`);
  });

  ffmpeg.on('close', (code, signal) => {
    console.log(`🛑 FFmpeg process closed (Code: ${code}, Signal: ${signal})`);
    ws.close();
  });

  ffmpeg.stdin.on('error', (e) => {
    console.log('⚠️ FFmpeg stdin error:', e.message);
  });

  // 👇 Yahan hum check kar rahe hain ki browser se data aa raha hai ya nahi
  ws.on('message', (msg) => {
    if (Buffer.isBuffer(msg)) {
      console.log(`📦 Received chunk from browser: ${msg.length} bytes`); // 👈 Ye print hona chahiye!
      ffmpeg.stdin.write(msg);
    } else {
      console.log('Received non-binary message:', msg);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Browser disconnected. Stopping stream...');
    ffmpeg.stdin.end();
    if (ffmpeg.kill) {
        ffmpeg.kill('SIGINT');
    }
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🔥 Rohes' Streaming Server is running on port ${PORT}`);
});

// --- RENDER FIX DEPLOYMENT TRIGGER ---
// Bawa, ye line bas Git ko jagane ke liye add ki hai taaki usko lage code update hua hai! 🚀