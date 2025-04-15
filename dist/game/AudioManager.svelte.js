// AudioManager.ts
import { Howl, Howler } from 'howler';
var AudioManager = /** @class */ (function () {
    function AudioManager() {
        this.sounds = {};
        this.soundCooldowns = {}; // Tracks last play time
        this.isMuted = $state(Howler === null || Howler === void 0 ? void 0 : Howler._muted);
        this.loadSound('bump', './sounds/bump.wav', { volume: 0.8, preload: true }, 50 // Specific cooldown for bump sound (50ms)
        );
        this.loadSound('pop', './sounds/pop.wav', {
            volume: 0.8,
            preload: true
        });
        // Attempt to resume audio context if it was previously suspended
        // This might help in some scenarios but isn't a guaranteed fix for autoplay
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume();
        }
    }
    Object.defineProperty(AudioManager.prototype, "isAudioContextReady", {
        get: function () {
            var _a;
            return ((_a = Howler.ctx) === null || _a === void 0 ? void 0 : _a.state) === 'running';
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Loads a sound effect.
     * @param name - A unique identifier for the sound.
     * @param path - The path to the sound file.
     * @param config - Optional configuration (volume, loop, preload).
     * @param specificCooldownMs - Optional cooldown override for this sound.
     */
    AudioManager.prototype.loadSound = function (name, path, config, specificCooldownMs) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a, _b, _c;
            if (_this.sounds[name]) {
                console.warn("Sound \"".concat(name, "\" already loaded."));
                resolve();
                return;
            }
            var sound = new Howl({
                src: [path],
                volume: (_a = config === null || config === void 0 ? void 0 : config.volume) !== null && _a !== void 0 ? _a : 1.0,
                loop: (_b = config === null || config === void 0 ? void 0 : config.loop) !== null && _b !== void 0 ? _b : false,
                preload: (_c = config === null || config === void 0 ? void 0 : config.preload) !== null && _c !== void 0 ? _c : true,
                onload: function () {
                    console.log("Sound \"".concat(name, "\" loaded successfully from ").concat(path));
                    _this.sounds[name] = sound;
                    // Initialize cooldown tracking for this sound
                    _this.soundCooldowns[name] = 0;
                    // Store specific cooldown if provided
                    if (specificCooldownMs !== undefined) {
                        // Use a convention, e.g., store cooldown on the Howl object
                        // (be mindful this isn't a standard Howler property)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        sound._customCooldown = specificCooldownMs;
                    }
                    resolve();
                },
                onloaderror: function (id, error) {
                    console.error("Failed to load sound \"".concat(name, "\" from ").concat(path, ":"), error);
                    reject(error);
                }
            });
        });
    };
    /**
     * Plays a loaded sound effect by its name, respecting cooldowns.
     * @param name - The name of the sound to play.
     * @param options - Optional playback overrides (volume, rate).
     * @returns The sound ID if played, or null if on cooldown or not found/ready.
     */
    AudioManager.prototype.playSound = function (name, options) {
        var _a, _b;
        var sound = this.sounds[name];
        if (!sound) {
            console.warn("Sound \"".concat(name, "\" not found or not loaded yet."));
            return null;
        }
        // Although Howler handles context unlocking, we double-check for safety.
        // The first play *must* happen after user interaction for browsers.
        if (!this.isAudioContextReady) {
            console.warn("Cannot play sound \"".concat(name, "\" - Audio Context not ready.") +
                " Ensure initializeAudioContext() or the first playSound()" +
                " call happens after user interaction.");
            // Attempt to resume context - might work if interaction happened recently
            (_a = Howler.ctx) === null || _a === void 0 ? void 0 : _a.resume();
            return null;
        }
        var now = performance.now();
        var lastPlayTime = (_b = this.soundCooldowns[name]) !== null && _b !== void 0 ? _b : 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var cooldown = sound._customCooldown;
        if (typeof cooldown === 'undefined' || now - lastPlayTime > cooldown) {
            try {
                var soundId = sound.play();
                // Apply options if provided
                if (options) {
                    if (options.volume !== undefined) {
                        sound.volume(options.volume, soundId);
                    }
                    if (options.rate !== undefined) {
                        sound.rate(options.rate, soundId);
                    }
                    // Reset to default volume/rate after play if needed, or manage instances
                }
                this.soundCooldowns[name] = now; // Update last play time
                return soundId;
            }
            catch (error) {
                console.error("Error playing sound \"".concat(name, "\":"), error);
                return null;
            }
        }
        else {
            // Sound is on cooldown
            return null;
        }
    };
    // Optional: Method to apply pitch variation easily
    AudioManager.prototype.playSoundWithPitchVariation = function (name, minRate, maxRate, baseVolume) {
        if (minRate === void 0) { minRate = 0.9; }
        if (maxRate === void 0) { maxRate = 1.1; }
        var rate = minRate + Math.random() * (maxRate - minRate);
        return this.playSound(name, { rate: rate, volume: baseVolume });
    };
    AudioManager.prototype.toggleMute = function () {
        var newIsMuted = !this.isMuted;
        Howler.mute(newIsMuted);
        this.isMuted = newIsMuted;
    };
    return AudioManager;
}());
export { AudioManager };
