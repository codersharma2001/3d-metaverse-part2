// Set up the scene, camera, and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up skybox
var skyBoxLoader = new THREE.CubeTextureLoader();
var skyBoxTexture = skyBoxLoader.load([
    'px.jpg', 'nx.jpg',
    'py.jpg', 'ny.jpg',
    'pz.jpg', 'nz.jpg',
]);
scene.background = skyBoxTexture;

// Set up fog
var fogColor = new THREE.Color(0xcceeff);
scene.fog = new THREE.Fog(fogColor, 20, 300);  // Adjust the 0.0003 value to control the density of the fog

// Shader code for the wind effect
const grassVertexShader = `
    uniform float time;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec3 newPosition = position;
        newPosition.x += sin(position.x * 10.0 + time) * 0.2;
        newPosition.z += sin(position.z * 10.0 + time) * 0.2;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

const grassFragmentShader = `
    varying vec2 vUv;
    uniform sampler2D grassTexture;
    void main() {
        gl_FragColor = texture2D(grassTexture, vUv);
    }
`;
// Set up grassland plane
var grassTexture = new THREE.TextureLoader().load('grass_texture.jpg');
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(100, 100);

var grassMaterial = new THREE.ShaderMaterial({
  uniforms: {
      time: { value: 0 },
      grassTexture: { value: grassTexture }
  },
  vertexShader: grassVertexShader,
  fragmentShader: grassFragmentShader,
});

var grassMaterial = new THREE.MeshStandardMaterial({ map: grassTexture });
var grassGeometry = new THREE.PlaneGeometry(1000, 1000);
var grassPlane = new THREE.Mesh(grassGeometry, grassMaterial);
grassPlane.rotation.x = -Math.PI / 2;
scene.add(grassPlane);

var tileTexture = new THREE.TextureLoader().load('tile_texture.jpg');
var imageTexture = new THREE.TextureLoader().load('VKB.png');

function createCircularRing(innerRadius, outerRadius, radialSegments, tubularSegments) {
  const ringGeometry = new THREE.TorusGeometry(
    (innerRadius + outerRadius) / 2,
    (outerRadius - innerRadius) / 2,
    radialSegments,
    tubularSegments
  );
  const ringMaterial = new THREE.MeshStandardMaterial({ map: tileTexture, side: THREE.DoubleSide });

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.y = 0.01; // Position the ring slightly above the grassland surface to avoid z-fighting
  ring.rotation.x = Math.PI / 2; // Rotate the ring so that it is parallel to the grassland surface

  return ring;
}

function createImagePlane(width, height, texture) {
  const imageGeometry = new THREE.PlaneGeometry(width, height);
  const imageMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
  return imagePlane;
}

// Set up a light source
var light = new THREE.PointLight(0xffffff, 1, 0);
light.position.set(0, 50, 50);
scene.add(light);

// Set up ambient light
var ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Set up globe
var globeTexture = new THREE.TextureLoader().load('earth-texture.jpg');
var globeBumpMap = new THREE.TextureLoader().load('earth-bump.png');
var globeGeometry = new THREE.SphereGeometry(5, 64, 64);
var globeMaterial = new THREE.MeshPhongMaterial({
  map: globeTexture,
  bumpMap: globeBumpMap,
  bumpScale: 0.1
});

var globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
globeMesh.position.y = 10;
// scene.add(globeMesh);

var logoTexture = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/en/f/ff/Amity_University_logo.png', function () {
  var logoWidth = 20;
  var logoHeight = logoWidth * (logoTexture.image.height / logoTexture.image.width);
  var logoGeometry = new THREE.PlaneGeometry(logoWidth, logoHeight);
  var logoMaterial = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true });
  var logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);

  var innermostRingRadius = 14;
  var logoPosition = new THREE.Vector3(0, 0.1, 0);
  logoMesh.position.set(logoPosition.x, logoPosition.y, logoPosition.z);
  logoMesh.rotation.x = -Math.PI / 2;
  scene.add(logoMesh);
});

// Add the circular ring to the scene
const numRings = 10;
const ringGap = 5;

const globePivot = new THREE.Object3D();
// scene.add(globePivot);
// globePivot.add(globeMesh);

for (let i = 0; i < numRings; i++) {
  const innerRadius = 14 + i * ringGap;
  const outerRadius = 16 + i * ringGap;
  const radialSegments = 32;
  const tubularSegments = 64;

  const circularRing = createCircularRing(innerRadius, outerRadius, radialSegments, tubularSegments);
  scene.add(circularRing);
}


// Set up image plane above the globe
const imagePlaneWidth = 15;
const imagePlaneHeight = 5;
const imagePlaneDistance = 10;

const imagePlane = createImagePlane(imagePlaneWidth, imagePlaneHeight, imageTexture);
imagePlane.position.set(0, globeMesh.position.y + imagePlaneDistance, 0);
// globePivot.add(imagePlane);

// Position camera and set controls
camera.position.set(0, 10, 25);
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 100;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  // grassMaterial.uniforms.time.value += 0.01;
  globePivot.rotation.y += 0.005;
  imagePlane.rotation.y += 0.01;
 
  renderer.render(scene, camera);
}

animate();

