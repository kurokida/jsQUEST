const numeric = require("./numeric-module.js");
console.log(numeric.linspace(1,5))
console.log(numeric.mul(2,3))

const jsQUEST = require("./jsQUEST2.js");
// import interp1 from 'interp1';

// const tActual = -2
const tGuess = -1
const tGuessSd = 2
const pThreshold = 0.82;
const beta = 3.5;
const delta = 0.01;
const gamma = 0.5;

let q = jsQUEST.QuestCreate(tGuess, tGuessSd, pThreshold, beta, delta, gamma);
