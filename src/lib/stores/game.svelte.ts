import RAPIER, {
  World,
  RigidBody,
  Collider,
  EventQueue, // Import EventQueue
  ActiveEvents // Import ActiveEvents
} from '@dimforge/rapier2d-compat';
import {
  FRUITS, // Assuming FRUITS is typed like: { radius: number; points: number }[]
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_THICKNESS,
  GAME_OVER_HEIGHT
} from '../constants'; // Ensure constants are correctly typed in their file

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
interface RigidBodyData {
  body: RigidBody;
  collider: Collider;
  fruitIndex: number;
}

// Simple easing function
const easeOutQuad = (t: number): number => t * (2 - t);

export class GameState {
  score: number = $state(0);
  gameOver: boolean = $state(false);
  currentFruit: number = $state(0);
  nextFruit: number = $state(0);
  fruits: FruitState[] = $state([]);
  mergeEffects: MergeEffectData[] = $state([]);

  mergeEffectIdCounter: number = 0;

  lastTime: number = 0;
  animationFrameId: number | null = null;

  physicsWorld: World | null = null;
  rigidBodies: RigidBodyData[] = [];
  eventQueue: EventQueue | null = null;
  colliderMap: Map<number, RigidBodyData> = new Map();

  constructor() {
    (async () => {
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
    this.animationFrameId = requestAnimationFrame(() => this.update()); // Request next frame
  }

  async initPhysics(): Promise<void> {
    console.log('init physics call');
    try {
      await RAPIER.init();
      console.log('Rapier initialized');

      const gravity = new RAPIER.Vector2(0.0, 196.2);
      this.physicsWorld = new RAPIER.World(gravity);
      this.eventQueue = new RAPIER.EventQueue(true); // Create event queue (true enables contact events)
      this.colliderMap.clear(); // Ensure map is clear on init

      // Create walls (walls don't need collision events for merging)
      this.createWall(0, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT);
      this.createWall(GAME_WIDTH, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT);
      this.createWall(GAME_WIDTH / 2, GAME_HEIGHT, GAME_WIDTH, WALL_THICKNESS);
      console.log('Physics world and event queue created and set.');
    } catch (error) {
      console.error('Failed to initialize Rapier or create world:', error);
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

    const mergePairs: { handleA: number; handleB: number }[] = [];
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
      const dataA = this.colliderMap.get(handle1);
      const dataB = this.colliderMap.get(handle2);

      // Ensure both colliders correspond to known fruit data and are valid
      if (!dataA || !dataB || !dataA.body.isValid() || !dataB.body.isValid()) {
        // One or both colliders might not be fruits (e.g., walls) or might have been removed
        return;
      }

      // Check if fruits are the same type and not the largest
      if (
        dataA.fruitIndex === dataB.fruitIndex &&
        dataA.fruitIndex < FRUITS.length - 1
      ) {
        // Queue this pair for merging
        console.log(
          `Collision Event: Queueing merge for type ${dataA.fruitIndex} (handles ${handle1}, ${handle2})`
        );
        // Ensure consistent order (optional, but good practice)
        const handleA = Math.min(handle1, handle2);
        const handleB = Math.max(handle1, handle2);
        mergePairs.push({ handleA, handleB });

        // Mark handles as merged for this step
        mergedHandlesThisStep.add(handleA);
        mergedHandlesThisStep.add(handleB);
      }
    });

    // --- Step 2: Process Queued Merges ---
    if (mergePairs.length > 0) {
      console.log(`Processing ${mergePairs.length} merge pairs from events...`);
      mergePairs.forEach(({ handleA, handleB }) => {
        // mergeFruits will handle validity checks internally now
        this.mergeFruits(handleA, handleB);
      });
      console.log(
        `Finished processing merges. Current rigidBodies count: ${this.rigidBodies.length}`
      );
    }

    // --- Step 3: Update Rendering State and Effects (mostly unchanged) ---
    const updatedFruitStates: FruitState[] = this.rigidBodies
      .map((rb) => {
        if (!rb.body.isValid()) return null;
        return {
          x: rb.body.translation().x,
          y: rb.body.translation().y,
          rotation: rb.body.rotation(),
          fruitIndex: rb.fruitIndex
        };
      })
      .filter((state): state is FruitState => state !== null);
    this.setFruits(updatedFruitStates);

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

    // --- Step 4: Check Game Over (unchanged) ---
    this.checkGameOver();
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

  mergeFruits(handleA: number, handleB: number): void {
    if (!this.physicsWorld) {
      console.error('Cannot merge fruits: Physics world not initialized.');
      return;
    }

    // Get data from map using handles
    const bodyAData = this.colliderMap.get(handleA);
    const bodyBData = this.colliderMap.get(handleB);

    // Check if data exists and bodies are valid
    if (
      !bodyAData ||
      !bodyBData ||
      !bodyAData.body.isValid() ||
      !bodyBData.body.isValid()
    ) {
      console.warn(
        `Attempted to merge handles ${handleA}, ${handleB}, but data/body was missing or invalid. Might have been merged already.`
      );
      return;
    }

    // --- Rest of the merge logic is similar, using bodyAData/bodyBData ---
    const posA = bodyAData.body.translation();
    const posB = bodyBData.body.translation();
    const midpoint = {
      x: (posA.x + posB.x) / 2,
      y: (posA.y + posB.y) / 2
    };

    const nextIndex = bodyAData.fruitIndex + 1;
    const nextFruitType = FRUITS[nextIndex];
    if (!nextFruitType) {
      console.error(`Invalid next fruit index during merge: ${nextIndex}`);
      return;
    }
    const newFruitRadius = nextFruitType.radius;

    // --- Critical Section: Update Physics World, Map, and Local Array ---

    // 1. Remove the old bodies from the physics world *first*
    this.physicsWorld.removeRigidBody(bodyAData.body); // Use data reference
    this.physicsWorld.removeRigidBody(bodyBData.body); // Use data reference

    // 2. Remove from collider map
    this.colliderMap.delete(handleA);
    this.colliderMap.delete(handleB);

    // 3. Filter the local rigidBodies array *immediately* using handles
    this.rigidBodies = this.rigidBodies.filter(
      (rb) => rb.collider.handle !== handleA && rb.collider.handle !== handleB
    );

    // --- End Critical Section ---

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
    console.log('new game score?', this.score + (nextFruitType.points || 0));

    console.log(
      `Merged handles ${handleA}, ${handleB}. New rigidBodies count: ${this.rigidBodies.length}`
    );
  }

  addFruit(fruitIndex: number, x: number, y?: number): void {
    if (!this.physicsWorld) {
      console.error('Cannot add fruit: Physics world not initialized.');
      return;
    }
    const fruit = FRUITS[fruitIndex];
    if (!fruit) {
      console.error(`Invalid fruitIndex: ${fruitIndex}`);
      return;
    }

    y = y ?? fruit.radius;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y)
      .setLinearDamping(0.2)
      .setAngularDamping(0.4);
    const body = this.physicsWorld.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(fruit.radius)
      .setRestitution(0.3)
      .setFriction(0.5)
      // *** Enable collision events for this collider ***
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    const collider = this.physicsWorld.createCollider(colliderDesc, body);

    const data: RigidBodyData = {
      body,
      collider,
      fruitIndex
    };

    // Store reference in our array and map
    this.rigidBodies.push(data);
    this.colliderMap.set(collider.handle, data); // Map handle to data

    // Update the Svelte store for rendering
    const newFruits = [...this.fruits, { x, y, rotation: 0, fruitIndex }];
    this.setFruits(newFruits);

    // Update the current and next fruits
    this.setCurrentFruit(this.nextFruit);
    this.setNextFruit(this.getRandomFruitIndex());
  }

  checkGameOver(): void {
    if (this.gameOver) return;

    for (const rb of this.rigidBodies) {
      if (rb.body.isValid() && rb.body.translation().y < GAME_OVER_HEIGHT) {
        console.log('Game Over condition met!');
        this.setGameOver(true);
        break;
      }
    }
  }

  /** Resets the game state, physics world, and clears the map */
  resetGame(): void {
    if (this.physicsWorld) {
      this.rigidBodies.forEach((rb) => {
        if (rb.body.isValid()) {
          this.physicsWorld.removeRigidBody(rb.body);
        }
      });
    }

    // Clear internal state
    this.rigidBodies = [];
    this.colliderMap.clear(); // Clear the map
    this.lastTime = 0;
    this.mergeEffectIdCounter = 0;

    // Reset Svelte stores
    this.setFruits([]);
    this.setMergeEffects([]);
    this.setScore(0);
    this.setGameOver(false);
    this.setCurrentFruit(this.getRandomFruitIndex());
    this.setNextFruit(this.getRandomFruitIndex());

    // Event queue might persist or be recreated in initPhysics if needed
    // eventQueue = null; // Or recreate in initPhysics
  }

  getRandomFruitIndex(limit: number = 5) {
    return Math.floor(Math.random() * 3);
  }

  setScore(newScore: number) {
    this.score = newScore;
  }

  setGameOver(newGameOver: boolean) {
    this.gameOver = newGameOver;
  }

  setCurrentFruit(newCurrentFruit: number) {
    this.currentFruit = newCurrentFruit;
  }

  setNextFruit(newNextFruit: number) {
    this.nextFruit = newNextFruit;
  }

  setFruits(newFruits: FruitState[]) {
    this.fruits = newFruits;
  }

  setMergeEffects(newMergeEffects: MergeEffectData[]) {
    this.mergeEffects = newMergeEffects;
  }
}

export const gameState = new GameState();
