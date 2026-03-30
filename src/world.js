import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.colliders = []; // Array to hold objects checking for collision
    }

    init() {
        this.createBoundaries();
        this.createWaterBodies();
        this.createPathways();
    }

    createBoundaries() {
        // Simple fence around the 10000x10000 world
        // North
        this.createWall(0, -5000, 10000, 50, 0x8B4513);
        // South
        this.createWall(0, 5000, 10000, 50, 0x8B4513);
        // East
        this.createWall(5000, 0, 50, 10000, 0x8B4513);
        // West
        this.createWall(-5000, 0, 50, 10000, 0x8B4513);
    }

    createWall(x, z, width, depth, color) {
        const geometry = new THREE.BoxGeometry(width, 20, depth);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, 10, z); // Half height
        this.scene.add(wall);
        this.colliders.push(wall);
    }

    createWaterBodies() {
        // Water is now handled by the map overlay texture and MapData collision check.
        // No need for separate meshes unless we want shaders. 
        // For now, the visual map is enough.
    }

    createPathways() {
        // Paths are now handled by the map overlay and MapData.
    }

    createServiceRoad() {
        // Handled by map.
    }

    createMainTrails() {
        // Handled by map.
    }

    createPath(points, width, color, closed = false) {
        // Deprecated
    }
}
