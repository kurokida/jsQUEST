# jsQUEST: A Bayesian adaptive psychometric method for measuring thresholds in online experiments.

The QUEST method (Watson & Pelli, 1983) is a Bayesian adaptive psychometric method. jsQuest is a JavaScript library to use the QUEST method in online experiments.

The files published here are translated from MATLAB files written by [Professor Denis Pelli](https://as.nyu.edu/faculty/denis-pelli.html) to JavaScript files. Almost all of the MATLAB code is commented out in each JavaScript file. The usage of each function is the same as that of MATLAB functions. So, you can refer to [the help of Psychtoolbox](http://psychtoolbox.org/docs/Quest).

If you are more interested in [QUEST+ (Watson, 2017)](https://jov.arvojournals.org/article.aspx?articleid=2611972) than QUEST, then you can use [jsQuestPlus](https://github.com/kurokida/jsQuestPlus) instead.

# How to use
Please refer to [this page](https://kurokida.github.io/jsQUEST/).

# Demonstration

Please run [jsPsychDemo/jsQUEST_jsPsychDemo.html](https://www.hes.kyushu-u.ac.jp/~kurokid/QUEST/jsPsychDemo/jsQUEST_jsPsychDemo.html). You will see that the peak of the posterior probability density function (PDF) gets closer to the truth value as you run more trials. This demo program is combined with [jsPsych](https://www.jspsych.org/).

[dist/demo.html](https://www.hes.kyushu-u.ac.jp/~kurokid/QUEST/dist/demo.html) does not use the jsPsych library. The results of all simulations can be observed in a JavaScript console window. If you are not a jsPsych user, this demo may be more useful for you.

# Important changes from Psychtoolbox
- QuestBetaAnalysis does not support outputting to a file.
- QuestMode returns an object with the 'mode' and 'pdf' properties.
- QuestRecompute takes the third and fourth arguments. The third argument means the width of the chart, and the forth argument means the height of the chart.
- QuestSimulate takes the fifth and sixth arguments. The fifth argument means the width of the chart, and the sixth argument means the height of the chart.

# Libraries
- Using [the numeric](https://github.com/sloisel/numeric), it is possible to perform matrix/array calculations at high speed.
- [The interp1 function](https://www.npmjs.com/package/interp1) is used for 1-D data interpolation. [GitHub page](https://github.com/Symmetronic/interp1).
- [Chart.js](https://www.chartjs.org/) is used for drawing graphs. [GitHub page](https://github.com/chartjs/Chart.js)
- I introduce [StaircaseJS](https://github.com/hadrienj/StaircaseJS) although it is not used in jsQUEST.

# Memo
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

# The following section describes how to use jsQUEST as an ES6 module.

@tpronk developed a prototype of jsQUEST as an ES6 module. He adapted the code to act like an ES6 module, so it can easily be imported into other ES6 modules as follows:

```javascript
import {jsquest} from "./jsQUEST.module.js";
```

# Information for developers/contributors

## Installation
Install node, then clone the repo to your hard drive. Next, you can install jsQUEST and its dependencies by running:

`npm install`

## Building jsQUEST
To package jsQUEST and it's dependencies, and export those as UMD bundle, run the command below. Your bundle will be available in the `dist/` directory:

`npx rollup -c`

## Demos and Tests
### Demo
This script reproduces [jsQuest's demo](https://github.com/kurokida/jsQUEST/blob/main/jsPsychDemo/jsQUEST_jsPsychDemo.html), but without the graph.

`node test/jsQUEST_demo.js`

### Demo
This script reproduces [a test of jsQuest against PsychoPy](https://gitlab.pavlovia.org/tpronk/demo_jsquest/#testing-jsquest-against-psychopy).

`node test/jsQUEST_test.js`


## Notes
jsQUEST depends on the numeric library, which @tpronk forked and turned into an ES6 module as well. The fork of numeric can be found [here](https://github.com/tpronk/numeric).
