import numeric from 'numeric_es6';
import interp1 from 'interp1';

console.log('jsQUEST Version 1.0.1')

// Copyright (c) 2021 Daiichiro Kuroki
// Released under the MIT license
//  
function QuestCreate(tGuess, tGuessSd, pThreshold, beta, delta, gamma, grain, range, plotIt){
    // q=QuestCreate(tGuess,tGuessSd,pThreshold,beta,delta,gamma,[grain],[range],[plotIt])

    // Create a struct q with all the information necessary to measure threshold. 
    // Threshold "t" is measured on an abstract "intensity" scale, which usually corresponds to log10 contrast.

    // QuestCreate saves in struct q the parameters for a Weibull psychometric function:

    // p2=delta*gamma+(1-delta)*(1-(1-gamma)*exp(-10.^(beta*(x-xThreshold))));

    // where x represents log10 contrast relative to threshold. 

    // The Weibull function itself appears only in QuestRecompute, which uses the specified parameter values in q 
    // to compute a psychometric function and store it in q. 

    // All the other Quest functions simply use the psychometric function stored in "q". 
    // QuestRecompute is called solely by QuestCreate and QuestBetaAnalysis (and possibly by a few user programs). 
    // Thus, if you prefer to use a different kind of psychometric function, called Foo, 
    // you need only create your own QuestCreateFoo, QuestRecomputeFoo, and (if you need it)
    // QuestBetaAnalysisFoo, based on QuestCreate, QuestRecompute, and QuestBetaAnalysis, and you can use them 
    // with the rest of the Quest package unchanged. 
    // You would only be changing a few lines of code, so it would quite easy to do.

    // Several users of Quest have asked questions on the Psychtoolbox forum about how to restrict themselves to 
    // a practical testing range. 
    // That is not what tGuessSd and "range" are for; they should be large, e.g. I typically set tGuessSd=3 and range=5 
    // when intensity represents log contrast. 
    // If necessary, you should restrict the range yourself, outside of Quest. 
    // Here, in QuestCreate, you tell Quest about your prior beliefs, and you should try to be open-minded, 
    // giving Quest a generously large range to consider as possible values of threshold. 
    // For each trial you will later ask Quest to suggest a test intensity. 
    // It is important to realize that what Quest returns is just what you asked for, a suggestion. 
    // You should then test at whatever intensity you like, taking into account both the suggestion and any practical constraints
    //  (e.g. a maximum and minimum contrast that you can achieve, and quantization of contrast). 
    // After running the trial you should call QuestUpdate with the contrast that you actually used 
    // and the observer's response to add your new datum to the database. 
    // Don't restrict "tGuessSd" or "range" by the limitations of what you can display. 
    // Keep open the possibility that threshold may lie outside the range of contrasts that you can produce, 
    // and let Quest consider all possibilities.

    // There is one exception to the above advice of always being generous with tGuessSd. 
    // Occasionally we find that we have a working Quest-based program that measures threshold, 
    // and we discover that we need to measure the proportion correct at a particular intensity. 
    // Instead of writing a new program, or modifying the old one, it is often more convenient 
    // to instead reduce tGuessSd to practically zero, e.g. a value like 0.001, which has the effect of restricting all threshold 
    // estimates to be practically identical to tGuess, making it easy to run any number of trials at that intensity. 
    // Of course, in this case, the final threshold estimate from Quest should be ignored, since it is merely parroting back to you 
    // the assertion that threshold is equal to the initial guess "tGuess". 
    // What's of interest is the final proportion correct; at the end, call QuestTrials or add an FPRINTF statement to report it.

    // tGuess is your prior threshold estimate.
    // tGuessSd is the standard deviation you assign to that guess. Be generous. 

    // pThreshold is your threshold criterion expressed as probability of response==1. 
    // An intensity offset is introduced into the psychometric function so that threshold (i.e. the midpoint of the table) yields pThreshold.

    // beta, delta, and gamma are the parameters of a Weibull psychometric function.
    // beta controls the steepness of the psychometric function. Typically 3.5.
    // delta is the fraction of trials on which the observer presses blindly. Typically 0.01.
    // gamma is the fraction of trials that will generate response 1 when intensity==-inf.

    // grain is the quantization (step size) of the internal table. E.g. 0.01.
    // range is the intensity difference between the largest and smallest intensity that the internal table can store. E.g. 5. 
    // This interval will be centered on the initial guess tGuess, i.e. tGuess+(-range/2:grain:range/2). 
    // "range" is used only momentarily here, to determine "dim", which is retained in the quest struct. 
    // "dim" is the number of distinct intensities that the internal table can store, e.g. 500. 
    // QUEST assumes that intensities outside of this interval have zero prior probability, i.e. they are impossible values for threshold. 

    // The cost of making "range" too big is some extra storage and computation, which are usually negligible. 
    // The cost of making "range" too small is that you prejudicially exclude what are actually possible values for threshold. 
    // Getting out-of-range warnings from QuestUpdate is one possible indication that your stated range is too small.

    // % Copyright (c) 1996-2004 Denis Pelli

    let q = {}

    if (typeof tGuess === 'undefined') {
        alert('Please specify tGuess as a parameter of QuestCreate.') 
        return
    } else {
        q.tGuess = tGuess;
    }
    
    if (typeof tGuessSd === 'undefined') {
        alert('Please specify tGuessSd as a parameter of QuestCreate.') 
        return
    } else {
        q.tGuessSd = tGuessSd;
    }

    if (typeof pThreshold === 'undefined') {
        alert('Please specify pThreshold as a parameter of QuestCreate.') 
        return
    } else {
        q.pThreshold = pThreshold;
    }

    if (typeof beta === 'undefined') {
        alert('Please specify beta as a parameter of QuestCreate.') 
        return
    } else {
        q.beta = beta;
    }

    if (typeof delta === 'undefined') {
        alert('Please specify delta as a parameter of QuestCreate.') 
        return
    } else {
        q.delta = delta;
    }

    if (typeof gamma === 'undefined') {
        alert('Please specify gamma as a parameter of QuestCreate.') 
        return
    } else {
        q.gamma = gamma;
    }

    // if nargin < 7 || isempty(grain)
    //     grain=0.01;
    // end
    if (typeof grain === 'undefined') {
        q.grain = 0.01
    } else {
        q.grain = grain;
    }

    // if nargin < 8 || isempty(range)
    //     dim=500;
    // else
    //     if range<=0
    //         error('"range" must be greater than zero.')
    //     end
    //     dim=range/grain;
    //     dim=2*ceil(dim/2);	% round up to an even integer
    // end
    let dim = 500
    if (typeof range !== 'undefined') {
        if (range <= 0) {
            alert('The range parameter must be greater than zero.')
            return
        }
        dim = range/grain;
        dim = 2 * Math.ceil(dim/2);	// round up to an even integer
    }

    // if nargin < 9 || isempty(plotIt)
    //     plotIt = 0;
    // end
    if (typeof plotIt === 'undefined') {
        plotIt = 0
    } 

    // pending
    // if ~isfinite(tGuess) || ~isreal(tGuess)
    //     error('"tGuess" must be real and finite.');
    // end
    // JavaScript does not have a isreal function.
    if (!numeric.isFinite(tGuess)){
        alert('The tGuess parameter must be finite.');
    }

    // q.updatePdf=1; % boolean: 0 for no, 1 for yes
    q.updatePdf = 1;
    q.warnPdf = 1; // boolean
    q.normalizePdf = 1; // boolean. This adds a few ms per call to QuestUpdate, but otherwise the pdf will underflow after about 1000 trials.
    q.dim = dim;

    return QuestRecompute(q, plotIt);
    // return QuestRecompute(q, 1, 400, 300);
    
}
 
