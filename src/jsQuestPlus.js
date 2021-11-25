// This project is inspired by the following two projects.
//  https://github.com/petejonze/QuestPlus
//  https://github.com/BrainardLab/mQUESTPlus
// Kudos to the developers!
// 
import numeric from 'numeric_es6';
/* global numeric */

console.log('jsQuestPlus Version 1.0.0')

class jsquest {
    // PF menas Psychometric Functions
    constructor(PF, stim_params, PF_params){
        this.nAlerts = 0

        this.PF = PF

        stim_params.forEach(param =>{
            if (!Array.isArray(param)) {
                alert('The stimulus parameters must be specified as an array.')
                this.nAlerts++
            }
        })        

        PF_params.forEach(param =>{
            if (!Array.isArray(param)) {
                alert('The parameters of the psychometric function must be specified as an array.')
                this.nAlerts++
            }
        })        

        this.stim_params = stim_params
        this.PF_params = PF_params

        // The combvec function is almost identical to that of MATLAB.
        // https://jp.mathworks.com/help/deeplearning/ref/combvec.html?lang=en
        this.comb_stim_params = stim_params.reduce(jsquest.combvec) // comb means combined; vec means vectors.
        this.comb_PF_params = PF_params.reduce(jsquest.combvec)
        

        // For now, only certain prior distributions are supported
        const priors = []
        PF_params.forEach(param => {
            const unit_vector = numeric.linspace(1, 1, param.length) // numeric.rep?
            if (param.length === 0) {
                alert('Divided by zero.')
                console.error('Divided by zero.')
                this.nAlerts++
            }
            priors.push(numeric.div(unit_vector, param.length))
        })
        this.priors = priors
        const comb_priors = priors.reduce(jsquest.combvec)

        let mulitiplied_priors = []
        if (Array.isArray(comb_priors[0])){
            comb_priors.forEach(element => {
                mulitiplied_priors.push(element.reduce(jsquest.multiply_reducer))
            })    
        } else {
            mulitiplied_priors = comb_priors
        }

        this.comb_priors = comb_priors

        const sum_of_priors = numeric.sum(mulitiplied_priors)
        if (sum_of_priors === 0) {
            alert('Divided by zero.')
            console.error('Divided by zero.')
            this.nAlerts++
        }
        this.normalized_priors = numeric.div(mulitiplied_priors, sum_of_priors)
        this.normalized_posteriors = this.normalized_priors

        this.responses = numeric.linspace(0, PF.length-1, PF.length)
                
        // Precompute outcome proportions (likelihoods)
        // response x stimulus (row) x PF parameters (column)
        const precomputed_outcome_proportions = []
        this.PF.forEach(func => {
            const likelihoods_stimulus_domain = []
            this.comb_stim_params.forEach(stim => {
                const probabilities = []
                this.comb_PF_params.forEach(param => { // PF parameters
                    const tmp_arguments = Array.isArray(stim) ? stim.concat(param) : [stim].concat(param)
                    const p = func(...tmp_arguments)
                    if (p < 0) {
                        alert('Psychometric function has returned negative probability for an outcome')
                        this.nAlerts++
                    }
                    if (p > 1){
                        alert('Psychometric function has returned probability that exceeds one for an outcome')
                        this.nAlerts++
                    }
                    probabilities.push(p)
                })
                likelihoods_stimulus_domain.push(probabilities)
            })
            precomputed_outcome_proportions.push(likelihoods_stimulus_domain)    
        })
        this.precomputed_outcome_proportions = precomputed_outcome_proportions

        this.expected_entropies_by_stim = jsquest.update_entropy_by_stim(this) // The initial entropies
    }

    // This is similar to the QuestSd function
    // http://psychtoolbox.org/docs/QuestSd 
    getSDs(){
        const params = numeric.transpose(this.comb_PF_params)
        const sd = []
        params.forEach(data => {
            const tmp = numeric.mul(data, this.normalized_posteriors)
            const mean = numeric.sum(tmp)

            // p=sum(q.pdf);
            // sd=sqrt(sum(q.pdf.*q.x.^2)/p-(sum(q.pdf.*q.x)/p).^2);
            const p = numeric.sum(this.normalized_posteriors) // This will be 1 as long the normalized posteriors are used.
            if (p === 0) {
                alert('Divided by zero.')
                console.error('Divided by zero.')
                this.nAlerts++
            }
            const tmp1 = numeric.pow(data, 2)
            const tmp2 = numeric.mul(this.normalized_posteriors, tmp1)
            const tmp3 = numeric.div(numeric.sum(tmp2), p)
            const tmp4 = numeric.div(mean, p)
            const tmp5 = numeric.pow(tmp4, [2])
            const tmp6 = numeric.sqrt(numeric.sub(tmp3, tmp5)) // tmp6 is an array containing only one element
            // console.log(tmp6)
            // return tmp6[0]
            sd.push(tmp6[0])
        })
        return sd
    }

