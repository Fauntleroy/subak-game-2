var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { init as rapierInit, Vector2, World, EventQueue // Import EventQueue
 } from '@dimforge/rapier2d-compat';
import { Fruit } from '../game/Fruit';
import { FRUITS, // Assuming FRUITS is typed like: { radius: number; points: number }[]
GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS } from '../constants'; // Ensure constants are correctly typed in their file
import { throttle } from '../utils/throttle';
import { AudioManager } from '../game/AudioManager.svelte';
import { Boundary } from '../game/Boundary';
// --- Constants for Volume Mapping ---
var MIN_VELOCITY_FOR_SOUND = 0.2; // Ignore very gentle taps
var MAX_VELOCITY_FOR_MAX_VOL = 0.8; // Velocity at which sound is loudest
var MIN_COLLISION_VOLUME = 0.3; // Minimum volume for the quietest sound
var MAX_COLLISION_VOLUME = 1.0; // Maximum volume for the loudest sound
// --- Pitch variation settings ---
var PITCH_VARIATION_MIN = 0.9;
var PITCH_VARIATION_MAX = 1.1;
// Helper function (as defined above)
function mapRange(value, inMin, inMax, outMin, outMax) {
    var clampedValue = Math.max(inMin, Math.min(value, inMax));
    return (((clampedValue - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin);
}
var GameState = /** @class */ (function () {
    function GameState() {
        var _this = this;
        this.audioManager = null;
        this.score = $state(0);
        this.gameOver = $state(false);
        this.currentFruitIndex = $state(0);
        this.nextFruitIndex = $state(0);
        this.fruits = [];
        this.fruitsState = $state([]);
        this.dropCount = $state(0);
        this.mergeEffects = $state([]);
        this.mergeEffectIdCounter = 0;
        this.physicsAccumulator = 0;
        this.lastTime = null;
        this.animationFrameId = null;
        this.physicsWorld = null;
        this.eventQueue = null;
        this.colliderMap = new Map();
        this.lastBumpSoundTime = 0;
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.audioManager = new AudioManager();
                        this.throttledCheckGameOver = throttle(this.checkGameOver, 500);
                        return [4 /*yield*/, this.initPhysics()];
                    case 1:
                        _a.sent();
                        this.resetGame();
                        this.update();
                        return [2 /*return*/];
                }
            });
        }); })();
    }
    GameState.prototype.update = function () {
        var _this = this;
        var _a;
        if (this.gameOver) {
            // Stop loop if component destroyed or game over
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            return;
        }
        this.stepPhysics(); // Run physics step
        (_a = this.throttledCheckGameOver) === null || _a === void 0 ? void 0 : _a.call(this); // We done here?
        this.animationFrameId = requestAnimationFrame(function () { return _this.update(); }); // Request next frame
    };
    GameState.prototype.initPhysics = function () {
        return __awaiter(this, void 0, Promise, function () {
            var gravity, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Starting Rapier physics engine...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, rapierInit()];
                    case 2:
                        _a.sent();
                        console.log('Rapier physics initialized.');
                        gravity = new Vector2(0.0, 9.86 * 0.15);
                        this.physicsWorld = new World(gravity);
                        this.physicsWorld.integrationParameters.numSolverIterations = 8;
                        this.eventQueue = new EventQueue(true); // Create event queue (true enables contact events)
                        this.colliderMap.clear(); // Ensure map is clear on init
                        this.createBounds();
                        console.log('Physics world and event queue created and set.');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to initialize Rapier or create physics world:', error_1);
                        this.setGameOver(true);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GameState.prototype.stepPhysics = function () {
        if (!this.physicsWorld || !this.eventQueue) {
            // Don't step if world or event queue doesn't exist
            return;
        }
        var currentTime = performance.now();
        var physicsStepMs = this.physicsWorld.integrationParameters.dt * 1000;
        this.physicsAccumulator += currentTime - (this.lastTime || 0);
        while (this.physicsAccumulator >= physicsStepMs) {
            this.physicsAccumulator -= physicsStepMs;
            this.physicsWorld.step(this.eventQueue);
            this.checkCollisions();
        }
        this.lastTime = currentTime;
        // --- Step 3: Update Rendering State and Effects (mostly unchanged) ---
        var updatedFruitStates = this.fruits
            .map(function (fruit) {
            if (!fruit.body.isValid())
                return null;
            return {
                x: fruit.body.translation().x,
                y: fruit.body.translation().y,
                rotation: fruit.body.rotation(),
                fruitIndex: fruit.fruitIndex
            };
        })
            .filter(function (state) { return state !== null; });
        this.setFruitsState(updatedFruitStates);
        var newMergeEffects = this.mergeEffects
            .map(function (effect) {
            var progress = (currentTime - effect.startTime) / effect.duration;
            if (progress >= 1)
                return null;
            return effect;
        })
            .filter(function (effect) { return effect !== null; });
        this.setMergeEffects(newMergeEffects);
    };
    GameState.prototype.checkCollisions = function () {
        var _this = this;
        if (!this.eventQueue) {
            return;
        }
        var currentTime = performance.now();
        var mergePairs = [];
        var mergedHandlesThisStep = new Set(); // Track handles involved in a merge *this step*
        this.eventQueue.drainCollisionEvents(function (handle1, handle2, started) {
            var _a, _b;
            // Only process contacts that *started* in this step
            if (!started) {
                return;
            }
            // Look up our data associated with the collider handles
            var collisionItemA = _this.colliderMap.get(handle1);
            var collisionItemB = _this.colliderMap.get(handle2);
            if ((collisionItemA === null || collisionItemA === void 0 ? void 0 : collisionItemA.body) && (collisionItemB === null || collisionItemB === void 0 ? void 0 : collisionItemB.body) && _this.audioManager) {
                // Apply random pitch variation
                var rate = PITCH_VARIATION_MIN +
                    Math.random() * (PITCH_VARIATION_MAX - PITCH_VARIATION_MIN);
                // if it's two fruits they will always fire pop sound effect
                if (collisionItemA instanceof Fruit &&
                    collisionItemB instanceof Fruit &&
                    collisionItemA.fruitIndex === collisionItemB.fruitIndex) {
                    _this.audioManager.playSound('pop', { volume: 1, rate: rate });
                    // bump sounds have complex logic
                }
                else {
                    // Get velocities (use {x:0, y:0} for static bodies or null bodies)
                    var vel1 = (_a = collisionItemA.body.linvel()) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
                    var vel2 = (_b = collisionItemB.body.linvel()) !== null && _b !== void 0 ? _b : { x: 0, y: 0 };
                    // Calculate relative velocity magnitude
                    var relVelX = vel1.x - vel2.x;
                    var relVelY = vel1.y - vel2.y;
                    var relVelMag = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
                    // --- Determine Volume and Play Sound ---
                    if (relVelMag >= MIN_VELOCITY_FOR_SOUND) {
                        // Check global time-based cooldown first
                        // Map velocity to volume
                        var volume = mapRange(relVelMag, MIN_VELOCITY_FOR_SOUND, MAX_VELOCITY_FOR_MAX_VOL, MIN_COLLISION_VOLUME, MAX_COLLISION_VOLUME);
                        // Play the sound using AudioManager
                        _this.audioManager.playSound('bump', { volume: volume, rate: rate });
                        // Update the last play time
                        _this.lastBumpSoundTime = currentTime;
                    }
                }
            }
            // Avoid processing if either collider is already part of a merge this step
            if (mergedHandlesThisStep.has(handle1) ||
                mergedHandlesThisStep.has(handle2)) {
                return;
            }
            var fruitA;
            var fruitB;
            if (collisionItemA instanceof Fruit && collisionItemB instanceof Fruit) {
                fruitA = collisionItemA;
                fruitB = collisionItemB;
            }
            else {
                return;
            }
            // Ensure both colliders correspond to known fruit data and are valid
            if (!fruitA ||
                !fruitB ||
                !fruitA.body.isValid() ||
                !fruitB.body.isValid()) {
                // One or both colliders might not be fruits (e.g., walls) or might have been removed
                return;
            }
            // Check if fruits are the same type and not the largest
            if (fruitA.fruitIndex === fruitB.fruitIndex &&
                fruitA.fruitIndex < FRUITS.length - 1) {
                // Queue this pair for merging
                console.log("Collision Event: Queueing merge for type ".concat(fruitA.fruitIndex, " (handles ").concat(handle1, ", ").concat(handle2, ")"));
                // Ensure consistent order (optional, but good practice)
                var handleA = Math.min(handle1, handle2);
                var handleB = Math.max(handle1, handle2);
                mergePairs.push({ fruitA: fruitA, fruitB: fruitB });
                // Mark handles as merged for this step
                mergedHandlesThisStep.add(handleA);
                mergedHandlesThisStep.add(handleB);
            }
        });
        // --- Step 2: Process Queued Merges ---
        if (mergePairs.length > 0) {
            console.log("Processing ".concat(mergePairs.length, " merge pairs from events..."));
            mergePairs.forEach(function (_a) {
                var fruitA = _a.fruitA, fruitB = _a.fruitB;
                // mergeFruits will handle validity checks internally now
                _this.mergeFruits(fruitA, fruitB);
            });
            console.log("Finished processing merges. Current fruits count: ".concat(this.fruits.length));
        }
    };
    GameState.prototype.createBounds = function () {
        // Create walls (walls don't need collision events for merging)
        this.createWall(WALL_THICKNESS / -2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT); // left
        this.createWall(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT); // right
        this.createWall(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2, GAME_WIDTH, WALL_THICKNESS); // floor
    };
    GameState.prototype.createWall = function (x, y, width, height) {
        if (!this.physicsWorld) {
            console.error('Cannot create wall: Physics world not initialized.');
            return;
        }
        var boundary = new Boundary(x, y, width, height, this.physicsWorld);
        this.colliderMap.set(boundary.collider.handle, boundary);
    };
    GameState.prototype.mergeFruits = function (fruitA, fruitB) {
        if (!this.physicsWorld) {
            console.error('Cannot merge fruits: Physics world not initialized.');
            return;
        }
        // Check if data exists and bodies are valid
        if (!fruitA.body.isValid() || !fruitB.body.isValid()) {
            console.warn("Attempted to merge handles ".concat(fruitA.body.handle, ", ").concat(fruitB.body.handle, ", but data/body was missing or invalid. Might have been merged already."));
            return;
        }
        // --- Rest of the merge logic is similar, using bodyAData/bodyBData ---
        var posA = fruitA.body.translation();
        var posB = fruitB.body.translation();
        var midpoint = {
            x: (posA.x + posB.x) / 2,
            y: (posA.y + posB.y) / 2
        };
        var nextIndex = fruitA.fruitIndex + 1;
        var nextFruitType = FRUITS[nextIndex];
        if (!nextFruitType) {
            console.error("Invalid next fruit index during merge: ".concat(nextIndex));
            return;
        }
        var newFruitRadius = nextFruitType.radius;
        // 1. Remove the old bodies from the physics world *first*
        fruitA.destroy();
        fruitB.destroy();
        // 2. Remove from collider map
        this.colliderMap.delete(fruitA.body.handle);
        this.colliderMap.delete(fruitB.body.handle);
        // 3. Filter the local fruits array *immediately* using handles
        this.fruits = this.fruits.filter(function (fruit) {
            return fruit !== fruitA && fruit !== fruitB;
        });
        // Add merge visual effect
        var newMergeEffects = __spreadArray(__spreadArray([], this.mergeEffects, true), [
            {
                id: this.mergeEffectIdCounter++,
                x: midpoint.x,
                y: midpoint.y,
                radius: newFruitRadius,
                startTime: performance.now(),
                duration: 1000
            }
        ], false);
        this.setMergeEffects(newMergeEffects);
        // 4. Add the new, larger fruit (addFruit will update map and array)
        this.addFruit(nextIndex, midpoint.x, midpoint.y);
        // Update the score
        this.setScore(this.score + (nextFruitType.points || 0));
        console.log("Merged handles ".concat(fruitA.body.handle, ", ").concat(fruitB.body.handle, ". New fruits count: ").concat(this.fruits.length));
    };
    GameState.prototype.addFruit = function (fruitIndex, x, y) {
        if (!this.physicsWorld) {
            console.error('Cannot add fruit: Physics world not initialized.');
            return;
        }
        var fruit = new Fruit(fruitIndex, x, y, this.physicsWorld);
        if (!fruit) {
            console.error("Invalid fruitIndex: ".concat(fruitIndex));
            return;
        }
        // update current state of fruits
        this.fruits = __spreadArray(__spreadArray([], this.fruits, true), [fruit], false);
        this.colliderMap.set(fruit.collider.handle, fruit);
    };
    GameState.prototype.dropFruit = function (fruitIndex, x, y) {
        this.addFruit(fruitIndex, x, y);
        this.setCurrentFruitIndex(this.nextFruitIndex);
        this.setNextFruitIndex(this.getRandomFruitIndex());
        this.setDropCount(this.dropCount + 1);
    };
    GameState.prototype.checkGameOver = function () {
        if (this.gameOver)
            return;
        for (var _i = 0, _a = this.fruits; _i < _a.length; _i++) {
            var fruit = _a[_i];
            if (fruit.isOutOfBounds()) {
                console.log('Game Over condition met!');
                this.setGameOver(true);
                break;
            }
        }
    };
    /** Resets the game state, physics world, and clears the map */
    GameState.prototype.resetGame = function () {
        if (this.physicsWorld) {
            this.fruits.forEach(function (fruit) { return fruit.destroy(); });
        }
        // Clear internal state
        this.fruits = [];
        this.lastTime = null;
        this.mergeEffectIdCounter = 0;
        this.dropCount = 0;
        // Reset Svelte stores
        this.setFruitsState([]);
        this.setMergeEffects([]);
        this.setScore(0);
        this.setGameOver(false);
        this.setCurrentFruitIndex(this.getRandomFruitIndex());
        this.setNextFruitIndex(this.getRandomFruitIndex());
    };
    GameState.prototype.restartGame = function () {
        this.resetGame();
        // start the loop again
        this.update();
    };
    GameState.prototype.getRandomFruitIndex = function (limit) {
        if (limit === void 0) { limit = 5; }
        return Math.floor(Math.random() * limit);
    };
    GameState.prototype.setScore = function (newScore) {
        this.score = newScore;
    };
    GameState.prototype.setGameOver = function (newGameOver) {
        this.gameOver = newGameOver;
    };
    GameState.prototype.setCurrentFruitIndex = function (newCurrentFruitIndex) {
        this.currentFruitIndex = newCurrentFruitIndex;
    };
    GameState.prototype.setNextFruitIndex = function (newNextFruitIndex) {
        this.nextFruitIndex = newNextFruitIndex;
    };
    GameState.prototype.setFruitsState = function (newFruits) {
        this.fruitsState = newFruits;
    };
    GameState.prototype.setDropCount = function (newDropCount) {
        this.dropCount = newDropCount;
    };
    GameState.prototype.setMergeEffects = function (newMergeEffects) {
        this.mergeEffects = newMergeEffects;
    };
    return GameState;
}());
export { GameState };
export var gameState = new GameState();