function diff(my_array){
    const differences = []
    my_array.forEach((element, index, array) => {
      if (index < my_array.length - 1){
          differences.push(array[index+1] - element)
      }
    });
    return differences
}

function find_non_zero_index(my_array){
    const indices = []
    my_array.forEach((element, index) => {
      if (element !== 0){
          indices.push(index)
      }
    });
    return indices
}

function find_more_than_zero_index(my_array){
    const indices = []
    my_array.forEach((element, index) => {
      if (element > 0){
          indices.push(index)
      }
    });
    return indices
}

function find_less_than_or_equal_to_zero_index(my_array){
    const indices = []
    my_array.forEach((element, index) => {
      if (element <= 0){
          indices.push(index)
      }
    });
    return indices
}

function get_array_using_index(array, indices){
    const values = []
    indices.forEach(element => {
      values.push(array[element])
    });
    return values
}

function fliplr(array){
    const result = []
        array.forEach((element, index, array) => {
            result.push(array[array.length-1-index])
        });
    return result
}

function max_of_array(arr){
    return arr.reduce(function(a, b) {
        return Math.max(a, b);
    });
}

function min_of_array(arr){
    return arr.reduce(function(a, b) {
        return Math.min(a, b);
    });
}

let recompute_chart, recompute_chart2

