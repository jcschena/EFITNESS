/* ==========================================================================
   INTERACTIVE LOGIC: UNDER A BLUES SKY (WHITESNAKE STYLE)
   Uses Web Audio API for 80s Rock Synthesis, MP3 File Playing & Sync UI
   ========================================================================== */

// --- Global Audio & Playback Variables ---
let audioCtx = null;
let masterGain = null;
let analyser = null;
let isPlaying = false;

// Audio Source Toggle ('synth' or 'file')
let audioSource = 'synth';
let audioElement = null;
let audioSourceNode = null;

// Sequencer & Tempo settings (Synth Mode)
let bpm = 85;
let currentStep = 0; // 0 to 31 (4 measures of 8th notes)
let nextStepTime = 0.0;
let scheduleAheadTime = 0.15; // How far ahead to schedule audio (s)
let lookahead = 25.0; // How frequently to call scheduling function (ms)
let timerId = null;

// Tracking time
let startTime = 0; // Performance.now() reference
let songDuration = 145; // Total length of the audio experience in seconds
let elapsedSeconds = 0;
let uiUpdateInterval = null;

// Visualizer animation frame
let visualizerFrameId = null;

// Active Lyrics Version ('en' or 'pt')
let activeVersion = 'en';

// Custom distortion curve cache
let distortionCurve = null;

// --- Initialize Web Audio Context ---
function initAudio() {
    if (audioCtx) return;
    
    // Create audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    // Master gain node
    masterGain = audioCtx.createGain();
    // Default volume from slider (70%)
    const volumeSlider = document.getElementById('volume-slider');
    masterGain.gain.value = volumeSlider ? volumeSlider.value / 100 : 0.7;
    
    // Analyser node for visualizer
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    // Connections
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    // Generate distortion curve
    distortionCurve = makeDistortionCurve(100);

    // Start Visualizer Canvas loop
    drawVisualizer();
}

// --- Distortion Curve Maker for 80s High-Gain Guitar ---
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

// --- Synthesizers Nodes Generators ---

// 1. Kick Drum (Thumping, sub-bass heavy)
function playKick(time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);
    
    osc.start(time);
    osc.stop(time + 0.4);
}

// 2. Snare Drum (Fat 80s snare with gate/reverb delay effect)
function playSnare(time) {
    // Noise source (white noise)
    const bufferSize = audioCtx.sampleRate * 0.4;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1100;
    noiseFilter.Q.value = 1.0;
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);
    
    // Snare fundamental tone (Triangle)
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.12);
    
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    // Reverb Pre-Delay effect (classic 80s plate simulation)
    const delay = audioCtx.createDelay();
    delay.delayTime.setValueAtTime(0.05, time); // 50ms delay
    
    const delayGain = audioCtx.createGain();
    delayGain.gain.setValueAtTime(0.25, time);
    delayGain.gain.exponentialRampToValueAtTime(0.01, time + 0.45);
    
    // Connect noise to filter & gain
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    // Connect to delay to simulate huge arena room sound
    noiseGain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(masterGain);
    
    // Connect fundamental oscillator
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    
    noiseSource.start(time);
    noiseSource.stop(time + 0.45);
    osc.start(time);
    osc.stop(time + 0.2);
}

// 3. Hi-Hat (Bright metal sheen)
function playHiHat(time, isOpen = false) {
    const bufferSize = audioCtx.sampleRate * (isOpen ? 0.2 : 0.05);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + (isOpen ? 0.18 : 0.04));
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    noise.start(time);
    noise.stop(time + (isOpen ? 0.25 : 0.08));
}

// 4. Bass Line (Warm and heavy drive)
function playBass(noteFreq, time, duration) {
    const osc = audioCtx.createOscillator();
    const subOsc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(noteFreq, time);
    
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(noteFreq / 2, time); // Sub-bass octave
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.04);
    filter.frequency.exponentialRampToValueAtTime(180, time + duration);
    
    gain.gain.setValueAtTime(0.38, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.start(time);
    subOsc.start(time);
    osc.stop(time + duration);
    subOsc.stop(time + duration);
}

