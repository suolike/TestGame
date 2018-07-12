let THREE = require('./three/three');
let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let context = canvas.getContext('webgl');
let renderer = new THREE.WebGLRenderer(context);

renderer.setSize(window.innerWidth, window.innerHeight);

canvas.appendChild(renderer.domElement);
let geometry = new THREE.CubeGeometry(1, 1, 1);
let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
let cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 5;


// 游戏主函数

export default class Main {
  constructor() {
    render();
  }
}

function render() {
  requestAnimationFrame(render);
  cube.rotation.x += 0.1;
  cube.rotation.y += 0.1;
  renderer.render(scene, camera);
}