function QuestRecompute(q, plotIt, chart_width, chart_height){
    // q=QuestRecompute(q [,plotIt=0])

    // Call this immediately after changing a parameter of the psychometric function. 
    // QuestRecompute uses the specified parameters in "q" to recompute the psychometric function. 
    // It then uses the newly computed psychometric function and the history in q.intensity and q.response to recompute the pdf. 
    // (QuestRecompute does nothing if q.updatePdf is false.)

    // QuestCreate saves in struct q the parameters for a Weibull psychometric function:

    // p2=delta*gamma+(1-delta)*(1-(1-gamma)*exp(-10.^(beta*(x-xThreshold))));

    // where x represents log10 contrast relative to threshold. 
    // The Weibull function itself appears only in QuestRecompute, which uses the specified parameter values in q 
    // to compute a psychometric function and store it in q. 
    // All the other Quest functions simply use the psychometric function stored in "q". 
    // QuestRecompute is called solely by QuestCreate and QuestBetaAnalysis (and possibly by a few user programs). 
    // Thus, if you prefer to use a different kind of psychometric function, called Foo, you need only create your own 
    // QuestCreateFoo, QuestRecomputeFoo, and (if you need it) QuestBetaAnalysisFoo, based on QuestCreate, QuestRecompute, 
    // and QuestBetaAnalysis, and you can use them with the rest of the Quest package unchanged. 
    // You would only be changing a few lines of code, so it would quite easy to do.

    // "dim" is the number of distinct intensities that the internal tables in q can store, e.g. 500. 
    // This vector, of length "dim", with increment size "grain", will be centered on the initial guess tGuess, 
    // i.e. tGuess+[-range/2:grain:range/2]. 
    // QUEST assumes that intensities outside of this interval have zero prior probability, i.e. they are impossible values for threshold. 
    // The cost of making "dim" too big is some extra storage and computation, which are usually negligible. 
    // The cost of making "dim" too small is that you prejudicially exclude what are actually possible values for threshold. 
    // Getting out-of-range warnings from QuestUpdate is one possible indication that your stated range is too small.

    // If you set the optional parameter 'plotIt' to 1, the function will plot the psychometric function in use.

    // See QuestCreate, QuestUpdate, QuestQuantile, QuestMean, QuestMode, QuestSd, and QuestSimulate.

    // % Copyright (c) 1996-2004 Denis Pelli

    // if length(q)>1
    // 	for i=1:length(q(:))
    // 		q(i).normalizePdf=0; % any norming must be done across the whole set of pdfs, because it's actually one big multi-dimensional pdf.
    // 		q(i)=QuestRecompute(q(i));
    // 	end
    // 	return
    // end
    if (Array.isArray(q) && q.length > 1){
    	for (let i = 0; i < q.length; i++){
    		q[i].normalizePdf=0; // % any norming must be done across the whole set of pdfs, because it's actually one big multi-dimensional pdf.
    		q[i] = QuestRecompute(q[i]);
        }
    	return q
    }

    // if ~q.updatePdf
    // 	return
    // end
    if (!q.updatePdf) return q

    // if q.gamma>q.pThreshold
    //     warning(sprintf('reducing gamma from %.2f to 0.5',q.gamma)) %#ok<SPWRN>
    //     q.gamma=0.5;
    // end
    if (q.gamma > q.pThreshold){
        alert(`reducing gamma from ${q.gamma} to 0.5`)
        q.gamma = 0.5;
    }

    // % Don't visualize functions by default:
    // if nargin < 2 || isempty(plotIt)
    //     plotIt = 0;
    // end
    if (typeof plotIt === 'undefined') plotIt = 0;

    // % prepare all the arrays

    // q.i=-q.dim/2:q.dim/2;
    q.i = numeric.linspace(-q.dim/2, q.dim/2)

    // q.x=q.i*q.grain;
    q.x = numeric.mul(q.i, q.grain)

    // q.pdf=exp(-0.5*(q.x/q.tGuessSd).^2);
    function calc_pdf(){
        const tmp1 = numeric.div(q.x, q.tGuessSd)
        const tmp2 = numeric.pow(tmp1, 2)
        const tmp3 = numeric.mul(-0.5, tmp2)
        return numeric.exp(tmp3)
    }
    q.pdf = calc_pdf()
    
    // q.pdf=q.pdf/sum(q.pdf);
    q.pdf = numeric.div(q.pdf, numeric.sum(q.pdf))

    // i2=-q.dim:q.dim;
    const i2 = numeric.linspace(-q.dim, q.dim)

    // q.x2=i2*q.grain;
    q.x2 = numeric.mul(i2, q.grain)
        
    // q.p2 = q.delta*q.gamma+(1-q.delta)*(1-(1-q.gamma)*exp(-10.^(q.beta*q.x2)));
    function calc_p2(x){
        const tmp1 = numeric.mul(q.delta, q.gamma)
        const tmp2 = numeric.sub(1, q.delta)
        const tmp3 = numeric.sub(1, q.gamma)
        const tmp4 = numeric.mul(q.beta, x)
        const tmp5 = numeric.pow(10, tmp4)
        const tmp6 = numeric.exp(numeric.mul(-1, tmp5))
        const tmp7 = numeric.sub(1, numeric.mul(tmp3, tmp6))
        return numeric.add(tmp1, numeric.mul(tmp2, tmp7))
    }
    q.p2 = calc_p2(q.x2)

    // % Plot Psychometric function if requested:
    // if plotIt > 0
    //     figure;
    //     plot(q.x2, q.p2);
    // end
    // 
    if (plotIt > 0){
        // Chart.js: https://www.chartjs.org/
        if (document.getElementById('recompute_canvas') === null) {
            const canvas_element = document.createElement('canvas');
            canvas_element.id = 'recompute_canvas';
            if (typeof chart_width === 'undefined') {
                canvas_element.width = 800
             } else{
                canvas_element.width = chart_width
             } 
            if (typeof chart_height === 'undefined') {
                canvas_element.height = 600
             } else {
                 canvas_element.height = chart_height
             }
            document.body.appendChild(canvas_element)
        } 

        const ctx = document.getElementById('recompute_canvas').getContext('2d');
        const weibull = []
        for (let i = 0; i < q.x2.length; i++){
            weibull.push({
                x: q.x2[i],
                y: q.p2[i]
            })
        }

        if (typeof recompute_chart !== 'undefined') {
            recompute_chart.destroy()
        }

        // recompute_chart must be a global variable, that is, 'const' or 'let' shuld not be used.
        recompute_chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Psychometric function',
                        data: weibull,
                        backgroundColor: 'RGBA(225,95,150, 1)',
                    },
                ]
            },
            options: {
                title: {
                    display: true,
                    text: 'Psychometric function by QuestRecompute.'
                },
                scales: {
                    xAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Stimulus intensity (Log scale)'
                            }
                        }
                    ],
                    yAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Probability'
                            }
                        }
                    ]
                },
                responsive: false
            }
        })
    }

    // if min(q.p2([1 end]))>q.pThreshold || max(q.p2([1 end]))<q.pThreshold
    //     error(sprintf('psychometric function range [%.2f %.2f] omits %.2f threshold',min(q.p2),max(q.p2),q.pThreshold))
    // end
    if (min_of_array(q.p2) > q.pThreshold || max_of_array(q.p2) < q.pThreshold){
        alert(`psychometric function range [${min_of_array(q.p2)} ${max_of_array(q.p2)}] omits ${q.pThreshold} threshold`)
    }

    // if any(~isfinite(q.p2))
    //     error('psychometric function p2 is not finite')
    // end
    if (numeric.isFinite(q.p2).includes(false)){
        alert('psychometric function p2 is not finite')
    }

    // index=find(diff(q.p2)); 		% subset that is strictly monotonic
    // if length(index)<2
    //     error(sprintf('psychometric function has only %g strictly monotonic point(s)',length(index)))
    // end
    const index = find_non_zero_index(diff(q.p2))
    if (index.length < 2) {
        alert(`psychometric function has only ${index.length} strictly monotonic point(s)`)
    }

    // q.xThreshold=interp1(q.p2(index),q.x2(index),q.pThreshold);
    // if ~isfinite(q.xThreshold)
    //     q %#ok<NOPRT>
    //     error(sprintf('psychometric function has no %.2f threshold',q.pThreshold))
    // end
    const p3 = get_array_using_index(q.p2, index)
    const x3 = get_array_using_index(q.x2, index)
    // q.xThreshold = numeric.spline(p3, x3).at(q.pThreshold) // Bug?
    q.xThreshold = interp1(p3, x3, [q.pThreshold])[0]
    if (numeric.isFinite(q.xThreshold) === false){
        alert(`psychometric function has no ${q.pThreshold} threshold`)
    }

    // If you want to see the scatter plot of x3 and p3, please specify the plotIt as 2.
    if (plotIt === 2){
        // Chart.js: https://www.chartjs.org/
        if (document.getElementById('recompute_canvas2') === null) {
            const canvas_element = document.createElement('canvas');
            canvas_element.id = 'recompute_canvas2';
            if (typeof chart_width === 'undefined') {
                canvas_element.width = 800
             } else{
                canvas_element.width = chart_width
             } 
            if (typeof chart_height === 'undefined') {
                canvas_element.height = 600
             } else {
                 canvas_element.height = chart_height
             }
            document.body.appendChild(canvas_element)
        } 

        const ctx = document.getElementById('recompute_canvas2').getContext('2d');
        const weibull = []
        for (let i = 0; i < q.x2.length; i++){
            weibull.push({
                x: x3[i],
                y: p3[i]
            })
        }

        if (typeof recompute_chart2 !== 'undefined') {
            recompute_chart2.destroy()
        }

        // recompute_chart2 must be a global variable, that is, 'const' or 'let' shuld not be used.
        recompute_chart2 = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Psychometric function',
                        data: weibull,
                        backgroundColor: 'RGBA(225,95,150, 1)',
                    },
                ]
            },
            options: {
                title: {
                    display: true,
                    text: 'Psychometric function by QuestRecompute.'
                },
                scales: {
                    xAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Stimulus intensity (Log scale)'
                            }
                        }
                    ],
                    yAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Probability'
                            }
                        }
                    ]
                },
                responsive: false
            }
        })
    }

    // q.p2=q.delta*q.gamma+(1-q.delta)*(1-(1-q.gamma)*exp(-10.^(q.beta*(q.x2+q.xThreshold))));
    // if any(~isfinite(q.p2))
    //     q %#ok<NOPRT>
    //     error('psychometric function p2 is not finite')
    // end
    q.p2 = calc_p2(numeric.add(q.x2, q.xThreshold))
    if (numeric.isFinite(q.p2).includes(false)){
        alert('psychometric function p2 is not finite')
    }

    // q.s2=fliplr([1-q.p2;q.p2]);
    q.s2 = [fliplr(numeric.sub(1, q.p2)), fliplr(q.p2)]

    // if ~isfield(q,'intensity') || ~isfield(q,'response')
    //     Preallocate for 10000 trials, keep track of real useful content in q.trialCount. 
    //     We allocate such large chunks to reduce memory fragmentation that would be caused by growing the arrays one element per trial. 
    //     Fragmentation has been shown to cause severe out-of-memory problems if one runs many interleaved quests. 
    //     10000 trials require/waste about 157 kB of memory, which is basically nothing for today's computers and likely suffices for even the most tortuous experiment.

    //     q.trialCount = 0;
    //     q.intensity=zeros(1,10000);
    //     q.response=zeros(1,10000);
    // end
    if (typeof q.intensity === 'undefined' || typeof q.response === 'undefined'){
        q.trialCount = 0;
        q.intensity = numeric.rep([10000], 0)
        q.response = numeric.rep([10000], 0)
    }
    
    // if any(~isfinite(q.s2(:)))
    //     error('psychometric function s2 is not finite')
    // end
    const isfinite_q_s2 = numeric.isFinite(q.s2) // Note that q.s2 is an array of array.
    if (isfinite_q_s2[0].includes(false) || isfinite_q_s2[1].includes(false)){
        alert('psychometric function s2 is not finite')
    }


    // % Best quantileOrder depends only on min and max of psychometric function.
    // % For 2-interval forced choice, if pL=0.5 and pH=1 then best quantileOrder=0.60
    // % We write x*log(x+eps) in place of x*log(x) to get zero instead of NaN when x is zero.
    // pL=q.p2(1);
    // pH=q.p2(end);
    // pE=pH*log(pH+eps)-pL*log(pL+eps)+(1-pH+eps)*log(1-pH+eps)-(1-pL+eps)*log(1-pL+eps);
    // pE=1/(1+exp(pE/(pL-pH)));
    // q.quantileOrder=(pE-pL)/(pH-pL);
    const pL = q.p2[0]
    const pH = q.p2[q.p2.length-1]
    const eps = 2.2204 * Math.pow(10, -16)
    const pre_pE = pH * Math.log(pH + eps) - pL * Math.log(pL + eps) + (1 - pH + eps) * Math.log(1 - pH + eps) - (1 - pL + eps) * Math.log(1 - pL + eps);
    const pE = 1 / (1 + Math.exp(pre_pE / (pL - pH)));
    q.quantileOrder = (pE - pL) / (pH - pL);

    // if any(~isfinite(q.pdf))
    //     error('prior pdf is not finite')
    // end
    if (numeric.isFinite(q.pdf).includes(false)){
        alert('prior pdf is not finite')
    }

    // % recompute the pdf from the historical record of trials
    // for k=1:q.trialCount
    //     inten=max(-1e10,min(1e10,q.intensity(k))); % make intensity finite
    //     ii=length(q.pdf)+q.i-round((inten-q.tGuess)/q.grain);
    //     if ii(1)<1
    //         ii=ii+1-ii(1);
    //     end
    //     if ii(end)>size(q.s2,2)
    //         ii=ii+size(q.s2,2)-ii(end);
    //     end
    //     q.pdf=q.pdf.*q.s2(q.response(k)+1,ii); % 4 ms
    //     if q.normalizePdf && mod(k,100)==0
    //         q.pdf=q.pdf/sum(q.pdf);	% avoid underflow; keep the pdf normalized	% 3 ms
    //     end
    // end
    const large_num = Math.pow(10, 10)
    for (let k = 0; k < q.trialCount; k++){
        const inten = Math.max(-1*large_num, Math.min(large_num, q.intensity[k])); // make intensity finite
        const tmp = Math.round((inten - q.tGuess) / q.grain)
        let ii = numeric.sub(numeric.add(q.pdf.length, q.i), tmp);
        const tmp2 = ii[0]
        if (tmp2 < 0){ // 'ii' must be greater than or equal to zero because 'ii' is the index of an array in JavaScript.
            ii = numeric.sub(ii, tmp2) 
        }
        const tmp3 = ii[ii.length-1]
        const tmp4 = numeric.dim(q.s2)[1]-1
        if (tmp3 > tmp4){ // Also, 'ii' must not be greater than the size of an array minus one.
            ii = numeric.sub(numeric.add(ii, tmp4), tmp3)
        }

        // q.pdf = numeric.mul(q.pdf, q.s2[q.response(k)+1, ii]) // 4 ms
        q.pdf = numeric.mul(q.pdf, get_array_using_index(q.s2[q.response[k]], ii))

        if (q.normalizePdf && (k+1) % 100 === 0){
		    q.pdf = numeric.div(q.pdf, numeric.sum(q.pdf))	// % avoid underflow; keep the pdf normalized	% 3 ms
        }
    }

    // if q.normalizePdf
    //     q.pdf=q.pdf/sum(q.pdf);		% keep the pdf normalized	% 3 ms
    // end
    if (q.normalizePdf === 1){
        q.pdf = numeric.div(q.pdf, numeric.sum(q.pdf))		// % keep the pdf normalized	% 3 ms
    }

    // if any(~isfinite(q.pdf))
    //     error('pdf is not finite')
    // end
    if (numeric.isFinite(q.pdf).includes(false)){
        alert('pdf is not finite')
    }

    return q
}

