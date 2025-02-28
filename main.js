import * as THREE from 'three';
import { EffectComposer, RenderPass, UnrealBloomPass } from 'three/examples/jsm/Addons.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.01);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;
camera.position.y = 15;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Create a more dynamic grid floor
const floorGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
const floorMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -10;
scene.add(floor);

// Create glowing grid lines
const gridMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff });
const gridGeometry = new THREE.BufferGeometry();
const gridLines = [];

// Create horizontal grid lines
for (let i = -100; i <= 100; i += 10) {
    gridLines.push(-100, -10, i);
    gridLines.push(100, -10, i);
}

// Create vertical grid lines
for (let i = -100; i <= 100; i += 10) {
    gridLines.push(i, -10, -100);
    gridLines.push(i, -10, 100);
}

gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridLines, 3));
const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
scene.add(grid);

// Add distant city skyline
function createCityscape() {
    const cityGroup = new THREE.Group();
    const buildingColors = [0x0088ff, 0x00aaff, 0x0066cc];
    
    for (let i = 0; i < 100; i++) {
        const height = 5 + Math.random() * 30;
        const width = 2 + Math.random() * 5;
        const depth = 2 + Math.random() * 5;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({
            color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
        
        const building = new THREE.Mesh(geometry, material);
        
        // Position buildings in a circular pattern around the scene
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 40;
        building.position.x = Math.cos(angle) * radius;
        building.position.z = Math.sin(angle) * radius;
        building.position.y = height / 2 - 10;
        
        cityGroup.add(building);
    }
    
    return cityGroup;
}

const cityscape = createCityscape();
scene.add(cityscape);

// Create light cycles with improved visuals
class LightCycle {
    constructor(color, startX, startZ, direction) {
        this.color = color;
        this.position = new THREE.Vector3(startX, -8, startZ);
        this.direction = direction;
        this.speed = 0.3;
        this.trailLength = 150;
        this.trailPositions = [];
        this.trailColors = [];
        
        // Create cycle body with more detailed geometry
        const geometry = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: this.color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        geometry.add(body);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
        const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, -0.5, 1.5);
        geometry.add(frontWheel);
        
        const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backWheel.rotation.z = Math.PI / 2;
        backWheel.position.set(0, -0.5, -1.5);
        geometry.add(backWheel);
        
        this.mesh = geometry;
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
        
        // Create trail with gradient effect
        this.trailGeometry = new THREE.BufferGeometry();
        this.trailMaterial = new THREE.LineBasicMaterial({ 
            vertexColors: true,
            linewidth: 3
        });
        this.trail = new THREE.Line(this.trailGeometry, this.trailMaterial);
        scene.add(this.trail);
        
        // Create light glow
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.3
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow.position.copy(this.position);
        scene.add(this.glow);
    }
    
    update() {
        // Update position based on direction
        if (this.direction === 'right') this.position.x += this.speed;
        if (this.direction === 'left') this.position.x -= this.speed;
        if (this.direction === 'up') this.position.z -= this.speed;
        if (this.direction === 'down') this.position.z += this.speed;
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        this.glow.position.copy(this.position);
        
        // Rotate mesh based on direction
        if (this.direction === 'right') this.mesh.rotation.y = Math.PI * 0.5;
        if (this.direction === 'left') this.mesh.rotation.y = Math.PI * 1.5;
        if (this.direction === 'up') this.mesh.rotation.y = Math.PI * 0;
        if (this.direction === 'down') this.mesh.rotation.y = Math.PI * 1;
        
        // Add current position to trail with color
        this.trailPositions.push(this.position.x, this.position.y, this.position.z);
        
        // Create gradient color effect for trail
        const color = new THREE.Color(this.color);
        this.trailColors.push(color.r, color.g, color.b);
        
        // Limit trail length
        if (this.trailPositions.length > this.trailLength * 3) {
            this.trailPositions = this.trailPositions.slice(-this.trailLength * 3);
            this.trailColors = this.trailColors.slice(-this.trailLength * 3);
        }
        
        // Update trail geometry
        this.trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(this.trailPositions, 3));
        this.trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(this.trailColors, 3));
        this.trailGeometry.attributes.position.needsUpdate = true;
        this.trailGeometry.attributes.color.needsUpdate = true;
        
        // Change direction with improved AI
        if (Math.random() < 0.005) {
            const directions = ['right', 'left', 'up', 'down'];
            const opposites = { 'right': 'left', 'left': 'right', 'up': 'down', 'down': 'up' };
            
            // Filter out current direction and its opposite
            const possibleDirections = directions.filter(dir => 
                dir !== this.direction && dir !== opposites[this.direction]
            );
            
            this.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        }
        
        // Boundary check with smoother transitions
        if (this.position.x > 45 && this.direction === 'right') {
            this.direction = 'left';
            this.createTurnEffect();
        }
        if (this.position.x < -45 && this.direction === 'left') {
            this.direction = 'right';
            this.createTurnEffect();
        }
        if (this.position.z > 45 && this.direction === 'down') {
            this.direction = 'up';
            this.createTurnEffect();
        }
        if (this.position.z < -45 && this.direction === 'up') {
            this.direction = 'down';
            this.createTurnEffect();
        }
    }
    
    createTurnEffect() {
        // Create a burst effect when turning
        const burstGeometry = new THREE.SphereGeometry(1, 8, 8);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.7
        });
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(this.position);
        scene.add(burst);
        
        // Animate the burst
        const expandAndFade = () => {
            burst.scale.multiplyScalar(1.1);
            burst.material.opacity *= 0.9;
            
            if (burst.material.opacity > 0.01) {
                requestAnimationFrame(expandAndFade);
            } else {
                scene.remove(burst);
            }
        };
        
        expandAndFade();
    }
}

