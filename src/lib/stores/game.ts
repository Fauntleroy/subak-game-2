import { writable } from "svelte/store";
import RAPIER from "@dimforge/rapier2d-compat";
import {
  FRUITS,
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_THICKNESS,
  GAME_OVER_HEIGHT,
} from "../constants";

export const score = writable(0);
export const gameOver = writable(false);
export const currentFruit = writable(0);
export const nextFruit = writable(0);
export const world = writable(null);
export const fruits = writable([]);
export const mergeEffects = writable([]);

let physicsWorld;
let rigidBodies = [];
let lastTime = 0;
const PHYSICS_STEP = 1 / 60;

export const initPhysics = async () => {
  console.log("init physics call");
  await RAPIER.init();

  const gravity = new RAPIER.Vector2(0.0, 196.2);
  physicsWorld = new RAPIER.World(gravity);

  // Create walls
  createWall(0, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT); // Left
  createWall(GAME_WIDTH, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT); // Right
  createWall(GAME_WIDTH / 2, GAME_HEIGHT, GAME_WIDTH, WALL_THICKNESS); // Bottom

  world.set(physicsWorld);
};

const createWall = (x, y, width, height) => {
  const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
  const body = physicsWorld.createRigidBody(bodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
  physicsWorld.createCollider(colliderDesc, body);
};

export const addFruit = (x, y, fruitIndex) => {
  const fruit = FRUITS[fruitIndex];
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y)
    .setLinearDamping(0.2)
    .setAngularDamping(0.4);
  const body = physicsWorld.createRigidBody(bodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.ball(fruit.radius)
    .setRestitution(0.3)
    .setFriction(0.5);
  const collider = physicsWorld.createCollider(colliderDesc, body);

  rigidBodies.push({
    body,
    collider,
    fruitIndex,
  });

  fruits.update((f) => [...f, { x, y, rotation: 0, fruitIndex }]);
};

const easeOutQuad = (t) => t * (2 - t);

export const step = () => {
  const currentTime = performance.now() / 1000;
  const deltaTime = lastTime ? currentTime - lastTime : PHYSICS_STEP;
  lastTime = currentTime;

  physicsWorld.step();

  // Update fruit positions and check collisions
  fruits.update((f) => {
    return rigidBodies.map((rb, i) => ({
      x: rb.body.translation().x,
      y: rb.body.translation().y,
      rotation: rb.body.rotation(),
      fruitIndex: rb.fruitIndex,
    }));
  });

  // Update merge effects
  mergeEffects.update((effects) => {
    return effects
      .map((effect) => {
        const progress = (currentTime - effect.startTime) / effect.duration;
        if (progress >= 1) return null;

        const eased = easeOutQuad(progress);
        return {
          ...effect,
          scale: 1 + 4 * eased, // Scale from 1 to 5
          opacity: 0.5 * (1 - eased), // Opacity from 0.5 to 0
        };
      })
      .filter(Boolean); // Remove completed effects
  });

  // Check for merges
  checkMerges();

  // Check for game over
  checkGameOver();
};

const checkMerges = () => {
  let merged = new Set();

  for (let i = 0; i < rigidBodies.length; i++) {
    if (merged.has(i)) continue;

    for (let j = i + 1; j < rigidBodies.length; j++) {
      if (merged.has(j)) continue;

      const bodyA = rigidBodies[i];
      const bodyB = rigidBodies[j];

      if (
        bodyA.fruitIndex === bodyB.fruitIndex &&
        bodyA.fruitIndex < FRUITS.length - 1
      ) {
        const posA = bodyA.body.translation();
        const posB = bodyB.body.translation();
        const radSum = FRUITS[bodyA.fruitIndex].radius * 2;
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < radSum) {
          console.log(`Merging fruits of type ${bodyA.fruitIndex}`);
          mergeFruits(i, j);
          merged.add(i);
          merged.add(j);
          break;
        }
      }
    }
  }
};

const mergeFruits = (indexA, indexB) => {
  const bodyA = rigidBodies[indexA];
  const bodyB = rigidBodies[indexB];

  const posA = bodyA.body.translation();
  const posB = bodyB.body.translation();
  const midpoint = {
    x: (posA.x + posB.x) / 2,
    y: (posA.y + posB.y) / 2,
  };

  const nextIndex = bodyA.fruitIndex + 1;
  const newFruitRadius = FRUITS[nextIndex].radius;

  // Add merge effect
  mergeEffects.update((effects) => [
    ...effects,
    {
      x: midpoint.x,
      y: midpoint.y,
      radius: newFruitRadius,
      startTime: performance.now() / 1000,
      duration: 0.5,
      scale: 1,
      opacity: 0.5,
    },
  ]);

  physicsWorld.removeRigidBody(bodyA.body);
  physicsWorld.removeRigidBody(bodyB.body);

  rigidBodies = rigidBodies.filter((_, i) => i !== indexA && i !== indexB);

  addFruit(midpoint.x, midpoint.y, nextIndex);

  score.update((s) => s + FRUITS[nextIndex].points);
};

const checkGameOver = () => {
  for (const rb of rigidBodies) {
    if (rb.body.translation().y < GAME_OVER_HEIGHT) {
      gameOver.set(true);
      break;
    }
  }
};

export const resetGame = () => {
  rigidBodies.forEach((rb) => {
    if (rb.body.isValid()) {
      physicsWorld.removeRigidBody(rb.body);
    }
  });
  rigidBodies = [];
  lastTime = 0;

  fruits.set([]);
  mergeEffects.set([]);
  score.set(0);
  gameOver.set(false);
  currentFruit.set(Math.floor(Math.random() * 3));
  nextFruit.set(Math.floor(Math.random() * 3));
};