function cumsum(array){
    const result = []
    for (let i = 0; i < array.length; i++){
      if (i === 0){
        result.push(array[0])
      } else {
        result.push(result[i-1] + array[i])
      }
    }
    return result
}

function QuestQuantile(q,quantileOrder){
    // intensity=QuestQuantile(q,[quantileOrder])
    
    // Gets a quantile of the pdf in the struct q. You may specify the desired quantileOrder, e.g. 0.5 for median, 
    // or, making two calls, 0.05 and 0.95 for a 90confidence interval. 
    // If the "quantileOrder" argument is not supplied, then it's taken from the "q" struct. 
    // QuestCreate uses QuestRecompute to compute the optimal quantileOrder and saves that in the "q" struct;
    // this quantileOrder yields a quantile that is the most informative intensity for the next trial.

    // This is based on work presented at a conference, but otherwise unpublished: Pelli, D. G. (1987). 
    // The ideal psychometric procedure. Investigative Ophthalmology & Visual Science, 28(Suppl), 366.

    // See Quest.

    // % Copyright (c) 1996-2015 Denis Pelli

    // if nargin>2
    //     error('Usage: intensity=QuestQuantile(q,[quantileOrder])')
    // end
    if (typeof q === 'undefined') alert('Usage: intensity=QuestQuantile(q,[quantileOrder])')

    // if length(q)>1
    //     if nargin>1
    //         error('Cannot accept quantileOrder for q vector. Set each q.quantileOrder instead.')
    //     end
    //     t=zeros(size(q));
    //     for i=1:length(q(:))
    //         t(i)=QuestQuantile(q(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        if (typeof quantileOrder !== 'undefined') alert('Cannot accept quantileOrder for q vector. Set each q.quantileOrder instead.')

        const t = numeric.rep([q.length], 0)
        for (let i = 0; i < q.length; i++){
            t[i] = QuestQuantile(q[i]);
        }
        return t
    }

    // if nargin<2
    //     quantileOrder=q.quantileOrder;
    // end
    if (typeof quantileOrder === 'undefined' ) quantileOrder = q.quantileOrder

    // if quantileOrder > 1 || quantileOrder < 0
    //     error('quantileOrder %f is outside range 0 to 1.',quantileOrder);
    // end
    if (quantileOrder > 1 || quantileOrder < 0){
        alert(`quantileOrder ${quantileOrder} is outside range 0 to 1.`)
    }

    const p = cumsum(q.pdf);
    // if ~isfinite(p(end))
    //     error('pdf is not finite')
    // end
    if (!isFinite(p[p.length-1])){
        alert('pdf is not finite')
    }

    // if p(end)==0
    //     error('pdf is all zero')
    // end
    if (p[p.length-1] === 0){
        alert('pdf is all zero')
    }

    // if quantileOrder < p(1)
    //     t=q.tGuess+q.x(1);
    //     return
    // end
    if (quantileOrder < p[0]){
        const t = q.tGuess + q.x[0];
        return t
    }

    // if quantileOrder > p(end)
    //     t=q.tGuess+q.x(end);
    //     return
    // end
    if (quantileOrder > p[p.length-1]){
        const t = q.tGuess + q.x[q.x.length - 1];
        return t
    }

    // index=find(diff([-1 p])>0);
    const index = find_more_than_zero_index(diff([-1].concat(p)))

    // if length(index)<2
    //     error('pdf has only %g nonzero point(s)',length(index));
    // end
    if (index.length < 2){
        alert(`pdf has only ${index.length} nonzero point(s)`)
    }

    // t=q.tGuess+interp1(p(index),q.x(index),quantileOrder*p(end)); % 40 ms
    const p2 = get_array_using_index(p, index)
    const x2 = get_array_using_index(q.x, index)
    // t = q.tGuess + numeric.spline(p2, x2).at(quantileOrder * p[p.length-1])
    const t = q.tGuess + interp1(p2, x2, [quantileOrder * p[p.length-1]])[0]

    return t
}

// return a array of numbers larger than num
function get_larger_numbers(array, num){
    const result = []
    array.forEach(x => {
        if (x >= num){
            result.push(x)
        } else {
            result.push(num)
        }
    })
    return result
}

function get_smaller_numbers(array, num){
    const result = []
    array.forEach(x => {
        if (x <= num){
            result.push(x)
        } else {
            result.push(num)
        }
    })
    return result
}

let simulate_chart

