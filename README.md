# jsQUEST: A Bayesian adaptive psychometric method for measuring thresholds in online experiments.

The goal of this project is to run [QUEST distributed as a part of Psychtoolbox](http://psychtoolbox.org/docs/Quest) in online experiments.

The files published here are translated from MATLAB files written by [Professor Denis Pelli](https://as.nyu.edu/faculty/denis-pelli.html) to JavaScript files. Almost all of the MATLAB code is commented out in each JavaScript file. The usage of each function is the same as that of MATLAB functions. So, you can refer to the help of Psychtoolbox.

Users of jsPsych should run [jsPsychDemo/jsQUEST_jsPsychDemo.html](https://www.hes.kyushu-u.ac.jp/~kurokid/QUEST/jsPsychDemo/jsQUEST_jsPsychDemo.html). Otherwise, please run [jsQuestDemo.html](https://www.hes.kyushu-u.ac.jp/~kurokid/QUEST/jsQuestDemo.html).

## Important changes from Psychtoolbox
- QuestBetaAnalysis does not support outputting to a file.
- QuestMode returns an object with the 'mode' and 'pdf' properties.
- QuestRecompute takes the third and fourth arguments. The third argument means the width of the chart, and the forth argument means the height of the chart.
- QuestSimulate takes the fifth and sixth arguments. The fifth argument means the width of the chart, and the sixth argument means the height of the chart.

## Libraries
- Using [the numeric](https://github.com/sloisel/numeric), it is possible to perform matrix/array calculations at high speed.
- [The interp1 function](https://www.npmjs.com/package/interp1) is used for 1-D data interpolation. [GitHub page](https://github.com/Symmetronic/interp1).
- [Chart.js](https://www.chartjs.org/) is used for drawing graphs. [GitHub page](https://github.com/chartjs/Chart.js)
- I introduce [StaircaseJS] although it is not used in jsQUEST.

## Memo
At first, I tried to use the numeric.spline function instead of the interp1 function. However, I was not able to get the proper xThreshold under the following conditions:

```javascript

const tGuess = -1
const tGuessSd = 2
const pThreshold=0.82;
const beta=4.76;
const delta=0.01;
const gamma=0.5;
const grain= 0.02
const dim = 250
let q = QuestCreate(tGuess, tGuessSd, pThreshold, beta, delta, gamma, grain, grain*dim, 1);

```

In the above condition, xThreshold was -40.88. (The correct value was 0.0036). In other conditions, the numeric.spline function returned the correct value. The cause is unknown.
