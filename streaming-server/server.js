const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Jab bhi frontend se connection aayega...
wss.on('connection', (ws, req) => {
  console.log('🎥 Frontend Connected to WebSocket!');

  // URL se YouTube ki Stream Key nikalna (eg: ws://localhost:8000/?key=YOUR_YOUTUBE_KEY)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const streamKey = url.searchParams.get('key');

  if (!streamKey) {
    console.error('❌ Error: YouTube stream key missing. Closing connection.');
    ws.close();
    return;
  }

  // YouTube ka final RTMP URL
  const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
  console.log(`🚀 Starting stream to YouTube...`);

  // FFmpeg process start karna
  const ffmpeg = spawn('ffmpeg', [
    '-i', '-', // Input stdin se aayega
    '-c:v', 'libx264', // Video codec
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-maxrate', '2500k',
    '-bufsize', '2500k',
    '-pix_fmt', 'yuv420p',
    '-g', '50', // Keyframe interval
    '-c:a', 'aac', // Audio codec
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'flv', // Final format for RTMP
    rtmpUrl
  ]);

  // FFmpeg errors ko handle karna
  ffmpeg.on('close', (code, signal) => {
    console.log(`🛑 FFmpeg process closed (Code: ${code}, Signal: ${signal})`);
    ws.close();
  });

  ffmpeg.stdin.on('error', (e) => {
    console.log('⚠️ FFmpeg stdin error:', e.message);
  });

  // Browser se jo video chunks aayenge, unhe FFmpeg me daalna
  ws.on('message', (msg) => {
    if (Buffer.isBuffer(msg)) {
      ffmpeg.stdin.write(msg);
    } else {
      console.log('Received non-binary message:', msg);
    }
  });

  // Jab stream band ho...
  ws.on('close', () => {
    console.log('🔌 Browser disconnected. Stopping stream...');
    ffmpeg.stdin.end();
    ffmpeg.kill('SIGINT');
  });
});

// Server chalu karne ka port
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🔥 Rohes' Streaming Server is running on port ${PORT}`);
});