function QuestSimulate(q,tTest,tActual,plotIt, chart_width, chart_height){
    // % response=QuestSimulate(q,intensity,tActual [,plotIt])
    //
    // Simulate the response of an observer with threshold tActual when exposed to a stimulus tTest.
    // 
    // 'plotIt' is optional: If set to a non-zero value, the simulated Quest session is visualized in a plot which shows the psychometric function of the simulated observer, where Quest placed test trials and what the observers response was. 
    // plotIt == 1 shows past trials in black, the current trial in green or red for a positive or negative response. 
    // plotIt == 2 color-codes all trials in red/green for negative or positive responses. 
    // By default, nothing is plotted.

    // % Copyright (c) 1996-2018 Denis Pelli

    // if nargin < 3
    //     error('Usage: response=QuestSimulate(q,tTest,tActual[,plotIt])')
    // end
    if (typeof q === 'undefined' || typeof tTest === 'undefined' || typeof tActual === 'undefined'){
        alert('Usage: response=QuestSimulate(q,tTest,tActual[,plotIt])')
    }

    // if length(q)>1
    //     error('can''t deal with q being a vector')
    // end
    if (Array.isArray(q) && q.length > 1) alert('can not deal with q being a vector')

    // x2min=min(q.x2([1 end]));
    // x2max=max(q.x2([1 end]));
    // t=min(max(tTest-tActual,x2min),x2max);
    const x2min = min_of_array(q.x2)
    const x2max = max_of_array(q.x2)
    const t = Math.min(Math.max(tTest-tActual, x2min), x2max); // scalar

    // response=interp1(q.x2,q.p2,t) > rand(1);
    const flag = interp1(q.x2, q.p2, [t])[0] > Math.random() // true or false
    const response = flag? 1:0

    // % Visualize if requested:
    // if (nargin >= 4) && (plotIt > 0)
    if (typeof plotIt !== 'undefined' && plotIt > 0){
        // tc = t;
        // col = {'*r', '*g'};
        const tc = t;
        const col = ['RGBA(255, 0, 0, 1)', 'RGBA(0, 128, 0, 1)']

        // t = min(max(q.intensity(1:q.trialCount) - tActual, x2min), x2max);
        const tmp = numeric.sub(q.intensity.slice(0, q.trialCount), tActual)
        // Changed the name of the variable from t to t2 to avoid confusion
        const t2 = get_smaller_numbers(get_larger_numbers(tmp, x2min), x2max)
        
        // if plotIt == 2
        //     positive = find(q.response(1:q.trialCount) > 0);
        //     negative = find(q.response(1:q.trialCount) <= 0);
        //     pcol = 'og';
        // else
        //     positive = 1:q.trialCount;
        //     negative = [];
        //     pcol = 'ok';
        // end
        let positive, negative, pcol
        if (plotIt === 2){
            positive = find_more_than_zero_index(q.response.slice(0, q.trialCount))
            negative = find_less_than_or_equal_to_zero_index(q.response.slice(0, q.trialCount))
            pcol = 'RGBA(0, 128, 0, 1)'
        } else {
            positive = numeric.linspace(0, q.trialCount-1)
            negative = [];
            pcol = 'RGBA(0, 0, 0, 1)'
        }
        
        // plot(q.x2 + tActual, q.p2, 'b', ...
        //     t(positive) + tActual, interp1(q.x2,q.p2,t(positive)), pcol, ...
        //     t(negative) + tActual, interp1(q.x2,q.p2,t(negative)), 'or', ...
        //     tActual, interp1(q.x2 + tActual,q.p2,tActual), 'x', ...
        //     tc + tActual, interp1(q.x2,q.p2,tc), col{response + 1});
   
        // Chart.js: https://www.chartjs.org/
        if (document.getElementById('simulate_canvas') === null) {
            const canvas_element = document.createElement('canvas');
            canvas_element.id = 'simulate_canvas';
            if (typeof chart_width === 'undefined') {
                canvas_element.width = 800
            } else {
                canvas_element.width = chart_width
            } 
            if (typeof chart_height === 'undefined') {
                canvas_element.height = 600
            } else {
                canvas_element.height = chart_height
            }
            document.body.appendChild(canvas_element)
        } 

        const ctx = document.getElementById('simulate_canvas').getContext('2d');
        const weibull = []
        for (let i = 0; i < q.x2.length; i++){
            weibull.push({
                x: q.x2[i] + tActual,
                y: q.p2[i]
            })
        }

        const graph_data = []
        graph_data.push({
            label: 'Psychometric function',
            data: weibull,
            backgroundColor: 'RGBA(225,95,150, 1)',
        })

        const positive_data = []
        const positive_x = get_array_using_index(t2, positive)
        for (let i = 0; i < positive.length; i++){
            positive_data.push({
                x: positive_x[i] + tActual,
                // y: numeric.spline(q.x2, q.p2).at(positive_x[i])
                y: interp1(q.x2, q.p2, [positive_x[i]])[0] 
            })
        }

        const negative_data = []
        if (plotIt === 2){
            const negative_x = get_array_using_index(t2, negative)
            for (let i = 0; i < negative.length; i++){
                negative_data.push({
                    x: negative_x[i] + tActual,
                    // y: numeric.spline(q.x2, q.p2).at(negative_x[i])
                    y: interp1(q.x2, q.p2, [negative_x[i]])[0] 
                })
            }

            graph_data.push({
                label: 'Positive',
                data: positive_data,
                backgroundColor: pcol,
                pointBorderColor: pcol,
                pointStyle: 'star',
                pointBorderWidth: 2,
                pointRadius: 10,
                pointRotation: 45,
            })

            graph_data.push({
                label: 'Negative',
                data: negative_data,
                backgroundColor: 'RGBA(255, 0, 0, 1)',
                pointBorderColor: 'RGBA(255, 0, 0, 1)',
                pointStyle: 'star',
                pointBorderWidth: 2,
                pointRadius: 10,
                pointRotation: 45,
            })
        } else {
            graph_data.push({
                label: 'Responses',
                data: positive_data,
                backgroundColor: pcol,
                pointBorderColor: pcol,
                pointStyle: 'star',
                pointBorderWidth: 2,
                pointRadius: 10,
                pointRotation: 45,
            })
        }

        graph_data.push({
            label: 'tActual',
            data: [{
                x: tActual, 
                // y: numeric.spline(numeric.add(q.x2, tActual) , q.p2).at(tActual)
                y: interp1(numeric.add(q.x2, tActual), q.p2, [tActual])[0] 
            }],
            backgroundColor: 'RGBA(255, 0, 255, 1)',
            pointBorderColor: 'RGBA(255, 0, 255, 1)',
            pointStyle: 'circle',
            pointBorderWidth: 2,
            pointRadius: 10,
            pointRotation: 45,
        },
        {
            label: 'The latest repsonse (Circle)',
            data: [{
                x: tc + tActual, 
                y: interp1(q.x2, q.p2, [tc])[0] 
            }],
            backgroundColor: col[response],
            pointBorderColor: col[response],
            pointStyle: 'circle',
            // pointBorderWidth: 2,
            pointRadius: 10,
            // pointRotation: 45,
        })

        if (typeof simulate_chart !== 'undefined') {
            simulate_chart.destroy()
        }

        // simulate_chart must be a global variable, that is, 'const' or 'let' shuld not be used.
        simulate_chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: graph_data
            },
            options: {
                title: {
                    display: true,
                    text: 'Psychometric function by QuestSimulate.'
                },
                scales: {
                    xAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Stimulus intensity (Log scale)'
                            }
                        }
                    ],
                    yAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Probability'
                            }
                        }
                    ]
                },
                responsive: false
            }
        })        
    }
    return response
}

