import * as THREE from 'three';
import { TextureGenerator } from './textureGenerator.js';

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.textureGen = new TextureGenerator();
    }

    init() {
        const grassTex = this.textureGen.createTexture('grass');
        const paveTex = this.textureGen.createTexture('pavement');
        const waterTex = this.textureGen.createTexture('water');

        // Repeat textures for high resolution feel
        const repeat = 200; // 500 = 20 units per repeat? 10000 / 500 = 20.
        // wait, CanvasTextures don't repeat automatically in shader unless we use UVs scaled.

        const loader = new THREE.TextureLoader();
        const controlMap = loader.load('map.gif');
        controlMap.colorSpace = THREE.SRGBColorSpace;

        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;

        const fragmentShader = `
            uniform sampler2D map;
            uniform sampler2D grassTex;
            uniform sampler2D paveTex;
            uniform sampler2D waterTex;
            uniform float repeat;
            uniform float time;

            varying vec2 vUv;

            void main() {
                // Sample Control Map
                vec4 control = texture2D(map, vUv);
                
                // Sample Textures with high frequency UVs
                vec2 detailUv = vUv * repeat;
                vec4 grass = texture2D(grassTex, detailUv);
                vec4 pave = texture2D(paveTex, detailUv);
                
                // Animate water UVs
                vec2 waterUv = detailUv + vec2(time * 0.05, time * 0.02);
                vec4 water = texture2D(waterTex, waterUv);

                // Mix based on Control Map Color
                // Water = Blue dominant
                // Path = White/Grey (High R, G, B)
                // Grass = Green dominant

                vec3 finalColor = grass.rgb; // Default

                // Simple mixing logic matching MapData.js logic roughly
                
                // Detect Water (Blue > Red+Green?) roughly
                // Map visualization: Blue pixels are water.
                if (control.b > control.r + 0.1 && control.b > control.g) {
                    finalColor = water.rgb;
                    // Add some foam/specular?
                } 
                // Detect Path (Bright pixels)
                else if (control.r > 0.6 && control.g > 0.6 && control.b > 0.6 && (max(max(control.r, control.g), control.b) - min(min(control.r, control.g), control.b) < 0.2)) {
                    finalColor = pave.rgb;
                }
                
                gl_FragColor = vec4(finalColor * control.rgb * 1.5, 1.0); // Multiply by map to keep original shadowing/details but boost brightness
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: controlMap },
                grassTex: { value: grassTex },
                paveTex: { value: paveTex },
                waterTex: { value: waterTex },
                repeat: { value: repeat },
                time: { value: 0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide
        });

        this.material = material; // Save ref to update time

        const geometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
        geometry.rotateX(-Math.PI / 2);

        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
    }

    update(time) {
        if (this.material) {
            this.material.uniforms.time.value = time;
        }
    }
}
