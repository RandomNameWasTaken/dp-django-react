import { dec2bin } from './utils.js';
import * as THREE from "three";
import { Point } from "./Point";


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