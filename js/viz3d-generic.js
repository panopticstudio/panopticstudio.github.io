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
var connMat_mpi15 = [ [1,2], [1,4], [4,5], [5,6], [1,3], [3,7], [7,8], [8,9], [3,13],[13,14], [14,15], [1,10], [10, 11], [11, 12] ];
var colorMat = randomColor({hue: 'pink', count: 18});
var cross;

// Skeletons_coco19
var connMat_coco19 = [ [1,2], [1,4], [4,5], [5,6], [1,3], [3,7], [7,8], [8,9], [3,13],[13,14], [14,15], [1,10], [10, 11], [11, 12], [2, 16], [16, 17], [2, 18], [18, 19] ];

var handConnMat = [ [1,2],[2,3],[3,4],[4,5],[1,6],[6,7],[7,8],[8,9],[1,10],[10,11],
[11,12],[12,13],[1,14],[14,15],[15,16],[16,17],[1,18],[18,19],[19,20],[20,21],[3,6],[6,10],[10,14],[14,18]];

var faceConnMat = [ [1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[18,19],[19,20],[20,21],[21,22],[23,24],[24,25],[25,26],[26,27],[28,29],[29,30],[30,31],[32,33],[33,34],[34,35],[35,36],[37,38],[38,39],[39,40],[40,41],[41,42],[42,37],[43,44],[44,45],[45,46],[46,47],[47,48],[48,43],[49,50],[50,51],[51,52],[52,53],[53,54],[54,55],[55,56],[56,57],[57,58],[58,59],[59,60],[60,49],[61,62],[62,63],[63,64],[64,65],[65,66],[66,67],[67,68],[68,61]];


var bodyBoneThickness = 1;
var handBoneThickness = 0.3;
var faceBoneThickness = 0.25;
var bone_thickness = 3;






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

var faceMaterialArray = [];
for (var idx=0;idx<70;idx++) {
  var c = new THREE.Color( 0.7, 0.7, 0.7);
  // console.log(idx/70.0);
  c.setHSL(idx/70.0, 1, 0.5);
  // console.log(c);
  faceMaterialArray.push(new THREE.MeshLambertMaterial({wireframe: false,
    color: c  }));
}
var boneMaterial = new THREE.MeshLambertMaterial({wireframe: false, color: 0xb8b8ff }); //colorMat[humanIdx]
var boneGeometry = new THREE.CylinderGeometry(0.0*bone_thickness, bone_thickness, 1.0, 8, 1);
var faceBoneGeometry = new THREE.CylinderGeometry(1.0, 1.0, 1.0, 8, 1);

var handMaterialArray = [];
var fingerColors = [new THREE.Color(1, 0, 0),
new THREE.Color(0.8, 1, 0),
new THREE.Color(0, 1, 0.4),
new THREE.Color(0, 0.4, 1),
new THREE.Color(0.8, 0, 1)];
var values = [0.8, 0.9, 0.95, 1];
for (var cidx=0;cidx<fingerColors.length;cidx++) {
for (var idx=0;idx<4;idx++) {
  handMaterialArray.push(new THREE.MeshLambertMaterial({wireframe: false,
    color: new THREE.Color( fingerColors[cidx].r*values[idx],
                            fingerColors[cidx].g*values[idx],
                            fingerColors[cidx].b*values[idx] )  }));
}
}
for (var idx=0;idx<4;idx++) {
  handMaterialArray.push(new THREE.MeshLambertMaterial({wireframe: false,
    color: new THREE.Color( 0.7, 0.7, 0.7)  }));
}






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
  	var joints;
  	if(params_gui.HD_coco19 || params_gui.VGA_coco19 || params_gui.HD_total)
  		joints = bodies[humanIdx]['joints19'];
  	else
  		joints = bodies[humanIdx]['joints15'];
	
    var id = bodies[humanIdx]['id'];
    var colorIdx = id%12;
    for( jointIdx = 0; jointIdx < joints.length/4; jointIdx++)
    {
      if (params_gui.HD_total)
      {
        if (jointIdx == 1 || jointIdx >= 15) continue;
      }
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
    var joints;
  	if(params_gui.HD_coco19 || params_gui.VGA_coco19 || params_gui.HD_total)
  		joints = bodies[humanIdx]['joints19'];
  	else
  		joints = bodies[humanIdx]['joints15'];
    for( boneIdx = 0;  boneIdx < connMat.length; boneIdx++ )
    {
      var idxA = connMat[boneIdx][0]-1;
      var idxB = connMat[boneIdx][1]-1;

      if (params_gui.HD_total)
      {
        if (idxA == 1 || idxB == 1 || idxA >= 15 || idxB >= 15) continue;
      }

      if (joints[idxA*4+3]>=0 && joints[idxB*4+3]>=0) {

        var ptA = new THREE.Vector3( joints[ idxA*4 ], joints[ idxA*4+1 ], joints[ idxA*4+2 ] );
        var ptB = new THREE.Vector3( joints[ idxB*4 ], joints[ idxB*4+1 ], joints[ idxB*4+2 ] );

        var boneMesh = drawBone(ptA,ptB,boneGeometry,boneMaterial,bodyBoneThickness);
        boneMesh.name = 'bone';
        group.add(boneMesh);
      }
    }
  }
  scene.add( group );
}