// 5. Rhythm Guitar (Crunchy distorted chords/riffs)
function playGuitar(noteFreq, time, duration, isChugging = false, hasHarmonic = false) {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const distortion = audioCtx.createWaveShaper();
    const cabFilter = audioCtx.createBiquadFilter(); // Guitar Speaker Cabinet simulator
    
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    
    // Detune oscillators for massive 80s double-track vibe
    osc1.detune.setValueAtTime(-12, time);
    osc2.detune.setValueAtTime(12, time);
    
    if (hasHarmonic) {
        // High pinch harmonic tone (screaming guitar)
        osc1.frequency.setValueAtTime(noteFreq * 4, time); 
        osc2.frequency.setValueAtTime(noteFreq * 4.02, time);
        
        // Add extreme pitch bend/vibrato to harmonic
        osc1.frequency.linearRampToValueAtTime(noteFreq * 4.2, time + duration * 0.4);
        osc1.frequency.linearRampToValueAtTime(noteFreq * 3.9, time + duration);
    } else {
        osc1.frequency.setValueAtTime(noteFreq, time);
        osc2.frequency.setValueAtTime(noteFreq, time);
    }
    
    distortion.curve = distortionCurve;
    distortion.oversample = '4x';
    
    // Emulates speaker cabinet resonance by cutting high/low sizzle
    cabFilter.type = 'bandpass';
    cabFilter.frequency.setValueAtTime(1300, time);
    cabFilter.Q.setValueAtTime(1.8, time);
    
    // Gain envelope
    const maxGain = isChugging ? 0.15 : (hasHarmonic ? 0.35 : 0.28);
    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(maxGain, time + 0.01);
    
    if (isChugging) {
        // Tight decay for palm muting
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration * 0.8);
    } else {
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    }
    
    osc1.connect(distortion);
    osc2.connect(distortion);
    distortion.connect(cabFilter);
    cabFilter.connect(gain);
    gain.connect(masterGain);
    
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration * 1.5);
    osc2.stop(time + duration * 1.5);
}

// 6. Keyboard Synth Pad (Atmospheric backdrop)
function playKeyboard(notes, time, duration) {
    notes.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, time);
        filter.frequency.exponentialRampToValueAtTime(900, time + duration * 0.3);
        filter.frequency.exponentialRampToValueAtTime(250, time + duration);
        
        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.09, time + 0.4); // soft attack
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        
        osc.start(time);
        osc.stop(time + duration + 0.1);
    });
}

