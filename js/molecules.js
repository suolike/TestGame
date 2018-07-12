let THREE = require('./three/three');

import './controls/TrackballControls'
import './renderers/CSS3DRenderer'
import './loaders/PDBLoader'

let camera, scene, renderer;
let controls;
let root;

let objects = [];
let tmpVec1 = new THREE.Vector3();
let tmpVec2 = new THREE.Vector3();
let tmpVec3 = new THREE.Vector3();
let tmpVec4 = new THREE.Vector3();
let offset = new THREE.Vector3();

let visualizationType = 2;

let MOLECULES = {
  "Ethanol": "ethanol.pdb",
  "Aspirin": "aspirin.pdb",
  "Caffeine": "caffeine.pdb",
  "Nicotine": "nicotine.pdb",
  "LSD": "lsd.pdb",
  "Cocaine": "cocaine.pdb",
  "Cholesterol": "cholesterol.pdb",
  "Lycopene": "lycopene.pdb",
  "Glucose": "glucose.pdb",
  "Aluminium oxide": "Al2O3.pdb",
  "Cubane": "cubane.pdb",
  "Copper": "cu.pdb",
  "Fluorite": "caf2.pdb",
  "Salt": "nacl.pdb",
  "YBCO superconductor": "ybco.pdb",
  "Buckyball": "buckyball.pdb",
  //"Diamond": "diamond.pdb",
  "Graphite": "graphite.pdb"
};

let loader = new THREE.PDBLoader();
let colorSpriteMap = {};
let baseSprite = document.createElement( 'img' );

let menu = document.getElementById( "menu" );


// 游戏主函数
export default class Main {
  constructor() {
    init();
    animate();
  }
}

function init() {

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = 1500;

  scene = new THREE.Scene();

  root = new THREE.Object3D();
  scene.add( root );

  // CSS3DRenderer可能不适用于微信小游戏，要使用WebGLRenderer

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.getElementById( 'container' ).appendChild( renderer.domElement );

  //

  controls = new THREE.TrackballControls( camera, renderer.domElement );
  controls.rotateSpeed = 0.5;
  controls.addEventListener( 'change', render );

  //

  baseSprite.onload = function () {

    loadMolecule( "models/molecules/caffeine.pdb" );
    createMenu();

  };

  baseSprite.src = 'textures/sprites/ball.png';

  //

  window.addEventListener( 'resize', onWindowResize, false );

}

//

function generateButtonCallback( url ) {

  return function ( event ) {

    loadMolecule( url );

  }

}

function createMenu() {

  for ( let m in MOLECULES ) {

    let button = document.createElement( 'button' );
    button.innerHTML = m;
    menu.appendChild( button );

    let url = "models/molecules/" +  MOLECULES[ m ];

    button.addEventListener( 'click', generateButtonCallback( url ), false );

  }

  let b_a = document.getElementById( "b_a" );
  let b_b = document.getElementById( "b_b" );
  let b_ab = document.getElementById( "b_ab" );

  b_a.addEventListener( 'click', function() { visualizationType = 0; showAtoms() } );
  b_b.addEventListener( 'click', function() { visualizationType = 1; showBonds() } );
  b_ab.addEventListener( 'click', function() { visualizationType = 2; showAtomsBonds() } );

}

//

function showAtoms() {

  for ( let i = 0; i < objects.length; i ++ ) {

    let object = objects[ i ];

    if ( object instanceof THREE.CSS3DSprite ) {

      object.element.style.display = "";
      object.visible = true;

    } else {

      object.element.style.display = "none";
      object.visible = false;

    }

  }

}

function showBonds() {

  for ( let i = 0; i < objects.length; i ++ ) {

    let object = objects[ i ];

    if ( object instanceof THREE.CSS3DSprite ) {

      object.element.style.display = "none";
      object.visible = false;

    } else {

      object.element.style.display = "";
      object.element.style.height = object.userData.bondLengthFull;
      object.visible = true;

    }

  }

}

function showAtomsBonds() {

  for ( let i = 0; i < objects.length; i ++ ) {

    let object = objects[ i ];

    object.element.style.display = "";
    object.visible = true;

    if ( ! ( object instanceof THREE.CSS3DSprite ) ) {

      object.element.style.height = object.userData.bondLengthShort;

    }

  }

}

//

function colorify( ctx, width, height, color ) {

  let r = color.r, g = color.g, b = color.b;

  let imageData = ctx.getImageData( 0, 0, width, height );
  let data = imageData.data;

  for ( let i = 0, l = data.length; i < l; i += 4 ) {

    data[ i + 0 ] *= r;
    data[ i + 1 ] *= g;
    data[ i + 2 ] *= b;

  }

  ctx.putImageData( imageData, 0, 0 );

}

function imageToCanvas( image ) {

  let width = image.width;
  let height = image.height;

  let canvas = document.createElement( 'canvas' );

  canvas.width = width;
  canvas.height = height;

  let context = canvas.getContext( '2d' );
  context.drawImage( image, 0, 0, width, height );

  return canvas;

}

