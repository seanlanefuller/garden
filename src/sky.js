import * as THREE from 'three';

export class Sky {
    constructor(scene) {
        this.scene = scene;
    }

    init() {
        this.createSkyDome();
    }

    createSkyDome() {
        // Create a large sphere
        const geometry = new THREE.SphereGeometry(6000, 32, 16);
        // Invert it so we see the inside
        geometry.scale(-1, 1, 1);

        // Simple Vertex/Fragment Shader for Day Sky
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize( vWorldPosition + offset ).y;
                gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
            }
        `;

        const uniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xffffff) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide
        });

        const skyMesh = new THREE.Mesh(geometry, material);
        this.scene.add(skyMesh);
    }
}
