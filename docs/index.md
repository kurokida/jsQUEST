# jsQUEST: A Bayesian adaptive psychometric method for measuring thresholds in online experiments.

Using adaptive psychometric procedures, the experimenter can determine the stimulus intensity based on the outcome of the preceding trials. Watson and Pelli (1983) reported QUEST which uses a Bayesian method to estimate the position of the psychometric function. jsQUEST is a translation of QUEST into JavaScript to use in online experiments.

# A psychometric function which assumes the Weibull distribution. 

Figure 1 shows a psychophysical function which assumes the Weibull distribution. You can also see this graph in [the demo](https://www.hes.kyushu-u.ac.jp/~kurokid/QUEST/jsPsychDemo/jsQUEST_jsPsychDemo.html). 

![Weibull](./images/Weibull_function.png)

This graph has been drawn using the following default values:

- The actual (true) threshold you want to know: tActual (Default: -2)
- Your guess about the threshold: tGuess (Default: -1)
- Your guess about the standard deviation of the threshold: tGuessSd (Default: 2)
- Threshold criterion expressed as probability: pThreshold (Default: 0.82)
- The parameters of a Weibull psychometric function: Beta (Default: 3.5). The slope of the psychometric function.
- The parameters of a Weibull psychometric function: Delta (Default: 0.01). The probability of making mistakes by participants at intensities significantly greater than the threshold.
- The parameters of a Weibull psychometric function: Gamma (Default: 0.5). The probability of a success (a response of YES) at zero intensity.

Note that the x-axis is the log scale. The pink circle represents the actual threshold (tActual). The experimenter does not usually know the value, and wants to know it by conducting the experiment. The tActual is used only for simulation, and is not necessarily required to run QUEST. The tGuess determines the horizontal position of the psychometric function, while the Beta, Delta, and Gamma determines the shape of the psychometric function. The tGuessSd affects the probability density function (PDF) of thresholds.

You'll see that the probability has changed from 0.5 to 1.0 in about one tick at the x-axis (log scale) in Figure 1. In other words, when observers see a stimulus that is about 10 times more intense than the stimulus that results in a 50 % correct response rate, they will give a 100 % correct response. By using the default values (Beta = 3.5, Delta = 0.01, Gamma = 0.5), the experimenter is assuming such a psychophysical function.

# Stimulus intensity

Before beggining the experiment, the experimenter needs to determine what the intensity of the stimulus is. For example, it could be the luminance/color contrast, size, length, or number of dots. If you are interested in the Müller-Lyer illusion, the stimulus intensity might be the ratio of the two lines. The experimenter is free to determine the intensity of the stimulus as long as it is considered to fit the psychophysical function.

# Threshold criterion expressed as probability (pThreshold)

Specify the probability that the experimenter is interested in. It is conventionally 75% for the two-alternative forced choice task, and 50% for the yes/no task. The default is 82%.

# Guess the threshold (tGuess)

Estimate of the stimulus intensity that is expected to result in a response rate of pThreshold. The default is -1. Given that the x-axis is the log scale, the default means 10^(-1) = 0.1. The symbol "^" means a power in this document.

# How to use jsQUEST

The usage of jsQUEST is the same as QUEST distributed as a part of Psychtoolbox. So, you can refer to [the help of Psychtoolbox](http://psychtoolbox.org/docs/Quest).

At first, call the QuestCreate function like this.

```javascript 
myquest = QuestCreate(tGuess, tGuessSd, pThreshold, beta, delta, gamma);
```

The QuestQuantile function returns a suggestion of stimulus intensity for the next trial. You can use the QuestMean or QuestMode functions instead of the QuestQuantile.

```javascript 
const tTest = QuestQuantile(myquest);	
```

If the default values are used, the first call of QuestQuantile returns -0.65. Note that the difference between the returned value (-0.65) and tGuess(-1) is 0.35. The QuestQuantile proposes to present a stimulus with 10^0.35 = 2.24 times the intensity of the tGuess (the intensity of the first stimulus) for the next trial. As long as the same Beta, Delta, and Gamma are used the difference between the returned value and tGuess will be about 0.35, no matter what the value of tGuess is.

The procedure of QUEST is easy to understand when the intensity of the stimulus is on a log scale, e.g. dB, while in other cases I recommend to think of it as follows. For example, if the experimenter predicts that the stimulus intensity of 150 pixels will result in a response rate of pThreshold (0.82), then tGuess should be log10(150) = 2.18. If the default values regarding Beta, Delta, and Gamma are used, the first call of QuestQuantile returns 2.53. Note that the difference between the returned value (2.18) and tGuess(2.53) is 0.35. This is the same as when tGuess is -1. The QuestQuantile proposes to present a stimulus with 10^0.35 = 2.24 times the intensity. The intensity can be calculated in one of two ways: (a) 150 * 2.24, or (b) 10^(2.53). The results of the two formulas are almost identical (about 338 pixels).

## Update the PDF

```javascript
myquest = QuestUpdate(myquest, tTest, response); // % Add the new datum (actual test intensity and observer response) to the database.
```

Update the PDF of thresholds by specifing the current/latest stimulus intensity (tTest) and the response (YES/SUCCESS = 1 or NO/FAILURE = 0). The tTest is not necessarily the value suggested by QUEST. For example, there may be upper and lower limits of the stimulus intensity. If QUEST proposes a value that exceeds these limits, it can be changed to an appropriate value. The important thing is to update the PDF with the actual stimulus intensity (tTest) and the response.

## Termination rules

Watson and Pelli (1983) recommended to stop updating (a) when a confidence interval for the location of threshold is smaller than a specified size, or (b) after a fixed number of trials. Pelli also suggests to update the PDF 40 times in his demo program.

## Estimate of the threshold

Finally, the experimenter can estimate the threshold and its standard deviation in the following way:

```javascript
const threshold = QuestMean(myquest); // % Recommended by Pelli (1989) and King-Smith et al. (1994). 
const sd = QuestSd(myquest);
```

# Functions

These are the links to the original MATLAB version of QUEST. 

- [QuestCreate](http://psychtoolbox.org/docs/QuestCreate)
- [QuestUpdate](http://psychtoolbox.org/docs/QuestUpdate)
- [QuestMean](http://psychtoolbox.org/docs/QuestMean)
- [QuestMode](http://psychtoolbox.org/docs/QuestMode)
- [QuestQuantile](http://psychtoolbox.org/docs/QuestQuantile)
- [QuestSd](http://psychtoolbox.org/docs/QuestSd)
- [QuestBetaAnalysis](http://psychtoolbox.org/docs/QuestBetaAnalysis)
- [QuestP](http://psychtoolbox.org/docs/QuestP)
- [QuestPdf](http://psychtoolbox.org/docs/QuestPdf)
- [QuestRecompute](http://psychtoolbox.org/docs/QuestRecompute)
- [QuestSimulate](http://psychtoolbox.org/docs/QuestSimulate)
- [QuestTrials](http://psychtoolbox.org/docs/QuestTrials)

There is no difference in usage between the MATLAB and JavaScript versions except for the following points.

- QuestBetaAnalysis does not support outputting to a file.
- QuestMode returns an object with the 'mode' and 'pdf' properties.
- QuestRecompute takes the third and fourth arguments. The third argument means the width of the chart, and the forth argument means the height of the chart.
- QuestSimulate takes the fifth and sixth arguments. The fifth argument means the width of the chart, and the sixth argument means the height of the chart.