// --- Coverdale Ad-libs Synthesizers ---
function playAdlib(type) {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    // Sub-modules to shape Coverdale's gritty delivery
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const distortion = audioCtx.createWaveShaper();
    const gain = audioCtx.createGain();
    
    distortion.curve = makeDistortionCurve(180); // Higher distortion for vocal grit
    
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 2.0;

    switch(type) {
        case 'oh-yeah':
            // Seductive low dive
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);
            
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.5, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            
            osc.connect(distortion);
            distortion.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            
            osc.start(now);
            osc.stop(now + 0.6);
            break;
            
        case 'ooh-baby':
            // "Ooh" (high) then "Baby" (deep vib)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
            
            // Second stage - Baby
            osc.frequency.setValueAtTime(140, now + 0.32);
            // Vibrato LFO
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            lfo.frequency.value = 8; // 8Hz vibrato
            lfoGain.gain.value = 15; // depth
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.4, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.2, now + 0.3);
            
            gain.gain.setValueAtTime(0.4, now + 0.32);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
            
            osc.connect(distortion);
            distortion.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            
            lfo.start(now + 0.32);
            osc.start(now);
            lfo.stop(now + 0.9);
            osc.stop(now + 0.9);
            break;
            
        case 'lord-mercy':
            // 3 peaks: Lord (220Hz) - Have (200Hz) - Mercy (140Hz)
            osc.type = 'sawtooth';
            
            // "Lord"
            osc.frequency.setValueAtTime(220, now);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.45, now + 0.05);
            gain.gain.setValueAtTime(0.25, now + 0.3);
            
            // "Have"
            osc.frequency.setValueAtTime(200, now + 0.32);
            gain.gain.setValueAtTime(0.45, now + 0.35);
            gain.gain.setValueAtTime(0.20, now + 0.6);
            
            // "Mercy"
            osc.frequency.setValueAtTime(140, now + 0.62);
            osc.frequency.exponentialRampToValueAtTime(90, now + 1.2);
            gain.gain.setValueAtTime(0.48, now + 0.65);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.35);
            
            osc.connect(distortion);
            distortion.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            
            osc.start(now);
            osc.stop(now + 1.4);
            break;
            
        case 'scream':
            // Giant hard rock high-pitch drive scream
            osc.type = 'sawtooth';
            // Start high 660Hz and sweep up to 880Hz, then slide down
            osc.frequency.setValueAtTime(580, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
            osc.frequency.setValueAtTime(880, now + 0.2);
            osc.frequency.linearRampToValueAtTime(780, now + 1.2);
            osc.frequency.exponentialRampToValueAtTime(220, now + 1.8);
            
            // Vibrato LFO for raw screaming shake
            const screamLfo = audioCtx.createOscillator();
            const screamLfoGain = audioCtx.createGain();
            screamLfo.frequency.value = 11; // fast shake
            screamLfoGain.gain.value = 25; // wide shake
            screamLfo.connect(screamLfoGain);
            screamLfoGain.connect(osc.frequency);
            
            // Vocal distortion / white noise blending to simulate coverdale's throat grit
            const screamNoiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.8, audioCtx.sampleRate);
            const ndata = screamNoiseBuffer.getChannelData(0);
            for (let i = 0; i < ndata.length; i++) {
                ndata[i] = Math.random() * 2 - 1;
            }
            const screamNoise = audioCtx.createBufferSource();
            screamNoise.buffer = screamNoiseBuffer;
            
            const screamNoiseFilter = audioCtx.createBiquadFilter();
            screamNoiseFilter.type = 'bandpass';
            screamNoiseFilter.frequency.value = 1500;
            screamNoiseFilter.Q.value = 4.0;
            
            const screamNoiseGain = audioCtx.createGain();
            screamNoiseGain.gain.setValueAtTime(0.01, now);
            screamNoiseGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
            screamNoiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.7);
            
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.55, now + 0.15); // fast swell
            gain.gain.setValueAtTime(0.55, now + 1.0);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);
            
            osc.connect(distortion);
            distortion.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            
            screamNoise.connect(screamNoiseFilter);
            screamNoiseFilter.connect(screamNoiseGain);
            screamNoiseGain.connect(masterGain);
            
            screamLfo.start(now);
            osc.start(now);
            screamNoise.start(now);
            
            screamLfo.stop(now + 1.8);
            osc.stop(now + 1.8);
            screamNoise.stop(now + 1.8);
            break;
    }
}

