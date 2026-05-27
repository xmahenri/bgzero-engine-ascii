const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {alpha: false});
const hiddenCanvas = document.createElement("canvas");
const hiddenCtx = hiddenCanvas.getContext("2d", {
    willReadFrequently: true,
    alpha: false
});

const video = document.getElementById("video");
const upload = document.getElementById("upload");
const webcamBtn = document.getElementById("webcamBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const timeline = document.getElementById("timeline");
const volumeInput = document.getElementById("volume");
const densityInput = document.getElementById("density");
const fontInput = document.getElementById("fontSize");
const brightnessInput = document.getElementById("brightness");
const timeText = document.getElementById("timeText");
const ui = document.getElementById("ui");
const toggleHud = document.getElementById("toggleHud");
const asciiModeBtn = document.getElementById("asciiModeBtn");
const colorMode = document.getElementById("colorMode");

let density = 10;
let fontSize = 11;
let brightnessBoost = 1.1;
let isWebcam = false;

const asciiModes = [
    {
        name: "Binary",
        chars: "01"
    },

    {
        name: "Special",
        chars: ".5,a:;#X9&@xA"
    },

    {
        name: "Full Characters",
        chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;#&@"
    }
];

let currentAsciiMode = 0;
let chars = asciiModes[currentAsciiMode].chars;
let currentColorMode = "original";

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}

resize();

addEventListener("resize", resize);

toggleHud.addEventListener("click", () => {
    ui.classList.toggle("hidden");
});

asciiModeBtn.addEventListener("click", () => {

    currentAsciiMode++;

    if (currentAsciiMode >= asciiModes.length) {
        currentAsciiMode = 0;
    }

    chars = asciiModes[currentAsciiMode].chars;
    asciiModeBtn.textContent = `Mode: ${asciiModes[currentAsciiMode].name}`;
});

colorMode.addEventListener("change", () => {
    currentColorMode = colorMode.value;
});

densityInput.addEventListener("input", () => {
    density = Number(densityInput.value);
});

fontInput.addEventListener("input", () => {
    fontSize = Number(fontInput.value);
});

brightnessInput.addEventListener("input", () => {
    brightnessBoost = Number(brightnessInput.value) / 100;
});

volumeInput.addEventListener("input", () => {
    video.volume = volumeInput.value / 100;
});

upload.addEventListener("change", e => {

    const file = e.target.files[0];

    if (!file)
        return;

    isWebcam = false;

    const url = URL.createObjectURL(file);

    video.srcObject = null;
    video.src = url;
    video.loop = true;
    video.muted = false;
    video.volume = volumeInput.value / 100;
    video.play();
});

webcamBtn.addEventListener("click", async () => {
    try {
        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {
                        ideal: 1920
                    },

                    height: {
                        ideal: 1080
                    },

                    frameRate: {
                        ideal: 60
                    }
                },

                audio: true
            });

        isWebcam = true;
        video.src = "";
        video.srcObject = stream;
        video.muted = true;

        await video.play();

    } catch (err) {

        alert("Error accessing webcam.");
    }
});

playPauseBtn.addEventListener("click", () => {

    if (isWebcam)
        return;

    if (video.paused) {
        video.play();
        playPauseBtn.textContent = "Pause Video";
    } else {
        video.pause();
        playPauseBtn.textContent = "Resume Video";
    }
});

timeline.addEventListener("input", () => {
    if (isWebcam)
        return;

    const percent = timeline.value / 100;

    video.currentTime = percent * video.duration;
});

function formatTime(seconds) {

    if (isNaN(seconds))
        return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimeline() {

    if (!isWebcam && video.duration) {

        const value = (video.currentTime / video.duration) * 100;

        timeline.value = value;
        timeText.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    }

    requestAnimationFrame(updateTimeline);
}

updateTimeline();

function applyColorPreset(r, g, b) {

    const intensity = (r + g + b) / 3;

    switch (currentColorMode) {

        case "green":
            return [
                intensity * 0.08,
                intensity * 1.5,
                intensity * 0.18
            ];

        case "blue":
            return [
                intensity * 0.10,
                intensity * 0.65,
                intensity * 1.9
            ];

        case "red":
            return [
                intensity * 1.8,
                intensity * 0.18,
                intensity * 0.18
            ];

        case "pink":
            return [
                intensity * 1.9,
                intensity * 0.45,
                intensity * 1.45
            ];

        default:
            return [r, g, b];
    }
}

function render() {

    requestAnimationFrame(render);

    if (video.readyState < 2)
        return;

    ctx.fillStyle = "#000";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const videoRatio = videoWidth / videoHeight;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (videoRatio > canvasRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / videoRatio;

        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;

    } else {

        drawHeight = canvas.height;
        drawWidth = canvas.height * videoRatio;

        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    }

    const cols = (drawWidth / density) | 0;
    const rows = (drawHeight / density) | 0;

    hiddenCanvas.width = cols;
    hiddenCanvas.height = rows;

    hiddenCtx.drawImage(
        video,
        0,
        0,
        cols,
        rows
    );

    const pixels =
        hiddenCtx.getImageData(
            0,
            0,
            cols,
            rows
        ).data;

    ctx.font = `${fontSize}px Consolas`;
    ctx.textBaseline = "top";

    for (let y = 0; y < rows; y++) {

        let offset = y * cols;

        for (let x = 0; x < cols; x++) {

            const i = (offset + x) * 4;

            let r = pixels[i];
            let g = pixels[i + 1];
            let b = pixels[i + 2];

            r *= brightnessBoost;
            g *= brightnessBoost;
            b *= brightnessBoost;

            [r, g, b] = applyColorPreset(r, g, b);

            const luminance = (

                0.2126 * r +
                0.7152 * g +
                0.0722 * b
            );

            const char =chars[
                (
                    (
                        luminance / 255
                    ) *
                    (
                        chars.length - 1
                    )
                ) | 0
                ];

            if (char === " ")
                continue;

            ctx.fillStyle =
                `rgb(${r | 0},${g | 0},${b | 0})`;

            ctx.fillText(

                char,

                offsetX + (x * density),
                offsetY + (y * density)
            );
        }
    }

    ctx.fillStyle = "rgba(255,255,255,0.12)";

    ctx.font = "14px Consolas";

    ctx.fillText(

        "BGzero Engine",

        canvas.width - 150,
        canvas.height - 25
    );
}

render();