    // Same as the getParamEsts()
    getEstimates(thresholdingRule = 'mode', roundStimuliToDomain = true){
        switch (thresholdingRule){
            case 'mean': {
                const params = numeric.transpose(this.comb_PF_params)
                const estimates_mean = []
                const deviation = []
                params.forEach(data => {
                    const tmp = numeric.mul(data, this.normalized_posteriors)
                    const mean = numeric.sum(tmp)
                    estimates_mean.push(mean)
                    deviation.push(numeric.pow(numeric.sub(data, mean), 2))
                })

                if (roundStimuliToDomain) {
                    const dev_matrix = numeric.transpose(deviation)
                    const tmp_array = []
                    dev_matrix.forEach(data => {
                        const avg = numeric.sum(data)/data.length
                        tmp_array.push(Math.sqrt(avg))
                    })
                    const idx_mean = jsquest.find_min_index(tmp_array)
                    return this.comb_PF_params[idx_mean]
                } else {
                    return estimates_mean
                }
            }
            // case 'median':
                // Pending
                // The following code is a faithful reproduction of the Matlab code.
                // However, I'm skeptical about this calculation
                // because the method seems to depend on the order of the data in normalized_posteriors.
                // I am not sure if the value obtained by this calculation is the median.
                //
                // See https://github.com/petejonze/QuestPlus/issues/2
                // 
                // const cumsum_array = jsquest.cumsum(this.normalized_posteriors)
                // const abs_array = numeric.abs(numeric.sub(cumsum_array, 0.5))
                // const idx_median = jsquest.find_min_index(abs_array)
                // return this.comb_PF_params[idx_median]
            case 'mode': {
                const idx_mode = jsquest.find_max_index(this.normalized_posteriors)
                return this.comb_PF_params[idx_mode]
            }
            default:
                alert(`The argument of the getEstimates must be "mean" or "mode".`)
        }
    }


    
    getStimParams(){
        // Compute the product of likelihood and current posterior array
        // Structure of likelihoods: response x stimulus (row) x PF parameters (column)

        const index = jsquest.find_min_index(this.expected_entropies_by_stim)
        let stim = this.comb_stim_params[index]
        return stim
    }

    update(stim, resp){
        const stimIdx = this.comb_stim_params.indexOf(stim)

        if (!Object.prototype.hasOwnProperty.call(this, 'stim_list')){
            this.stim_list = [stim]
            this.resp_list = [resp]
            this.stim_index_list = [stimIdx]
        } else {
            this.stim_list.push(stim)
            this.resp_list.push(resp)
            this.stim_index_list.push(stimIdx)
        }
        const new_posterior = numeric.mul(this.normalized_posteriors, this.precomputed_outcome_proportions[resp][stimIdx])
        const s = numeric.sum(new_posterior)
        if (s === 0) {
            alert('Divided by zero.')
            console.error('Divided by zero.')
            this.nAlerts++
        }
        this.normalized_posteriors = numeric.div(new_posterior, s)
        this.expected_entropies_by_stim = jsquest.update_entropy_by_stim(this)
    }

    static update_entropy_by_stim(data){
        const EH_array = numeric.rep([data.comb_stim_params.length], 0)
        data.precomputed_outcome_proportions.forEach(proportions_at_stim_params => { // For each response
            proportions_at_stim_params.forEach((proportions_at_PF_params, index) => { // For each stimulus domain
                const posterior_times_proportions = numeric.mul(data.normalized_posteriors, proportions_at_PF_params)
                const expected_outcomes = numeric.sum(posterior_times_proportions)
                if (expected_outcomes === 0) {
                    alert('Divided by zero.')
                    console.error('Divided by zero.')
                    this.nAlerts++
                }
                const posterior = numeric.div(posterior_times_proportions, expected_outcomes)
                // const tmp_entropy = numeric.mul(posterior, numeric.log(posterior)) // Note that log2 is used in qpArrayEntropy
                const tmp_entropy = numeric.mul(posterior, jsquest.log2(posterior))
                const H = (-1) * tmp_entropy.reduce((a,b) => a + (isNaN(b) ? 0: b), 0) // nansum function 
                // https://stackoverflow.com/questions/50956086/javascript-equivalent-of-nansum-from-matlab

                //  Compute the expected entropy for each stimulus by averaging entropies over each outcome
                EH_array[index] = EH_array[index] + expected_outcomes * H
            })
        })
        return EH_array
    }

