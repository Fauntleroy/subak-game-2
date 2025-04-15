import { ActiveEvents, ColliderDesc, RigidBodyDesc } from '@dimforge/rapier2d-compat';
var Boundary = /** @class */ (function () {
    function Boundary(x, y, width, height, physicsWorld) {
        var bodyDesc = RigidBodyDesc.fixed().setTranslation(x, y);
        this.body = physicsWorld.createRigidBody(bodyDesc);
        var colliderDesc = ColliderDesc.cuboid(width / 2, height / 2);
        colliderDesc.setActiveEvents(ActiveEvents.COLLISION_EVENTS);
        this.collider = physicsWorld.createCollider(colliderDesc, this.body);
    }
    return Boundary;
}());
export { Boundary };
