// State Variables
let audioContext = null;
let masterGain = null;

let isPlaying = false;
let bpm = 120;
let currentBeat = 0;
let timerID = null;

const bpmValue = document.getElementById("bpmValue");
const bpmSlider = document.getElementById("bpmSlider");

const gainSlider = document.getElementById("gainSlider");
const gainValue = document.getElementById("gainValue");

const startButton = document.getElementById("startButton");
const decreaseBpm = document.getElementById("decreaseBpm");
const increaseBpm = document.getElementById("increaseBpm");

const beatIndicator = document.getElementById("beatIndicator");
const timeSignature = document.getElementById("timeSignature");


// ----------------------------------------
// Web Audio API
// ----------------------------------------

function initAudio() {

    if (!audioContext) {

        audioContext = new AudioContext();

        // Create the master volume control once.
        masterGain = audioContext.createGain();

        // Set initial volume.
        masterGain.gain.value =
            Number(gainSlider.value) / 100;

        // Master gain -> speakers
        masterGain.connect(
            audioContext.destination
        );
    }

    // Browsers can suspend the AudioContext
    // until the user interacts with the page.
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}


function playClick(accent = false) {

    const oscillator =
        audioContext.createOscillator();

    const gainNode =
        audioContext.createGain();


    // Higher frequency for the first beat
    // of each measure.
    oscillator.frequency.value =
        accent ? 1000 : 700;

    oscillator.type = "square";


    // Very short envelope.
    const now =
        audioContext.currentTime;

    gainNode.gain.setValueAtTime(
        0.0001,
        now
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.5,
        now + 0.001
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.05
    );


    // Oscillator -> click gain -> master gain
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);


    oscillator.start(now);

    oscillator.stop(
        now + 0.06
    );


    flashBeat(accent);
}


// ----------------------------------------
// Visual beat indicator
// ----------------------------------------

function flashBeat(accent) {

    beatIndicator.classList.remove(
        "active",
        "accent"
    );

    // Force browser to recognize the animation
    void beatIndicator.offsetWidth;

    beatIndicator.classList.add("active");

    if (accent) {
        beatIndicator.classList.add("accent");
    }


    setTimeout(() => {

        beatIndicator.classList.remove(
            "active",
            "accent"
        );

    }, 80);
}


// ----------------------------------------
// Metronome timing
// ----------------------------------------

function tick() {

    const beatsPerMeasure =
        Number(timeSignature.value);

    const isAccent =
        currentBeat === 0;

    playClick(isAccent);

    currentBeat =
        (currentBeat + 1) %
        beatsPerMeasure;
}


function startMetronome() {

    initAudio();

    if (isPlaying) {
        return;
    }

    isPlaying = true;

    currentBeat = 0;

    startButton.textContent =
        "Stop";

    // Play the first beat immediately.
    tick();

    const interval =
        60000 / bpm;

    timerID = setInterval(
        tick,
        interval
    );
}


function stopMetronome() {

    isPlaying = false;

    clearInterval(timerID);

    timerID = null;

    currentBeat = 0;

    startButton.textContent =
        "Start";
}


function restartMetronome() {

    if (!isPlaying) {
        return;
    }

    stopMetronome();

    startMetronome();
}


// ----------------------------------------
// BPM controls
// ----------------------------------------

let wasPlayingBeforeDrag = false;


function updateBpm(value) {

    bpm = Number(value);

    bpmValue.textContent = bpm;

    bpmSlider.value = bpm;
}


// Update BPM display while dragging.
// Do NOT restart the metronome here.
bpmSlider.addEventListener(
    "input",
    () => {

        updateBpm(
            bpmSlider.value
        );

    }
);


// Pause the metronome when the user
// starts dragging.
bpmSlider.addEventListener(
    "pointerdown",
    () => {

        wasPlayingBeforeDrag =
            isPlaying;

        if (isPlaying) {

            clearInterval(timerID);

            timerID = null;
        }

    }
);


// Restart when the user finishes dragging.
bpmSlider.addEventListener(
    "pointerup",
    () => {

        if (wasPlayingBeforeDrag) {

            currentBeat = 0;

            const interval =
                60000 / bpm;

            timerID = setInterval(
                tick,
                interval
            );

            // Play new tempo immediately.
            tick();
        }

        wasPlayingBeforeDrag = false;

    }
);


// Handle cancelled pointer interaction.
bpmSlider.addEventListener(
    "pointercancel",
    () => {

        if (wasPlayingBeforeDrag) {

            currentBeat = 0;

            const interval =
                60000 / bpm;

            timerID = setInterval(
                tick,
                interval
            );

            tick();
        }

        wasPlayingBeforeDrag = false;

    }
);


decreaseBpm.addEventListener(
    "click",
    () => {

        if (bpm > 40) {

            updateBpm(
                bpm - 1
            );

            if (isPlaying) {
                restartMetronome();
            }

        }

    }
);


increaseBpm.addEventListener(
    "click",
    () => {

        if (bpm < 240) {

            updateBpm(
                bpm + 1
            );

            if (isPlaying) {
                restartMetronome();
            }

        }

    }
);


// ----------------------------------------
// Gain / Volume control
// ----------------------------------------

gainSlider.addEventListener(
    "input",
    () => {

        const volume =
            Number(gainSlider.value) / 100;

        gainValue.textContent = `${gainSlider.value}% `;


        // Change master volume.
        // This does NOT restart the metronome.
        if (masterGain) {

            masterGain.gain.setTargetAtTime(
                volume,
                audioContext.currentTime,
                0.01
            );

        }

    }
);


// ----------------------------------------
// Start / Stop
// ----------------------------------------

startButton.addEventListener(
    "click",
    () => {

        if (isPlaying) {
            stopMetronome();
        } else {
            startMetronome();
        }

    }
);


// ----------------------------------------
// Time signature
// ----------------------------------------

timeSignature.addEventListener(
    "change",
    () => {

        // Start counting from beat 1.
        currentBeat = 0;

    }
);