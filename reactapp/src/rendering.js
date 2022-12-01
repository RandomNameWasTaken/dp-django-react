import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import { Point } from "./Point";
import { Interaction } from "three.interaction-fixed";
import * as rendering_utils from './rendering_utils.js';

export function init3Dgraphics(canvas, description_div, gui_div, data, nodes_ids, h, w) {
  if (data === undefined) {
    return false;
  }

  const CYLINDER_HEIGHT = 8;
  const number_of_nodes = Object.keys(nodes_ids).length;

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
  camera.position.setZ(30); // for better perspective
  renderer.sortObjects = false;
  renderer.render(scene, camera);

  new Interaction(renderer, scene, camera);

  // For showing text information about clusters
  var texts = [];
  var cylinders = [];
  
  const gui = new dat.GUI( { autoPlace: false } );
  gui_div.append(gui.domElement);
  var parameters_colors = [
    {check: true  }, // color for back edges 
    {check: false }, // color for ranks
    {check: false }, // color for None colors
  ]

  var parameters_wireframe = [
    {check: false }, 
  ]

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

  window.addEventListener("resize", function () {
    camera.aspect = canvas.width / canvas.width;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width, canvas.width);
  });

  function createCylinder(
    data,
    id,
    startPoint,
    endPoint,
    currRadius,
    nextRadius,
    rank,
    rank_max
  ) {

    const isAtractor = data[id]["Color"] !== "";

    const colorBacks = new THREE.Color(
      isAtractor ? data[id]["Color"] : rendering_utils.calcColorBacks(data[id])
    );

    const colorRank = new THREE.Color(
      isAtractor ? data[id]["Color"] : rendering_utils.calcColorRank(rank_max, rank)
    );

    var cylinderMesh = function (
      startPoint,
      endPoint,
      midPoint,
      currRadius,
      nextRadius,
      colorBacks,
      colorRank,
      isAtractor
    ) {

      const orientation = new THREE.Matrix4();
      /* THREE.Object3D().up (=Y) default orientation for all objects */
      orientation.lookAt(startPoint, endPoint, new THREE.Object3D().up);

      /* rotation around axis X by -90 degrees
       * matches the default orientation Y
       * with the orientation of looking Z */
      const mat = new THREE.Matrix4();
      mat.set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
      orientation.multiply(mat);

      /* cylinder: radiusAtTop, radiusAtBottom, 
          height, radiusSegments, heightSegments */
      const RADIAL_SEGMENTS = 8;
      const HEIGHT_SEGMENTS = 1;
      const edgeGeometry = new THREE.CylinderGeometry(
        currRadius,
        nextRadius,
        CYLINDER_HEIGHT,
        RADIAL_SEGMENTS,
        HEIGHT_SEGMENTS
      );

      const material = new THREE.MeshPhongMaterial({ color: colorBacks, flatShading: true });
      const cylinder = new THREE.Mesh(
        edgeGeometry,
        material
      );

      cylinder.applyMatrix4(orientation);
      cylinder.position.set(midPoint.x, midPoint.y, midPoint.z);
      cylinder.cursor = "pointer";

      cylinder.userData.colorBacks = colorBacks;
      cylinder.userData.colorRank  = colorRank;
      cylinder.userData.isAtractor = isAtractor;

      cylinder.on("click", function () {
        rendering_utils.resetOpacity(cylinders);
        const newMaterial = cylinder.material.clone();
        newMaterial.transparent = true;
        newMaterial.opacity = 0.5;
        cylinder.material = newMaterial;

        rendering_utils.resetText(texts, scene);
        description_div.innerHTML = rendering_utils.createDescriptionForCluster(data[id], cylinder, nodes_ids, number_of_nodes);
      });

      return cylinder;
    };

    const midPoint = new Point(
      (startPoint.x + endPoint.x) / 2,
      (startPoint.y + endPoint.y) / 2,
      (startPoint.z + endPoint.z) / 2
    );
    return cylinderMesh(
      startPoint,
      endPoint,
      midPoint,
      currRadius,
      nextRadius,
      colorBacks,
      colorRank,
      isAtractor
    );
  }

  // prevPoint, point - upper and downer middle points of cylinder
  // dirPoint - point to which direction of cylinder (dir vector) should go
  function clustering(
    scene,
    data,
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
      id: id,
      prevPoint: prevPointFirst,
      point: pointFirst,
    });
    var stack = [tuple];

  // to change direction of descendant for situations when cluster has "Separate" and only 1 other descendant
  // according this the position is swiped from left to right - alternating
    var last_dir_right = false;

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

      var cylinder = createCylinder(
        data,
        current,
        prevPoint,
        point,
        upperRadius,
        lowerRadius,
        data[current]["Rank"],
        biggestRank
      );

      cylinders.push(cylinder);
      scene.add(cylinder);

      var dirVector = new THREE.Vector3(
        point.x - prevPoint.x,
        point.y - prevPoint.y,
        point.z - prevPoint.z
      );

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

        // COMPUTE NEW COORDINATES around circle
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

        var newStartPointHelper = u
          .add(v)
          .add(new THREE.Vector3(point.x, point.y, point.z));


        // Vector which will be prolonged from prevPoint to newStartPointer -> to create newEndPoint
        const vector = new THREE.Vector3(
          newStartPointHelper.x - prevPoint.x,
          newStartPointHelper.y - prevPoint.y,
          newStartPointHelper.z - prevPoint.z
        ).normalize();

        const newEndPoint = new Point(
          newStartPointHelper.x + CYLINDER_HEIGHT * vector.x,
          newStartPointHelper.y + CYLINDER_HEIGHT * vector.y,
          newStartPointHelper.z + CYLINDER_HEIGHT * vector.z
        );

        tuple = Object.freeze({
          id: cluster["Desc"][i],
          prevPoint: newStartPointHelper,
          point: newEndPoint,
        });
        stack.push(tuple);
      }
    }
  }

  function processClusters(scene, data) {
    var root_cluster_key = undefined;
    var biggestRank = 0;
    Object.entries(data).forEach(([k, v]) => {
      if (v["Rank"] === 0) {
        root_cluster_key = k;
      }
      biggestRank = Math.max(v["Rank"], biggestRank);
    });

    const firstHeight = (biggestRank * CYLINDER_HEIGHT) / 2 + CYLINDER_HEIGHT;
    const firstStartPoint = new Point(0, firstHeight,                   0);
    const firstEndPoint   = new Point(0, firstHeight - CYLINDER_HEIGHT, 0);

    clustering(
      scene,
      data,
      root_cluster_key,
      firstStartPoint,
      firstEndPoint,
      biggestRank
    );

    var folder = gui.addFolder("Colors");
    folder.add(parameters_colors[0], 'check').name('Back edges').listen().onChange(function(e)
    {
      setChecked(0);
      if (e) {
        cylinders.forEach(function(cylinder) {
          if (!cylinder.userData.isAtractor) {
            cylinder.material.color = cylinder.userData.colorBacks;
          }
        });
      }
    });

    folder.add(parameters_colors[1], 'check').name('Ranks').listen().onChange(function(e)
    {
      setChecked(1);
      if (e) {
        cylinders.forEach(function(cylinder) {
          if (!cylinder.userData.isAtractor) {
            cylinder.material.color = cylinder.userData.colorRank;
          }
        });
      }
    });

    folder.add(parameters_colors[2], 'check').name('None').listen().onChange(function(e)
    {
      setChecked(2);
      if (e) {
        cylinders.forEach(function(cylinder) {
          if (!cylinder.userData.isAtractor) {
            cylinder.material.color = new THREE.Color(rendering_utils.NEUTRAL_COLOR);
          }
        });
      }
    });

    var folder_wireframe = gui.addFolder("Wireframe");
    folder_wireframe.add(parameters_wireframe[0], 'check').name('Wireframe').listen().onChange(function(e)
    {
      cylinders.forEach(function(cylinder) {
        cylinder.material.wireframe = e;
      });
    }); 

    function setChecked( prop ){
      for (let param in parameters_colors){
        parameters_colors[param].check = false;
      }
      parameters_colors[prop].check = true;
    }
    
  }
}