function QuestUpdate(q, intensity, response){
    // % q=QuestUpdate(q,intensity,response)

    // Update the struct q to reflect the results of this trial. 
    // The historical records q.intensity and q.response are always updated, but q.pdf is only updated if q.updatePdf is true. 
    // You can always call QuestRecompute to recreate q.pdf from scratch from the historical record.

    // if nargin~=3
    //     error('Usage: q=QuestUpdate(q,intensity,response)')
    // end
    if (typeof q === 'undefined' || typeof intensity === 'undefined' || typeof response === 'undefined'){
        alert('Usage: q=QuestUpdate(q,intensity,response)')    
    }

    // if length(q)>1
    //     error('Can''t deal with q being a vector.')
    // end
    if (Array.isArray(q) && q.length > 1) alert('Can not deal with q being a vector.')

    // pending
    // JavaScript does not have a isreal function.
    // if ~isreal(intensity)
    //     error(sprintf('QuestUpdate: intensity %s must be real, not complex.',num2str(intensity)));
    // end

    // if response<0 || response>=size(q.s2,1)
    //     error(sprintf('response %g out of range 0 to %d',response,size(q.s2,1)-1))
    // end
    if (response < 0 || response > q.s2.length-1){
        alert(`response ${response} out of range 0 to ${q.s2.length-1}`)
    }


    if (q.updatePdf){
        // inten=max(-1e10,min(1e10,intensity)); % make intensity finite
        const large_num = Math.pow(10, 10)
        const inten = Math.max(-1*large_num, Math.min(large_num, intensity)); // make intensity finite
            
        // ii=size(q.pdf,2)+q.i-round((inten-q.tGuess)/q.grain);
        const tmp = q.pdf.length - Math.round((inten - q.tGuess)/q.grain)
        let ii = numeric.add(tmp, q.i)

        // if ii(1)<1 || ii(end)>size(q.s2,2)
        // 'ii' must be greater than or equal to zero because 'ii' is the index of an array in JavaScript.
        // Also, 'ii' must not be greater than the size of an array minus one. 
        if (ii[0] < 0 || ii[ii.length-1] > numeric.dim(q.s2)[1]-1){
            if (q.warnPdf){
                // low=(1-size(q.pdf,2)-q.i(1))*q.grain+q.tGuess;
                // high=(size(q.s2,2)-size(q.pdf,2)-q.i(end))*q.grain+q.tGuess;
                const low = (1 - q.pdf.length - q.i[0]) * q.grain + q.tGuess;
                const high = (numeric.dim(q.s2)[1] - q.pdf.length - q.i[q.i.length-1]) * q.grain + q.tGuess;
                        
                alert(`QuestUpdate: intensity ${intensity} out of range ${low} to ${high}. Pdf will be inexact. Suggest that you increase "range" in call to QuestCreate.`);
                // pending
                // oldWarning=warning;
                // warning('on'); %#ok<WNON> % no backtrace
                // warning(sprintf('QuestUpdate: intensity %.3f out of range %.2f to %.2f. Pdf will be inexact. Suggest that you increase "range" in call to QuestCreate.',intensity,low,high)); %#ok<SPWRN>
                // warning(oldWarning);
            }
            // if ii(1)<1
            // 	ii=ii+1-ii(1);
            // else
            // 	ii=ii+size(q.s2,2)-ii(end);
            // end
            if (ii[0] < 0){
                ii = numeric.sub(ii, ii[0]);
            } else {
                const tmp = numeric.add(ii, numeric.dim(q.s2)[1]-1)
                ii = numeric.sub(tmp, ii[ii.length-1])
            }
        }

        // q.pdf=q.pdf.*q.s2(response+1,ii); % 4 ms
        q.pdf = numeric.mul(q.pdf, get_array_using_index(q.s2[response], ii))
        // if q.normalizePdf
        // 	q.pdf=q.pdf/sum(q.pdf);		% keep the pdf normalized	% 3 ms
        // end
        if (q.normalizePdf){
            q.pdf = numeric.div(q.pdf, numeric.sum(q.pdf))
        }
    }

    // % keep a historical record of the trials
    // q.trialCount = q.trialCount + 1;
    q.trialCount++

    // if q.trialCount > length(q.intensity)
    if (q.trialCount > q.intensity.length){
        // Out of space in preallocated arrays. Reallocate for additional 10000 trials. 
        // We reallocate in large chunks to reduce memory fragmentation.
        // q.intensity = [q.intensity, zeros(1,10000)];
        // q.response  = [q.response,  zeros(1,10000)];

        const tmp = numeric.rep([10000], 0)
        q.intensity = q.intensity.concat(tmp)
        q.response = q.response.concat(tmp)
    }

    // q.intensity(q.trialCount) = intensity;
    // q.response(q.trialCount)  = response;
    q.intensity[q.trialCount-1] = intensity;
    q.response[q.trialCount-1]  = response;

    return q
}

function QuestMean(q){
    // % t=QuestMean(q)
    // %
    // % Get the mean threshold estimate.
    // % If q is a vector, then the returned t is a vector of the same size.
    // % 
    // % Copyright (c) 1996-2002 Denis Pelli

    // if nargin~=1
    //     error('Usage: t=QuestMean(q)')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: t=QuestMean(q)')
    }
    
    // if length(q)>1
    //     t=zeros(size(q));
    //     for i=1:length(q(:))
    //         t(i)=QuestMean(q(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        let t= numeric.rep([q.length], 0)
        for (let i = 0; i < q.length; i++){
            t[i] = QuestMean(q[i]);
        }
        return t
    }


    // t=q.tGuess+sum(q.pdf.*q.x)/sum(q.pdf);	% mean of our pdf
    const tmp = numeric.mul(q.pdf, q.x)
    return q.tGuess + numeric.sum(tmp) / numeric.sum(q.pdf);	// % mean of our pdf
}

function QuestSd(q){
    // % sd=QuestSd(q)
    // %
    // % Get the sd of the threshold distribution.
    // % If q is a vector, then the returned t is a vector of the same size.
    // % 
    // % Copyright (c) 1996-1999 Denis Pelli

    // if nargin~=1
    //     error('Usage: sd=QuestSd(q)')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: sd=QuestSd(q)')
    }

    // if length(q)>1
    //     sd=zeros(size(q));
    //     for i=1:length(q(:))
    //         sd(i)=QuestSd(q(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        let sd= numeric.rep([q.length], 0)
        for (let i = 0; i < q.length; i++){
            sd[i] = QuestSd(q[i]);
        }
        return sd
    }

    // p=sum(q.pdf);
    // sd=sqrt(sum(q.pdf.*q.x.^2)/p-(sum(q.pdf.*q.x)/p).^2);
    const p = numeric.sum(q.pdf)
    const tmp1 = numeric.pow(q.x, 2)
    const tmp2 = numeric.mul(q.pdf, tmp1)
    const tmp3 = numeric.div(numeric.sum(tmp2), p)
    const tmp4 = numeric.mul(q.pdf, q.x)
    const tmp5 = numeric.sum(tmp4)
    const tmp6 = numeric.div(tmp5, p)
    const tmp7 = numeric.pow(tmp6, [2])
    const tmp8 = numeric.sqrt(numeric.sub(tmp3, tmp7)) // tmp8 is an array containing only one element
    return tmp8[0]

}

function max_with_index(array){
    let tmp_num = -Infinity
    let tmp_index = -Infinity
    array.forEach((element, index, array) => {
        if(element > tmp_num){
            tmp_num = element
            tmp_index = index
        }
    })
    return {
        value: tmp_num, 
        index: tmp_index}
}


function QuestMode(q){
    // QuestMode returns a JavaScript object which has two properties: 'mode' and 'pdf'.
    // % [t,p]=QuestMode(q)
    // %
    // % "t" is the mode threshold estimate
    // % "p" is the value of the (unnormalized) pdf at t.
    // % 
    // % Copyright (c) 1996-2004 Denis Pelli

    // if nargin~=1
    //     error('Usage: t=QuestMode(q)')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: object = QuestMode(q)')
    }

    // if length(q)>1
    //     t=zeros(size(q));
    //     for i=1:length(q(:))
    //         t(i)=QuestMode(q(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        let t= numeric.rep([q.length], 0)
        for (let i = 0; i < q.length; i++){
            t[i] = QuestMode(q[i]);
        }
        return t
    }

    // [p,iMode]=max(q.pdf);
    // t=q.x(iMode)+q.tGuess;
    const maximum = max_with_index(q.pdf)
    return {
        mode: q.x[maximum.index] + q.tGuess,
        pdf: maximum.value
    }
}