// --- Scheduler / Sequencer Engine (Lookahead design) ---
function scheduleNote(step, time) {
    const elapsed = elapsedSeconds;
    
    // Frequencies chart
    const A1 = 55.00;
    const C2 = 65.41;
    const D2 = 73.42;
    const Ds2 = 77.78;
    const A2 = 110.00;
    const C3 = 130.81;
    const D3 = 146.83;
    const Ds3 = 155.56;
    const E3 = 164.81;
    const G2 = 98.00;
    const F2 = 87.31;
    const G1 = 49.00;
    const F1 = 43.65;
    
    const stepDur = (60.0 / bpm) / 2; 
    
    // --- 1. KEYBOARD PAD / INTRO & BRIDGE ATMOSPHERE ---
    if (elapsed < 8 || (elapsed >= 112 && elapsed < 128) || elapsed >= 136) {
        if (step % 16 === 0) {
            let chords = [220, 261.63, 329.63]; // Am (A3, C4, E4)
            if (elapsed >= 112 && elapsed < 120) {
                chords = [174.61, 220, 261.63]; // F (F3, A3, C4)
            } else if (elapsed >= 120 && elapsed < 128) {
                chords = [196.00, 246.94, 293.66]; // G (G3, B3, D4)
            }
            playKeyboard(chords, time, stepDur * 16);
        }
    }
    
    // --- 2. DRUM PATTERN ---
    const hasDrums = (elapsed >= 8 && elapsed < 112) || (elapsed >= 120);
    
    if (hasDrums) {
        const localBeat = step % 8;
        
        if (localBeat === 0 || localBeat === 4) {
            playKick(time);
        }
        if (localBeat === 6 && (step % 16 >= 8)) {
            playKick(time);
        }
        if (localBeat === 2 || localBeat === 6) {
            playSnare(time);
        }
        
        const isOpenHat = (localBeat === 7);
        playHiHat(time, isOpenHat);
    } else if (elapsed >= 112 && elapsed < 120) {
        if (step % 4 === 0) {
            playKick(time);
        }
    }

    // --- 3. BASS & GUITAR RIFFS ---
    if (elapsed >= 8) {
        const localStep = step % 32;
        
        let rootBass = A1;
        let rootGuitar = A2;
        let isPreChorus = (elapsed >= 32 && elapsed < 44);
        let isChorus = (elapsed >= 44 && elapsed < 60) || (elapsed >= 84 && elapsed < 96) || (elapsed >= 128 && elapsed < 136);
        let isSolo = (elapsed >= 96 && elapsed < 112);
        let isBridge = (elapsed >= 112 && elapsed < 128);
        
        if (isPreChorus) {
            if (localStep < 16) {
                rootBass = F1; rootGuitar = F2;
            } else {
                rootBass = G1; rootGuitar = G2;
            }
            
            if (step % 2 === 0) {
                playBass(rootBass, time, stepDur * 1.8);
                playGuitar(rootGuitar, time, stepDur * 1.8);
            }
        } 
        else if (isChorus) {
            if (localStep < 8) {
                rootBass = A1; rootGuitar = A2;
            } else if (localStep < 16) {
                rootBass = F1; rootGuitar = F2;
            } else if (localStep < 24) {
                rootBass = G1; rootGuitar = G2;
            } else {
                rootBass = C2; rootGuitar = C3;
            }
            
            if (localStep % 4 === 0) {
                playBass(rootBass, time, stepDur * 3.5);
                playGuitar(rootGuitar, time, stepDur * 3.5);
                playGuitar(rootGuitar * 2, time, stepDur * 3.5);
            } else if (localStep % 4 === 2) {
                playGuitar(rootGuitar, time, stepDur * 1.5);
            }
        }
        else if (isBridge) {
            if (elapsed < 120) {
                if (localStep === 0 || localStep === 16) {
                    rootBass = (localStep === 0) ? F1 : G1;
                    playBass(rootBass, time, stepDur * 7.5);
                }
            } else {
                rootBass = A1;
                rootGuitar = A2;
                if (step % 2 === 0) {
                    playBass(rootBass, time, stepDur * 1.8);
                    playGuitar(rootGuitar, time, stepDur * 1.8, true);
                }
            }
        }
        else if (isSolo) {
            rootBass = A1;
            rootGuitar = A2;
            
            if (step % 2 === 0) {
                playBass(rootBass, time, stepDur * 1.8);
            }
            
            if (localStep % 8 < 6) {
                if (step % 2 === 0) playGuitar(rootGuitar, time, stepDur * 1.8, true);
            } else {
                if (localStep % 8 === 6) playGuitar(C3, time, stepDur);
                if (localStep % 8 === 7) playGuitar(D3, time, stepDur);
            }
            
            const soloBeat = step % 16;
            const pentatonic = [440, 523.25, 587.33, 622.25, 659.25, 783.99, 880.00];
            
            let noteIdx = Math.floor(Math.random() * pentatonic.length);
            let soloNote = pentatonic[noteIdx];
            
            if (soloBeat % 2 === 0) {
                playGuitar(soloNote, time, stepDur * 0.9);
            } else {
                playGuitar(pentatonic[(noteIdx + 2) % pentatonic.length], time + stepDur/2, stepDur * 0.45);
            }
            
            if (soloBeat === 8) {
                playGuitar(pentatonic[pentatonic.length - 1], time, stepDur * 3, false, true);
            }
        }
        else {
            const riffBeat = localStep % 8;
            
            if (step % 2 === 0) {
                playBass(A1, time, stepDur * 1.8);
            }
            
            if (riffBeat === 0) {
                playGuitar(A2, time, stepDur * 3);
                playGuitar(E3, time, stepDur * 3);
            } else if (riffBeat === 4) {
                playGuitar(A2, time, stepDur * 0.8, true);
            } else if (riffBeat === 5) {
                playGuitar(C3, time, stepDur);
            } else if (riffBeat === 6) {
                playGuitar(D3, time, stepDur);
            } else if (riffBeat === 7) {
                const isSecondMeasure = (localStep >= 8 && localStep < 16) || (localStep >= 24);
                if (isSecondMeasure) {
                    playGuitar(Ds3, time, stepDur * 2.5, false, true);
                } else {
                    playGuitar(Ds3, time, stepDur);
                }
            }
        }
    }
}

