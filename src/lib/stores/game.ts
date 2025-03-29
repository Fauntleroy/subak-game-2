import { writable, type Writable } from "svelte/store";
import RAPIER, {
  World,
  RigidBody,
  Collider,
  EventQueue, // Import EventQueue
  ActiveEvents, // Import ActiveEvents
} from "@dimforge/rapier2d-compat";
import {
  FRUITS, // Assuming FRUITS is typed like: { radius: number; points: number }[]
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_THICKNESS,
  GAME_OVER_HEIGHT,
} from "../constants"; // Ensure constants are correctly typed in their file

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

// --- Typed Svelte Stores remain the same ---
export const score: Writable<number> = writable(0);
export const gameOver: Writable<boolean> = writable(false);
export const currentFruit: Writable<number> = writable(0);
export const nextFruit: Writable<number> = writable(0);
export const world: Writable<World | null> = writable(null);
export const fruits: Writable<FruitState[]> = writable([]);
export const mergeEffects: Writable<MergeEffectData[]> = writable([]);

// --- Typed Module Variables ---
let physicsWorld: World | null = null;
let rigidBodies: RigidBodyData[] = [];
let lastTime: number = 0;
const PHYSICS_STEP: number = 1 / 60;
let mergeEffectIdCounter: number = 0;
let eventQueue: EventQueue | null = null; // Add EventQueue variable
// Map collider handles to our RigidBodyData for quick lookup
let colliderMap: Map<number, RigidBodyData> = new Map();

// --- Typed Functions ---

/** Initializes the Rapier physics world, walls, and event queue */
export const initPhysics = async (): Promise<void> => {
  console.log("init physics call");
  try {
    await RAPIER.init();
    console.log("Rapier initialized");

    const gravity = new RAPIER.Vector2(0.0, 196.2);
    physicsWorld = new RAPIER.World(gravity);
    eventQueue = new RAPIER.EventQueue(true); // Create event queue (true enables contact events)
    colliderMap.clear(); // Ensure map is clear on init

    // Create walls (walls don't need collision events for merging)
    createWall(0, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT);
    createWall(GAME_WIDTH, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT);
    createWall(GAME_WIDTH / 2, GAME_HEIGHT, GAME_WIDTH, WALL_THICKNESS);

    world.set(physicsWorld);
    console.log("Physics world and event queue created and set.");
  } catch (error) {
    console.error("Failed to initialize Rapier or create world:", error);
    gameOver.set(true);
  }
};

/** Creates a static wall (no changes needed here) */
const createWall = (
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  if (!physicsWorld) {
    console.error("Cannot create wall: Physics world not initialized.");
    return;
  }
  const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
  const body = physicsWorld.createRigidBody(bodyDesc);
  // Walls don't need ActiveEvents.COLLISION_EVENTS unless you want to detect collisions with them
  const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
  physicsWorld.createCollider(colliderDesc, body);
};

/** Adds a new fruit, enabling collision events and mapping its collider */
export const addFruit = (x: number, y: number, fruitIndex: number): void => {
  if (!physicsWorld) {
    console.error("Cannot add fruit: Physics world not initialized.");
    return;
  }
  const fruit = FRUITS[fruitIndex];
  if (!fruit) {
    console.error(`Invalid fruitIndex: ${fruitIndex}`);
    return;
  }

  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y)
    .setLinearDamping(0.2)
    .setAngularDamping(0.4);
  const body = physicsWorld.createRigidBody(bodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.ball(fruit.radius)
    .setRestitution(0.3)
    .setFriction(0.5)
    // *** Enable collision events for this collider ***
    .setActiveEvents(ActiveEvents.COLLISION_EVENTS);
  const collider = physicsWorld.createCollider(colliderDesc, body);

  const data: RigidBodyData = {
    body,
    collider,
    fruitIndex,
  };

  // Store reference in our array and map
  rigidBodies.push(data);
  colliderMap.set(collider.handle, data); // Map handle to data

  // Update the Svelte store for rendering
  fruits.update((currentFruits) => [
    ...currentFruits,
    { x, y, rotation: 0, fruitIndex },
  ]);
};

/** Simple easing function (no changes) */
const easeOutQuad = (t: number): number => t * (2 - t);

