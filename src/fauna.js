import * as THREE from 'three';

export class Fauna {
    constructor(scene) {
        this.scene = scene;
        this.butterflies = [];
        this.birds = [];
    }

    init() {
        this.createButterflies(20);
        this.createBirds(10);
    }

    createButterflies(count) {
        // Simple 2-triangle butterfly
        const geometry = new THREE.BufferGeometry();
        // A simple "V" shape
        const vertices = new Float32Array([
            0, 0, 0, 2, 2, 0, 2, 0, 0, // Right wing
            0, 0, 0, -2, 2, 0, -2, 0, 0  // Left wing
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide }); // Gold

        for (let i = 0; i < count; i++) {
            const butterfly = new THREE.Mesh(geometry, material);
            // Butterfly House Area (West side)
            // Center around -2500, 0
            const x = -2500 + (Math.random() - 0.5) * 1000;
            const z = (Math.random() - 0.5) * 2000; // Wider z range

            butterfly.position.set(
                x,
                5 + Math.random() * 5,
                z
            );

            // Custom properties for animation
            butterfly.userData = {
                speed: 5 + Math.random() * 5,
                direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
                wingSpeed: 10 + Math.random() * 10
            };

            this.scene.add(butterfly);
            this.butterflies.push(butterfly);
        }
    }

    createBirds(count) {
        // Simple "V" shape bird high up
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0, 5, 0, 2, 0, 0.5, 0,
            0, 0, 0, -5, 0, 2, 0, 0.5, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });

        for (let i = 0; i < count; i++) {
            const bird = new THREE.Mesh(geometry, material);
            bird.position.set(
                (Math.random() - 0.5) * 8000,
                100 + Math.random() * 200,
                (Math.random() - 0.5) * 8000
            );

            bird.userData = {
                speed: 30 + Math.random() * 20,
                direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
            };

            // Orient to direction
            bird.lookAt(bird.position.clone().add(bird.userData.direction));

            this.scene.add(bird);
            this.birds.push(bird);
        }
    }

    update(time, delta) {
        // Animate Butterflies
        this.butterflies.forEach(b => {
            // Move
            b.position.addScaledVector(b.userData.direction, b.userData.speed * delta);

            // Flap wings (Scaling X)
            b.scale.x = Math.sin(time * b.userData.wingSpeed);

            // Change direction occasionally
            if (Math.random() < 0.01) {
                b.userData.direction.set(Math.random() - 0.5, (Math.random() - 0.5) * 0.2, Math.random() - 0.5).normalize();
                b.lookAt(b.position.clone().add(b.userData.direction));
            }

            // Wrap around world
            if (b.position.x > 5000) b.position.x = -5000;
            if (b.position.x < -5000) b.position.x = 5000;
            if (b.position.z > 5000) b.position.z = -5000;
            if (b.position.z < -5000) b.position.z = 5000;
        });

        // Animate Birds
        this.birds.forEach(b => {
            b.position.addScaledVector(b.userData.direction, b.userData.speed * delta);

            // Wrap
            if (b.position.x > 5000) b.position.x = -5000;
            if (b.position.x < -5000) b.position.x = 5000;
            if (b.position.z > 5000) b.position.z = -5000;
            if (b.position.z < -5000) b.position.z = 5000;
        });
    }
}
