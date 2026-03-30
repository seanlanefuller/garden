import * as THREE from 'three';

export class LocationManager {
    constructor() {
        this.locations = [
            { id: 1, name: "Propst Guest Center", type: "Building", mapX: 55, mapY: 27 },
            { id: 2, name: "Teledyne Terrace", type: "Building", mapX: 54, mapY: 34 },
            { id: 3, name: "Cherry Circle", type: "Garden", mapX: 51, mapY: 39 },
            { id: 4, name: "Spencer Volunteer Tribute Garden", type: "Garden", mapX: 55, mapY: 39 },
            { id: 5, name: "Murray Hall", type: "Building", mapX: 61, mapY: 34 },
            { id: 6, name: "Train Garden", type: "Garden", mapX: 67, mapY: 41 },
            { id: 7, name: "Cedar Glade", type: "Garden", mapX: 50, mapY: 45 },
            { id: 8, name: "Four Seasons Garden", type: "Garden", mapX: 55, mapY: 52 },
            { id: 9, name: "Damson Aquatic Garden", type: "Garden", mapX: 54, mapY: 65 },
            { id: 10, name: "Summer House", type: "Building", mapX: 68, mapY: 69 },
            { id: 11, name: "Holmes Trillium Garden", type: "Garden", mapX: 48, mapY: 66 },
            { id: 12, name: "Harbarger Hydrangea Border", type: "Garden", mapX: 44, mapY: 65 },
            { id: 13, name: "Van Valkenburgh Daylily Garden", type: "Garden", mapX: 36, mapY: 61 },
            { id: 14, name: "Herb Garden", type: "Garden", mapX: 32, mapY: 63 },
            { id: 15, name: "Mother Earth Troll Garden", type: "Garden", mapX: 23, mapY: 53 },
            { id: 16, name: "Garden of Hope", type: "Garden", mapX: 18, mapY: 56 },
            { id: 17, name: "Fern Glade", type: "Garden", mapX: 35, mapY: 50 },
            { id: 18, name: "Demonstration Vegetable Garden", type: "Garden", mapX: 19, mapY: 45 },
            { id: 19, name: "Trading Post", type: "Garden", mapX: 34, mapY: 46 },
            { id: 20, name: "Wicks Family Garden", type: "Garden", mapX: 32, mapY: 35 },
            { id: 21, name: "Lewis Bird Watch", type: "Garden", mapX: 24, mapY: 37 },
            { id: 22, name: "Tweetsville", type: "Garden", mapX: 16, mapY: 34 },
            { id: 23, name: "Anderson Education Center", type: "Building", mapX: 38, mapY: 29 },
            { id: 24, name: "Pollinator Walk", type: "Garden", mapX: 41, mapY: 30 },
            { id: 25, name: "Boeing-Toyota Amphitheatre", type: "Building", mapX: 33, mapY: 25 },
            { id: 26, name: "Linda J Smith Administration Bldg", type: "Building", mapX: 75, mapY: 36 },
            { id: 27, name: "Nichols Arbor", type: "Building", mapX: 74, mapY: 39 },
            { id: 28, name: "Grisham Pavilion", type: "Building", mapX: 85, mapY: 31 },
            { id: 29, name: "South Meadow", type: "Garden", mapX: 62, mapY: 77 },
            { id: 30, name: "Native Plants Teaching Garden", type: "Garden", mapX: 31, mapY: 7 }
        ];
    }

    // Convert Map Coordinates (0-100) to World Coordinates (-5000 to +5000)
    // Note: Map Y=0 is bottom (Z=5000). Map Y=100 is top (Z=-5000).
    // Map X=0 is left (X=-5000). Map X=100 is right (X=5000).
    getWorldPosition(mapX, mapY) {
        const x = (mapX / 100) * 10000 - 5000;
        const z = 5000 - (mapY / 100) * 10000;
        return new THREE.Vector3(x, 0, z);
    }

    getLocation(id) {
        return this.locations.find(l => l.id === id);
    }

    // Check if a point (world coords) is near a specific location ID
    isNear(x, z, locationId, radius = 500) {
        const loc = this.getLocation(locationId);
        if (!loc) return false;

        const center = this.getWorldPosition(loc.mapX, loc.mapY);
        const dx = x - center.x;
        const dz = z - center.z;
        return (dx * dx + dz * dz) < (radius * radius);
    }
}