function QuestBetaAnalysis(q){
    // betaEstimate=QuestBetaAnalysis(q,[fid]);
    // Note that the JavaScript version does not support fid.

    // Analyzes the quest function with beta as a free parameter. It prints (in the file or files pointed to by fid) the mean estimates of alpha (as logC) and beta. 
    // Gamma is left at whatever value the user fixed it at.

    // Note that normalization of the pdf, by QuestRecompute, is disabled because it would need to be done across the whole q vector. 
    // Without normalization, the pdf tends to underflow at around 1000 trials. 
    // You will have some warning of this because the printout mentions any values of beta that were dropped because they had zero probability. 
    // Thus you should keep the number of trials under around 1000, to avoid the zero-probability warnings.

    // % Denis Pelli 5/6/99



    // if nargin<1 || nargin>2
    //     error('Usage: QuestBetaAnalysis(q,[fid])')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: QuestBetaAnalysis(q)')
    }

    // pending
    // if nargin<2
    //     fid=1;
    // end

    // fprintf('Now re-analyzing with both threshold and beta as free parameters. ...\n');
    console.log('Now re-analyzing with both threshold and beta as free parameters. ...');

    // pending
    // for f=fid
    //     fprintf(f,'logC 	 +-sd 	 beta	 +-sd	 gamma\n');
    // end

    // for i=1:length(q(:))
    //     betaEstimate(i)=QuestBetaAnalysis1(q(i),fid);
    // end
    // return
    const betaEstimate = []
    if (Array.isArray(q)){
        for (let i = 0; i < q.length; i++){
            betaEstimate.push(QuestBetaAnalysis1(q[i]))
        }
    } else {
        betaEstimate.push(QuestBetaAnalysis1(q))
    }
    return betaEstimate
}
    
function find_zero(array){
    for (let i = 0; i < array.length; i++){
        if (array[i] === 0){
            return i
        }
    }
}

function QuestBetaAnalysis1(q){
    // betaEstimate=QuestBetaAnalysis1(q,fid)
    
    // for i=1:16
    //     q2(i)=q;
    //     q2(i).beta=2^(i/4);
    //     q2(i).dim=250;
    //     q2(i).grain=0.02;
    // end
    const q2 =[]
    for (let i = 0; i < 16; i++){
        const obj = Object.assign({}, q)
        obj.beta = Math.pow(2, (i+1)/4)
        obj.dim = 250
        obj.grain = 0.02
        q2.push(obj)
    }

    const qq = QuestRecompute(q2);

    // % omit betas that have zero probability
    // for i=1:length(qq)
    //     p(i)=sum(qq(i).pdf);
    // end
    const p = []
    for (let i =0; i < qq.length; i++){
        p.push(numeric.sum(qq[i].pdf))
    }

    // if any(p==0)
    //     fprintf('Omitting beta values ');
    //     fprintf('%.1f ',qq(find(p==0)).beta);
    //     fprintf('because they have zero probability.\n');
    // end
    const tmp = find_zero(p)
    if (typeof tmp !== 'undefined'){
        console.log('Omitting beta values ');
        console.log(qq[tmp].beta);
        console.log('because they have zero probability.');
    }

    // clear q2
    // q2=qq(find(p));
    // Changed the name of the variable from q2 to q3 to avoid confusion
    const q3 = get_array_using_index(qq, find_non_zero_index(p))

    // t2=QuestMean(q2); % estimate threshold for each possible beta
    const t2 = QuestMean(q3)

    // p2=QuestPdf(q2,t2); % get probability of each of these (threshold,beta) combinations
    const p2 = QuestPdf(q3, t2);

    // sd2=QuestSd(q2); % get sd of threshold for each possible beta
    const sd2 = QuestSd(q3);

    // beta2=[q2.beta];
    const beta2 = []
    for (let i = 0; i < q3.length; i++){
        beta2.push(q3[i].beta)
    }

    // % for f=fid
    // % 	fprintf(f,'beta ');fprintf(f,'	%7.1f',q2(:).beta);fprintf(f,'\n');
    // % 	fprintf(f,'t    ');fprintf(f,'	%7.2f',t2);fprintf(f,'\n');
    // % 	fprintf(f,'sd   ');fprintf(f,'	%7.2f',sd2);fprintf(f,'\n');
    // % 	fprintf(f,'log p');fprintf(f,'	%7.2f',log10(p2));fprintf(f,'\n');
    // % end
    // console.log(`beta =`);
    // console.log(beta2);
    // console.log(`t =`);
    // console.log(t2);
    // console.log(`sd =`);
    // console.log(sd2);
    // const log_data = []
    // for (let i = 0; i < p2.length; i++){
    //     log_data.push(Math.log10(p2[i]))
    // }
    // console.log(`log10 p =`);
    // console.log(log_data);

    // [p,i]=max(p2); % take mode, i.e. the most probable (threshold,beta) combination
    const maximum = max_with_index(p2)

    // t=t2(i); % threshold at that mode
    const t = t2[maximum.index]

    // %t=QuestMean(q2(i)); % mean threshold estimate

    // sd=QuestSd(q2(i)); % sd of threshold estimate at the beta of that mode
    const sd = QuestSd(q3[maximum.index])

    // p=sum(p2);
    // Changed the name of the variable from p to tmp_p to avoid confusion
    const tmp_p = numeric.sum(p2)

    // betaMean=sum(p2.*beta2)/p;
    const tmp1 = numeric.mul(p2, beta2)
    const tmp2 = numeric.sum(tmp1)
    const betaMean = numeric.div(tmp2, tmp_p)

    // betaSd=sqrt(sum(p2.*beta2.^2)/p-(sum(p2.*beta2)/p).^2);
    const tmp3 = numeric.mul(p2, numeric.pow(beta2, 2))
    const tmp4 = numeric.div(numeric.sum(tmp3), tmp_p)
    const tmp5 = numeric.pow(betaMean, [2])
    const betaSd = numeric.sqrt(numeric.sub(tmp4, tmp5))[0]

    // beta has a very skewed distribution, with a long tail out to very large value of beta, whereas 1/beta is more symmetric, with a roughly normal distribution. 
    // Thus it is statistically more efficient to estimate the parameter as 1/average(1/beta) than as average(beta). 
    // "iBeta" stands for inverse beta, 1/beta.
    // The printout takes the conservative approach of basing the mean on 1/beta, but reporting the sd of beta.


    // iBetaMean=sum(p2./beta2)/p;
    const iBetaMean = numeric.div(numeric.sum(numeric.div(p2, beta2)), tmp_p)

    // iBetaSd=sqrt(sum(p2./beta2.^2)/p-(sum(p2./beta2)/p).^2);
    const tmp6 = numeric.div(p2, numeric.pow(beta2, 2))
    const tmp7 = numeric.div(numeric.sum(tmp6), tmp_p)
    const tmp8 = numeric.pow(iBetaMean, [2])
    const iBetaSd = numeric.sqrt(numeric.sub(tmp7, tmp8))

    // for f=fid
    //     %	fprintf(f,'Threshold %4.2f +- %.2f; Beta mode %.1f mean %.1f +- %.1f imean 1/%.1f +- %.1f; Gamma %.2f\n',t,sd,q2(i).beta,betaMean,betaSd,1/iBetaMean,iBetaSd,q.gamma);
    //     %	fprintf(f,'%5.2f	%4.1f	%5.2f\n',t,1/iBetaMean,q.gamma);
    //     fprintf(f,'%5.2f	%5.2f	%4.1f	%4.1f	%6.3f\n',t,sd,1/iBetaMean,betaSd,q.gamma);
    // end
    console.log(`Threshold ${round2(t, 2)} +- ${round2(sd, 2)}`)
    console.log(`beta = ${1/iBetaMean}`)
    console.log(`Beta mode ${q3[maximum.index].beta} mean ${round2(betaMean, 2)} +- ${round2(betaSd, 2)}`)
    console.log(`imean 1/${round2(1/iBetaMean, 2)} +- ${round2(iBetaSd, 2)}`)
    console.log(`Gamma ${q.gamma} `)
    // console.log(`${t} ${1/iBetaMean} ${q.gamma}`)
    // console.log(`${t} ${sd} ${1/iBetaMean} ${betaSd} ${q.gamma}`)


    // betaEstimate=1/iBetaMean;
    return 1/iBetaMean
}