    // Wrappers for the numeric.js
    static linspace = numeric.linspace
    static abs = numeric.abs
    static add = numeric.add
    static cos = numeric.cos
    static dim = numeric.dim
    static div = numeric.div
    static dot = numeric.dot
    static exp = numeric.exp
    static floor = numeric.floor
    static isFinite = numeric.isFinite
    static isNaN = numeric.isNaN
    static log = numeric.log
    static mod = numeric.mod
    static mul = numeric.mul
    static pow = numeric.pow
    static round = numeric.round
    static sin = numeric.sin
    static sqrt = numeric.sqrt
    static sub = numeric.sub
    static sum = numeric.sum
    static transpose = numeric.transpose

    static log2(array){
        const length = array.length
        const output = []
        for (let i = 0; i < length; i++) output.push(Math.log2(array[i]))
        return output
    }

    // It is similar to the combvec function in MATLAB.
    // https://jp.mathworks.com/help/deeplearning/ref/combvec.html?lang=en
    static combvec(a, b, divide_flag){
        if (divide_flag === "undefined") divide_flag = true
        let output = [] 
        if (Array.isArray(a) && divide_flag){
            divide_flag = false
            a.forEach(element => {
                const res = jsquest.combvec(element, b, divide_flag)
                output = output.concat(res)
            })
        } else if (Array.isArray(b)){
            b.forEach(element => {
                output.push(jsquest.combvec(a, element, divide_flag))
            })
        }
        else {
            if (!Array.isArray(a)) a = [a]
            return a.concat(b)
        }
        return output
    }

    static multiply_reducer(a, b) {
        return a * b
    }
    
    // This is the same as the cumusm function of MATLAB
    static cumsum(array){
        const output = [array[0]]
        for (let i = 1; i < array.length; i++){
            const tmp = output[output.length - 1] + array[i]
            output.push(tmp)
        }
        return output
    }

    static find_min_index(array){
        const min = array.reduce(min_reducer)
        return array.indexOf(min)    

        function min_reducer(a, b) {
            return Math.min(a, b);
        }
    }
    
    static find_max_index(array){
        const max = array.reduce(max_reducer)
        return array.indexOf(max)    

        function max_reducer(a, b) {
            return Math.max(a, b);
        }
    }

    // https://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript
    // ただし引数の順番を変更して、一番目をxとしている
    // erf関数を使用する方法もあるようだ
    static normcdf(x, mean, sigma) {
        const z = (x-mean)/Math.sqrt(2*sigma*sigma);
        const t = 1/(1+0.3275911*Math.abs(z));
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
        let sign = 1;
        if(z < 0)
        {
            sign = -1;
        }
        return (1/2)*(1+sign*erf);
    }

    static weibull(stim, threshold, slope, guess, lapse) {
        const tmp = slope * (stim - threshold)/20
        return lapse - (guess + lapse -1)*Math.exp(-Math.pow(10, tmp))
    }

    static simulate_weibull_two_resp(current_intensity, true_threshold, true_slope, true_guess, true_lapse){
        if (Math.random() > jsquest.weibull(current_intensity, true_threshold, true_slope, true_guess, true_lapse)){
            return 1 // yes
        } else {
            return 0 // no
        }
    } 

    static array(start, interval, end){
        const tmp = Math.floor((end-start)/interval)
        const adjusted_end = start + interval * tmp
        return numeric.linspace(start, adjusted_end, tmp+1)
    }

    // Note that the following code is written in qpUnitizeArray
    //
    // %% Get summed values for each column
    // %
    // % I fussed with this code in the profiler, but couldn't get it to run
    // % much faster than it does.  The code inside the if doesn't get used very
    // % often, in cases I tried.  I suppose one could live dangerously and not do
    // % the check for the zero divide.  But I don't think pain if it ever failed
    // % to be caught is worth the risk.
    // sumOfValues = sum(inputArray,1);
    // uniformArray = bsxfun(@rdivide,inputArray,sumOfValues);
    // if (any(sumOfValues == 0))
    //     index = find(sumOfValues == 0);
    //     [m,~] = size(inputArray);
    //     uniformColumn = qpUniformArray([m 1]);
    //     uniformArray(:,index) = repmat(uniformColumn,1,length(index));
    // end    

}

export default jsquest;