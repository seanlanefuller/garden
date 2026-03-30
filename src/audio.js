import * as THREE from 'three';

export class AudioController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        this.context = this.listener.context; // Web Audio Context
        this.windSound = null;
        this.waterSounds = [];
    }

    init() {
        // We can't start audio context until user gesture. 
        // We'll prepare buffers and wait for 'resume' call.
        this.createWind();
        this.createWaterSources();
    }

    resume() {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    createNoiseBuffer(type = 'white') {
        const bufferSize = 2 * this.context.sampleRate; // 2 seconds
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            if (type === 'white') {
                output[i] = Math.random() * 2 - 1;
            } else if (type === 'pink') {
                // Approximate Pink Noise (1/f)
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // Compensate for gain loss
            }
        }
        return buffer;
    }

    createWind() {
        // Global wind sound
        const sound = new THREE.Audio(this.listener);
        const buffer = this.createNoiseBuffer('white'); // Use white for base
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.1); // Base volume

        // Lowpass filter for "rumble"
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        sound.setFilter(filter);
        this.windSound = { sound, filter };

        // We rely on Three.js Audio but we need to connect filter manually sometimes 
        // Three.js Audio handles filters via setFilter nicely.

        this.scene.add(sound); // 'scene' not passed, but Audio doesn't strictly need to be in scene if not positional
        // Actually non-positional audio just needs listener.

        sound.play(); // It won't actually be audible until context resumes
    }

    createWaterSources() {
        // Create positional audio for lakes
        // Locations: 
        // Little Smith Lake: -500, 1500
        // Aquatic Garden: -200, -200

        const locations = [
            new THREE.Vector3(-500, 0, 1500),
            new THREE.Vector3(-200, 0, -200)
        ];

        locations.forEach(pos => {
            const sound = new THREE.PositionalAudio(this.listener);
            const buffer = this.createNoiseBuffer('white'); // Pink noise approximation logic is tricky in loop, using white with heavy filter
            // Let's just use white and filter it heavily to sound like rushing water
            sound.setBuffer(buffer);
            sound.setRefDistance(50); // Shorter distance for brook
            sound.setRolloffFactor(2); // Faster fade out
            sound.setLoop(true);
            sound.setVolume(0.2); // Quieter

            // Filter for bubbling brook (Bandpass)
            const filter = this.context.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 600;
            filter.Q.value = 2;
            sound.setFilter(filter);

            // Create a dummy object to hold the sound
            const pivot = new THREE.Object3D();
            pivot.position.copy(pos);
            pivot.add(sound);
            // We need to add this pivot to the main scene, but we don't have scene ref here easily.
            // Let's pass scene in constructor or store these to add later.
            this.waterSounds.push(pivot);

            sound.play();
        });
    }

    playBirdChirp() {
        if (this.context.state === 'suspended') return;

        // Procedural bird chirp using Oscillator
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination); // Global sound for now, simpler

        osc.type = 'sine';

        // Random pitch
        const startFreq = 2000 + Math.random() * 2000;
        osc.frequency.setValueAtTime(startFreq, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(startFreq / 2, this.context.currentTime + 0.1);

        // Envelope
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    }

    update(time) {
        // Wind modulation
        if (this.windSound) {
            // Swell volume/filter
            const swell = Math.sin(time * 0.5) * 0.5 + 0.5; // 0 to 1
            this.windSound.filter.frequency.value = 200 + swell * 400; // 200 to 600Hz
            this.windSound.sound.setVolume(0.1 + swell * 0.2);
        }

        // Random Birds
        if (Math.random() < 0.005) { // Occasional chirp
            this.playBirdChirp();
        }

        // Bubbling Water Modulation
        this.waterSounds.forEach((pivot, i) => {
            const sound = pivot.children[0];
            if (sound && sound.getOutput) { // Check if connected
                // Modulate filter frequency for "gurgle"
                // Use different speeds for each source
                const noise = Math.sin(time * (5 + i)) * Math.cos(time * (3 + i) + i);
                if (sound.filters && sound.filters.length > 0) {
                    sound.filters[0].frequency.value = 600 + noise * 150;
                }
            }
        });
    }
}

// Helper for pink noise state
let lastOut = 0;