function QuestPdf(q,t){
    // % p=QuestPdf(q,t)
    // % 
    // % The (possibly unnormalized) probability density of candidate threshold "t".
    // % q and t may be vectors of the same size, in which case the returned p is a vector of that size.
    // % 
    // % Copyright (c) 1996-1999 Denis Pelli

    // if nargin~=2
    //     error('Usage: p=QuestPdf(q,t)')
    // end
    if (typeof q === 'undefined' || typeof t === 'undefined'){
        alert('Usage: p=QuestPdf(q,t)')
    }

    // if size(q)~=size(t)
    //     error('both arguments must have the same dimensions')
    // end
    if (q.length !== t.length){
        alert('both arguments must have the same dimensions')
    }

    // if length(q)>1
    //     p=zeros(size(q));
    //     for i=1:length(q(:))
    //         p(i)=QuestPdf(q(i),t(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        let p = numeric.rep([q.length], 0)
        for (let i = 0; i < q.length; i++){
            p[i] = QuestPdf(q[i],t[i]);
        }
        return p
    }

    // i=round((t-q.tGuess)/q.grain)+1+q.dim/2;
    // i=min(length(q.pdf),max(1,i));
    // p=q.pdf(i);
    const i = Math.round((t - q.tGuess) / q.grain) + 1 + q.dim / 2;
    const i2 = Math.min(q.pdf.length, Math.max(1, i))
    return q.pdf[i2]
}

// Round off to the specified number of digits.
function round2(value, num){
    return Math.round(value * Math.pow(10, num)) / Math.pow(10, num)
}

function QuestP(q,x){
    // % p=QuestP(q,x)
    // %
    // % The probability of a correct (or yes) response at intensity x, assuming
    // % threshold is at x=0.
    // %
    // % Copyright (c) 1996-2004 Denis Pelli

    // pending
    // JavaScript does not have a isreal function.
    // if ~isreal(x)
    //     error('x must be real, not complex.');
    // end

    // if x<q.x2(1)
    //     p=q.p2(1);
    // elseif x>q.x2(end)
    //     p=q.p2(end);
    // else
    //     p=interp1(q.x2,q.p2,x);
    // end
    let p
    if (x < q.x2[0]){
        p = q.p2[0]
    } else {
        if (x > q.x2[q.x2.length - 1]){
            p = q.p2[q.x2.length - 1];
        } else {
            p = interp1(q.x2, q.p2, [x])[0];
        }
    }

    // if ~isfinite(p)
    //     q
    //     error(sprintf('psychometric function %g at %.2g',p,x))
    // end
    if (!isFinite(p)){
        console.log(q)
        alert(`psychometric function ${p} at ${x}`)
    }

    return p
}

function indexSort(array) {
    const index = numeric.linspace(0, array.length-1) 
    function compareFunc(a, b){
      return array[a] - array[b]
    }
    return index.sort(compareFunc)
  }

function QuestTrials(q, binsize){
    // % trial=QuestTrials(q,[binsize])
    // % 
    // % Return sorted list of intensities and response frequencies.
    // % "binsize", if supplied, will be used to round intensities to nearest multiple of binsize.
    // % Here's how you might use this function to display your results:
    // % 		t=QuestTrials(q,0.1);
    // % 		fprintf(' intensity     p fit         p    trials\n');
    // % 		disp([t.intensity; QuestP(q,t.intensity-logC); (t.responses(2,:)./sum(t.responses)); sum(t.responses)]');
    
    // % Copyright (c) 1996-1999 Denis Pelli

    // if nargin < 1
    //     error('Usage: trial=QuestTrials(q,[binsize])')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: trial=QuestTrials(q,[binsize])')
    }

    // if nargin < 2
    //     binsize = [];
    // end
    // if isempty(binsize) || ~isfinite(binsize) 
    //     binsize=0;
    // end
    if (typeof binsize === 'undefined' || !isFinite(binsize)){
        binsize = 0
    }

    // if binsize < 0
    //     error('binsize cannot be negative')
    // end
    if (binsize < 0){
        alert('binsize cannot be negative')
    }

    // if length(q)>1
    //     for i=1:length(q(:))
    //         trial(i)=QuestTrials(q(i)); %#ok<AGROW>
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        const trial = []
        for (let i = 0; i < q.length; i++){
            trial.push(QuestTrials(q[i]))
        }
        return trial
    }

    function compareFunc(a, b) {
        return a - b;
    }
  
    // % sort
    // inIntensity = q.intensity(1:q.trialCount);
    // inResponse = q.response(1:q.trialCount);
    // [intensity,i]=sort(inIntensity);
    // response(1:length(i))=inResponse(i);
    const intensity = q.intensity.slice(0, q.trialCount);
    intensity.sort(compareFunc)
    const index = indexSort(q.intensity.slice(0, q.trialCount))
    const response = q.response.slice(0, q.trialCount);

    // % quantize
    // if binsize>0
    //     intensity=round(intensity/binsize)*binsize;
    // end
    let intensity2 = intensity;
    if (binsize > 0){
        const tmp1 = numeric.div(intensity, binsize)
        const tmp2 = numeric.round(tmp1)
        intensity2 = numeric.mul(tmp2, binsize)
    }

    // % compact
    // j=1;
    // trial.intensity(1,j)=intensity(1);
    // trial.responses(1:2,j)=[0 0];
    // for i=1:length(intensity)
    //     if intensity(i)~=trial.intensity(j)
    //         j=j+1;
    //         trial.intensity(1,j)=intensity(i);
    //         trial.responses(1:2,j)=[0 0];
    //     end
    //     trial.responses(response(i)+1,j)=trial.responses(response(i)+1,j)+1;
    // end
    const trial = {
        intensity: [],
        response0: [],
        response1: []
    }
    let tmp_intensity = intensity2[0]
    let response0 = 0
    let response1 = 0
    for (let i = 0; i < intensity2.length; i++){
        if (tmp_intensity !== intensity2[i]){
            trial.intensity.push(tmp_intensity)
            trial.response0.push(response0)
            trial.response1.push(response1)

            tmp_intensity = intensity2[i]
            response0 = 0
            response1 = 0    
        } 
        
        if (response[i] === 0){
            response0++
        } else {
            response1++
        }
    }
    // save the last data
    trial.intensity.push(tmp_intensity)
    trial.response0.push(response0)
    trial.response1.push(response1)
    
    return trial
}

export {
  QuestCreate,
  QuestRecompute,
  QuestQuantile,
  QuestSimulate,
  QuestUpdate,
  QuestMean,
  QuestSd,
  QuestMode,
  QuestBetaAnalysis,
  QuestBetaAnalysis1,
  QuestPdf,
  QuestP,
  QuestTrials
};
