import * as jsQUEST from '../src/jsQUEST.js'

// Adapted from https://github.com/kurokida/jsQUEST/blob/v0.1/jsQuestDemo.html
const tActual = -2
const tGuess = -1
const tGuessSd = 2
const pThreshold = 0.82;
const beta = 3.5;
const delta = 0.01;
const gamma = 0.5;
const trialsDesired = 20;
const wrongRight = ['wrong','right'];

let q = jsQUEST.QuestCreate(tGuess, tGuessSd, pThreshold, beta, delta, gamma);
let tTest, response;
for (let k = 0; k < trialsDesired; k++){
    // % Get recommended level.  Choose your favorite algorithm.
    tTest = jsQUEST.QuestQuantile(q); // % Recommended by Pelli (1987), and still our favorite.
    // tTest=QuestMean(q);  // % Recommended by King-Smith et al. (1994)
    // tTest=QuestMode(q).mode;  // % Recommended by Watson & Pelli (1983)

    // % We are free to test any intensity we like, not necessarily what Quest suggested.
    // %  tTest=min(-0.05,max(-3,tTest)); % Restrict to range of log contrasts that our equipment can produce.

    // % Simulate a trial
    response = jsQUEST.QuestSimulate(q, tTest, tActual);
    console.log(`Trial ${k+1} at ${tTest} is  ${wrongRight[response]}`)

    // % Update the pdf
    q = jsQUEST.QuestUpdate(q, tTest, response); // % Add the new datum (actual test intensity and observer response) to the database.
}

// % Ask Quest for the final estimate of threshold.
const myMean = jsQUEST.QuestMean(q); // % Recommended by Pelli (1989) and King-Smith et al. (1994). Still our favorite.
const mySD = jsQUEST.QuestSd(q);
console.log(`Final threshold estimate (mean+-sd) is ${myMean} +- ${mySD}`)

// Testing other functions.
const mode_data = jsQUEST.QuestMode(q)
console.log(`MODE: ${mode_data.mode}; PDF: ${mode_data.pdf}`)

console.log(`QuestTrials without the bin size`);
console.log(jsQUEST.QuestTrials(q))
console.log(`QuestTrials with the bin size`);

const trials_data = jsQUEST.QuestTrials(q,0.1)
console.log(trials_data)

trials_data.intensity.forEach(element => {
    console.log(`The probability is ${jsQUEST.QuestP(q, element - tActual)} at the intensity of ${element}.`)
})

jsQUEST.QuestBetaAnalysis(q)
