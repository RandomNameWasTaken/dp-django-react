import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import { Point, createPoint } from "./Point";
import { Interaction } from "three.interaction-fixed";
import { dec2bin, rad2degrees } from "./utils";



export function init3Dgraphics(canvas, div, data, nodes_ids, h, w) {
  if (data === undefined) {
    return false;
  }

  const CYLINDER_HEIGHT = 8;
  const number_of_nodes = Object.keys(nodes_ids).length;

  const scene = new THREE.Scene();
  //scene.background = new THREE.Color( 0xd3d3d3 );
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

  //const axesHelper = new THREE.AxesHelper(100);
  //scene.add(axesHelper);

  /*
  const gui = new dat.GUI();
  const options = {
    sphereColor : 0xffea00,
    wireframe: false,
  };
*/
  const pointLight = new THREE.PointLight(0x818085);
  pointLight.position.set(20, 20, 20);

  const ambientLight = new THREE.AmbientLight(0xffffff);
  ambientLight.position.set(20, 20, 20);

  scene.add(pointLight, ambientLight);

  //const lightHelper = new THREE.PointLightHelper(pointLight);  // shows position of lighsource
  //const gridHelper = new THREE.GridHelper(30, 20);

  //scene.add(lightHelper, gridHelper);

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

  function crossProduct(a, b) {
    return new THREE.Vector3(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    );
  }

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
    console.log(id);
    const color = new THREE.Color(
      data[id]["Color"] === "" ? calcColor(rank_max, rank) : data[id]["Color"]
    );
    //color.setHex(rank/10 * 0xffffff );
    // color.setHex(rank/10 * 0xffffff );

    var cylinderMesh = function (
      startPoint,
      endPoint,
      midPoint,
      currRadius,
      nextRadius,
      color
    ) {
      /* edge from X to Y */
      const direction = new THREE.Vector3().subVectors(endPoint, startPoint);

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
        Math.max(100, nextRadius * RADIAL_SEGMENTS),
        HEIGHT_SEGMENTS
      );

      const material = new THREE.MeshPhongMaterial({ color: color, flatShading: true });
      const cylinder = new THREE.Mesh(
        edgeGeometry,
        material
      );

      cylinder.applyMatrix4(orientation);
      cylinder.position.set(midPoint.x, midPoint.y, midPoint.z);
      cylinder.cursor = "pointer";
      cylinder.on("click", function (ev) {
        resetOpacity();
        const newMaterial = cylinder.material.clone();
        newMaterial.transparent = true;
        newMaterial.opacity = 0.5;
        cylinder.material = newMaterial;

        texts.forEach(function (text) {
          var selectedObject = scene.getObjectByName(text.name);
          scene.remove(selectedObject);
        });

        var text = "";
        data[id]["Nodes"].forEach(function (elem) {
          if (text !== "") {
            text += ",";
          }
          text += " (";
          const bin = dec2bin(elem, number_of_nodes);

          for (let i = 0; i < bin.length; i++) {
            if (bin[i] === "1") {
              text += " " + nodes_ids[i];
            }
          }
          text += " )";
        });

        div.innerHTML =
          "<b>Rank</b>: " + data[id]["Rank"] + "<br><b>Nodes</b>: " + text;
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
      color
    ); //new THREE.Mesh(geometryCyl, material);
  }

  function getChildsChilds(data, cluster) {
    var childsChildCount = 0;
    for (var i = 0; i < cluster["Desc"].length; ++i) {
      childsChildCount += data[cluster["Desc"][i]].NodeCount;
    }

    if (cluster["Separate"] !== undefined) {
      childsChildCount = data[cluster["Separate"]].NodeCount;
    }

    return childsChildCount;
  }

  function createLine(p1, p2, color) {
    const material = new THREE.LineBasicMaterial( { color: color } );
    const geometry = new THREE.BufferGeometry().setFromPoints( [p1, p2] );
    const line = new THREE.Line( geometry, material );
    scene.add( line );
  }

  function createCoordinatesForSingleSon(point, prevPoint, id) {
    const dirVector = new THREE.Vector3(
      point.x - prevPoint.x,
      point.y - prevPoint.y,
      point.z - prevPoint.z
    );

    var newStartPoint = new Point(point.x, point.y, point.z); // to make copy
    const newPoint = new Point(
      dirVector.x + point.x,
      dirVector.y + point.y,
      dirVector.z + point.z
    );

    return Object.freeze({
      id: id, //cluster["Desc"][0],
      prevPoint: newStartPoint,
      point: newPoint,
    });
  }

  // prevPoint, point - upper and downer middle points of cylinder
  // dirPoint - point to which direction of cylinder (dir vector) should go
  function clustering(
    scene,
    data,
    id,
    max_branching,
    prevPointFirst,
    pointFirst,
    biggestRank
  ) {
    if (id === undefined) {
      console.log("Id is undefined in clustering");
      return;
    }
    const firstId = id;

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

      console.log(current);

      var childsChildCount = getChildsChilds(data, cluster);

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
          stack.push( createCoordinatesForSingleSon(point, prevPoint, cluster["Separate"]) );
      }

      for (var i = 0; i < childCount; ++i) {

        if (childCount === 1 && cluster["Separate"] === undefined) {
          stack.push( createCoordinatesForSingleSon(point, prevPoint, cluster["Desc"][0]) );
          continue;
        }

        const uVector = new THREE.Vector3((-1) * dirVector.y, dirVector.x, 0).normalize();

        const adota = uVector.dot(uVector);
        const crossProductVec = crossProduct(dirVector, uVector);
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

  function compMaxBranching(data, key) {
    let stack = [key];
    var maximums = {};
    var colors = {};

    while (stack.length > 0) {
      const current = stack.pop();
      colors[current] = "G";
      stack.push(current);

      if (maximums[current] === undefined) {
        maximums[current] = 0;
      }

      var count_black = 0;
      const desc_count = data[current]["Desc"].length;
      for (var i = 0; i < desc_count; ++i) {
        if (colors[data[current]["Desc"][i]] === undefined) {
          stack.push(data[current]["Desc"][i]);
        }

        if (colors[data[current]["Desc"][i]] === "B") {
          count_black += 1;
          maximums[current] = Math.max(
            maximums[data[current]["Desc"][i]],
            maximums[current]
          );
        }
      }

      if (count_black === desc_count) {
        colors[current] = "B";
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
    Object.entries(data).forEach(([k, v]) => {
      if (v["Rank"] === 0) {
        root_cluster_key = k;
      }
      biggestRank = Math.max(v["Rank"], biggestRank);
    });

    const max_branching = compMaxBranching(data, root_cluster_key);

    const firstHeight = (biggestRank * CYLINDER_HEIGHT) / 2 + CYLINDER_HEIGHT;
    const firstStartPoint = new Point(0, firstHeight, 0);
    const firstEndPoint = new Point(0, firstHeight - CYLINDER_HEIGHT, 0);

    clustering(
      scene,
      data,
      root_cluster_key,
      max_branching,
      firstStartPoint,
      firstEndPoint,
      biggestRank
    );
  }
}
