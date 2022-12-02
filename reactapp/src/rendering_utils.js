import { dec2bin } from './utils.js';
import * as THREE from "three";
import { Point } from "./Point";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export const NEUTRAL_COLOR = "hsl(255, 0%, 46%)";

export function resetOpacity(cylinders) {
    cylinders.forEach(function (cylinder) {
        const newMaterial = cylinder.material.clone();
        newMaterial.transparent = false;
        newMaterial.opacity = 1;
        cylinder.material = newMaterial;
    });
}
  
export function resetText(texts, scene) {
    texts.forEach(function (text) {
      var selectedObject = scene.getObjectByName(text.name);
      scene.remove(selectedObject);
    });
}
  
export function getChildsChilds(data, cluster) {
    var childsChildCount = 0;
    for (var i = 0; i < cluster["Desc"].length; ++i) {
      childsChildCount += data[cluster["Desc"][i]].NodeCount;
    }
  
    if (cluster["Separate"] !== undefined) {
      childsChildCount = data[cluster["Separate"]].NodeCount;
    }
  
    return childsChildCount;
}

export function createCoordinatesForSingleSon(point, prevPoint, id) {
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

export function createDescriptionForCluster(cluster, cylinder, nodes_ids, number_of_nodes) {
  var text = "";
  cluster["Nodes"].forEach(function (elem) {
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

  const atraktor = cylinder.userData.isAtractor ? "<br><b>Atraktor</b>" : "";
  return "<b>Rank</b>: " + cluster["Rank"] + "<br><b>Nodes</b>: " + text + atraktor;
}
  
export function calcColorBacks(cluster) {
  if (cluster["Backs"].length > 0) {
    return "hsl(259, 20%, 30%)";
  }

  return NEUTRAL_COLOR;
}

export function calcColorRank(max, val) {
  const min = 0
  var minHue = 240, maxHue=0;
  var curPercent = (val - min) / (max-min);
  var colString = "hsl(" + ((curPercent * (maxHue-minHue) ) + minHue) + ",25%,40%)";
  return colString;
}

export function crossProduct(a, b) {
  return new THREE.Vector3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

export function save( blob, filename ) {
  const link = document.createElement( 'a' );
  link.style.display = 'none';
  document.body.appendChild( link );

  link.href = URL.createObjectURL( blob );
  link.download = filename;
  link.click();

  // URL.revokeObjectURL( url ); breaks Firefox...

}

export function saveString( text, filename ) {

  save( new Blob( [ text ], { type: 'text/plain' } ), filename );

}

export function saveArrayBuffer( buffer, filename ) {

  save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );

}

export function exportGLTE(input) {
  const gltfExporter = new GLTFExporter();
  
  gltfExporter.parse(
    input,
    function ( result ) {

      if ( result instanceof ArrayBuffer ) {

        saveArrayBuffer( result, 'object.glb' );

      } else {

        const output = JSON.stringify( result, null, 2 );
        saveString( output, 'object.gltf' );

      }

    },
    function ( error ) {

      console.log( 'An error happened during parsing', error );

    }
  );
};

export function createControls(gui, cylinders, group) {

  /* Colors */
  var parameters_colors = [
    {check: true  }, // color for back edges 
    {check: false }, // color for ranks
    {check: false }, // color for None colors
  ];

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
          cylinder.material.color = new THREE.Color(NEUTRAL_COLOR);
        }
      });
    }
  });

  function setChecked( prop ){
    for (let param in parameters_colors){
      parameters_colors[param].check = false;
    }
    parameters_colors[prop].check = true;
  }

  /* Export */
  const params_export = {
    export: exportGLTEObject,
  };
  var folder_export = gui.addFolder("Export");
	folder_export.add( params_export, 'export' ).name( 'Export in gltf format' );

  /* Move */
  const params_move = {
    right: moveObjectToRight,
    left: moveObjectToLeft,
    up: moveObjectUp,
    down: moveObjectDown,
    close: modeObjectCloser,
    far: moveObjectFar,
  };
  var folder_move = gui.addFolder("Move");
	folder_move.add( params_move, 'right' ).name( 'Move to right' );
	folder_move.add( params_move, 'left' ).name( 'Move to left' );
	folder_move.add( params_move, 'up' ).name( 'Move up' );
	folder_move.add( params_move, 'down' ).name( 'Move down' );
	folder_move.add( params_move, 'close' ).name( 'Move closer' );
	folder_move.add( params_move, 'far' ).name( 'Move away' );

  function moveObjectToRight() {
    group.position.set(group.position.x + 5, group.position.y, group.position.z);
  }

  function moveObjectToLeft() {
    group.position.set(group.position.x - 5, group.position.y, group.position.z);
  }

  function moveObjectUp() {
    group.position.set(group.position.x, group.position.y + 5, group.position.z);
  }

  function moveObjectDown() {
    group.position.set(group.position.x, group.position.y - 5, group.position.z);
  }

  function modeObjectCloser() {
    group.position.set(group.position.x, group.position.y, group.position.z + 5);
  }

  function moveObjectFar() {
    group.position.set(group.position.x, group.position.y, group.position.z - 5);
  }

  function exportGLTEObject() {
    return exportGLTE(group);
  }

}