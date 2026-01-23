
/*
 * © 2026 Eduarda Tessari Pereira & Felipe Correa Bitencourt.
 * All Rights Reserved.
 * Unauthorized distribution or modification is prohibited.
 */

/**
 * AudioManager
 * Uses Web Audio API to generate system sounds without external files.
 */
const AudioManager = {
    ctx: null,
    enabled: true,

    init: function () {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            console.log("AudioContext initialized");
        } catch (e) {
            console.warn("Web Audio API not supported");
            this.enabled = false;
        }
    },

    playTone: function (freq, type, duration, startTime = 0, vol = 0.1) {
        if (!this.enabled || !this.ctx) return;

        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gainNode.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    },

    playClick: function () {
        // Short high pitch 'tick'
        this.playTone(800, 'sine', 0.05, 0, 0.05);
    },

    playSuccess: function () {
        // Major chord arpeggio (C - E - G)
        this.playTone(523.25, 'sine', 0.2, 0, 0.1);   // C5
        this.playTone(659.25, 'sine', 0.2, 0.1, 0.1); // E5
        this.playTone(783.99, 'sine', 0.4, 0.2, 0.1); // G5
    },

    playError: function () {
        // Dissonant low buzz
        this.playTone(150, 'sawtooth', 0.3, 0, 0.1);
        this.playTone(142, 'sawtooth', 0.3, 0.05, 0.1);
    },

    playExpand: function () {
        // Soft 'pop' sound for expanding/revealing content
        this.playTone(440, 'sine', 0.08, 0, 0.08);      // A4
        this.playTone(554.37, 'sine', 0.1, 0.05, 0.06); // C#5 - creates a pleasant minor 3rd
    }
};
