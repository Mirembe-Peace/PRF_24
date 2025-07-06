import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as nipplejs from 'nipplejs';


const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const scene = new THREE.Scene();
const canvas = document.querySelector('.canvas');

//camera setup
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(80.21954626648072, 39.0888887446244, 278.2953267000209);
camera.rotation.set(-0.17155681062643696, -0.013253588181707663, -0.0022962445718362895);
scene.add(camera);

//webGL renderer setup
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: !isMobile, // Disable antialiasing on mobile
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);

if (isMobile) {
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio)); // Limit pixel ratio on mobile
}
else {
    renderer.setPixelRatio(window.devicePixelRatio);
}

//Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(ambientLight);
scene.add(directionalLight);

if(isMobile) {
    ambientLight.intensity = 0.8;
    directionalLight.intensity = 0.8;
}

// initialization data
let exhibitHotspots = [];
let isAnimating = false;
let currentExhibit = null;
const audioLoader = new THREE.AudioLoader();
const audioListener = new THREE.AudioListener();
scene.add(audioListener);
const sound = new THREE.Audio(audioListener);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// First-person movement variables
const moveSpeed = 5;
const lookSpeed = 0.002;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

// UI elements for exhibit display
const exhibitUI = document.createElement('div');
exhibitUI.id = 'exhibit-ui';
exhibitUI.style.display = 'none';
document.body.appendChild(exhibitUI);

const exhibitTitle = document.createElement('h2');
exhibitTitle.id = 'exhibit-title';
exhibitUI.appendChild(exhibitTitle);

const exhibitDescription = document.createElement('p');
exhibitDescription.id = 'exhibit-description';
exhibitUI.appendChild(exhibitDescription);

const closeButton = document.createElement('button');
closeButton.id = 'close-exhibit';
closeButton.textContent = 'Close';
closeButton.addEventListener('click', (event) => closeExhibit(event));
exhibitUI.appendChild(closeButton);

