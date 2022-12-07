import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import { Point } from "./Point";
import { Interaction } from "three.interaction-fixed";
import * as rendering_utils from './rendering_utils.js';

// All code necessary for three.js set up and rendering cylinders

export function init3Dgraphics(canvas, description_div, gui_div, data, nodes_ids, h, w) {
  if (data === undefined) {
    return false;
  }

  const number_of_nodes = Object.keys(nodes_ids).length;

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f2ea);
  const camera = new THREE.PerspectiveCamera(
    75,
    canvas.width / canvas.height,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.width, canvas.height); // full size
  camera.position.setZ(100); // for better perspective
  renderer.sortObjects = false;
  renderer.render(scene, camera);

  new Interaction(renderer, scene, camera); // inicialization for later use of onClick

  // For showing text 'global' information about clusters
  var texts = [];
  var cylinders = [];
  
  const gui = new dat.GUI( { autoPlace: false } );
  gui_div.append(gui.domElement);


  // Lighting
  const pointLight = new THREE.PointLight(0x818085);
  pointLight.position.set(20, 20, 20);

  const ambientLight = new THREE.AmbientLight(0xffffff);
  ambientLight.position.set(20, 20, 20);

  scene.add(pointLight, ambientLight);

  window.addEventListener("resize", function () {
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width);
  });

  const controls = new OrbitControls(camera, renderer.domElement);

  processClusters(scene, data);
  data = null;

  function animate() {
    setTimeout(function () {
      requestAnimationFrame(animate);
    }, 1000 / 5);

    controls.update();
    renderer.render(scene, camera);
    pointLight.position.copy(camera.position);
  }

  renderer.setAnimationLoop(animate);

  // Adding cylinders to group for easier moving of this object (in controls "Move")
  const group = new THREE.Group();
  cylinders.forEach(function (cyl) {
    group.add(cyl)
  });
  scene.add(group);

  rendering_utils.createControls(gui, cylinders, group);

  function renderClusters(
    id,
    prevPointFirst,
    pointFirst,
    biggestRank
  ) {
    if (id === undefined) {
      console.log("Id is undefined in clustering");
      return;
    }

    var tuple = Object.freeze({
      id:        id,
      prevPoint: prevPointFirst,
      point:     pointFirst,
    });
    var stack = [tuple];

  // to change direction of descendant for situations when cluster has "Separate" and only 1 other descendant
  // according this the position is swiped from left to right - alternating
    var last_dir_right = false;

    // in each round one cylinder is created and afterwards coordinates of his ancestors are computed and added to stack
    while (stack.length > 0) {
      const stackElement = stack.pop();
      const current = stackElement.id;
      const prevPoint = stackElement.prevPoint;
      const point = stackElement.point;

      var cluster = data[current];
      const childCount = cluster["Desc"].length;

      var childsChildCount = rendering_utils.getChildsChilds(data, cluster);

      const upperRadius = cluster.NodeCount;
      const lowerRadius =
        childCount === 1
          ? childsChildCount
          : childsChildCount + cluster["Desc"].length + (cluster["Separate"] !== undefined ? 1 : 0);

      var cylinder = rendering_utils.createCylinder(
        data,
        current,
        prevPoint,
        point,
        upperRadius,
        lowerRadius,
        data[current]["Rank"],
        biggestRank,
        cylinders,
        texts,
        scene,
        description_div,
        nodes_ids,
        number_of_nodes
      );

      cylinders.push(cylinder);
      scene.add(cylinder);

      var dirVector = new THREE.Vector3(
        point.x - prevPoint.x,
        point.y - prevPoint.y,
        point.z - prevPoint.z
      );

      // If there is separate - put it under current cylinder
      if (cluster["Separate"] !== undefined) {
          stack.push( rendering_utils.createCoordinatesForSingleSon(point, prevPoint, cluster["Separate"]) );
      }

      for (var i = 0; i < childCount; ++i) {

        if (childCount === 1 && cluster["Separate"] === undefined) {
          stack.push( rendering_utils.createCoordinatesForSingleSon(point, prevPoint, cluster["Desc"][0]) );
          continue;
        }

        const uVector = new THREE.Vector3((-1) * dirVector.y, dirVector.x, 0).normalize();

        const adota = uVector.dot(uVector);
        const crossProductVec = rendering_utils.crossProduct(dirVector, uVector);
        const vVector = crossProductVec.divideScalar(adota).normalize();

        // compute new coordinates around circle
        var theta = (2*Math.PI / childCount) * i;
        if (childCount === 1) {
          if (last_dir_right === true) {
            theta = Math.PI; // not 0 but 180
          }
          last_dir_right = !last_dir_right;
        }

        const sin = Math.sin(theta);
        const cos = Math.cos(theta);

        const u = uVector.multiplyScalar(cos * lowerRadius);
        const v = vVector.multiplyScalar(sin * lowerRadius);

        var newStartPoint = u
          .add(v)
          .add(new THREE.Vector3(point.x, point.y, point.z));


        // Vector which will be prolonged from prevPoint to newStartPointer -> to create newEndPoint
        const vector = new THREE.Vector3(
          newStartPoint.x - prevPoint.x,
          newStartPoint.y - prevPoint.y,
          newStartPoint.z - prevPoint.z
        ).normalize();

        const newEndPoint = new Point(
          newStartPoint.x + rendering_utils.CYLINDER_HEIGHT * vector.x,
          newStartPoint.y + rendering_utils.CYLINDER_HEIGHT * vector.y,
          newStartPoint.z + rendering_utils.CYLINDER_HEIGHT * vector.z
        );

        tuple = Object.freeze({
          id: cluster["Desc"][i],
          prevPoint: newStartPoint,
          point: newEndPoint,
        });
        stack.push(tuple);
      }
    }
  }

  function processClusters(scene, data) {
    var root_cluster_key = undefined;
    var biggestRank = 0;
    // find biggest rank and root cluster
    Object.entries(data).forEach(([k, v]) => {
      if (v["Rank"] === 0) {
        root_cluster_key = k;
      }
      biggestRank = Math.max(v["Rank"], biggestRank);
    });

    // initialize first position
    const firstHeight = (biggestRank * rendering_utils.CYLINDER_HEIGHT) / 2 + rendering_utils.CYLINDER_HEIGHT;
    const firstStartPoint = new Point(-20, firstHeight,                   0);
    const firstEndPoint   = new Point(-20, firstHeight - rendering_utils.CYLINDER_HEIGHT, 0);

    renderClusters(
      root_cluster_key,
      firstStartPoint,
      firstEndPoint,
      biggestRank
    );
    
  }
}