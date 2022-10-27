import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { Point } from './Point';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

function dec2bin(dec, n) {
  var res = (dec >>> 0).toString(2);

  if (res.length < n) {
    for (let i = 0; i < (n - res.length); ++i) {
      res = '0' + res;
    }
  }

  return res;
}

export function init3Dgraphics(element, data, nodes_ids) {

  if (data === undefined) {
    return false;
  }

  const CYLINDER_HEIGHT = 5;

  const scene = new THREE.Scene();
  //scene.background = new THREE.Color( 0xd3d3d3 );
  scene.background = new THREE.Color( 0xf8f2ea);
  const camera = new THREE.PerspectiveCamera(75, element.width / element.height, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({
    canvas: element,
  });

  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(element.width, element.height); // full size
  camera.position.setZ(30); // for better perspective
  renderer.sortObjects = false;
  renderer.render(scene, camera);

  const fontJson = require( "./fonts/Caviar_Dreams_Bold.json" );
  const font = new Font( fontJson );
  var texts = [];

  var mouse = new THREE.Vector2();
  var raycaster = new THREE.Raycaster();

  function onMouseMove( event ) {

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = ( event.clientX / element.width ) * 2 - 1;
    mouse.y = - ( event.clientY / element.height ) * 2 + 1;
  }

  const axesHelper = new THREE.AxesHelper(100);
  //scene.add(axesHelper);

  const gui = new dat.GUI();
  const options = {
    sphereColor : 0xffea00,
    wireframe: false,
  };
    
  const pointLight = new THREE.PointLight(0xffffff)
  pointLight.position.set(20, 20, 20);

  const ambientLight = new THREE.AmbientLight(0xffffff)
  ambientLight.position.set(20, 20, 20);

  scene.add(pointLight, ambientLight);

  const lightHelper = new THREE.PointLightHelper(pointLight);  // shows position of lighsource
  const gridHelper = new THREE.GridHelper(30, 20);

  //scene.add(lightHelper, gridHelper);

  window.addEventListener('resize', function() {
    camera.aspect = element.width / element.height;
    camera.updateProjectionMatrix();
    renderer.setSize(element.width);
  });

  const controls = new OrbitControls(camera, renderer.domElement);

  var nodes_to_id = {};


  function resetMaterials() {
    for (let i = 0; i < scene.children.length; i++) {
      if (scene.children[i].material) {
        scene.children[i].material.opacity = 1.0;
      }
    }
  }


  function hoverPieces() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
      const newMaterial = intersects[i].object.material.clone();
      newMaterial.transparent = true;
      newMaterial.opacity = 0.5;
      intersects[i].object.material = newMaterial;
    }
  }

  function onClick() {
    texts.forEach((text) => { removeObject3D(text) });

    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length === 1) {
      const obj = intersects[0].object;
      var text = '';
      nodes_to_id[obj.id].forEach(function (elem) {
        if (text !== '') {
          text += ',';
        }
        text += ' (';
        const bin = dec2bin(elem, nodes_ids.length);

        for (let i = 0; i < bin.length; i++) {
          if (bin[i] === '1') {
            text += ' ' + nodes_ids[i];
          }
        }
        text += ')';
      });

      const geometry = new TextGeometry(text, {
        font : font,
        size : 1,
        height : 1,
      });

      const textMesh = new THREE.Mesh(geometry, [
        new THREE.MeshPhongMaterial( { color : 0x000000 } )
      ]);

      textMesh.position.x = obj.position.x;
      textMesh.position.y = obj.position.y;
      textMesh.position.z = obj.position.z + 10;

      texts.push(textMesh);
      scene.add(textMesh);      
    }
  }

  function removeObject3D(object3D) {
    if (!(object3D instanceof THREE.Object3D)) return false;

    // for better memory management and performance
    if (object3D.geometry) object3D.geometry.dispose();

    if (object3D.material) {
        if (object3D.material instanceof Array) {
            // for better memory management and performance
            object3D.material.forEach(material => material.dispose());
        } else {
            // for better memory management and performance
            object3D.material.dispose();
        }
    }
    object3D.removeFromParent(); // the parent might be the scene or another Object3D, but it is sure to be removed this way
    return true;
}

  processClusters(scene, data);
  data = null;

  function animate() {
    setTimeout( function() {
      requestAnimationFrame( animate );
    }, 1000 / 5 );

    controls.update();
    resetMaterials();
    hoverPieces();
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);

  window.addEventListener( 'click', onClick );
  window.addEventListener( 'mousemove', onMouseMove );

  window.addEventListener('resize', function() {
    camera.aspect = element.width / element.width
    camera.updateProjectionMatrix();
    renderer.setSize(element.width, element.width);
  });

  function calcColor(max, val) {
    return "hsla(147, 0%, 50%, 1)";
    const min = 0
    var minHue = 240, maxHue=0;
    var curPercent = (val - min) / (max-min);
    var colString = "hsl(" + ((curPercent * (maxHue-minHue) ) + minHue) + ",65%,50%)";
    return colString;
  }

  function createCylinder( data, id, startPoint, endPoint, currRadius, nextRadius, rank, rank_max) {
    const color = new THREE.Color( data[id]['Color'] === '' ? calcColor(rank_max, rank) : data[id]['Color'] );
    //color.setHex(rank/10 * 0xffffff );
   // color.setHex(rank/10 * 0xffffff );


    var cylinderMesh = function( startPoint, endPoint, midPoint, currRadius, nextRadius, color ) {
      /* edge from X to Y */
      const direction = new THREE.Vector3().subVectors( endPoint, startPoint );

      const orientation = new THREE.Matrix4();
      /* THREE.Object3D().up (=Y) default orientation for all objects */
      orientation.lookAt(startPoint, endPoint, new THREE.Object3D().up);

      /* rotation around axis X by -90 degrees 
      * matches the default orientation Y 
      * with the orientation of looking Z */
      const mat =  new THREE.Matrix4();
      mat.set(
        1,0,0,0,
        0,0,1,0, 
        0,-1,0,0,
        0,0,0,1
      );
      orientation.multiply(mat);

      /* cylinder: radiusAtTop, radiusAtBottom, 
          height, radiusSegments, heightSegments */
      const edgeGeometry = new THREE.CylinderGeometry( nextRadius, currRadius, direction.length(), 8, 1);
      const cylinder = new THREE.Mesh( edgeGeometry, 
              new THREE.MeshPhongMaterial( { color: color, flatShading : true } ) );

      cylinder.applyMatrix4(orientation)
      cylinder.position.set(midPoint.x, midPoint.y, midPoint.z);
      nodes_to_id[cylinder.id] = data[id]["Nodes"];
      return cylinder;
    }

    const midPoint = new Point((startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2, (startPoint.z + endPoint.z) / 2);
    return cylinderMesh(startPoint, endPoint, midPoint, currRadius, nextRadius, color); //new THREE.Mesh(geometryCyl, material);

  }

  // prevPoint, point - upper and downer middle points of cylinder
  // dirPoint - point to which direction of cylinder (dir vector) should go 
  function clustering(scene, data, id, max_branching, branch_count, prevPointFirst, pointFirst, biggestRank) {

    if (id === undefined) {
      console.log("Id is undefined in clustering");
      return;
    }

    var tuple = Object.freeze({ id: id, prevPoint: prevPointFirst, point: pointFirst });
    var stack = [ tuple ];
 
    var count = 0

    while (stack.length > 0) {
      ++count;
      const stackElement = stack.pop();
      const current = stackElement.id;
      const prevPoint = stackElement.prevPoint;
      const point = stackElement.point;

      var cluster = data[current];
      const childCount = cluster["Desc"].length;

      var childsChildCount = 0;
      for (var i = 0; i < cluster["Desc"].length; ++i) {
        childsChildCount += data[cluster["Desc"][i]]["NodeCount"];
      }

      var cylinder = createCylinder(data, current, prevPoint, point, cluster.NodeCount, childsChildCount, data[current]["Rank"], biggestRank);

      const prevPointPointDist = Math.sqrt((point.x - prevPoint.x) * (point.x - prevPoint.x) + (point.y - prevPoint.y)
                              * (point.y - prevPoint.y) + (point.z - prevPoint.z) * (point.z - prevPoint.z));

      for (i = 0; i < childCount; ++i) {

        if (childCount === 1) {

            var newStartPoint = new Point(point.x, point.y, point.z); // to make copy

            var offset = 0;
            if (childsChildCount === cluster["Desc"].length && childsChildCount !== 0 && data[cluster["Desc"][0]]["Desc"].length !== 0) {
              cylinder = undefined; // join same-like cluster to one - draw one cluster with bigger height
              newStartPoint = new Point(prevPoint.x, prevPoint.y, prevPoint.z); // to make copy
            }

            const dirVector = new THREE.Vector3(point.x - prevPoint.x, point.y - prevPoint.y, point.z - prevPoint.z);
            const newPoint = new Point(dirVector.x + point.x, dirVector.y + point.y, dirVector.z + point.z);

            tuple = Object.freeze({ id: cluster["Desc"][0], prevPoint: newStartPoint, point: newPoint });
            stack.push(tuple);
          
          continue;
        }

        // COMPUTE NEW COORDINATES around circle
        const theta = 2 * Math.PI / childCount * i;

        var xPos = Math.cos(theta) * childsChildCount;
        var zPos = Math.sin(theta) * childsChildCount;
        // this point is not exactly matching with rotation line
        // it is used to compute vector and later in correct newStartPoint
        const newStartPointHelper = new Point(point.x + xPos, point.y, point.z + zPos);

        const vector = new THREE.Vector3(newStartPointHelper.x - prevPoint.x, newStartPointHelper.y - prevPoint.y, newStartPointHelper.z - prevPoint.z).normalize();
        const distance = Math.sqrt(cluster.NodeCount * cluster.NodeCount + prevPointPointDist * prevPointPointDist);
        newStartPoint = new Point(
          prevPoint.x + distance * vector.x,
          prevPoint.y + distance * vector.y,
          prevPoint.z + distance * vector.z,
        );
      
        const branch_factor = 2 - (1/max_branching * branch_count);
        xPos = Math.cos(theta) * childsChildCount * branch_factor; // TODO pronasobit constantov pro urceni mensiho/vetsiho uhlu - v ramci hlbky stromu? 
        zPos = Math.sin(theta) * childsChildCount * branch_factor; // TODO
        const newEndPoint = new Point(newStartPoint.x + xPos, newStartPoint.y - CYLINDER_HEIGHT, newStartPoint.z + zPos);
      
        tuple = Object.freeze({ id: cluster["Desc"][i], prevPoint: newStartPoint, point: newEndPoint });
        stack.push(tuple);
      }

      if (cylinder !== undefined) {
        scene.add(cylinder);
      }

    }
  }

  function compMaxBranching(data, key) {

    let stack = [ key ];
    var maximums = {}
    var colors = {}

    while (stack.length > 0) {
      const current = stack.pop();
      colors[current] = 'G';
      stack.push(current);
      
      if (maximums[current] === undefined) {
        maximums[current] = 0
      }

      var count_black = 0;
      const desc_count = data[current]["Desc"].length;
      for (var i = 0; i < desc_count; ++i) {
        if (colors[data[current]["Desc"][i]] === undefined) {
          stack.push(data[current]["Desc"][i]);
        } 

        if (colors[data[current]["Desc"][i]] === 'B') {
          count_black += 1;
          maximums[current] = Math.max(maximums[ data[current]["Desc"][i] ], maximums[current]);
        }
      }

      if (count_black === desc_count) {
        colors[current] = 'B';
        stack.pop();

        if (desc_count > 1) {
          maximums[current] += 1;
        }
      }
    }

    return maximums[key];
  }

  function processClusters(scene, data) {

    var root_cluster_key = undefined;
    var maxCluster = 1;
    var biggestRank = 0;
    Object.entries(data).forEach(([k,v]) => {
      if (v["Rank"] === 0) {
        root_cluster_key = k;
      }
      biggestRank = Math.max(v["Rank"], biggestRank);
      maxCluster = Math.max(maxCluster, v.NodeCount);
    });

    const max_branching = compMaxBranching(data, root_cluster_key);

    const firstHeight = biggestRank * CYLINDER_HEIGHT / 2 + CYLINDER_HEIGHT;
    const firstStartPoint = new Point(0, firstHeight, 0);
    const firstEndPoint = new Point(0, firstHeight - CYLINDER_HEIGHT, 0);

    clustering(scene, data, root_cluster_key, max_branching, 1, firstStartPoint, firstEndPoint, biggestRank);
  }
}