// 16 invisible hotspots data
const hotspotData = [
    {
            position: new THREE.Vector3(-40, 18, -165),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/ANKLE_RATTLES.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_8.mp3',
            title: "Ankle Rattles",
            description: "These are ankle rattles for wearing on the unkles to enhance the sound of music at celebrations like marriages and royal fuctions."
        },
          {
            position: new THREE.Vector3(-100, -4, -500),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/AXE.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_4.mp3',
            title: "Axe",
            description: "This is a male traditional hoe called Eligo. It is held by the chief to show leadersip and was used as awar tool."
        },
        {
            position: new THREE.Vector3(-100, 40, -510),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/BOW.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_3.mp3',
            title: "Bow",
            description: "Bow model."
        },
        {
            position: new THREE.Vector3(-100, 90, -515),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/ELEGU.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_3.mp3',
            title: "Elegu",
            description: "The is also called Eligo it is the female one held by the chiefs wife as a symbol of leadership also used in war.."
        },
        {
            position: new THREE.Vector3(-40, 18, -118),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/GOAT_SUCK.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_6.mp3',
            title: "Goat sack",
            description: "This is a goat's hide, during the Kebu medieval times it was used as a carrying suck. When an elder went to visit and there was leftover food, it would be parked in this suck for him to take back with him."
        },
        {
            position: new THREE.Vector3(-40, 20, -207),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/KEBU_HORN.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_6.mp3',
            title: "Kebu Horn",
            description: "These horns are found in the neck of every Kebu man. They are for signaling danger or general mobilization depending on the pattern of how they are being blown."
        },
        {
            position: new THREE.Vector3(-250, 22, -151),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/KEBU_POT.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_6.mp3',
            title: "Kebu Pot",
            description: "The pot is a very important commodity to the Kebu society and home. The Kebu people never used iron to cook. Clay pots were used for cooking, collecting water and preserving food itself."
        },
        {
            position: new THREE.Vector3(-40, 18, -30),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(15, 15, 15),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/MIYA_SKIN.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_6.mp3',
            title: "Miya Skin",
            description: "This is a Miya cat skin, it is one of the Kebu people's artifacts. It used to be used to ward away epidemics that broke out during medieval times. It used to be waved by the chief as he cast out sickness from his land."
        },
        {
            position: new THREE.Vector3(202, 17, -194),
            modelOffset: new THREE.Vector3(100, 30, -250),
            modelScale: new THREE.Vector3(0.5, 0.5, 0.5),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/NANAGA.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_8.mp3',
            title: "Enanga",
            description: "Is an instrument that the Batwa used to play after a succfesful hunt. it is made of a flattended wooden slade with nylon or animal skin cut into stings and tied from end to end horizontally to produce different pitches when played. "
        },
        {
            position: new THREE.Vector3(-40, 20, -65),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/OGOROGOGO%20.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_8.mp3',
            title: "Ogorogogo",
            description: "This is a farming tool used by the Ukebhu for harrowing, it is called Agorogoro. It normally has got an iron fixed on its sharp end."
        },
        {
            position: new THREE.Vector3(-255, 25, -367),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/SHAKER.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_2.mp3',
            title: "Shaker",
            description: "This is a shaker made out of calabash. It is used to evoc spirits of the ancestors. But now its used as a music instrument."
        },
        {
            position: new THREE.Vector3(211, 17, -60),
            modelOffset: new THREE.Vector3(100, 30, 0),
            modelScale: new THREE.Vector3(5, 5, 5),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/STICKS.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_2.mp3',
            title: "Sticks",
            description: "These are sticks called Imirosho used by the Batwa in cultural dances and performances. They are used for drumming or as dance props."
        },
        {
            position: new THREE.Vector3(206, 20, -444),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/THUMB_PIANO.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_2.mp3',
            title: "Ikumbi (Thumb Piano)",
            description: "This is a wooden box instrument found in the Batwa community like in most Ugandan cultures, it has a box wooden body and metal pokes tied to its neck in diferent pitches. Its played using both thumb fingers to create sound."
        },
        {
            position: new THREE.Vector3(-52, 12, -336),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/THUMB_PIANO.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_2.mp3',
            title: "Thumb Piano",
            description: "The Lukembe is one of the musical instrumenets of the Ukebhu, it is made of a sqaure wooden box and metallic pokes tided to its neck with different pitches. Lekembe is played using two finger thumbs by strumming the pokes rythmically to create sound."
        },
          // remember to give the second thumb piano a different position
        {
            position: new THREE.Vector3(-52, 12, 107),
            modelOffset: new THREE.Vector3(-150, 30, -118),
            modelScale: new THREE.Vector3(10, 10, 10),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/VACCUM.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_6.mp3',
            title: "Vaccum",
            description: "This is a food warmer called Abhoro. It is used to keep food fresh and warm."
        },
        {
            position: new THREE.Vector3(10, -5, -115),
            modelOffset: new THREE.Vector3(100, 30, 0),
            modelScale: new THREE.Vector3(5, 5, 5),
            modelPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/UMUNAHI.glb',
            soundPath: 'https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/audio_2.mp3',
            title: "Umunahi",
            description: "This is an istrument found among the Batwa, it is used for playing music while telling stories at the fire place. It is made of out of  Macademia nut tree branches and a gourd at the bottom to creat low end sound."
        }

    ]
const pictureHotspotData = [
    {
        position: new THREE.Vector3(-255, 45, -40), 
        videoId: "A9P7MDe9xfQ", 
        title: "Sembagare",
        description: "Sembagare"
    },
    {
        position: new THREE.Vector3(-255, 45, -250), 
        videoId: "2YNjtXqCO_Q",
        title: "Paskazia Nyiragaromba",
        description: "Paskazia Nyiragaromba"
    },
    {
        position: new THREE.Vector3(-255, 45, -470), 
        videoId: "VXkjMivVNc8", 
        title: "Birara Dance",
        description: "Birara Dance"
    },
    {
        position: new THREE.Vector3(170, 0, -106), 
        videoId: "SV6mbdtQ_qw", 
        title: "The fire making stick",
        description: "The fire making stick"
    },
    {
        position: new THREE.Vector3(10, 50, -115), 
        videoId: "5ps75Q-4Zi4", 
        title: "Batwa Dance",
        description: "Batwa Dance"
    },
    {
        position: new THREE.Vector3(170, 0, -125), 
        videoId: "z6iG4wFgZfc", 
        title: "Enanga",
        description: "Enanga"
    },
    {
        position: new THREE.Vector3(206, 40, -330), 
        videoId: "llJWRdh4zIc", 
        title: "Thumb Piano",
        description: "Thumb Piano"
    },
    {
        position: new THREE.Vector3(90, 20, -520),
        videoId: "i78wqPZQfb0", 
        title: "Seeke",
        description: "Seeke"
    }
];