// Create light cycles with different colors
const cycles = [
    new LightCycle(0x00ffff, -20, 0, 'right'),
    new LightCycle(0xff00ff, 20, 0, 'left'),
    new LightCycle(0xffff00, 0, -20, 'down'),
    new LightCycle(0x00ff00, 0, 20, 'up')
];

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Add particle system for atmosphere
function createParticles() {
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        // Position
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = Math.random() * 50 - 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        
        // Color
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    return new THREE.Points(particles, particleMaterial);
}

const particles = createParticles();
scene.add(particles);

// Set up effect composer with enhanced bloom effect
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom pass with stronger settings
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2.0,    // strength
    0.5,    // radius
    0.7     // threshold
);
composer.addPass(bloomPass);

// Animation variables
let time = 0;
const cameraPath = {
    radius: 60,
    height: 15,
    speed: 0.0001
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    time = Date.now();
    
    // Update cycles
    cycles.forEach(cycle => cycle.update());
    
    // Animate particles
    particles.rotation.y += 0.0001;
    
    // Dynamic camera movement
    const cameraAngle = time * cameraPath.speed;
    camera.position.x = Math.sin(cameraAngle) * cameraPath.radius;
    camera.position.z = Math.cos(cameraAngle) * cameraPath.radius;
    camera.position.y = cameraPath.height + Math.sin(time * 0.0002) * 5;
    camera.lookAt(0, 0, 0);
    
    // Animate floor for wave effect
    const vertices = floorGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        const distance = Math.sqrt(x * x + z * z);
        vertices[i + 1] = Math.sin(distance * 0.05 + time * 0.001) * 2;
    }
    floorGeometry.attributes.position.needsUpdate = true;
    
    // Render with composer
    composer.render();
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Add keyboard controls for camera
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowUp':
            cameraPath.height += 5;
            break;
        case 'ArrowDown':
            cameraPath.height = Math.max(5, cameraPath.height - 5);
            break;
        case 'ArrowLeft':
            cameraPath.speed += 0.00005;
            break;
        case 'ArrowRight':
            cameraPath.speed -= 0.00005;
            break;
    }
});

// Start animation
animate(); 