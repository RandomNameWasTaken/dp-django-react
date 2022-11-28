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