// All controls
// desktop controls
// Mouse look 
renderer.domElement.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('mouseleave', () => isDragging = false);

renderer.domElement.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - previousMouseX;
    const deltaY = e.clientY - previousMouseY;
    
    camera.rotation.y -= deltaX * lookSpeed;
    camera.rotation.x -= deltaY * lookSpeed;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
    
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

// Keyboard movement (WASD)
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
});

//mouse click
renderer.domElement.addEventListener('click', onMouseClick);

// Mobile controls
let joystickLeft, joystickRight;
  if ('ontouchstart' in window) {
    joystickLeft = nipplejs.create({
        zone: document.getElementById('joystick-left'),
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white'
    });

    joystickRight = nipplejs.create({
        zone: document.getElementById('joystick-right'),
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white'
    });

    joystickLeft.on('move', (evt, data) => {
        moveForward = data.vector.y > 0.5;
        moveBackward = data.vector.y < -0.5;
        moveLeft = data.vector.x < -0.5;
        moveRight = data.vector.x > 0.5;
    });

    joystickRight.on('move', (evt, data) => {
        camera.rotation.y -= data.vector.x * 0.05;
        camera.rotation.x -= data.vector.y * 0.05;
        camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Movement with acceleration/friction
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const friction = 0.95;

function updateMovement(delta) {
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    
    velocity.x -= velocity.x * friction;
    velocity.z -= velocity.z * friction;
    
    if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed * delta;
    
    camera.translateX(velocity.x * delta);
    camera.translateZ(velocity.z * delta);
}

// function to create the picture hotspots
function createPictureHotspots() {
    pictureHotspotData.forEach((data) => {
        const geometry = new THREE.BoxGeometry(50, 50, 5); 
        const material = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0 // change back after adjusting
        });
        const pictureFrame = new THREE.Mesh(geometry, material);
        pictureFrame.position.copy(data.position);
        pictureFrame.userData = { 
            isPicture: true,
            videoId: data.videoId,
            title: data.title,
            description: data.description
        };
        scene.add(pictureFrame);
    });
    console.log('createPictureHotspots created');
}

// function to create the exhibit hotspots
function createExhibitHotspots() {
    // Clear existing exhibit hotspots
    exhibitHotspots.forEach(hotspot => {
        scene.remove(hotspot.mesh);
    });
    exhibitHotspots = [];
    
    // Create 16 invisible hotspots
    hotspotData.forEach((data, index) => {
        const geometry = new THREE.SphereGeometry(13, 24, 24);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0 // Completely invisible
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(data.position);
        sphere.userData = { exhibitData: data };
        scene.add(sphere);
        
        exhibitHotspots.push({
            mesh: sphere,
            exhibitData: data
        });
    });
    console.log('createExhibitHotspots created');
}

// function to load the exhibit
function showExhibit(data) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
    }
    // Show loading indicator
    const exhibitLoader = document.getElementById('exhibit-loader');
    if (exhibitLoader) exhibitLoader.style.display = 'flex';

    closeExhibit();

    // Populate UI first
    exhibitTitle.textContent = data.title;
    exhibitDescription.textContent = data.description;
    exhibitUI.style.display = 'block';

    // Load and display the 3D model
    const loader = new GLTFLoader();
        if (isMobile) {
            // Add Draco compression for mobile
            loader.dracoLoader = new DRACOLoader(); 
            loader.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        }
    loader.load(data.modelPath, 
        (gltf) => {
            // Remove previous model if exists
            if (currentExhibit && currentExhibit.model) {
                scene.remove(currentExhibit.model);
            }
            
            const model = gltf.scene;
            model.scale.copy(data.modelScale);
            model.position.copy(data.modelOffset);
            scene.add(model);
            
            currentExhibit = {
                model: model,
                sound: null
            };
            
            // Load and play sound
            audioLoader.load(data.soundPath, (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(false);
                sound.setVolume(0.5);
                sound.play();
                currentExhibit.sound = sound;
                
                // Hide loader when both model and sound are loaded
                if (exhibitLoader) exhibitLoader.style.display = 'none';
                console.log('audioLoader.load callback called');
            });
            
        },
        undefined, // Progress callback
        (error) => {
            console.log('Error loading model:', error);
            if (exhibitLoader) exhibitLoader.style.display = 'none';
            console.log('GLTFLoader.load error callback called');
        });
}

