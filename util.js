export const pick = function(array) {
  const i = Math.floor(Math.random() * (array.length - 1));
  return array[i];
}

// medium.com/@nitinpatel_20236/15ea3f84bfb
export const shuffle = function(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
};

export const arraysEqual = function(a, b) {
  if (a.length != b.length) {
    return false;
  }

  return a.every((elem, ix) => elem === b[ix]);
};
