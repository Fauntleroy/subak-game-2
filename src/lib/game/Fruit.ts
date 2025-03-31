import RAPIER, {
  ActiveEvents,
  RigidBody,
  Collider,
  World,
  type Vector,
  type Rotation
} from '@dimforge/rapier2d-compat'; // Or @dimforge/rapier3d

import { FRUITS, GAME_OVER_HEIGHT } from '../constants';

export class Fruit {
  public readonly name: string;
  public readonly radius: number;
  public readonly points: number;
  public readonly fruitIndex: number; // Index in FRUIT_CATALOG
  public readonly body: RigidBody; // Reference to the physics body
  public readonly collider: Collider;
  public readonly physicsWorld: World; // Reference to the physics body
  public startOutOfBounds: DOMHighResTimeStamp | null = null;
  public outOfBounds: boolean = false;

  constructor(fruitIndex: number, x: number, y?: number, physicsWorld: World) {
    const fruitData = FRUITS[fruitIndex];

    if (!fruitData) {
      throw new Error(`Invalid fruitIndex: ${fruitIndex}`);
    }

    this.fruitIndex = fruitIndex;
    this.name = fruitData.name;
    this.radius = fruitData.radius;
    this.points = fruitData.points;
    this.physicsWorld = physicsWorld;

    y = y ?? this.radius;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y)
      .setLinearDamping(0.2)
      .setAngularDamping(0.4);
    this.body = this.physicsWorld.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(this.radius)
      .setRestitution(0.3)
      .setFriction(0.5)
      // *** Enable collision events for this collider ***
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    this.collider = this.physicsWorld.createCollider(colliderDesc, this.body);

    // --- CRUCIAL STEP ---
    // Store a reference to this Fruit instance in the RigidBody's userData.
    // This allows us to easily get the Fruit object from a RigidBody/Collider handle.
    // Ensure userData is initialized if not done during body creation.
    if (!this.body.userData) {
      this.body.userData = {};
    }
    // Use a specific key like 'fruitInstance' to avoid potential conflicts
    // if userData is used for other things.
    this.body.userData.fruitInstance = this;

    // Optional: You might prefer attaching to the collider if you primarily
    // work with colliders in collision events. Assumes one collider per body.
    // const collider = body.collider(0); // Get the first collider
    // if (collider) {
    //   if (!collider.userData) collider.userData = {};
    //   collider.userData.fruitInstance = this;
    // } else {
    //   console.warn("Could not find collider to attach Fruit instance to userData");
    // }
  }

  isOutOfBounds(): boolean {
    // are we out of bounds NOW?
    if (
      this.startOutOfBounds &&
      performance.now() - this.startOutOfBounds > 500
    ) {
      return true;
    }

    // otherwise, set the out of bounds flags
    if (this.body.isValid() && this.body.translation().y < GAME_OVER_HEIGHT) {
      this.startOutOfBounds = performance.now();
    } else {
      this.startOutOfBounds = null;
    }

    return false;
  }

  // Helper to get current position from the physics body
  getPosition(): Vector {
    // Use RAPIER.Vector2 or RAPIER.Vector3 based on your import
    return this.body.translation();
  }

  // Helper to get current rotation from the physics body
  getRotation(): number | Rotation {
    // Return type depends on 2D (number) or 3D (RAPIER.Rotation)
    return this.body.rotation();
  }

  // Method to handle cleanup when the fruit is removed
  destroy(): void {
    console.log(`Destroying physics body for ${this.name}`);
    // Remove the associated rigid body from the physics world
    this.physicsWorld.removeRigidBody(this.body);

    // The Fruit instance itself will be removed from the fruitsInPlay array separately.
    // We don't nullify this.body here as the instance might be briefly
    // held elsewhere before garbage collection.
  }
}
