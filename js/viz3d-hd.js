// Copyright Tomas Simon, Hanbyul Joo, Xulong Li
// 2016
// http://cs.cmu.edu/~tsimon

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, camera, scene, renderer, mesh;
var params_gui;

// Point clouds
var pointCloud;
var pointShaderMaterial;

// Skeletons
var connMat = [ [1,2], [1,4], [4,5], [5,6], [1,3], [3,7], [7,8], [8,9], [3,13],[13,14], [14,15], [1,10], [10, 11], [11, 12] ];
var colorMat = randomColor({hue: 'pink', count: 18});
var cross;

var fragmentShaderTxt = [
"varying vec3 vColor;",
"uniform float alpha;",
"void main() {",
"  gl_FragColor = vec4( vColor, alpha );",
"}"].join('\n');
var vertexShaderTxt = [
"varying vec3 vColor;",
"uniform float pointSize;",
"uniform float alpha;",
"  void main() {",
"    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
"    gl_PointSize = pointSize;",
"    gl_Position = projectionMatrix * mvPosition;",
"    vColor = color;",
"  }"].join('\n');

mouse = { x: 0, y: 0 },
objects = [],

count = 0,

CANVAS_WIDTH = 720,
CANVAS_HEIGHT = 520;
gui = new dat.GUI({height : 4 * 32 - 1, autoPlace: false });

controls_container = document.getElementById( 'viz3d-controls-container' );
controls_container.appendChild(gui.domElement);
container = document.getElementById( 'viz3d-container' );
// document.body.appendChild( container );

renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );
renderer.setClearColor( 0xFFFFFF );
//renderer.setPixelRatio( window.devicePixelRatio );
container.appendChild( renderer.domElement );

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera( 50, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 2000 );

var bone_thickness = 3;
var sphereGeometry = new THREE.SphereGeometry( bone_thickness, 8, 8 );
var sphereMaterial = new THREE.MeshLambertMaterial({wireframe: false, color: 0xff8888  }); // colorMat[humanIdx]
var sphereMaterialArray = [ new THREE.MeshLambertMaterial({wireframe: false, color: 0xff8888  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0x336699  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0x666666  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0x003366  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0xff6600  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0x00ff00  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0xffcc00  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0xff9900  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0xFF0000  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0xcccccc  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0xa75c56  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0xeab06e  }),
  new THREE.MeshLambertMaterial({wireframe: false, color: 0xe89c84  })
]

var boneMaterial = new THREE.MeshLambertMaterial({wireframe: false, color: 0xb8b8ff }); //colorMat[humanIdx]
var boneGeometry = new THREE.CylinderGeometry(0.0*bone_thickness, bone_thickness, 1.0, 8, 1);

function visSkeleton(scene,connMat,bodies,colorMat)
{
  drawJoint(scene,bodies,colorMat);
  drawBody(scene,bodies,connMat,colorMat);
}

function drawJoint(scene,bodies,colorMat)
{
  var group = new THREE.Group();
  group.name = 'joints';
  for( humanIdx = 0; humanIdx < bodies.length; humanIdx++){
    var joints = bodies[humanIdx]['joints15'];
    var id = bodies[humanIdx]['id'];
    var colorIdx = id%12;
    for( jointIdx = 0; jointIdx < joints.length; jointIdx++)
    {
      if (joints[jointIdx*4+3]>=0) {
                var jointMesh = new THREE.Mesh(sphereGeometry, sphereMaterialArray[colorIdx]);
        jointMesh.position.set( joints[jointIdx*4],joints[jointIdx*4+1],joints[jointIdx*4+2] );
        jointMesh.name = 'joint';
        group.add(jointMesh);
      }
    }
  }
  scene.add( group );
}

