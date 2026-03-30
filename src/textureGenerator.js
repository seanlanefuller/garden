import * as THREE from 'three';

export class TextureGenerator {
    constructor() { }

    createTexture(type) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (type === 'grass') {
            this.generateNoise(ctx, size, [34, 139, 34], [107, 142, 35]); // ForestGreen to OliveDrab
        } else if (type === 'pavement') {
            this.generateNoise(ctx, size, [128, 128, 128], [169, 169, 169]); // Grey to DarkGrey
        } else if (type === 'water') {
            this.generateNoise(ctx, size, [0, 0, 255], [0, 191, 255]); // Blue to DeepSkyBlue
        } else if (type === 'bark') {
            this.generateBark(ctx, size);
        } else if (type === 'leaves') {
            this.generateNoise(ctx, size, [34, 139, 34], [50, 205, 50], true); // DarkGreen to LimeGreen, speckled
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    generateNoise(ctx, size, color1, color2, speckled = false) {
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let mix = Math.random();
            if (speckled) mix = (Math.random() > 0.7) ? 1 : 0; // High contrast speckles for leaves

            data[i] = color1[0] * mix + color2[0] * (1 - mix);     // R
            data[i + 1] = color1[1] * mix + color2[1] * (1 - mix); // G
            data[i + 2] = color1[2] * mix + color2[2] * (1 - mix); // B
            data[i + 3] = 255; // Alpha
        }

        ctx.putImageData(imageData, 0, 0);
    }

    generateBark(ctx, size) {
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        // Brown vertical streaks
        const c1 = [139, 69, 19]; // SaddleBrown
        const c2 = [101, 67, 33]; // DarkBrown

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                // Vertical noise: coherent in Y, random in X
                const noise = Math.sin(x * 0.1) * 0.5 + 0.5 + (Math.random() - 0.5) * 0.4;
                const mix = Math.max(0, Math.min(1, noise));

                data[index] = c1[0] * mix + c2[0] * (1 - mix);
                data[index + 1] = c1[1] * mix + c2[1] * (1 - mix);
                data[index + 2] = c1[2] * mix + c2[2] * (1 - mix);
                data[index + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
}
