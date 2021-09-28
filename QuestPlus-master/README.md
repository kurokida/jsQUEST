# QuestPlus: a MATLAB implementation of the QUEST+ adaptive psychometric method

QuestPlus is a MATLAB implementation of the QUEST+ adaptive psychometric method. It provides a rapid and flexible method of estimating the parameters of a psychophysical model, and is also capable of advising the user on the most appropriate stimuli to present, and on when to terminate testing. Of particular note is the algorithm’s ability to use prior information, its ability to determine the maximally informative stimulus on each trial, its ability to fit arbitrarily complex models, and its ability to vary multiple stimulus properties simultaneously.

### Quick Start: Setting up
1. Download the Zip archive and unzip it into an appropriate directory
2. Run QuestPlus.runExample(1) in MATLAB

### System Requirements
**Operating system:**
QuestPlus is pure MATLAB code, and should function on all operating systems in which MATLAB is supported.

**Programming language:**
QuestPlus requires MATLAB V2012 or later. . Due to the use of modern OOP syntax, QuestPlus is not compatible with earlier versions of MATLAB, or with Octave.

**Dependencies:**
There are no MATLAB dependencies in the core QUEST+ algorithm. However, several of the examples of use require the statistics toolbox.

### License
GNU GPL v3.0

### More Info
[Watson (2017) QUEST+: A general multidimensional Bayesian adaptive psychometric method, Journal of Vision, 17(10)](http://jov.arvojournals.org/article.aspx?articleid=2611972)

### Enjoy!
@petejonze  
28/09/2017