function drawBody(scene,bodies,connMat,colorMat)
{
  var group = new THREE.Group();
  group.name = 'bodies';

  for( humanIdx = 0; humanIdx < bodies.length; humanIdx++){
    var joints = bodies[humanIdx]['joints15'];
    for( boneIdx = 0;  boneIdx < connMat.length; boneIdx++ )
    {
      var idxA = connMat[boneIdx][0]-1;
      var idxB = connMat[boneIdx][1]-1;

      if (joints[idxA*4+3]>=0 && joints[idxB*4+3]>=0) {

        var ptA = new THREE.Vector3( joints[ idxA*4 ], joints[ idxA*4+1 ], joints[ idxA*4+2 ] );
        var ptB = new THREE.Vector3( joints[ idxB*4 ], joints[ idxB*4+1 ], joints[ idxB*4+2 ] );

        var boneMesh = drawBone(ptA,ptB,boneGeometry,boneMaterial);
        boneMesh.name = 'bone';
        group.add(boneMesh);
      }
    }
  }
  scene.add( group );
}

function drawBone(pointX, pointY, edgeGeometry, material)
{
  var direction = new THREE.Vector3().subVectors(pointY, pointX);
  var orientation = new THREE.Matrix4();
  orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
  orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
    0, 0, 1, 0,
    0, -1, 0, 0,
    0, 0, 0, 1));
  var edge = new THREE.Mesh(edgeGeometry, material);
  var scale = new THREE.Matrix4().set(1,0,0,0,
    0,direction.length(),0,0,
    0,0,1,0,
    0,0,0,1);
  pos = orientation.multiply(scale);
  var pos2 = new THREE.Matrix4().set(1,0,0,(pointX.x+pointY.x)/2,
    0,1,0,(pointX.y+pointY.y)/2,
    0,0,1,(pointX.z+pointY.z)/2,
    0,0,0,1);
  pos = pos2.multiply(pos);
  edge.applyMatrix(pos);
  return edge;
}

function removeEntity(name) {
  var selectedObject = scene.getObjectByName(name);
  scene.remove( selectedObject );
}


function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

function onChangeFrame() {
    var manager = new THREE.LoadingManager();
    var plyLoader;
    var jsonLoader;
    var pointcloud = null;
    var skeleton_data;

    if(params_gui.showPointcloud) {
      plyLoader = new THREE.PLYLoader(manager);
    }
    //if(params_gui.showSkeletons) {
      jsonLoader = new THREE.XHRLoader(manager);
    //}

    manager.onLoad = function() {
      removeEntity('pointcloud');
      if (pointcloud!=null) {
        scene.add( pointcloud );
      }

      removeEntity('bodies');
      removeEntity('joints');
      visSkeleton(scene,connMat,skeleton_data['bodies'],[]);
      render();
    };

    if(params_gui.showPointcloud) {
      //PLY file
      //var fileName = 'glExample/151125_mafia_complete/exportTrajStreamPly_webVersion_sampled/reconByTraj_' + zeroPad(params_gui.frameIdx+7801,8)+'.ply';
      var fileName = sequenceDataPath+"/ptcloud/ptCloud_" + zeroPad(params_gui.frameIdx,8)+".ply";
      plyLoader.load( fileName, function ( geometry ) {
        pointcloud = new THREE.Points( geometry, pointShaderMaterial );
        pointcloud.name = 'pointcloud';
       } );
    }
    //if (params_gui.showSkeletons) {
      //var filename = 'glExample/skeleton/body3DScene_' + zeroPad(params_gui.frameIdx+7801,8)+'.json';
      var fileName = sequenceDataPath+"/hdPose3d_stage1/body3DScene_" + zeroPad(params_gui.frameIdx,8)+".json";
      jsonLoader.load(fileName, function (text) {
        skeleton_data = JSON.parse( text );
      });

    //}
}