/** Steps the physics simulation, processes collision events, and updates state */
export const step = (): void => {
  if (!physicsWorld || !eventQueue) {
    // Don't step if world or event queue doesn't exist
    return;
  }

  const currentTime = performance.now() / 1000;
  lastTime = currentTime;

  // --- Step 1: Step Physics and Drain Events ---
  physicsWorld.step(eventQueue); // Step world AND populate event queue

  const mergePairs: { handleA: number; handleB: number }[] = [];
  const mergedHandlesThisStep = new Set<number>(); // Track handles involved in a merge *this step*

  eventQueue.drainCollisionEvents((handle1, handle2, started) => {
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
    const dataA = colliderMap.get(handle1);
    const dataB = colliderMap.get(handle2);

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
      mergeFruits(handleA, handleB);
    });
    console.log(
      `Finished processing merges. Current rigidBodies count: ${rigidBodies.length}`
    );
  }

  // --- Step 3: Update Rendering State and Effects (mostly unchanged) ---
  const updatedFruitStates: FruitState[] = rigidBodies
    .map((rb) => {
      if (!rb.body.isValid()) return null;
      return {
        x: rb.body.translation().x,
        y: rb.body.translation().y,
        rotation: rb.body.rotation(),
        fruitIndex: rb.fruitIndex,
      };
    })
    .filter((state): state is FruitState => state !== null);
  fruits.set(updatedFruitStates);

  mergeEffects.update((effects: MergeEffectData[]) => {
    return effects
      .map((effect: MergeEffectData) => {
        const progress = (currentTime - effect.startTime) / effect.duration;
        if (progress >= 1) return null;
        const eased = easeOutQuad(Math.min(progress, 1));
        return {
          ...effect,
          scale: 1 + 4 * eased,
          opacity: 0.5 * (1 - eased),
        };
      })
      .filter((effect): effect is MergeEffectData => effect !== null);
  });

  // --- Step 4: Check Game Over (unchanged) ---
  checkGameOver();
};

// --- REMOVED checkMerges() function ---
// The logic is now handled by processing collision events in step()

/** Handles the merging of two specific fruits identified by their collider handles */
const mergeFruits = (handleA: number, handleB: number): void => {
  if (!physicsWorld) {
    console.error("Cannot merge fruits: Physics world not initialized.");
    return;
  }

  // Get data from map using handles
  const bodyAData = colliderMap.get(handleA);
  const bodyBData = colliderMap.get(handleB);

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
    y: (posA.y + posB.y) / 2,
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
  physicsWorld.removeRigidBody(bodyAData.body); // Use data reference
  physicsWorld.removeRigidBody(bodyBData.body); // Use data reference

  // 2. Remove from collider map
  colliderMap.delete(handleA);
  colliderMap.delete(handleB);

  // 3. Filter the local rigidBodies array *immediately* using handles
  rigidBodies = rigidBodies.filter(
    (rb) => rb.collider.handle !== handleA && rb.collider.handle !== handleB
  );

  // --- End Critical Section ---

  // Add merge visual effect
  mergeEffects.update((effects) => [
    ...effects,
    {
      id: mergeEffectIdCounter++,
      x: midpoint.x,
      y: midpoint.y,
      radius: newFruitRadius,
      startTime: performance.now() / 1000,
      duration: 0.5,
      scale: 1,
      opacity: 0.5,
    },
  ]);

  // 4. Add the new, larger fruit (addFruit will update map and array)
  addFruit(midpoint.x, midpoint.y, nextIndex);

  // Update the score
  score.update((s) => s + (nextFruitType.points || 0));

  console.log(
    `Merged handles ${handleA}, ${handleB}. New rigidBodies count: ${rigidBodies.length}`
  );
};

/** Checks if any fruit is above the game over line (no changes) */
const checkGameOver = (): void => {
  let isGameOver = false;
  gameOver.subscribe((value) => (isGameOver = value))();
  if (isGameOver) return;

  for (const rb of rigidBodies) {
    if (rb.body.isValid() && rb.body.translation().y < GAME_OVER_HEIGHT) {
      console.log("Game Over condition met!");
      gameOver.set(true);
      break;
    }
  }
};

/** Resets the game state, physics world, and clears the map */
export const resetGame = (): void => {
  if (physicsWorld) {
    rigidBodies.forEach((rb) => {
      if (rb.body.isValid()) {
        physicsWorld.removeRigidBody(rb.body);
      }
    });
  }

  // Clear internal state
  rigidBodies = [];
  colliderMap.clear(); // Clear the map
  lastTime = 0;
  mergeEffectIdCounter = 0;

  // Reset Svelte stores
  fruits.set([]);
  mergeEffects.set([]);
  score.set(0);
  gameOver.set(false);
  currentFruit.set(Math.floor(Math.random() * 3));
  nextFruit.set(Math.floor(Math.random() * 3));

  // Event queue might persist or be recreated in initPhysics if needed
  // eventQueue = null; // Or recreate in initPhysics
};
