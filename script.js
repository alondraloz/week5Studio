const buttonStart = document.getElementById("start-button");

// create player with bigBang.mp3
const player = new Tone.Player("bigBang.mp3").toDestination();
Tone.loaded().then(() => {
//	player.start();
});

function startTone() {
    buttonStart.disabled = "true";
	Tone.start().then(() => { 
        console.log("audio is ready"); 
        //buttonStart.style.display = "none";
        player.start();
    }).catch((error) => { 
        console.log("audio not ready"); 
        buttonStart.disabled = "false"; 
    });
}

const synth = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 },
});

const sequence = new Tone.Sequence((time, note) => {
    synth.triggerAttackRelease(note, "2n", time);
}, ["C4"], "1n");
sequence.start(0);

const synthBass = new Tone.Synth().toDestination();

const loop = new Tone.Loop((time) => {
    synthBass.triggerAttackRelease("C0", "8n", time);
}, "4n").start(0);

const vibrato = new Tone.Vibrato({
  frequency: 4,
  depth: 0.5,
}).toDestination();

// Add a gain node to control volume
const volumeGain = new Tone.Gain(0.5).toDestination();
//player.volumeGain;

// Create an LFO to control the volume
const volumeLFO = new Tone.LFO({
  type: "square",
  frequency: 1, // Slow oscillation
  min: 0,       // Fully silent
  max: 1,       // Full volume
  amplitude: 1, // Full-range modulation
}).start();

// Connect the LFO to the gain's volume
volumeLFO.connect(volumeGain.gain);

// Chain the effects
synth.chain(vibrato, volumeGain);
synthBass.chain(volumeGain);

// Map values between a range
function map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// HTML elements
const pad = document.getElementById('xy-pad');
const dot = document.getElementById('dot');
const red = 255;
const green = 0;
const blue = 255; 
const alpha = 1.0;

// Handle mouse events
pad.addEventListener('mousemove', (e) => {
    const rect = pad.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top, 0, rect.height);

    // Update dot position
    dot.style.left = `${x-3}px`;
    dot.style.top = `${y-2}px`;

    const vibratoDepth = map(x, 0, rect.width, 0, 0.5);
    const vibratoFrequency = map(x, 0, rect.width, 0.1, 8);
    vibrato.depth.value = vibratoDepth;
    vibrato.frequency.value = vibratoFrequency;
    
    const lfoFrequency = map(y, 0, rect.height, 0.1, 15); // Slow to fast modulation
    volumeLFO.frequency.value = lfoFrequency;
    
    // change pad color by x position
    let aRatio = (rect.width-x)/rect.width;
    // change pad color by y position
    let lRatio = (rect.height-y)/rect.height;
    pad.style.backgroundColor = `rgba(${red}, ${green*lRatio}, ${blue}, ${alpha*aRatio}`; 
});

// Play sound on mouse click
pad.addEventListener('mousedown', () => {
    synth.triggerAttack("C4");
    Tone.getTransport().start(); // restart sequence
    dot.classList.add("active");
});

// Stop sound on mouse release
pad.addEventListener('mouseup', () => {
    //synth.triggerRelease();
    Tone.getTransport().pause(); // end sequence
    dot.classList.remove("active");
});
