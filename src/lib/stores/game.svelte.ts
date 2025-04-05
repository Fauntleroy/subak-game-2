import RAPIER, {
  World,
  EventQueue // Import EventQueue
} from '@dimforge/rapier2d-compat';

import { Fruit } from '../game/Fruit';

import {
  FRUITS, // Assuming FRUITS is typed like: { radius: number; points: number }[]
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_THICKNESS
} from '../constants'; // Ensure constants are correctly typed in their file
import { throttle } from '../utils/throttle';

// --- Interfaces remain the same ---
export interface MergeEffectData {
  id: number;
  x: number;
  y: number;
  radius: number;
  startTime: number;
  duration: number;
  scale: number;
  opacity: number;
}
export interface FruitState {
  x: number;
  y: number;
  rotation: number;
  fruitIndex: number;
}

// Simple easing function
const easeOutQuad = (t: number): number => t * (2 - t);

export class GameState {
  score: number = $state(0);
  gameOver: boolean = $state(false);
  currentFruitIndex: number = $state(0);
  nextFruitIndex: number = $state(0);
  fruits: Fruit[] = [];
  fruitsState: FruitState[] = $state([]);
  dropCount: number = $state(0);
  mergeEffects: MergeEffectData[] = $state([]);

  mergeEffectIdCounter: number = 0;

  lastTime: number = 0;
  animationFrameId: number | null = null;

  physicsWorld: World | null = null;
  eventQueue: EventQueue | null = null;
  colliderMap: Map<number, Fruit> = new Map();

  throttledCheckGameOver?: () => void;

  constructor() {
    (async () => {
      this.throttledCheckGameOver = throttle(this.checkGameOver, 500);
      await this.initPhysics();
      this.resetGame();
      this.update();
    })();
  }

  update() {
    if (this.gameOver) {
      // Stop loop if component destroyed or game over
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      return;
    }
    this.stepPhysics(); // Run physics step
    this.throttledCheckGameOver?.(); // We done here?
    this.animationFrameId = requestAnimationFrame(() => this.update()); // Request next frame
  }

  async initPhysics(): Promise<void> {
    console.log('Starting Rapier physics engine...');
    try {
      await RAPIER.init();
      console.log('Rapier physics initialized.');

      const gravity = new RAPIER.Vector2(0.0, 196.2);
      this.physicsWorld = new RAPIER.World(gravity);
      this.physicsWorld.integrationParameters.numSolverIterations = 8;
      this.eventQueue = new RAPIER.EventQueue(true); // Create event queue (true enables contact events)
      this.colliderMap.clear(); // Ensure map is clear on init

      // Create walls (walls don't need collision events for merging)
      this.createWall(0, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT);
      this.createWall(GAME_WIDTH, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT);
      this.createWall(GAME_WIDTH / 2, GAME_HEIGHT, GAME_WIDTH, WALL_THICKNESS);

      console.log('Physics world and event queue created and set.');
    } catch (error) {
      console.error(
        'Failed to initialize Rapier or create physics world:',
        error
      );
      this.setGameOver(true);
    }
  }