function drawHands(scene,bodies,handConnMat,colorMat)
{
  var group = new THREE.Group();
  group.name = 'hands';
  var leftRights = ['right_hand', 'left_hand'];

  for( var humanIdx = 0; humanIdx < bodies.length; humanIdx++){
    if (bodies[humanIdx].id<0) continue;
    for( var hIdx = 0; hIdx < 2; hIdx++ ) {
    if (!(leftRights[hIdx] in bodies[humanIdx])) continue;
    var joints = bodies[humanIdx][leftRights[hIdx]].landmarks;
    var valid = bodies[humanIdx][leftRights[hIdx]].validity;
    var visibility = bodies[humanIdx][leftRights[hIdx]].visibility;
    var scores = bodies[humanIdx][leftRights[hIdx]].averageScore;
    for( var boneIdx = 0; boneIdx < handConnMat.length; boneIdx++ )
    {
      var idxA = handConnMat[boneIdx][0]-1;
      var idxB = handConnMat[boneIdx][1]-1;

      if ((valid[idxA]>0 && valid[idxB]>0) &&
          (scores[idxA]>0 && scores[idxB]>0) &&
          (joints[ idxA*3 ]!=0 && joints[ idxB*3 ]!=0) &&
          (visibility[idxA].length>3 && visibility[idxB].length>3)) {

        var ptA = new THREE.Vector3( joints[ idxA*3 ], joints[ idxA*3+1 ], joints[ idxA*3+2 ] );
        var ptB = new THREE.Vector3( joints[ idxB*3 ], joints[ idxB*3+1 ], joints[ idxB*3+2 ] );

        var boneMesh = drawBone(ptA,ptB,faceBoneGeometry,handMaterialArray[boneIdx],handBoneThickness);
        boneMesh.name = 'bone';
        group.add(boneMesh);
      }
    }
    }
  }
  scene.add( group );
}
function drawFaces(scene,bodies,faceConnMat,colorMat)
{
  var group = new THREE.Group();
  group.name = 'faces';
  var leftRights = ['face70'];

  for( var humanIdx = 0; humanIdx < bodies.length; humanIdx++){
    if (bodies[humanIdx].id<0) continue;
    for( var hIdx = 0; hIdx < 1; hIdx++ ) {
    if (!(leftRights[hIdx] in bodies[humanIdx])) continue;
    // console.log(bodies[humanIdx]);
    var joints = bodies[humanIdx][leftRights[hIdx]].landmarks;
    var scores = bodies[humanIdx][leftRights[hIdx]].averageScore;
    for( var boneIdx = 0; boneIdx < faceConnMat.length; boneIdx++ )
    {
      var idxA = faceConnMat[boneIdx][0]-1;
      var idxB = faceConnMat[boneIdx][1]-1;
      if (idxA<=6 || (idxA>=10 && idxA<=16)) continue;
      if (idxB<=6 || (idxB>=10 && idxB<=16)) continue;
      if ((scores[idxA]>0 && scores[idxB]>0) &&
          (joints[ idxA*3 ]!=0 && joints[ idxB*3 ]!=0)) {

        var ptA = new THREE.Vector3( joints[ idxA*3 ], joints[ idxA*3+1 ], joints[ idxA*3+2 ] );
        var ptB = new THREE.Vector3( joints[ idxB*3 ], joints[ idxB*3+1 ], joints[ idxB*3+2 ] );

        var boneMesh = drawBone(ptA,ptB,faceBoneGeometry,faceMaterialArray[boneIdx],faceBoneThickness);
        boneMesh.name = 'bone';
        group.add(boneMesh);
      }
    }
    }
  }
  scene.add( group );
}