//function to close the exhibit
function closeExhibit(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    // Hide loader immediately
    const exhibitLoader = document.getElementById('exhibit-loader');
    if (exhibitLoader) {
        exhibitLoader.style.display = 'none';
    }

    if (currentExhibit) {
        // Remove model
        if (currentExhibit.model && currentExhibit.model.parent) {
            scene.remove(currentExhibit.model);
            
            // Dispose of model resources if needed
            if (currentExhibit.model.traverse) {
                currentExhibit.model.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (child.material.map) child.material.map.dispose();
                            child.material.dispose();
                        }
                    }
                });
        
            }
        }
        
        // Stop sound
        if (currentExhibit.sound) {
            currentExhibit.sound.stop();
            currentExhibit.sound.disconnect();
        }
        
        currentExhibit = null;
    }
    
    // Hide UI
    exhibitUI.style.display = 'none';

}

// Function to handle mouse click events
function onMouseClick(event) {
  
    
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check for exhibit hotspots
    const allExhibitObjects = exhibitHotspots.map(h => h.mesh);
    const exhibitIntersects = raycaster.intersectObjects(allExhibitObjects);
    
    if (exhibitIntersects.length > 0) {
        const clickedHotspot = exhibitHotspots.find(h => h.mesh === exhibitIntersects[0].object);
        if (clickedHotspot) {
            showExhibit(clickedHotspot.exhibitData);
        }
        else {
            if (isAnimating || exhibitUI.style.display === 'block' || document.getElementById('video-container')) return;
            console.warn("Clicked on an exhibit hotspot but no data found.");
        }
    }

    //for the videos 
    // Check for picture hotspots
    const pictureIntersects = raycaster.intersectObjects(scene.children.filter(obj => obj.userData.isPicture));
    if (pictureIntersects.length > 0) {
        const clickedPicture = pictureIntersects[0].object;
        showYouTubeVideo(clickedPicture.userData.videoId, clickedPicture.userData.title, clickedPicture.userData.description);

        if( clickedPicture) {
            console.log("Clicked on a picture hotspot:", clickedPicture.userData.title);
        }

        else {
            if (isAnimating || exhibitUI.style.display === 'block' || document.getElementById('video-container')) return;
            console.warn("Clicked on a picture hotspot but no data found.");
        }
    }
    


}

