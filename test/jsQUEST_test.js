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
let tTest, response;
for (let k = 0; k < responses.length; k++){
    tTest = jsQUEST.QuestQuantile(q);
    q = jsQUEST.QuestUpdate(q, tTest, responses[k]);
}

// % Ask Quest for the final estimate of threshold.
const myMean = jsQUEST.QuestMean(q); // % Recommended by Pelli (1989) and King-Smith et al. (1994). Still our favorite.
const mySD = jsQUEST.QuestSd(q);
console.log(`Final threshold estimate (mean+-sd) is ${myMean} +- ${mySD}`)
