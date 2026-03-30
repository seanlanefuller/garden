import * as THREE from 'three';
import { LocationManager } from './locations.js';

export class Structures {
    constructor(scene) {
        this.scene = scene;
        this.locationManager = new LocationManager();
    }

    init() {
        this.createBuildingsFromMap();
        this.createLandmarks();
        this.createSigns();
        this.createBenches();
    }

    createBenches() {
        // Place benches near building locations
        this.locationManager.locations.forEach(loc => {
            const pos = this.locationManager.getWorldPosition(loc.mapX, loc.mapY);
            // Place 2 benches near each location
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 80 + Math.random() * 40;
                const bx = pos.x + Math.cos(angle) * dist;
                const bz = pos.z + Math.sin(angle) * dist;

                this.createBenchModel(bx, bz, angle + Math.PI); // Face inward
            }
        });
    }

    createBenchModel(x, z, rot) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        group.rotation.y = rot;

        // Seat
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(20, 2, 8),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        seat.position.y = 8;
        group.add(seat);

        // Back
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(20, 10, 2),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        back.position.set(0, 14, -4);
        group.add(back);

        // Legs
        const legGeo = new THREE.BoxGeometry(2, 8, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const l1 = new THREE.Mesh(legGeo, legMat); l1.position.set(-9, 4, 0);
        const l2 = new THREE.Mesh(legGeo, legMat); l2.position.set(9, 4, 0);
        group.add(l1);
        group.add(l2);

        this.scene.add(group);
    }

    createSigns() {
        this.locationManager.locations.forEach(loc => {
            const pos = this.locationManager.getWorldPosition(loc.mapX, loc.mapY);
            // Offset sign slightly so it's not Inside the building
            const signPos = pos.clone().add(new THREE.Vector3(0, 0, 50));
            this.createSignModel(signPos, loc.name);
        });
    }

    createSignModel(pos, text) {
        const group = new THREE.Group();
        group.position.copy(pos);

        // Post
        const postGeo = new THREE.CylinderGeometry(2, 2, 30, 8);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x5C4033 }); // Dark Wood
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = 15;
        group.add(post);

        // Board
        const boardW = 40;
        const boardH = 20;
        const boardGeo = new THREE.BoxGeometry(boardW, boardH, 2);
        const texture = this.createTextTexture(text);
        const boardMat = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xFFFFFF
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(0, 30, 2.5); // Offset Z to attach to front of post
        group.add(board);

        this.scene.add(group);
    }

    createTextTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 256, 128);

        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, 256, 128);

        // Text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Simple wrap or just split by space if too long?
        const words = text.split(' ');
        if (words.length > 3) {
            const mid = Math.floor(words.length / 2);
            const line1 = words.slice(0, mid).join(' ');
            const line2 = words.slice(mid).join(' ');
            ctx.fillText(line1, 128, 44);
            ctx.fillText(line2, 128, 84);
        } else {
            ctx.fillText(text, 128, 64);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    createBuildingsFromMap() {
        this.locationManager.locations.forEach(loc => {
            if (loc.type === 'Building') {
                const pos = this.locationManager.getWorldPosition(loc.mapX, loc.mapY);
                this.createSpecificBuilding(loc.id, pos, loc.name);
            }
        });
    }

    createSpecificBuilding(id, pos, name) {
        if (id === 1) { this.createGuestCenterModel(pos); return; }
        if (id === 5) { this.createMurrayHallModel(pos); return; }
        if (id === 25) { this.createAmphitheatre(pos); return; }
        if (id === 28) { this.createPavilion(pos); return; }
        this.createGenericBuilding(pos, 0x8B4513, 100, 200, name);
    }

    createGuestCenterModel(pos) {
        const group = new THREE.Group();
        group.position.copy(pos);

        // Main Body (Larger but shorter N-S)
        const bodyGeo = new THREE.BoxGeometry(500, 120, 150); // Depth reduced to 150
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xF5F5DC }); // Beige/Cream
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 60;
        group.add(body);

        // Columns (Front Portico)
        const colGeo = new THREE.CylinderGeometry(8, 8, 120, 16);
        const colMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

        for (let i = 0; i < 6; i++) {
            const col = new THREE.Mesh(colGeo, colMat);
            col.position.set(-150 + i * 60, 60, 80); // Adjusted Z to match thinner body
            group.add(col);
        }

        // Portico Roof (Triangle)
        const roofGeo = new THREE.ConeGeometry(350, 80, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 }); // Red
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 160, 0);
        roof.rotation.y = Math.PI / 4;
        group.add(roof);

        this.scene.add(group);
    }

    createMurrayHallModel(pos) {
        const group = new THREE.Group();
        group.position.copy(pos);

        // Modern glass/brick mix
        const main = new THREE.Mesh(
            new THREE.BoxGeometry(250, 60, 120),
            new THREE.MeshStandardMaterial({ color: 0xCCCCCC })
        );
        main.position.y = 30;
        group.add(main);

        // Glass Windows (Blueish)
        const glass = new THREE.Mesh(
            new THREE.BoxGeometry(230, 40, 125),
            new THREE.MeshStandardMaterial({ color: 0x87CEEB, metalness: 0.9, roughness: 0.1 })
        );
        glass.position.y = 30;
        group.add(glass);

        this.scene.add(group);
    }

    createAmphitheatre(pos) {
        const group = new THREE.Group();
        group.position.copy(pos);

        const stage = new THREE.Mesh(
            new THREE.CylinderGeometry(100, 100, 5, 32, 1, false, 0, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        stage.position.y = 2.5;
        group.add(stage);

        this.scene.add(group);
    }

    createPavilion(pos) {
        // Open structure, roof on pillars
        const group = new THREE.Group();
        group.position.copy(pos);

        // Roof
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(80, 30, 6),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        roof.position.y = 60;
        group.add(roof);

        // Pillars
        const legGeo = new THREE.CylinderGeometry(3, 3, 60);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        for (let i = 0; i < 6; i++) {
            const leg = new THREE.Mesh(legGeo, legMat);
            const angle = (i / 6) * Math.PI * 2;
            leg.position.set(Math.cos(angle) * 50, 30, Math.sin(angle) * 50);
            group.add(leg);
        }

        this.scene.add(group);
    }

    createGenericBuilding(pos, color, size, width, name) {
        const geometry = new THREE.BoxGeometry(width, size, width / 2);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const building = new THREE.Mesh(geometry, material);
        building.position.copy(pos);
        building.position.y = size / 2;

        // Ideally add label?
        this.scene.add(building);
    }

    createLandmarks() {
        this.createBridge();
        this.createRocket();
        this.createButterflyDome();
    }

    createButterflyDome() {
        // Butterfly House
        const geometry = new THREE.IcosahedronGeometry(70, 1);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0,
            metalness: 0.1,
            clearcoat: 1.0
        });
        const dome = new THREE.Mesh(geometry, material);
        // Location? West-ish. Using auto-detected location would be better if mapped, 
        // but for now hardcode or use ID if available? 
        // Map ID 3 is Cherry Circle? No butterfly house listed as Building?
        // Ah, ID 24 is Pollinator Walk. Tweetsville #22.
        // Let's place it near Tweetsville zone.
        const loc = this.locationManager.getLocation(22);
        if (loc) {
            const pos = this.locationManager.getWorldPosition(loc.mapX - 5, loc.mapY); // Slightly west
            dome.position.copy(pos);
            dome.position.y = 35;
        } else {
            dome.position.set(-2500, 35, 0);
        }

        this.scene.add(dome);
    }

    createBridge() {
        // Bridge over Aquatic Garden (Zone 9)
        const loc = this.locationManager.getLocation(9);
        if (!loc) return;

        const pos = this.locationManager.getWorldPosition(loc.mapX, loc.mapY);

        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(pos.x - 100, 0, pos.z - 100),
            new THREE.Vector3(pos.x, 80, pos.z),
            new THREE.Vector3(pos.x + 100, 0, pos.z + 100)
        );

        const geometry = new THREE.TubeGeometry(curve, 20, 20, 8, false);
        const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const bridge = new THREE.Mesh(geometry, material);
        this.scene.add(bridge);
    }

    createRocket() {
        // Huntsville is "Rocket City".
        const x = 5000; // Far East
        const z = -6000; // Far North

        const bodyGeo = new THREE.CylinderGeometry(50, 50, 800, 32);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(x, 400, z);
        this.scene.add(body);

        // Black stripes
        const stripeGeo = new THREE.CylinderGeometry(51, 51, 100, 32);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
        stripe1.position.set(x, 200, z);
        this.scene.add(stripe1);
    }
}
