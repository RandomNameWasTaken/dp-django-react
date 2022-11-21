import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { Point } from './Point';
import { Interaction } from 'three.interaction-fixed';
import { dec2bin  } from "./utils";


export function init3Dgraphics(canvas, div, data, nodes_ids, h, w) {

  if (data === undefined) {
    return false;
  }

  const CYLINDER_HEIGHT = 5;

  const scene = new THREE.Scene();
  //scene.background = new THREE.Color( 0xd3d3d3 );
  scene.background = new THREE.Color( 0xf8f2ea);
  const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });

  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(canvas.width, canvas.height); // full size
  camera.position.setZ(30); // for better perspective
  renderer.sortObjects = false;
  renderer.render(scene, camera);

  new Interaction(renderer, scene, camera);

// For showing text information about clusters
  var texts = [];
  var cylinders = [];

  //const axesHelper = new THREE.AxesHelper(100);
  //scene.add(axesHelper);

/*
  const gui = new dat.GUI();
  const options = {
    sphereColor : 0xffea00,
    wireframe: false,
  };
*/    
  const pointLight = new THREE.PointLight(0xffffff)
  pointLight.position.set(20, 20, 20);

  const ambientLight = new THREE.AmbientLight(0xffffff)
  ambientLight.position.set(20, 20, 20);

  scene.add(pointLight, ambientLight);

  //const lightHelper = new THREE.PointLightHelper(pointLight);  // shows position of lighsource
  //const gridHelper = new THREE.GridHelper(30, 20);

  //scene.add(lightHelper, gridHelper);

  window.addEventListener('resize', function() {
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width);
  });

  const controls = new OrbitControls(camera, renderer.domElement);

  processClusters(scene, data);
  data = null;

  function animate() {
    setTimeout( function() {
      requestAnimationFrame( animate );
    }, 1000 / 5 );

    controls.update();
    renderer.render(scene, camera);
    pointLight.position.copy(camera.position );
  }

  renderer.setAnimationLoop(animate);

  window.addEventListener('resize', function() {
    camera.aspect = canvas.width / canvas.width
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width, canvas.width);
  });


  function calcColor(max, val) {
    return "hsla(147, 0%, 50%, 1)";
    /*
    const min = 0
    var minHue = 240, maxHue=0;
    var curPercent = (val - min) / (max-min);
    var colString = "hsl(" + ((curPercent * (maxHue-minHue) ) + minHue) + ",65%,50%)";
    return colString;
    */
  }

  function resetOpacity() {
    cylinders.forEach(function (cylinder) {
      const newMaterial = cylinder.material.clone();
      newMaterial.transparent = false;
      newMaterial.opacity = 1;
      cylinder.material = newMaterial;
    });
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
        0,1,0,0,
        0,0,0,1
      );
      orientation.multiply(mat);

      /* cylinder: radiusAtTop, radiusAtBottom, 
          height, radiusSegments, heightSegments */
      const edgeGeometry = new THREE.CylinderGeometry( currRadius, nextRadius, direction.length(), 8, 1);
      const cylinder = new THREE.Mesh( edgeGeometry, new THREE.MeshPhongMaterial( { color: color, flatShading : true } ) );

      cylinder.applyMatrix4(orientation)
      cylinder.position.set(midPoint.x, midPoint.y, midPoint.z);
      cylinder.cursor = 'pointer';
      cylinder.on('click', function(ev) {

        resetOpacity();
        const newMaterial = cylinder.material.clone();
        newMaterial.transparent = true;
        newMaterial.opacity = 0.5;
        cylinder.material = newMaterial;

        texts.forEach(function (text) {
            var selectedObject = scene.getObjectByName(text.name);
            scene.remove( selectedObject );
        });

        var text = '';
        data[id]["Nodes"].forEach(function (elem) {
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

        div.innerHTML = text;

      });

      return cylinder;
    }

    const midPoint = new Point((startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2, (startPoint.z + endPoint.z) / 2);
    return cylinderMesh(startPoint, endPoint, midPoint, currRadius, nextRadius, color); //new THREE.Mesh(geometryCyl, material);

  }

  function getChildsChilds(data, cluster) {
    var childsChildCount = 0;
    for (var i = 0; i < cluster["Desc"].length; ++i) {
      childsChildCount += data[cluster["Desc"][i]]["NodeCount"];
    }

    return childsChildCount;
  }

  // prevPoint, point - upper and downer middle points of cylinder
  // dirPoint - point to which direction of cylinder (dir vector) should go 
  function clustering(scene, data, id, max_branching, prevPointFirst, pointFirst, biggestRank) {

    if (id === undefined) {
      console.log("Id is undefined in clustering");
      return;
    }

    var tuple = Object.freeze({ id: id, prevPoint: prevPointFirst, point: pointFirst });
    var stack = [ tuple ];
 
    while (stack.length > 0) {
      const stackElement = stack.pop();
      const current = stackElement.id;
      const prevPoint = stackElement.prevPoint;
      const point = stackElement.point;

      var cluster = data[current];
      const childCount = cluster["Desc"].length;

      var childsChildCount = getChildsChilds(data, cluster);

      var cylinder = createCylinder(data, current, prevPoint, point, cluster.NodeCount, childsChildCount, data[current]["Rank"], biggestRank);

      const prevPointPointDist = Math.sqrt((point.x - prevPoint.x) * (point.x - prevPoint.x) + (point.y - prevPoint.y)
                              * (point.y - prevPoint.y) + (point.z - prevPoint.z) * (point.z - prevPoint.z));

      for (var i = 0; i < childCount; ++i) {

        if (childCount === 1) {

            var newStartPoint = new Point(point.x, point.y, point.z); // to make copy

/*            if (childsChildCount === cluster["Desc"].length && childsChildCount !== 0 && data[cluster["Desc"][0]]["Desc"].length !== 0) {
              cylinder = undefined; // join same-like cluster to one - draw one cluster with bigger height
              newStartPoint = new Point(prevPoint.x, prevPoint.y, prevPoint.z); // to make copy
            }
*/
            const dirVector = new THREE.Vector3(point.x - prevPoint.x, point.y - prevPoint.y, point.z - prevPoint.z);
            const newPoint = new Point(dirVector.x + point.x, dirVector.y + point.y, dirVector.z + point.z);

            tuple = Object.freeze({ id: cluster["Desc"][0], prevPoint: newStartPoint, point: newPoint });
            stack.push(tuple);
          
          continue;
        }

        // COMPUTE NEW COORDINATES around circle
        const theta = 2 * Math.PI / childCount;
        const h = childCount / 2;

        var fi = i * theta;
        if (i <= h && i % 2 === 1) {
          fi = (Math.ceil(h) - 1 + i) * theta;
        } else if (i > h && (childCount - 1 - i) % 2 === 0) {
          fi = (childCount - i) * theta;
        } if (i > h && (childCount - 1 - i) % 2 === 1) {
          fi = (Math.ceil(h) - 1 + childCount - i) * theta;
        }

        var xPos = childsChildCount * Math.cos(fi);
        var zPos = childsChildCount * Math.sin(fi);
        const newStartPointHelper = new Point(point.x + xPos, point.y, point.z + zPos);

        const vector = new THREE.Vector3(newStartPointHelper.x - prevPoint.x, newStartPointHelper.y - prevPoint.y, newStartPointHelper.z - prevPoint.z).normalize();

        const distance = Math.sqrt(cluster.NodeCount * cluster.NodeCount + CYLINDER_HEIGHT * CYLINDER_HEIGHT);
        newStartPoint = new Point(
          prevPoint.x + distance * vector.x,
          prevPoint.y + distance * vector.y,
          prevPoint.z + distance * vector.z,
        );

        const newEndPoint = new Point(
          newStartPoint.x + CYLINDER_HEIGHT * vector.x,
          newStartPoint.y + CYLINDER_HEIGHT * vector.y,
          newStartPoint.z + CYLINDER_HEIGHT * vector.z,
        );

    //    const newVector = [newEndPoint.x - newStartPoint.xnewEndPoint.y - newStartPoint.y, newEndPoint.z - newStartPoint.z];
        console.log( [ [Math.cos(angle), 0, Math.sin(angle)], [0, 1, 0], [-Math.sin(angle), 0, Math.cos(angle)] ] );
        const matrix =[ [Math.cos(angle), 0, Math.sin(angle)], [0, 1, 0], [-Math.sin(angle), 0, Math.cos(angle)] ];

        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const transStartPoint = new Point(c*newStartPoint.x + s*newStartPoint.x, newStartPoint.y, -s*newStartPoint.x + c*newStartPoint.z);
        const transEndPoint = new Point(c*newEndPoint.x + s*newEndPoint.x, newEndPoint.y, -s*newEndPoint.x + c*newEndPoint.z);
       // const branch_factor = 2 - (1/max_branching);
       // xPos = Math.cos(fi) * childsChildCount * branch_factor;
       // zPos = Math.sin(fi) * childsChildCount * branch_factor;
      //  const newEndPoint = new Point(newStartPoint.x + xPos, newStartPoint.y - CYLINDER_HEIGHT, newStartPoint.z + zPos);
      
        tuple = Object.freeze({ id: cluster["Desc"][i], prevPoint: transStartPoint, point: transEndPoint });
        stack.push(tuple);
      }

      if (cylinder !== undefined) {
        cylinders.push(cylinder);
       // if (current === firstId) {
          scene.add(cylinder);
       // }
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
    var biggestRank = 0;
    Object.entries(data).forEach(([k,v]) => {
      if (v["Rank"] === 0) {
        root_cluster_key = k;
      }
      biggestRank = Math.max(v["Rank"], biggestRank);
    });

    const max_branching = compMaxBranching(data, root_cluster_key);

    const firstHeight = biggestRank * CYLINDER_HEIGHT / 2 + CYLINDER_HEIGHT;
    const firstStartPoint = new Point(0, firstHeight, 0);
    const firstEndPoint = new Point(0, firstHeight - CYLINDER_HEIGHT, 0);

    clustering(scene, data, root_cluster_key, max_branching, firstStartPoint, firstEndPoint, biggestRank);
  }
}



