function QuestCreate(tGuess, tGuessSd, pThreshold, beta, delta, gamma, grain, range, plotIt){
    // q=QuestCreate(tGuess,tGuessSd,pThreshold,beta,delta,gamma,[grain],[range],[plotIt])

    // Create a struct q with all the information necessary to measure threshold. 
    // Threshold "t" is measured on an abstract "intensity" scale, which usually corresponds to log10 contrast.

    // QuestCreate saves in struct q the parameters for a Weibull psychometric function:

    // p2=delta*gamma+(1-delta)*(1-(1-gamma)*exp(-10.^(beta*(x-xThreshold))));

    // where x represents log10 contrast relative to threshold. 

    // The Weibull function itself appears only in QuestRecompute, which uses the specified parameter values in q to compute a psychometric function and store it in q. 

    // All the other Quest functions simply use the psychometric function stored in "q". 
    // QuestRecompute is called solely by QuestCreate and QuestBetaAnalysis (and possibly by a few user programs). 
    // Thus, if you prefer to use a different kind of psychometric function, called Foo, you need only create your own QuestCreateFoo, QuestRecomputeFoo, and (if you need it)
    // QuestBetaAnalysisFoo, based on QuestCreate, QuestRecompute, and QuestBetaAnalysis, and you can use them with the rest of the Quest package unchanged. 
    // You would only be changing a few lines of code, so it would quite easy to do.

    // Several users of Quest have asked questions on the Psychtoolbox forum about how to restrict themselves to a practical testing range. 
    // That is not what tGuessSd and "range" are for; they should be large, e.g. I typically set tGuessSd=3 and range=5 when intensity represents log contrast. 
    // If necessary, you should restrict the range yourself, outside of Quest. 
    // Here, in QuestCreate, you tell Quest about your prior beliefs, and you should try to be open-minded, giving Quest a generously large range to consider as possible values of threshold. 
    // For each trial you will later ask Quest to suggest a test intensity. 
    // It is important to realize that what Quest returns is just what you asked for, a suggestion. 
    // You should then test at whatever intensity you like, taking into account both the suggestion and any practical constraints (e.g. a maximum and minimum contrast that you can achieve, and quantization of contrast). 
    // After running the trial you should call QuestUpdate with the contrast that you actually used and the observer's response to add your new datum to the database. 
    // Don't restrict "tGuessSd" or "range" by the limitations of what you can display. 
    // Keep open the possibility that threshold may lie outside the range of contrasts that you can produce, and let Quest consider all possibilities.

    // There is one exception to the above advice of always being generous with tGuessSd. 
    // Occasionally we find that we have a working Quest-based program that measures threshold, and we discover that we need to measure the proportion correct at a particular intensity. 
    // Instead of writing a new program, or modifying the old one, it is often more convenient to instead reduce tGuessSd to practically zero, e.g. a value like 0.001, which has the effect of restricting all threshold estimates to be practically identical to tGuess, making it easy to run any number of trials at that intensity. 
    // Of course, in this case, the final threshold estimate from Quest should be ignored, since it is merely parroting back to you the assertion that threshold is equal to the initial guess "tGuess". 
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

    // See Quest.

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


function QuestRecompute(q, plotIt){
    // q=QuestRecompute(q [,plotIt=0])

    // Call this immediately after changing a parameter of the psychometric function. 
    // QuestRecompute uses the specified parameters in "q" to recompute the psychometric function. 
    // It then uses the newly computed psychometric function and the history in q.intensity and q.response to recompute the pdf. 
    // (QuestRecompute does nothing if q.updatePdf is false.)

    // QuestCreate saves in struct q the parameters for a Weibull psychometric function:

    // p2=delta*gamma+(1-delta)*(1-(1-gamma)*exp(-10.^(beta*(x-xThreshold))));

    // where x represents log10 contrast relative to threshold. 
    // The Weibull function itself appears only in QuestRecompute, which uses the specified parameter values in q to compute a psychometric function and store it in q. 
    // All the other Quest functions simply use the psychometric function stored in "q". 
    // QuestRecompute is called solely by QuestCreate and QuestBetaAnalysis (and possibly by a few user programs). 
    // Thus, if you prefer to use a different kind of psychometric function, called Foo, you need only create your own QuestCreateFoo, QuestRecomputeFoo, and (if you need it) QuestBetaAnalysisFoo, based on QuestCreate, QuestRecompute, and QuestBetaAnalysis, and you can use them with the rest of the Quest package unchanged. 
    // You would only be changing a few lines of code, so it would quite easy to do.

    // "dim" is the number of distinct intensities that the internal tables in q can store, e.g. 500. 
    // This vector, of length "dim", with increment size "grain", will be centered on the initial guess tGuess, i.e. tGuess+[-range/2:grain:range/2]. 
    // QUEST assumes that intensities outside of this interval have zero prior probability, i.e. they are impossible values for threshold. 
    // The cost of making "dim" too big is some extra storage and computation, which are usually negligible. 
    // The cost of making "dim" too small is that you prejudicially exclude what are actually possible values for threshold. 
    // Getting out-of-range warnings from QuestUpdate is one possible indication that your stated range is too small.

    // If you set the optional parameter 'plotIt' to 1, the function will plot the psychometric function in use.

    // See QuestCreate, QuestUpdate, QuestQuantile, QuestMean, QuestMode, QuestSd, and QuestSimulate.

    // pending
    // if length(q)>1
    // 	for i=1:length(q(:))
    // 		q(i).normalizePdf=0; % any norming must be done across the whole set of pdfs, because it's actually one big multi-dimensional pdf.
    // 		q(i)=QuestRecompute(q(i));
    // 	end
    // 	return
    // end

    // if ~q.updatePdf
    // 	return
    // end
    if (!q.updatePdf) return

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

    // pending
    // % Plot Psychometric function if requested:
    // if plotIt > 0
    //     figure;
    //     plot(q.x2, q.p2);
    // end

    // if min(q.p2([1 end]))>q.pThreshold || max(q.p2([1 end]))<q.pThreshold
    //     error(sprintf('psychometric function range [%.2f %.2f] omits %.2f threshold',min(q.p2),max(q.p2),q.pThreshold))
    // end
    if (Math.min(q.p2) > q.pThreshold || Math.max(q.p2) < q.pThreshold){
        alert(`psychometric function range [${Math.min(q.p2)} ${Math.max(q.p2)}] omits ${q.pThreshold} threshold`)
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
    q.xThreshold = numeric.spline(p3, x3).at(q.pThreshold)
    if (numeric.isFinite(q.xThreshold) === false){
        alert(`psychometric function has no ${q.pThreshold} threshold`)
    }
    // console.log(p3)
    // console.log(x3)
    console.log(q.xThreshold)


    // q.p2=q.delta*q.gamma+(1-q.delta)*(1-(1-q.gamma)*exp(-10.^(q.beta*(q.x2+q.xThreshold))));
    // if any(~isfinite(q.p2))
    //     q %#ok<NOPRT>
    //     error('psychometric function p2 is not finite')
    // end
    // const tmp11 = numeric.mul(q.delta, q.gamma)
    // const tmp12 = numeric.sub(1, q.delta)
    // const tmp13 = numeric.sub(1, q.gamma)
    // const tmp14 = numeric.mul(q.beta, numeric.add(q.x2, q.xThreshold))
    // const tmp15 = numeric.pow(10, tmp14)
    // const tmp16 = numeric.exp(numeric.mul(-1, tmp15))
    // const tmp17 = numeric.sub(1, numeric.mul(tmp13, tmp16))
    // q.p2 = numeric.add(tmp11, numeric.mul(tmp12, tmp17))
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
    // const eps = 2.2204 * numeric.pow(10, [-16])
    // const tmp18 = numeric.mul(pH, numeric.log([pH + eps]))
    // const tmp19 = numeric.mul(pL, numeric.log([pL + eps]))
    // const tmp20 = 1 - pH + eps
    // const tmp21 = numeric.mul(tmp20, numeric.log([tmp20]))
    // const tmp22 = 1 - pL + eps
    // const tmp23 = numeric.mul(tmp22, numeric.log([tmp22]))
    // const tmp24 = numeric.sub(tmp18, tmp19)
    // const tmp25 = numeric.add(tmp24, tmp21)
    // const tmp26 = numeric.sub(tmp25, tmp23)
    // const tmp27 = numeric.exp(numeric.div(tmp26, pL-pH))
    // const pE = numeric.div(1, numeric.add(1, tmp27))


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
        const tmp2 = ii(0)
        if (tmp2 < 1){
            ii = numeric.sub(numeric.add(ii, 1), tmp2)
        }
        const tmp3 = ii(ii.length-1)
        const tmp4 = numeric.dim(q.s2)[1]
        if (tmp3 > tmp4){
            ii = numeric.sub(numeric.add(ii, tmp4), tmp3)
        }
        // s2はarray of arrayのはずでよく分からない
        q.pdf = numeric.mul(q.pdf, q.s2[q.response(k)+1, ii]) // 4 ms

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
    
    // Gets a quantile of the pdf in the struct q. You may specify the desired quantileOrder, e.g. 0.5 for median, or, making two calls, 0.05 and 0.95 for a 90confidence interval. 
    // If the "quantileOrder" argument is not supplied, then it's taken from the "q" struct. 
    // QuestCreate uses QuestRecompute to compute the optimal quantileOrder and saves that in the "q" struct;
    // this quantileOrder yields a quantile that is the most informative intensity for the next trial.

    // This is based on work presented at a conference, but otherwise unpublished: Pelli, D. G. (1987). 
    // The ideal psychometric procedure. Investigative Ophthalmology & Visual Science, 28(Suppl), 366.

    // See Quest.

    let t;

    // if nargin>2
    //     error('Usage: intensity=QuestQuantile(q,[quantileOrder])')
    // end

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
    // 複数のqを使っての動作確認
    if (q.length > 1){
        if (typeof quantileOrder !== 'undefined') alert('Cannot accept quantileOrder for q vector. Set each q.quantileOrder instead.')

        const t = numeric.rep([q.length], 0)
        for (let i = 0; i < q.length; i++){
            t[i] = QuestQuantile(q[i]);
        }
    }

    // if nargin<2
    //     quantileOrder=q.quantileOrder;
    // end
    if (typeof quantileOrder === 'undefined' ) quantileOrder = q.quantileOrder

    console.log(quantileOrder)
    // if quantileOrder > 1 || quantileOrder < 0
    //     error('quantileOrder %f is outside range 0 to 1.',quantileOrder);
    // end
    if (quantileOrder > 1 || quantileOrder < 0){
        alert(`quantileOrder ${quantileOrder} is outside range 0 to 1.`)
    }

    p = cumsum(q.pdf);
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
        t = q.tGuess + q.x[0];
        return t
    }

    // if quantileOrder > p(end)
    //     t=q.tGuess+q.x(end);
    //     return
    // end
    if (quantileOrder > p[p.length-1]){
        t = q.tGuess + q.x[q.x.length - 1];
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
    t = q.tGuess + numeric.spline(p2, x2).at(quantileOrder * p[p.length-1])

    return t
}