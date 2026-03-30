import * as THREE from 'three';

export class MapData {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.data = null;
    }

    load(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.width = img.width;
                this.height = img.height;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.context.drawImage(img, 0, 0);
                this.data = this.context.getImageData(0, 0, this.width, this.height).data;
                console.log(`MapData loaded: ${this.width}x${this.height}`);
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    // Get pixel data at normalized coordinates (0 to 1)
    getPixel(u, v) {
        if (!this.data) return null;

        const x = Math.floor(u * this.width);
        const y = Math.floor(v * this.height);

        // Clamping
        const safeX = Math.max(0, Math.min(this.width - 1, x));
        const safeY = Math.max(0, Math.min(this.height - 1, y));

        const index = (safeY * this.width + safeX) * 4;

        return {
            r: this.data[index],
            g: this.data[index + 1],
            b: this.data[index + 2],
            a: this.data[index + 3]
        };
    }

    // Convert World Coordinates (e.g. -5000 to 5000) to Normalized (0 to 1)
    // Assumes world is 10000x10000 centered at 0
    worldToNormalized(x, z) {
        const u = (x + 5000) / 10000;
        const v = (z + 5000) / 10000;
        return { u, v };
    }

    // Analyze terrain type at world position
    getTerrainType(x, z) {
        const { u, v } = this.worldToNormalized(x, z);
        const pixel = this.getPixel(u, v);

        if (!pixel) return 'UNKNOWN';

        // Check Water (Blue-ish)
        // Map Blue: r < 100, g < 200, b > 150? Adjust thresholds based on inspection
        if (pixel.b > pixel.r + 50 && pixel.b > pixel.g) {
            return 'WATER';
        }

        // Check Forest (Dark Green)
        // R low, G high, B low. Dark.
        if (pixel.g > pixel.r + 20 && pixel.g > pixel.b + 20 && pixel.g < 150) {
            return 'FOREST';
        }

        // Check Paths (White Lines)
        // Strictly White/Light Grey: High brightness, Low saturation
        // Avoids light green grass or other colors
        if (pixel.r > 180 && pixel.g > 180 && pixel.b > 180) {
            const max = Math.max(pixel.r, pixel.g, pixel.b);
            const min = Math.min(pixel.r, pixel.g, pixel.b);
            if (max - min < 30) {
                return 'PATH';
            }
        }

        // Check Service Road (Dark Grey)
        if (pixel.r < 100 && pixel.g < 100 && pixel.b < 100) {
            if (Math.abs(pixel.r - pixel.g) < 15 && Math.abs(pixel.r - pixel.b) < 15) {
                return 'ROAD';
            }
        }

        return 'GRASS'; // Default
    }

    debugVisualize(scene) {
        const samples = 400; // 400x400 grid = 160,000 instances
        const step = 10000 / samples;

        const geometry = new THREE.BoxGeometry(15, 15, 15); // Smaller cubes for higher res
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const mesh = new THREE.InstancedMesh(geometry, material, samples * samples);

        const dummy = new THREE.Object3D();
        let count = 0;

        for (let x = -5000; x < 5000; x += step) {
            for (let z = -5000; z < 5000; z += step) {
                const type = this.getTerrainType(x, z);
                let color = new THREE.Color(0xFFFFFF);

                if (type === 'WATER') color.set(0x0000FF);
                if (type === 'FOREST') color.set(0x006400); // DarkGreen
                if (type === 'PATH') color.set(0xFFFF00); // Yellow for debug
                if (type === 'ROAD') color.set(0x333333);
                if (type === 'GRASS') color.set(0x00FF00);

                dummy.position.set(x, 50, z);
                dummy.updateMatrix();

                mesh.setMatrixAt(count, dummy.matrix);
                mesh.setColorAt(count, color);
                count++;
            }
        }

        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor.needsUpdate = true;
        scene.add(mesh);
    }

    // Find center of red clusters (Map Markers)
    getRedMarkers() {
        // Simple scan for red pixels
        const markers = [];
        const step = 50; // Scan step

        for (let x = -5000; x < 5000; x += step) {
            for (let z = -5000; z < 5000; z += step) {
                const { u, v } = this.worldToNormalized(x, z);
                const pixel = this.getPixel(u, v);
                if (pixel) {
                    // Red Check: High R, Low G/B
                    if (pixel.r > 150 && pixel.g < 100 && pixel.b < 100) {
                        markers.push(new THREE.Vector3(x, 0, z));
                    }
                }
            }
        }

        // Return raw markers for now (simplification: no clustering)
        // Ideally we would cluster these points to find the "center" of each number.
        return markers;
    }
}
