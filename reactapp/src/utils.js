import * as THREE from "three";


export function getWindowSize() {
    const main_div = document.getElementById('root');
    const innerWidth = main_div.clientWidth;
    const innerHeight = Math.max(main_div.clientHeight, 900);

    return {innerWidth, innerHeight};
}

export function dec2bin(dec, n) {
  dec = Number(dec);
  var res = dec.toString(2);

  while (res.length < n) {
      res = '0' + res;
  }
  return res;
}

export function crossProduct(a, b) {
  return new THREE.Vector3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}