# A prototype of jsQUEST as an ES6 module
This prototype is a fork of [jsQUEST](https://github.com/kurokida/jsQUEST) by Daiichiro Kuroki. I adapted the code to act like an ES6 module, so it can easily be imported into other ES6 modules.

# Installation
Install node, then clone the repo to your hard drive. Next, you can install jsQUEST and its dependencies by running:

`npm install`

# Building jsQUEST
To package jsQUEST and it's dependencies, and export those as UMD bundle, run the command below. Your bundle will be available in the `dist/` directory:

`rollup -c`

# Demos and Tests
## Demo
This script reproduces [jsQuest's demo](https://github.com/kurokida/jsQUEST/blob/main/jsQuestDemo.html), but without the graph.

`node jsQUEST_demo.js`

## Demo
This script reproduces [a test of jsQuest against PsychoPy](https://gitlab.pavlovia.org/tpronk/demo_jsquest/#testing-jsquest-against-psychopy).

`node jsQUEST_test.js`


# Notes
* As it is now it can be used as a module in a web-browser, but I'll need to ask around a bit to find out how to best build a version that acts like a global variable (for use in jsPsych, for example).
* jsQUEST depends on the numeric library, which I forked and turned into an ES6 module as well. The fork of numeric can be found [here](https://github.com/tpronk/numeric).
