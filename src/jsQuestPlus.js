// This project is inspired by the following two projects.
//  https://github.com/petejonze/QuestPlus
//  https://github.com/BrainardLab/mQUESTPlus
// Kudos to the developers!
// 
class jsquest {
    // PF menas Psychometric Functions
    constructor(PF, stim_params, PF_params, responses, stopRule, stopCriterion, minNTrials, maxNTrials){

        // 多次元配列の判定？

        // Fが関数でなかった場合のエラー

        this.PF = PF
        this.stim_params = stim_params
        this.PF_params = PF_params
        this.comb_stim_params = stim_params.reduce(jsquest.combvec) // comb means combined; vec means vectors.
        this.comb_PF_params = PF_params.reduce(jsquest.combvec)

        // default priors 引数で指定されたものにも対応する必要あり
        const priors = []
        PF_params.forEach(param => {
            const unit_vector = numeric.linspace(1, 1, param.length) // numeric.rep?
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
        this.normalized_priors = numeric.div(mulitiplied_priors, numeric.sum(mulitiplied_priors))
        this.normalized_posteriors = this.normalized_priors

        this.responses = responses
        // this.stopRule = stopRule.toLowerCase()
        
        this.stopCriterion = stopCriterion
        this.minNTrials = minNTrials
        this.maxNTrials = maxNTrials

        if (stopRule === "ntrials"){
            if (typeof minNTrials !== 'undefined' && minNTrials !== stopCriterion ) {
                alert('When stopRule is specified as ntrials, minNTrials and stopCriterion must be the same.')
            } else if (typeof maxNTrials !== 'undefined' && maxNTrials !== stopCriterion ) {
                alert('When stopRule is specified as ntrials, maxNTrials and stopCriterion must be the same.')
            }
        }
    
        // 引数が適切かどうかの確認


                
        // Precompute outcome proportions
        // ここで呼び出すならば、事前分布を指定したいときの処理も考えなければならない
        
        // response x stimulus (row) x PF parameters (column)
        const precomputed_outcome_proportions = []
        this.PF.forEach(func => {
            const likelihoods_stimulus_domain = []
            this.comb_stim_params.forEach(stim => {
                const probabilities = []
                this.comb_PF_params.forEach(param => { // parameters of PF
                    const tmp_arguments = Array.isArray(stim) ? stim.concat(param) : [stim].concat(param)
                    probabilities.push(func(...tmp_arguments))
                })
                likelihoods_stimulus_domain.push(probabilities)
            })
            precomputed_outcome_proportions.push(likelihoods_stimulus_domain)    
        })
        this.precomputed_outcome_proportions = precomputed_outcome_proportions

    }

    getEstimates(thresholdingRule = 'mode', roundStimuliToDomain = true){
        switch (thresholdingRule){
            case 'mean':
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
            case 'median':
                const cumsum_array = jsquest.cumsum(this.normalized_posteriors)
                const abs_array = numeric.abs(numeric.sub(cumsum_array, 0.5))
                const idx_median = jsquest.find_min_index(abs_array)
                return this.comb_PF_params[idx_median]
            case 'mode':
                const idx_mode = jsquest.find_max_index(this.normalized_posteriors)
                return this.comb_PF_params[idx_mode]
            default:
                alert(`The argument of the getEstimates must be one of : "mean" | "median" | "mode".`)
        }
    }


    
    getStimParams(){
        // Compute the product of likelihood and current posterior array
        // likelihoodsは3つの入れ子配列。1番目が反応、2番目が刺激、3番目がpfのパラメーター

        const EH_array = numeric.rep([this.comb_stim_params.length], 0)
        this.precomputed_outcome_proportions.forEach(proportions_at_stim_params => { // For each response
            proportions_at_stim_params.forEach((proportions_at_PF_params, index) => { // For each stimulus domain
                const posterior_times_proportions = numeric.mul(this.normalized_posteriors, proportions_at_PF_params)
                const expected_outcomes = numeric.sum(posterior_times_proportions)
                const posterior = numeric.div(posterior_times_proportions, expected_outcomes)
                const tmp_entropy = numeric.mul(posterior, numeric.log(posterior))
                const H = (-1) * tmp_entropy.reduce((a,b) => a + (isNaN(b) ? 0: b), 0) // nansum function 
                // https://stackoverflow.com/questions/50956086/javascript-equivalent-of-nansum-from-matlab

                //  Compute the expected entropy for each stimulus by averaging entropies over each outcome
                EH_array[index] = EH_array[index] + expected_outcomes * H
            })
        })

        const index = jsquest.find_min_index(EH_array)
        let stim = this.comb_stim_params[index]
        return stim

        // console.log(index)
        // console.log(this.stim_params)
        // console.log(stim)

        // ここは実際は呼ばれていない
        // constrain selection if required (and if not on first trial) -- new method, based on actual domain-entry units
        // 刺激の選択について、なにか制約を設ける？
        // if (typeof(this.stimConstrainToNOfPrev) !== 'undefined' && typeof(this.history_stim) !== 'undefined'){
        //     const prevStim = this.history_stim[this.history_stim.length - 1]

        //     // prevStimは、刺激の各次元の値をひとつずつ持っている
        //     prevStim.forEach((element, index) => {
        //         // this.stim_params[index] = domain
        //         const tmp1 = numeric.sub(this.stim_params[index], element)
        //         const tmp2 = numeric.abs(tmp1)
        //         const idx0 = jsquest.find_min_index(tmp2)

        //         const targIdx = this.stim_params.indexOf(stim[index])

        //         if (Math.abs(targIdx - idx0) > this.stimConstrainToNOfPrev[index]){
        //             const idx1 = idx0 + Math.sign(targIdx - idx0) * this.stimConstrainToNOfPrev[index]
        //             stim[index] = this.stim_params[idx1]
        //         }
        //     })
        // }

    }

    update(stim, resp){
        const stimIdx = this.comb_stim_params.indexOf(stim)
        const new_posterior = numeric.mul(this.normalized_posteriors, this.precomputed_outcome_proportions[resp][stimIdx])
        const s = numeric.sum(new_posterior)
        this.normalized_posteriors = numeric.div(new_posterior, s)
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

    static getArray_with_fix_interval(start, interval, end){
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