// Scheduler loop trigger
function scheduler() {
    while (nextStepTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(currentStep, nextStepTime);
        advanceStep();
    }
    timerId = setTimeout(scheduler, lookahead);
}

function advanceStep() {
    const secondsPerBeat = 60.0 / bpm;
    const stepDuration = secondsPerBeat / 2;
    nextStepTime += stepDuration;
    currentStep = (currentStep + 1) % 32;
}

// --- Visualizer Renderer (Canvas) ---
function drawVisualizer() {
    if (!isPlaying || !analyser) return;
    
    visualizerFrameId = requestAnimationFrame(drawVisualizer);
    
    const canvas = document.getElementById('audio-visualizer');
    if (!canvas) return;
    
    const canvasCtx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = canvas.parentElement.clientHeight;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    
    canvasCtx.fillStyle = 'rgba(5, 6, 11, 0.25)';
    canvasCtx.fillRect(0, 0, width, height);
    
    canvasCtx.lineWidth = 3;
    
    const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#00d2ff');
    gradient.addColorStop(0.5, '#bd00ff');
    gradient.addColorStop(1, '#00d2ff');
    canvasCtx.strokeStyle = gradient;
    
    canvasCtx.shadowBlur = 10;
    canvasCtx.shadowColor = '#bd00ff';
    
    canvasCtx.beginPath();
    
    const sliceWidth = width * 1.0 / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;
        
        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
    }
    
    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();
    canvasCtx.shadowBlur = 0;
}

// --- Toggle Audio Source (Synth vs. File) ---
function toggleAudioSource(source) {
    if (isPlaying) {
        togglePlayback(); // Pause current playback
    }
    
    audioSource = source;
    
    const optSynth = document.getElementById('opt-synth');
    const optFile = document.getElementById('opt-file');
    const fileContainer = document.getElementById('file-uploader-container');
    const bpmControlGroup = document.getElementById('bpm-control-group');
    const panelTitle = document.getElementById('panel-title');
    const playBtn = document.getElementById('play-button');
    
    if (source === 'synth') {
        optSynth.classList.add('active');
        optFile.classList.remove('active');
        fileContainer.classList.add('hidden');
        bpmControlGroup.classList.remove('hidden');
        panelTitle.textContent = "SINTETIZADOR WHITESNAKE (WEB AUDIO)";
        playBtn.innerHTML = '<span class="play-icon">▶</span> TOCAR ARRANJO';
    } else {
        optSynth.classList.remove('active');
        optFile.classList.add('active');
        fileContainer.classList.remove('hidden');
        bpmControlGroup.classList.add('hidden');
        panelTitle.textContent = "PLAYER DE COVER (ÁUDIO REAL)";
        playBtn.innerHTML = '<span class="play-icon">▶</span> TOCAR COVER';
    }
    
    // Reset track progress
    elapsedSeconds = 0;
    currentStep = 0;
    
    // Clear line highlights
    const activeLine = document.querySelector('.lyric-line.active, .lyric-line-instrumental.active');
    if (activeLine) activeLine.classList.remove('active');
    
    const lyricsContainer = document.getElementById('lyrics-container');
    if (lyricsContainer) lyricsContainer.scrollTop = 0;
}