// Function to show YouTube video
function showYouTubeVideo(videoId, title, description) {
     
    // Create or show video container
    let videoContainer = document.getElementById('video-container');
    
    if (!videoContainer) {
        videoContainer = document.createElement('div');
        videoContainer.id = 'video-container';
        videoContainer.style.position = 'fixed';
        videoContainer.style.top = '0';
        videoContainer.style.left = '0';
        videoContainer.style.width = '100%';
        videoContainer.style.height = '100%';
        videoContainer.style.backgroundColor = 'rgba(0,0,0,0.9)';
        videoContainer.style.zIndex = '1000';
        videoContainer.style.display = 'flex';
        videoContainer.style.flexDirection = 'column';
        videoContainer.style.justifyContent = 'center';
        videoContainer.style.alignItems = 'center';
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '20px';
        closeButton.style.right = '20px';
        closeButton.style.padding = '10px 20px';
        closeButton.style.backgroundColor = '#333';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '1001';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(videoContainer);
            
        });
        videoContainer.appendChild(closeButton);
        
        // Video info
        const infoDiv = document.createElement('div');
        infoDiv.style.color = 'white';
        infoDiv.style.textAlign = 'center';
        infoDiv.style.marginBottom = '20px';
        infoDiv.style.maxWidth = '800px';
        
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        infoDiv.appendChild(titleElement);
        
        const descElement = document.createElement('p');
        descElement.textContent = description;
        infoDiv.appendChild(descElement);
        
        videoContainer.appendChild(infoDiv);
        
        // YouTube iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'youtube-iframe';
        iframe.style.border = 'none';
        iframe.style.width = '80%';
        iframe.style.height = '60%';
        iframe.style.maxWidth = '1200px';
     
        videoContainer.appendChild(iframe);
        
        document.body.appendChild(videoContainer);
    } else {
        videoContainer.style.display = 'flex';
    }
    
    // Set the video source
    const iframe = document.getElementById('youtube-iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    
    // Update title and description
    const titleElement = videoContainer.querySelector('h2');
    const descElement = videoContainer.querySelector('p');
    titleElement.textContent = title;
    descElement.textContent = description;
    
}

// function to create home button
function createHomeButton() {
    const homeButton = document.createElement('div');
    homeButton.id = 'home-button';
    homeButton.innerHTML = 'Home';
    homeButton.title = 'Return to homepage';
    
    homeButton.addEventListener('click', () => {
        window.location.href = 'https://pearlrhythmfoundation.org/category/art-archive/';
        
    });
    
    document.body.appendChild(homeButton);
    
}

// function to show Loading progress
function updateLoadingProgress(progress) {
    const percentage = Math.round(progress * 100);
    document.getElementById('loading-percentage').textContent = percentage;
    document.getElementById('progress-bar-fill').style.width = `${percentage}%`;

    if (percentage >= 100) {
        setTimeout(() => {
            document.querySelector('.loading-screen').classList.add('fade-out');
            console.log('updateLoadingProgress setTimeout handler called');
        }, 500);
    }
    
}

// loading manager for better progress tracking
const loadingManager = new THREE.LoadingManager(
    () => {
        // When all assets are loaded
        updateLoadingProgress(1);
        console.log('loadingManager onLoad called');
    },
    (item, loaded, total) => {
        // Progress update
        updateLoadingProgress(loaded / total);
        console.log('loadingManager onProgress called');
    }
);

// Loading the HDR environment map and museum model
if (!isMobile) {
    new RGBELoader()
        .setPath('https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/')
        .load('environment.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
            scene.environment = texture;
            
            // Load museum model after environment is set
            const loader = new GLTFLoader(loadingManager);
            loader.load('https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/museum_test_1blend.gltf', (gltf) => {
                const model = gltf.scene;
                model.position.set(0, 0, 0);
                model.scale.set(2, 2, 2);
                scene.add(model);

                createExhibitHotspots();
                createPictureHotspots();
                
            }, undefined, (error) => {
                console.error('Error loading museum model:', error);
            });
        }, undefined, (error) => {
            console.error('Error loading HDR environment:', error);
            // Even if HDR fails, still load the museum model
            loadMuseumModel();
        });
} else {
    // On mobile, just load the museum model without environment texture
    loadMuseumModel();
}

function loadMuseumModel() {
    const loader = new GLTFLoader(loadingManager);
    loader.load('https://storage.googleapis.com/pearl-artifacts-cdn/museum_model/museum_test_1blend.gltf', (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(2, 2, 2);
        scene.add(model);

        createHomeButton();
        createExhibitHotspots();
        createPictureHotspots();
        
        
    
    }, undefined, (error) => {
        console.error('Error loading museum model:', error);
    });
}

// animate function
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    
    updateMovement(delta);
    renderer.render(scene, camera);
}

animate();