function drawBone(pointX, pointY, edgeGeometry, material, bone_thickness)
{
  var direction = new THREE.Vector3().subVectors(pointY, pointX);
  var orientation = new THREE.Matrix4();
  orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
  orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
    0, 0, 1, 0,
    0, -1, 0, 0,
    0, 0, 0, 1));
  var edge = new THREE.Mesh(edgeGeometry, material);
  var scale = new THREE.Matrix4().set(bone_thickness,0,0,0,
    0,direction.length(),0,0,
    0,0,bone_thickness,0,
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
    var skeleton_data ={};
  	var face_data = {};
  	var hand_data = {};

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
	  removeEntity('faces');
	  removeEntity('hands');
	  
	  if(params_gui.HD_coco19 || params_gui.VGA_coco19 )
	  {
  		visSkeleton(scene,connMat_coco19,skeleton_data['bodies'],[]);  
	  }
	  else if(params_gui.HD_coco19)
	  {
		  visSkeleton(scene,connMat_coco19,skeleton_data['bodies'],[]);  
	  }
	  else if(params_gui.HD_face)
	  {
		  drawFaces(scene,face_data['people'],faceConnMat,colorMat);	  
	  }	  
	  else if(params_gui.HD_hand)
	  {
		  drawHands(scene,hand_data['people'],handConnMat,colorMat);
	  }
	  else if(params_gui.VGA_mpi15)
	  {
    	visSkeleton(scene,connMat_mpi15,skeleton_data['bodies'],[]);  
	  }
    else //params_gui.HD_total
    {
      // console.log(connMat_coco19.length)
      visSkeleton(scene,connMat_coco19,skeleton_data['bodies'],[]);  
      drawFaces(scene,face_data['people'],faceConnMat,colorMat);    
      drawHands(scene,hand_data['people'],handConnMat,colorMat);
    }
      
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
	  var fileName;
	  if(params_gui.HD_coco19)
	  {	
  		fileName = sequenceDataPath+"/hdPose3d_stage1_coco19/body3DScene_" + zeroPad(params_gui.frameIdx,8)+".json";
  		jsonLoader.load(fileName, function (text) {skeleton_data = JSON.parse( text );});
	  }
	  else if(params_gui.VGA_coco19)
	  {	
  		fileName = sequenceDataPath+"/vgaPose3d_stage1_coco19/body3DScene_" + zeroPad(params_gui.frameIdx,8)+".json";
  		jsonLoader.load(fileName, function (text) {skeleton_data = JSON.parse( text );});
	  }
	  else if(params_gui.HD_face)
	  {	
  		fileName = sequenceDataPath+"/hdFace3d/faceRecon3D_hd" + zeroPad(params_gui.frameIdx,8)+".json";
  		jsonLoader.load(fileName, function (text) {face_data = JSON.parse( text );});
	  }
	  else if(params_gui.HD_hand)
	  {	
  		fileName = sequenceDataPath+"/hdHand3d/handRecon3D_hd" + zeroPad(params_gui.frameIdx,8)+".json";
  		jsonLoader.load(fileName, function (text) {hand_data = JSON.parse( text );});
	  }
	  else if(params_gui.VGA_mpi15)
	  {
  		fileName = sequenceDataPath+"/vgaPose3d_stage1/body3DScene_" + zeroPad(params_gui.frameIdx,8)+".json";
  		jsonLoader.load(fileName, function (text) {skeleton_data = JSON.parse( text );});
	  }
    else // params_gui.HD_total
    {
      fileName = sequenceDataPath+"/hdTotal3d/total3D_" + zeroPad(params_gui.frameIdx,8)+".json";
      jsonLoader.load(fileName, function (text) {
        data = JSON.parse( text );
        skeleton_data = data['pose'];
        hand_data = data['hand'];
        face_data = data['face'];
      });
    }
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
    autoplaySkel: true,
	VGA_mpi15: false,
	
	//HD_mpi15: false
	VGA_coco19: false,
	HD_coco19: false,
	HD_face: false,
	HD_hand: false,
  HD_total: true
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

  gui.add(params_gui, 'VGA_mpi15', true).listen().name("VGA mpi15").onChange(function(newValue) {
	params_gui.HD_coco19 = false;
	params_gui.VGA_coco19 = false;
	params_gui.HD_face = false;
	params_gui.HD_hand = false;
  params_gui.HD_total = false;
	params_gui.VGA_mpi15 = true;
    onChangeFrame();
  });
  
   gui.add(params_gui, 'VGA_coco19', false).listen().name("VGA coco19").onChange(function(newValue) {
	params_gui.VGA_mpi15 = false;	
	params_gui.HD_coco19 = false;
	params_gui.HD_face = false;
	params_gui.HD_hand = false;
  params_gui.HD_total = false;
	params_gui.VGA_coco19 = true;
    onChangeFrame();
  });

  gui.add(params_gui, 'HD_coco19', false).listen().name("HD coco19").onChange(function(newValue) {
	params_gui.VGA_mpi15 = false;
	params_gui.VGA_coco19 = false;
	params_gui.HD_face = false;
	params_gui.HD_hand = false;
  params_gui.HD_total = false;
	params_gui.HD_coco19 = true;
    onChangeFrame();
  });
  
  gui.add(params_gui, 'HD_face', false).listen().name("HD Face").onChange(function(newValue) {
	params_gui.VGA_mpi15 = false;
	params_gui.VGA_coco19 = false;
	params_gui.HD_coco19 = false;
	params_gui.HD_hand = false;
  params_gui.HD_total = false;
	params_gui.HD_face = true;
    onChangeFrame();
  });

  gui.add(params_gui, 'HD_hand', false).listen().name("HD Hand").onChange(function(newValue) {
	params_gui.VGA_mpi15 = false;
	params_gui.VGA_coco19 = false;
	params_gui.HD_coco19 = false;	
	params_gui.HD_face = false;
  params_gui.HD_total = false;
	params_gui.HD_hand = true;
    onChangeFrame();
  });
  
  gui.add(params_gui, 'HD_total', false).listen().name("HD Total").onChange(function(newValue) {
  params_gui.VGA_mpi15 = false;
  params_gui.VGA_coco19 = false;
  params_gui.HD_coco19 = false; 
  params_gui.HD_face = false;
  params_gui.HD_hand = false;
  params_gui.HD_total = true;
    onChangeFrame();
  });
  
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