// --- Audio File Handling Functions ---
function handleAudioFile(file) {
    initAudio();
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    if (isPlaying) {
        togglePlayback();
    }
    
    // Create audio node elements if they don't exist
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.crossOrigin = "anonymous";
        
        // Feed file player element to our Web Audio Analyzer node!
        audioSourceNode = audioCtx.createMediaElementSource(audioElement);
        audioSourceNode.connect(masterGain);
        
        // Event triggers
        audioElement.addEventListener('ended', () => {
            if (isPlaying) {
                togglePlayback();
            }
        });
    }
    
    // Object URL to read file local stream
    const fileURL = URL.createObjectURL(file);
    audioElement.src = fileURL;
    
    const dropText = document.getElementById('drop-text');
    const loadedFileInfo = document.getElementById('loaded-file-info');
    const loadedFileName = document.getElementById('loaded-file-name');
    
    if (dropText && loadedFileInfo && loadedFileName) {
        dropText.textContent = "Arquivo pronto! Clique ou arraste outro para substituir.";
        loadedFileInfo.classList.remove('hidden');
        loadedFileName.textContent = file.name;
    }
    
    elapsedSeconds = 0;
    audioElement.addEventListener('loadedmetadata', () => {
        songDuration = audioElement.duration;
    });
}

function removeAudioFile() {
    if (isPlaying && audioSource === 'file') {
        togglePlayback();
    }
    
    if (audioElement) {
        audioElement.src = "";
    }
    
    const dropText = document.getElementById('drop-text');
    const loadedFileInfo = document.getElementById('loaded-file-info');
    const fileInput = document.getElementById('audio-file-input');
    
    if (dropText && loadedFileInfo) {
        dropText.textContent = "Arraste seu MP3 (Cover com vozes da banda) ou clique para carregar";
        loadedFileInfo.classList.add('hidden');
    }
    
    if (fileInput) {
        fileInput.value = "";
    }
    
    elapsedSeconds = 0;
    songDuration = 145;
}

// --- System Play / Pause Controllers ---
function togglePlayback() {
    const playBtn = document.getElementById('play-button');
    
    if (isPlaying) {
        // --- PAUSE ---
        isPlaying = false;
        if (playBtn) {
            playBtn.classList.remove('playing');
            playBtn.innerHTML = audioSource === 'synth' ? 
                '<span class="play-icon">▶</span> TOCAR ARRANJO' : 
                '<span class="play-icon">▶</span> TOCAR COVER';
        }
        
        if (audioSource === 'synth') {
            clearTimeout(timerId);
        } else if (audioElement) {
            audioElement.pause();
        }
        
        clearInterval(uiUpdateInterval);
        cancelAnimationFrame(visualizerFrameId);
        
        if (audioCtx) audioCtx.suspend();
    } else {
        // --- PLAY ---
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        // Prevent playing in file mode without a loaded track
        if (audioSource === 'file' && (!audioElement || !audioElement.src)) {
            alert("Por favor, carregue um arquivo de áudio (MP3/WAV) primeiro!");
            return;
        }
        
        isPlaying = true;
        if (playBtn) {
            playBtn.classList.add('playing');
            playBtn.innerHTML = '<span class="play-icon">❚❚</span> PAUSAR';
        }
        
        if (audioSource === 'synth') {
            nextStepTime = audioCtx.currentTime;
            startTime = audioCtx.currentTime - elapsedSeconds;
            scheduler();
        } else if (audioElement) {
            audioElement.currentTime = elapsedSeconds;
            audioElement.play();
        }
        
        // Dynamic fast polling for UI updates (100ms)
        uiUpdateInterval = setInterval(updateUI, 100);
        drawVisualizer();
    }
}

