import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { Point } from './Point';


export function init3Dgraphics(element, data) {

  if (data === undefined) {
    return false;
  }

  const CYLINDER_HEIGHT = 5;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xd3d3d3 );
  const camera = new THREE.PerspectiveCamera(75, element.width / element.height, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({
    canvas: element,
  });

  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(element.width, element.height); // full size
  camera.position.setZ(30); // for better perspective
  renderer.sortObjects = false;
  renderer.render(scene, camera);

  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

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

  scene.add(lightHelper, gridHelper);

  window.addEventListener('resize', function() {
    camera.aspect = element.width / element.height;
    camera.updateProjectionMatrix();
    renderer.setSize(element.width);
  });

  const controls = new OrbitControls(camera, renderer.domElement);

  // Returns a random integer from 0 to 9:
  //const randomNum = Math.floor(Math.random() * 8); 

  processClusters(scene, data);

  function animate() {
    setTimeout( function() {
      requestAnimationFrame( animate );
    }, 1000 / 3 );

    controls.update();
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);

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

  function createLine(scene, data, id, startPoint, endPoint, currRadius, nextRadius, rank, rank_max) {
    const color = new THREE.Color( data[id]['color'] === undefined ? calcColor(rank_max, rank) : data[id]['color'] );
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
      const edge = new THREE.Mesh( edgeGeometry, 
              new THREE.MeshBasicMaterial( { color: color } ) );

      edge.applyMatrix4(orientation)
      edge.position.set(midPoint.x, midPoint.y, midPoint.z);
      return edge;
    }

    const midPoint = new Point((startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2, (startPoint.z + endPoint.z) / 2);
    const cylinder = cylinderMesh(startPoint, endPoint, midPoint, currRadius, nextRadius, color); //new THREE.Mesh(geometryCyl, material);

    cylinder.name = id;

    //return _mergeMeshes([object, cylinder], false);
    scene.add(cylinder);
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


    while (stack.length > 0) {
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

      createLine(scene, data, current, prevPoint, point, cluster.NodeCount, childsChildCount, data[current]["Rank"], biggestRank);

      const prevPointPointDist = Math.sqrt((point.x - prevPoint.x) * (point.x - prevPoint.x) + (point.y - prevPoint.y)
                              * (point.y - prevPoint.y) + (point.z - prevPoint.z) * (point.z - prevPoint.z));

      for (i = 0; i < childCount; ++i) {

        if (childCount === 1) {

            const dirVector = new THREE.Vector3(point.x - prevPoint.x, point.y - prevPoint.y, point.z - prevPoint.z);
            const newPoint = new Point(dirVector.x + point.x, dirVector.y + point.y, dirVector.z + point.z);
            const newStartPoint = new Point(point.x, point.y, point.z);

            tuple = Object.freeze({ id: cluster["Desc"][0], prevPoint: newStartPoint, point: newPoint });
            stack.push(tuple);
          
        //  dfsClustering(scene, data, cluster["Desc"][0], max_branching, branch_count, point, newPoint);
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
        const newStartPoint = new Point(
          prevPoint.x + distance * vector.x,
          prevPoint.y + distance * vector.y,
          prevPoint.z + distance * vector.z,
        );
      
        const branch_factor = 2 - (1/max_branching * branch_count);
        xPos = Math.cos(theta) * childsChildCount * branch_factor; // TODO pronasobit constantov pro urceni mensiho/vetsiho uhlu - v ramci hlbky stromu? 
        zPos = Math.sin(theta) * childsChildCount * branch_factor; // TODO
        const newEndPoint = new Point(newStartPoint.x + xPos, newStartPoint.y - CYLINDER_HEIGHT, newStartPoint.z + zPos);
      
          //dfsClustering(scene, data, cluster["Desc"][i], max_branching, branch_count + 1, newStartPoint, newEndPoint);
        tuple = Object.freeze({ id: cluster["Desc"][i], prevPoint: newStartPoint, point: newEndPoint });
        stack.push(tuple);
      }
    }
  }

  function getIntersection(setA, setB) {
    const intersection = new Set(
      [...setA].filter(element => setB.has(element))
    );
  
    return intersection;
  }

  function _getSCCset(node, data, childs) {
    var result = new Set();

    var queue = [node]
    while (queue.length > 0) {
      var curr_node = queue.shift();
      result.add(curr_node);

      for (var i = 0; i < data[curr_node][childs].length; ++i) {
        queue.push(data[curr_node][childs][i]);
      }
    }
    return result;
  }

  function isStability(scc) {
    return scc.length === 1;
  }

  function isOscillation(scc, data) {
    scc.forEach((item) => {
      if (data[item]["NodeCount"] !== 1 || data[item]["Desc"].length !== 1) {  // TODO overit
        return false;
      }
    });
    return true;
  }

  function compSCC(node, data) {

    const normal = _getSCCset(node, data, 'Desc');
    const reverted = _getSCCset(node, data, 'Backs');

    const scc = Array.from(getIntersection(normal, reverted));

    console.log(scc);

    var color = "hsla(187, 90%, 50%, 0.53)";
    if (isOscillation(scc, data)) {
      color = "hsla(100, 90%, 50%, 0.53)";
    }
    if (isStability(scc)) {
      color = "hsla(295, 90%, 50%, 0.37)";
    }

    scc.forEach((item) => {
      console.log(item, " colored with ", color);
      data[item]['color'] = color;
    });
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

      // Predpocitat obratenu siet, pustit BFS na check SCC
      if (desc_count === 0) {
        compSCC(current, data)
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

    //var cylinders = {};

    const firstHeight = biggestRank * CYLINDER_HEIGHT / 2 + CYLINDER_HEIGHT;
    const firstStartPoint = new Point(0, firstHeight, 0);
    const firstEndPoint = new Point(0, firstHeight - CYLINDER_HEIGHT, 0);

    clustering(scene, data, root_cluster_key, max_branching, 1, firstStartPoint, firstEndPoint, biggestRank);

    /*
    gui.addColor(options, 'sphereColor').onChange(function(e) {

      for (const [key, cylinder] of Object.entries(cylinders)) {
        cylinder.material.color.set(e);
      }
    });
    
      gui.add(options, 'wireframe').onChange(function(e) {
        cylinders.forEach(function(cylinder) {
          cylinder.material.wireframe = e;
        });
      });
    */
  }
}



