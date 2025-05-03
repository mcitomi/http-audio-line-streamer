const audio = document.getElementById('audio');
const startBtn = document.getElementById('startBtn');
const mediaSource = new MediaSource();
let sourceBuffer;
let socket;
let queue = [];

audio.volume = 0.2;
audio.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', () => {
    console.log("MediaSource opened.");
    sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

    sourceBuffer.mode = 'sequence';

    sourceBuffer.addEventListener('updateend', () => {
        if (queue.length > 0 && !sourceBuffer.updating) {
            sourceBuffer.appendBuffer(queue.shift());
        }
    });
});

startBtn.addEventListener('click', () => {
    startBtn.disabled = true;

    socket = new WebSocket(`ws://${location.host}`);
    socket.binaryType = 'arraybuffer';

    socket.addEventListener('open', () => {
        console.log("WebSocket connected.");
        audio.play().catch(err => {
            console.error("Autoplay blocked:", err.message);
        });
    });

    socket.addEventListener('message', (event) => {
        const chunk = new Uint8Array(event.data);

        if (queue.length > 20) {
            console.warn("Buffer overflow, dropping old audio");
            queue = [];
            if (!sourceBuffer.updating) {
                sourceBuffer.appendBuffer(chunk);
            } else {
                queue.push(chunk);
            }
        } else if (sourceBuffer && !sourceBuffer.updating && queue.length === 0) {
            sourceBuffer.appendBuffer(chunk);
        } else {
            queue.push(chunk);
        }
    });

    socket.addEventListener('close', () => {
        console.warn("WebSocket closed.");
    });

    socket.addEventListener('error', (err) => {
        console.error("WebSocket error:", err);
    });
});

function changeVol(value) {
    audio.volume = value / 100;
}