// --- Sincronizador de Letras (Lyrics Sync) ---
function updateUI() {
    if (!isPlaying) return;
    
    if (audioSource === 'synth') {
        if (audioCtx) {
            elapsedSeconds = audioCtx.currentTime - startTime;
            if (elapsedSeconds >= songDuration) {
                elapsedSeconds = 0;
                startTime = audioCtx.currentTime;
                currentStep = 0;
                nextStepTime = audioCtx.currentTime;
            }
        }
    } else if (audioElement) {
        elapsedSeconds = audioElement.currentTime;
    }
    
    // Sync active lyric highlight
    const currentViewId = activeVersion === 'en' ? 'lyrics-en' : 'lyrics-pt';
    const lines = document.querySelectorAll(`#${currentViewId} .lyric-line, #${currentViewId} .lyric-line-instrumental`);
    
    let activeLine = null;
    
    lines.forEach((line) => {
        const time = parseFloat(line.getAttribute('data-time'));
        line.classList.remove('active');
        if (elapsedSeconds >= time) {
            activeLine = line;
        }
    });
    
    if (activeLine) {
        activeLine.classList.add('active');
        
        // Auto Scroll
        const lyricsContainer = document.getElementById('lyrics-container');
        if (lyricsContainer) {
            const containerHeight = lyricsContainer.clientHeight;
            const lineTop = activeLine.offsetTop;
            const lineHeight = activeLine.clientHeight;
            lyricsContainer.scrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2);
        }
    }
}

// --- Toggle Version (English/Portuguese) ---
function switchLyrics(lang) {
    activeVersion = lang;
    
    const enBtn = document.getElementById('btn-english');
    const ptBtn = document.getElementById('btn-portuguese');
    const enView = document.getElementById('lyrics-en');
    const ptView = document.getElementById('lyrics-pt');
    
    if (lang === 'en') {
        enBtn.classList.add('active');
        ptBtn.classList.remove('active');
        enView.classList.add('active');
        ptView.classList.remove('active');
    } else {
        ptBtn.classList.add('active');
        enBtn.classList.remove('active');
        ptView.classList.add('active');
        enView.classList.remove('active');
    }
    
    if (isPlaying) {
        updateUI();
    }
}

// --- Event Listeners and Slider Inputs Binding ---
document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('play-button');
    const bpmSlider = document.getElementById('bpm-slider');
    const bpmDisplay = document.getElementById('bpm-display');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    
    // Play button hook
    if (playBtn) {
        playBtn.addEventListener('click', togglePlayback);
    }
    
    // BPM slider hook
    if (bpmSlider) {
        bpmSlider.addEventListener('input', (e) => {
            bpm = parseInt(e.target.value);
            if (bpmDisplay) bpmDisplay.textContent = bpm;
        });
    }
    
    // Volume slider hook
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const vol = parseInt(e.target.value);
            if (volumeDisplay) volumeDisplay.textContent = vol + '%';
            
            if (masterGain) {
                masterGain.gain.setValueAtTime(vol / 100, audioCtx ? audioCtx.currentTime : 0);
            }
        });
    }
    
    // --- File Uploader drag/drop bindings ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('audio-file-input');
    
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleAudioFile(e.target.files[0]);
            }
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleAudioFile(e.dataTransfer.files[0]);
            }
        });
    }
    
    // Initial static canvas render
    const canvas = document.getElementById('audio-visualizer');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        
        ctx.fillStyle = '#05060b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(189, 0, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }
});