  stepPhysics(): void {
    if (!this.physicsWorld || !this.eventQueue) {
      // Don't step if world or event queue doesn't exist
      return;
    }

    const currentTime = performance.now() / 1000;
    this.lastTime = currentTime;

    // --- Step 1: Step Physics and Drain Events ---
    this.physicsWorld.step(this.eventQueue); // Step world AND populate event queue

    const mergePairs: { fruitA: Fruit; fruitB: Fruit }[] = [];
    const mergedHandlesThisStep = new Set<number>(); // Track handles involved in a merge *this step*

    this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      // Only process contacts that *started* in this step
      if (!started) {
        return;
      }

      // Avoid processing if either collider is already part of a merge this step
      if (
        mergedHandlesThisStep.has(handle1) ||
        mergedHandlesThisStep.has(handle2)
      ) {
        return;
      }

      // Look up our data associated with the collider handles
      const fruitA = this.colliderMap.get(handle1);
      const fruitB = this.colliderMap.get(handle2);

      // Ensure both colliders correspond to known fruit data and are valid
      if (
        !fruitA ||
        !fruitB ||
        !fruitA.body.isValid() ||
        !fruitB.body.isValid()
      ) {
        // One or both colliders might not be fruits (e.g., walls) or might have been removed
        return;
      }

      // Check if fruits are the same type and not the largest
      if (
        fruitA.fruitIndex === fruitB.fruitIndex &&
        fruitA.fruitIndex < FRUITS.length - 1
      ) {
        // Queue this pair for merging
        console.log(
          `Collision Event: Queueing merge for type ${fruitA.fruitIndex} (handles ${handle1}, ${handle2})`
        );
        // Ensure consistent order (optional, but good practice)
        const handleA = Math.min(handle1, handle2);
        const handleB = Math.max(handle1, handle2);
        mergePairs.push({ fruitA, fruitB });

        // Mark handles as merged for this step
        mergedHandlesThisStep.add(handleA);
        mergedHandlesThisStep.add(handleB);
      }
    });

    // --- Step 2: Process Queued Merges ---
    if (mergePairs.length > 0) {
      console.log(`Processing ${mergePairs.length} merge pairs from events...`);
      mergePairs.forEach(({ fruitA, fruitB }) => {
        // mergeFruits will handle validity checks internally now
        this.mergeFruits(fruitA, fruitB);
      });
      console.log(
        `Finished processing merges. Current fruits count: ${this.fruits.length}`
      );
    }

    // --- Step 3: Update Rendering State and Effects (mostly unchanged) ---
    const updatedFruitStates: FruitState[] = this.fruits
      .map((fruit) => {
        if (!fruit.body.isValid()) return null;
        return {
          x: fruit.body.translation().x,
          y: fruit.body.translation().y,
          rotation: fruit.body.rotation(),
          fruitIndex: fruit.fruitIndex
        };
      })
      .filter((state): state is FruitState => state !== null);
    this.setFruitsState(updatedFruitStates);

    const newMergeEffects = this.mergeEffects
      .map((effect: MergeEffectData) => {
        const progress = (currentTime - effect.startTime) / effect.duration;
        if (progress >= 1) return null;
        const eased = easeOutQuad(Math.min(progress, 1));
        return {
          ...effect,
          scale: 1 + 4 * eased,
          opacity: 0.5 * (1 - eased)
        };
      })
      .filter((effect): effect is MergeEffectData => effect !== null);
    this.setMergeEffects(newMergeEffects);
  }

  createWall(x: number, y: number, width: number, height: number): void {
    if (!this.physicsWorld) {
      console.error('Cannot create wall: Physics world not initialized.');
      return;
    }

    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
    const body = this.physicsWorld.createRigidBody(bodyDesc);
    // Walls don't need ActiveEvents.COLLISION_EVENTS unless you want to detect collisions with them
    const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
    this.physicsWorld.createCollider(colliderDesc, body);
  }

  mergeFruits(fruitA: Fruit, fruitB: Fruit): void {
    if (!this.physicsWorld) {
      console.error('Cannot merge fruits: Physics world not initialized.');
      return;
    }

    // Check if data exists and bodies are valid
    if (!fruitA.body.isValid() || !fruitB.body.isValid()) {
      console.warn(
        `Attempted to merge handles ${fruitA.body.handle}, ${fruitB.body.handle}, but data/body was missing or invalid. Might have been merged already.`
      );
      return;
    }

    // --- Rest of the merge logic is similar, using bodyAData/bodyBData ---
    const posA = fruitA.body.translation();
    const posB = fruitB.body.translation();
    const midpoint = {
      x: (posA.x + posB.x) / 2,
      y: (posA.y + posB.y) / 2
    };

    const nextIndex = fruitA.fruitIndex + 1;
    const nextFruitType = FRUITS[nextIndex];
    if (!nextFruitType) {
      console.error(`Invalid next fruit index during merge: ${nextIndex}`);
      return;
    }
    const newFruitRadius = nextFruitType.radius;

    // 1. Remove the old bodies from the physics world *first*
    fruitA.destroy();
    fruitB.destroy();

    // 2. Remove from collider map
    this.colliderMap.delete(fruitA.body.handle);
    this.colliderMap.delete(fruitB.body.handle);

    // 3. Filter the local fruits array *immediately* using handles
    this.fruits = this.fruits.filter((fruit) => {
      return fruit !== fruitA && fruit !== fruitB;
    });

    // Add merge visual effect
    const newMergeEffects = [
      ...this.mergeEffects,
      {
        id: this.mergeEffectIdCounter++,
        x: midpoint.x,
        y: midpoint.y,
        radius: newFruitRadius,
        startTime: performance.now() / 1000,
        duration: 0.5,
        scale: 1,
        opacity: 0.5
      }
    ];
    this.setMergeEffects(newMergeEffects);

    // 4. Add the new, larger fruit (addFruit will update map and array)
    this.addFruit(nextIndex, midpoint.x, midpoint.y);

    // Update the score
    this.setScore(this.score + (nextFruitType.points || 0));

    console.log(
      `Merged handles ${fruitA.body.handle}, ${fruitB.body.handle}. New fruits count: ${this.fruits.length}`
    );
  }

  addFruit(fruitIndex: number, x: number, y: number): void {
    if (!this.physicsWorld) {
      console.error('Cannot add fruit: Physics world not initialized.');
      return;
    }

    const fruit = new Fruit(fruitIndex, x, y, this.physicsWorld);

    if (!fruit) {
      console.error(`Invalid fruitIndex: ${fruitIndex}`);
      return;
    }

    // update current state of fruits
    this.fruits = [...this.fruits, fruit];

    this.colliderMap.set(fruit.collider.handle, fruit);
  }

  dropFruit(fruitIndex: number, x: number, y: number): void {
    this.addFruit(fruitIndex, x, y);
    this.setCurrentFruitIndex(this.nextFruitIndex);
    this.setNextFruitIndex(this.getRandomFruitIndex());
    this.setDropCount(this.dropCount + 1);
  }

  checkGameOver(): void {
    if (this.gameOver) return;

    for (const fruit of this.fruits) {
      if (fruit.isOutOfBounds()) {
        console.log('Game Over condition met!');
        this.setGameOver(true);
        break;
      }
    }
  }

  /** Resets the game state, physics world, and clears the map */
  resetGame(): void {
    if (this.physicsWorld) {
      this.fruits.forEach((fruit) => fruit.destroy());
    }

    // Clear internal state
    this.fruits = [];
    this.lastTime = 0;
    this.mergeEffectIdCounter = 0;
    this.dropCount = 0;

    // Reset Svelte stores
    this.setFruitsState([]);
    this.setMergeEffects([]);
    this.setScore(0);
    this.setGameOver(false);
    this.setCurrentFruitIndex(this.getRandomFruitIndex());
    this.setNextFruitIndex(this.getRandomFruitIndex());
  }

  restartGame(): void {
    this.resetGame();
    // start the loop again
    this.update();
  }

  getRandomFruitIndex(limit: number = 5) {
    return Math.floor(Math.random() * limit);
  }

  setScore(newScore: number) {
    this.score = newScore;
  }

  setGameOver(newGameOver: boolean) {
    this.gameOver = newGameOver;
  }

  setCurrentFruitIndex(newCurrentFruitIndex: number) {
    this.currentFruitIndex = newCurrentFruitIndex;
  }

  setNextFruitIndex(newNextFruitIndex: number) {
    this.nextFruitIndex = newNextFruitIndex;
  }

  setFruitsState(newFruits: FruitState[]) {
    this.fruitsState = newFruits;
  }

  setDropCount(newDropCount: number) {
    this.dropCount = newDropCount;
  }

  setMergeEffects(newMergeEffects: MergeEffectData[]) {
    this.mergeEffects = newMergeEffects;
  }
}

export const gameState = new GameState();