function onAutoPlay() {
  if (params_gui.autoplaySkel) //&& params_gui.showSkeletons)
  {
    params_gui.frameIdx = params_gui.frameIdx + 1;
    if (params_gui.frameIdx > endFrameIdx)	{ //@TODO Max of frames index
      params_gui.frameIdx = startFrameIdx;		//@TODO Min of frames index
    }
    onChangeFrame();
  }
}
function init() {

  camera = new THREE.PerspectiveCamera( 30, CANVAS_WIDTH /CANVAS_HEIGHT, 1, 2000 );
  camera.up.set( 0, -1, 0 );

  camera.position.x = -500;
  camera.position.y = -500;
  camera.position.z = -700;

  controls = new THREE.TrackballControls(camera, container);

  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.dynamicDampingFactor = 0.5;
  //controls.keys = [ 65, 83, 68 ];
  controls.addEventListener( 'change', render );

  // world
  scene = new THREE.Scene();
  scene.position.set( 0, 120,0 );

  // lights
  light = new THREE.DirectionalLight( 0x888888 );
  light.position.set( 0, -500, 0 );
  scene.add( light );

  light = new THREE.AmbientLight( 0x666666 );
  scene.add( light );

  // FLOOR
  var texLoader = new THREE.TextureLoader();
  var floorTexture;
  texLoader.load('img/checkerboard.jpg', function(tex) {
    floorTexture = tex;
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set( 5, 5 );
    var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
    // var floorGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    var floorGeometry = new THREE.CircleGeometry(300, 18);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.x = 0;
    floor.position.y = 0;
    floor.position.z = 0;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    render();
  });

  //GUI params
  params_gui =
  {
    frameIdx: Math.floor(startFrameIdx+ (endFrameIdx-startFrameIdx)/4),
    //pointSize: 0.1,
    //alpha: 0.75,
    //showPointcloud: false,
    //showSkeletons: true,
    autoplaySkel: true
  };

  var defAutoplay = localStorage.getItem("viz3d.autoplaySkel");
  if (defAutoplay!=null) {
    if (defAutoplay=="false") {
      params_gui.autoplaySkel = false;
    }
  }

  pointShaderMaterial = new THREE.ShaderMaterial( {
    uniforms: {
      //"pointSize": { type: "f", value: params_gui.pointSize },
      //"alpha":{ type: "f", value: params_gui.alpha},
    },
    vertexColors: THREE.VertexColors,
    vertexShader:   vertexShaderTxt,
    fragmentShader: fragmentShaderTxt,
    transparent:    true,
  });

  //GUI
  gui.add( params_gui, 'frameIdx').max(endFrameIdx).min(startFrameIdx).step(1).name( 'Frame' ).onChange(function(){
    onChangeFrame();
  } );

  //gui.add( params_gui, 'pointSize', 0.01, 10, 0.01 ).name( 'PointSize' ).onChange(function(){
    //pointShaderMaterial.uniforms.pointSize.value  = params_gui.pointSize;
    //render();
  //} );

  //gui.add( params_gui, 'alpha', 0.1, 1, 0.1 ).listen().name( 'Alpha' ).onChange(function(){
    //pointShaderMaterial.uniforms.alpha.value = params_gui.alpha;
    //render();
  //} );

  //gui.add(params_gui,'showPointcloud', true).listen().name("Load Point Cloud").onChange(function(newValue) {
    //onChangeFrame();
  //});

  //gui.add(params_gui, 'showSkeletons', true).listen().name("Load Skeleton").onChange(function(newValue) {
    //onChangeFrame();
  //});

  gui.add(params_gui, 'autoplaySkel', false).listen().name("Auto Play").onChange(function(newValue) {
    localStorage.setItem('viz3d.autoplaySkel', (newValue?"true":"false"));
    return newValue;
  });

  window.addEventListener( 'resize', onWindowResize, false );

  // Load initial frame
  onChangeFrame();
}

init();
animate();

function onWindowResize() {

  camera.aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
  camera.updateProjectionMatrix();

  renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );

  controls.handleResize();

  render();

}

function animate() {
  requestAnimationFrame( animate );
  controls.update();

  if(params_gui.autoplaySkel) {
      onAutoPlay();
      // Iterate over all controllers
      for (var i in gui.__controllers) {
      gui.__controllers[i].updateDisplay();
      }
  }
}

function render() {
  renderer.render( scene, camera );
}
