const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static'); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, req) => {
  console.log('🎥 Frontend Connected to WebSocket successfully!');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const streamKey = url.searchParams.get('key');

  if (!streamKey) {
    console.error('❌ Error: YouTube stream key missing.');
    ws.close();
    return;
  }

  const rtmpsUrl = `rtmps://a.rtmp.youtube.com:443/live2/${streamKey}`;
  console.log(`🚀 Starting secure stream to YouTube (RTMPS)...`);

  const ffmpeg = spawn(ffmpegPath, [
    '-fflags', '+nobuffer',
    '-f', 'webm',
    '-i', '-', 
    '-c:v', 'libx264', 
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-maxrate', '2500k',
    '-bufsize', '5000k',
    '-pix_fmt', 'yuv420p',
    '-g', '50', 
    '-r', '30',
    '-c:a', 'aac', 
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'flv', 
    rtmpsUrl
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

  ws.on('message', (msg) => {
    if (Buffer.isBuffer(msg)) {
      console.log(`📦 Received chunk from browser: ${msg.length} bytes`);
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