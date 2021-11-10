import * as jsQUEST from '../src/jsQUEST.js'

// Adapted from https://github.com/psychopy/psychopy/blob/b5382a33852dccd16312b04a4a5d847c8579673d/psychopy/tests/test_data/test_StairHandlers.py#L436
// Since the test above yielded infinities in the grain, I changed maxVal to 80
const tGuess = 50
const tGuessSd = 50
const pThreshold = 0.82;
const beta = 3.5;
const delta = 0.01;
const gamma = 0.5;
const grain = 0.01;
const range = 80;
const responses = [1, 1, 0, 0, 1, 1, 0, 0, 1, 1]

let q = jsQUEST.QuestCreate(tGuess, tGuessSd, pThreshold, beta, delta, gamma, grain, range);
let tTest;
for (let k = 0; k < responses.length; k++){
    tTest = jsQUEST.QuestQuantile(q);
    q = jsQUEST.QuestUpdate(q, tTest, responses[k]);
}

// % Ask Quest for the final estimate of threshold.
const myMean = jsQUEST.QuestMean(q); // % Recommended by Pelli (1989) and King-Smith et al. (1994).
const mySD = jsQUEST.QuestSd(q);
console.log(` `)
console.log(`The results of jsQUEST, MATLAB, and PsychoPy should be almost equal.`)
console.log(`jsQUEST: Final threshold estimate (mean+-sd) is ${myMean} +- ${mySD}`)
console.log(`MATLAB: Final threshold estimate (mean+-sd) is 79.073768 +- 4.173877`)
console.log(`PsychoPy: Final threshold estimate (mean+-sd) is 79.33662751283129 +- 4.233607966057011`)

// See. https://gitlab.pavlovia.org/tpronk/demo_jsquest/#testing-jsquest-against-psychopy and test/matlab_sample.m