//

function loadMolecule( url ) {

  for ( let i = 0; i < objects.length; i ++ ) {

    let object = objects[ i ];
    object.parent.remove( object );

  }

  objects = [];

  loader.load( url, function ( pdb ) {

    let geometryAtoms = pdb.geometryAtoms;
    let geometryBonds = pdb.geometryBonds;
    let json = pdb.json;

    geometryAtoms.computeBoundingBox();
    geometryAtoms.boundingBox.getCenter( offset ).negate();

    geometryAtoms.translate( offset.x, offset.y, offset.z );
    geometryBonds.translate( offset.x, offset.y, offset.z );

    let positions = geometryAtoms.getAttribute( 'position' );
    let colors = geometryAtoms.getAttribute( 'color' );

    let position = new THREE.Vector3();
    let color = new THREE.Color();

    for ( let i = 0; i < positions.count; i ++ ) {

      position.x = positions.getX( i );
      position.y = positions.getY( i );
      position.z = positions.getZ( i );

      color.r = colors.getX( i );
      color.g = colors.getY( i );
      color.b = colors.getZ( i );

      let atom = json.atoms[ i ];
      let element = atom[ 4 ];

      if ( ! colorSpriteMap[ element ] ) {

        let canvas = imageToCanvas( baseSprite );
        let context = canvas.getContext( '2d' );

        colorify( context, canvas.width, canvas.height, color );

        let dataUrl = canvas.toDataURL();

        colorSpriteMap[ element ] = dataUrl;

      }

      let colorSprite = colorSpriteMap[ element ];

      atom = document.createElement( 'img' );
      atom.src = colorSprite;

      let object = new THREE.CSS3DSprite( atom );
      object.position.copy( position );
      object.position.multiplyScalar( 75 );

      object.matrixAutoUpdate = false;
      object.updateMatrix();

      root.add( object );

      objects.push( object );

    }

    positions = geometryBonds.getAttribute( 'position' );

    let start = new THREE.Vector3();
    let end = new THREE.Vector3();

    for ( let i = 0; i < positions.count; i += 2 ) {

      start.x = positions.getX( i );
      start.y = positions.getY( i );
      start.z = positions.getZ( i );

      end.x = positions.getX( i + 1 );
      end.y = positions.getY( i + 1 );
      end.z = positions.getZ( i + 1 );

      start.multiplyScalar( 75 );
      end.multiplyScalar( 75 );

      tmpVec1.subVectors( end, start );
      let bondLength = tmpVec1.length() - 50;

      //

      let bond = document.createElement( 'div' );
      bond.className = "bond";
      bond.style.height = bondLength + "px";

      let object = new THREE.CSS3DObject( bond );
      object.position.copy( start );
      object.position.lerp( end, 0.5 );

      object.userData.bondLengthShort = bondLength + "px";
      object.userData.bondLengthFull = ( bondLength + 55 ) + "px";

      //

      let axis = tmpVec2.set( 0, 1, 0 ).cross( tmpVec1 );
      let radians = Math.acos( tmpVec3.set( 0, 1, 0 ).dot( tmpVec4.copy( tmpVec1 ).normalize() ) );

      let objMatrix = new THREE.Matrix4().makeRotationAxis( axis.normalize(), radians );
      object.matrix = objMatrix;
      object.rotation.setFromRotationMatrix( object.matrix, object.rotation.order );

      object.matrixAutoUpdate = false;
      object.updateMatrix();

      root.add( object );

      objects.push( object );

      //

      bond = document.createElement( 'div' );
      bond.className = "bond";
      bond.style.height = bondLength + "px";

      let joint = new THREE.Object3D( bond );
      joint.position.copy( start );
      joint.position.lerp( end, 0.5 );

      joint.matrix.copy( objMatrix );
      joint.rotation.setFromRotationMatrix( joint.matrix, joint.rotation.order );

      joint.matrixAutoUpdate = false;
      joint.updateMatrix();

      object = new THREE.CSS3DObject( bond );
      object.rotation.y = Math.PI/2;

      object.matrixAutoUpdate = false;
      object.updateMatrix();

      object.userData.bondLengthShort = bondLength + "px";
      object.userData.bondLengthFull = ( bondLength + 55 ) + "px";

      object.userData.joint = joint;

      joint.add( object );
      root.add( joint );

      objects.push( object );

    }

    //console.log( "CSS3DObjects:", objects.length );

    switch ( visualizationType ) {

      case 0: showAtoms(); break;
      case 1: showBonds(); break;
      case 2: showAtomsBonds(); break;

    }

    render();

  } );


}

//

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  render();

}

function animate() {

  requestAnimationFrame( animate );
  controls.update();

  let time = Date.now() * 0.0004;

  root.rotation.x = time;
  root.rotation.y = time * 0.7;

  render();

}

function render() {

  renderer.render( scene, camera );

}