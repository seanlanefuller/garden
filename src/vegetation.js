import * as THREE from 'three';
import { LocationManager } from './locations.js';
import { TextureGenerator } from './textureGenerator.js';

export class Vegetation {
    constructor(scene, mapData) {
        this.scene = scene;
        this.mapData = mapData;
        this.locationManager = new LocationManager();
        this.textureGen = new TextureGenerator();
        this.treeCount = 4000;
    }

    init() {
        this.createTrees();
        this.createShrubs();
        this.createSpecificFlora();
    }

    createShrubs() {
        // Small bushes along paths/grass
        const geo = new THREE.DodecahedronGeometry(8);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 1.0,
            map: this.textureGen.createTexture('leaves')
        });
        const mesh = new THREE.InstancedMesh(geo, mat, 5000);

        const dummy = new THREE.Object3D();
        let idx = 0;

        for (let i = 0; i < 20000; i++) {
            if (idx >= 5000) break;
            const x = (Math.random() - 0.5) * 10000;
            const z = (Math.random() - 0.5) * 10000;
            const type = this.mapData.getTerrainType(x, z);

            if (type === 'GRASS') {
                if (Math.random() < 0.3) {
                    dummy.position.set(x, 5, z);
                    const s = 0.5 + Math.random() * 1.0;
                    dummy.scale.set(s, s * 0.8, s); // Slightly flattened
                    dummy.rotation.set(0, Math.random() * Math.PI, 0);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(idx++, dummy.matrix);
                }
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
        this.scene.add(mesh);
    }

    createTrees() {
        const barkTex = this.textureGen.createTexture('bark');
        const leavesTex = this.textureGen.createTexture('leaves');

        // 1. Conifer (Pine) - Thinner
        const coniferGeo = new THREE.ConeGeometry(15, 120, 8); // Radius 30 -> 15
        const coniferMat = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            map: leavesTex,
            roughness: 0.9
        });

        // 2. Oak (Foliage) - Smaller base
        const oakGeo = new THREE.DodecahedronGeometry(20); // Radius 40 -> 20
        const oakMat = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            map: leavesTex,
            roughness: 0.8
        });

        // 3. Flowering (Dogwood/Azalea)
        const flowerGeo = new THREE.DodecahedronGeometry(7.5); // Radius 15 -> 7.5
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.6 });

        // Trunk - Thinner
        const trunkGeo = new THREE.CylinderGeometry(4, 6, 60, 8); // Radius 8/12 -> 4/6
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            map: barkTex
        });

        const coniferMesh = new THREE.InstancedMesh(coniferGeo, coniferMat, this.treeCount);
        const oakMesh = new THREE.InstancedMesh(oakGeo, oakMat, this.treeCount);
        const flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, this.treeCount);
        const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, this.treeCount * 3);

        let trunkIdx = 0;
        let cIdx = 0, oIdx = 0, fIdx = 0;

        for (let i = 0; i < this.treeCount * 8; i++) {
            const x = (Math.random() - 0.5) * 10000;
            const z = (Math.random() - 0.5) * 10000;

            const type = this.mapData.getTerrainType(x, z);

            if (type === 'FOREST') {
                if (cIdx < this.treeCount) {
                    const scale = 0.5 + Math.random() * 1.5;
                    this.placeTree(coniferMesh, cIdx++, trunkMesh, trunkIdx++, x, z, scale, 60);
                }
            } else if (type === 'GRASS') {
                const rand = Math.random();
                if (rand < 0.10) {
                    if (oIdx < this.treeCount) {
                        // Massive Oak 
                        const baseScale = 1.0 + Math.random() * 0.5;
                        // Foliage: 2x Width, 4x Height relative to base
                        const folScale = new THREE.Vector3(baseScale * 2, baseScale * 4, baseScale * 2);

                        this.placeTree(oakMesh, oIdx++, trunkMesh, trunkIdx++, x, z, baseScale, 50, 2.5, folScale);
                    }
                } else if (rand < 0.20) {
                    // Small Oak
                    if (oIdx < this.treeCount) {
                        const s = 0.8 + Math.random() * 0.4;
                        this.placeTree(oakMesh, oIdx++, trunkMesh, trunkIdx++, x, z, s, 40);
                    }
                } else if (rand < 0.25) {
                    if (fIdx < this.treeCount) {
                        const scale = 0.5 + Math.random() * 1.0;
                        this.placeTree(flowerMesh, fIdx++, trunkMesh, trunkIdx++, x, z, scale, 30);
                    }
                }
            }
        }

        this.scene.add(coniferMesh);
        this.scene.add(oakMesh);
        this.scene.add(flowerMesh);
        this.scene.add(trunkMesh);
    }

    placeTree(mesh, index, trunkMesh, trunkIndex, x, z, scale, foliageHeight, trunkScaleMult = 1.0, foliageScaleVec = null) {
        const dummy = new THREE.Object3D();

        // Trunk
        const trunkY = (30 * scale * trunkScaleMult);
        dummy.position.set(x, trunkY, z);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(scale * trunkScaleMult, scale * trunkScaleMult, scale * trunkScaleMult);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(trunkIndex, dummy.matrix);

        // Foliage
        const foliageY = (60 * scale * trunkScaleMult) - (10 * scale);
        dummy.position.set(x, foliageY + (foliageHeight * scale * 0.5), z);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);

        if (foliageScaleVec) {
            dummy.scale.copy(foliageScaleVec);
        } else {
            dummy.scale.set(scale, scale, scale);
        }

        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);

        mesh.instanceMatrix.needsUpdate = true;
        trunkMesh.instanceMatrix.needsUpdate = true;
    }

    createSpecificFlora() {
        this.spawnInZone(12, 100, 0x87CEEB, 10); // Hydrangeas
        this.spawnInZone(13, 100, 0xFFA500, 5); // Daylilies
        this.spawnInZone(17, 200, 0x228B22, 5, 'fern'); // Ferns
    }

    spawnInZone(zoneId, count, color, size, type = 'flower') {
        const loc = this.locationManager.getLocation(zoneId);
        if (!loc) return;

        const center = this.locationManager.getWorldPosition(loc.mapX, loc.mapY);
        const radius = 300;

        const geometry = (type === 'fern')
            ? new THREE.ConeGeometry(5, 10, 4)
            : new THREE.DodecahedronGeometry(size);

        const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
        const mesh = new THREE.InstancedMesh(geometry, material, count);

        const dummy = new THREE.Object3D();
        let idx = 0;

        for (let i = 0; i < count; i++) {
            const r = Math.sqrt(Math.random()) * radius;
            const theta = Math.random() * 2 * Math.PI;
            const x = center.x + r * Math.cos(theta);
            const z = center.z + r * Math.sin(theta);

            dummy.position.set(x, size / 2, z);
            dummy.rotation.set(0, Math.random() * Math.PI, 0);
            dummy.scale.setScalar(0.8 + Math.random() * 0.4);
            dummy.updateMatrix();
            mesh.setMatrixAt(idx++, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
        this.scene.add(mesh);
    }
}
