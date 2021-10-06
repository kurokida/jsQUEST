class QuestPlus {
    constructor(F, stimDomain, paramDomain, respDomain, stopRule, stopCriterion, minNTrials, maxNTrials){

        // 多次元配列の判定？

        // Fが関数でなかった場合のエラー

        this.F = F
        this.stimDomain = stimDomain
        this.paramDomain = paramDomain
        this.comb_stimDomain = stimDomain.reduce(combvec)
        this.comb_paramDomain = paramDomain.reduce(combvec)

        // default priors 引数で指定されたものにも対応する必要あり
        const priors = []
        paramDomain.forEach(param => {
            const unit_vector = numeric.linspace(1, 1, param.length) // numeric.rep?
            priors.push(numeric.div(unit_vector, param.length))
            // priors.push(unit_vector)
        })
        this.priors = priors
        const comb_priors = priors.reduce(combvec)
        let mulitiplied_priors = []

        console.log(Array.isArray(comb_priors[0]))

        if (Array.isArray(comb_priors[0])){
            comb_priors.forEach(element => {
                mulitiplied_priors.push(element.reduce(multiply_reducer))
            })    
        } else {
            mulitiplied_priors = comb_priors
        }

        this.comb_priors = comb_priors
        this.normalized_priors = numeric.div(mulitiplied_priors, numeric.sum(mulitiplied_priors))
        this.normalized_posteriors = this.normalized_priors

        this.respDomain = respDomain
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


                
        // Compute likelihoods
        // ここで呼び出すならば、事前分布を指定したいときの処理も考えなければならない
        
        // this.comb_allDomain.forEach(params => {
        //     likelihoods.push(this.F(...params))
        // })
        // this.respDomain.forEach(resp => {

            
        const likelihoods = []

        this.F.forEach(func => {
            const likelihoods_for_single_resp = []
            this.comb_stimDomain.forEach(stim => {
                const each_stimDomain = []
                this.comb_paramDomain.forEach(param => {
                    if (Array.isArray(stim)) {
                        if (Array.isArray(param)) {
                            each_stimDomain.push(func(...stim, ...param))
                        } else {
                            each_stimDomain.push(func(...stim, param))
                        }
                    } else {
                        if (Array.isArray(param)) {
                            each_stimDomain.push(func(stim, ...param))
                        } else {
                            each_stimDomain.push(func(stim, param))
                        }
                    }
                    // each_stimDomain.push(func(...stim, ...param))
    
                })
                likelihoods_for_single_resp.push(each_stimDomain)
            })
            likelihoods.push(likelihoods_for_single_resp)    
        })

        // const likelihoods = []
        // // console.log()
        // for (let i = 0; i < respDomain.length; i++) likelihoods.push(likelihoods_for_single_resp)
    
        // })
        this.likelihoods = likelihoods

    }

    initialise(obj, priors, likelihoodsFnOrDat){
        // 事前分布の確認。指定がないときには、1をデータ数で均等に割った値（すべてを足し合わせたら1になるように）
        // 事前分布はparamのみ？

        // 事前分布をその場で計算する？

        // 351行目 compute prior
        // % compute prior
        // x = combvec(priors{:});  % get all combinations of priors
        // x = prod(x,1);           % multiply together (assumes independence!!)
        // x = x./sum(x);           % normalize so sum to 1
        // obj.prior = x;

        // 出力結果の個数 69行目　nFuncOutputs

        // オリジナルQUESTで扱うようなデータであれば、短縮できるかも 374行目

        // // Compute likelihoods
        // // console.log(this.comb_stimDomain)
        // const likelihoods = []
        // this.comb_allDomain.forEach(params => {
        //     likelihoods.push(this.F(...params))
        // })
        


    }

    speak(){
        // console.log(this.stimDomain)

        this.stimDomain.forEach(element =>{
            // console.log(element)
            element.map(x => {
                // console.log(x*2)
                this.paramDomain.forEach(para =>{
                    para.map(y => {
                        // console.log(`stim=${x}, para=${y}, Z=${x+y}`)

                    })
                })
            })
        })
    }

    // getParamEsts(obj, thresholdingRule, roundStimuliToDomain){
    getParamEsts(thresholdingRule, roundStimuliToDomain){
        switch (thresholdingRule){
            case 'mean':
                // console.log(this.paramDomain)
                console.log(this.posteriors)
                const params = numeric.mul(this.paramDomain, this.posteriors)
                const output = []
                params.forEach(element => output.push(numeric.sum(element)))
                return output
                // console.log(numeric.mul([3],[4]))
                // break; // returnするならbreak不要
        }
    }


    getTargetStim(obj){
        // Compute the product of likelihood and current posterior array
        // likelihoodsは3つの入れ子配列。1番目が反応、2番目が刺激、3番目がpfのパラメーター

        const postTimesL = []
        const pk = []
        const newPosteriors = []
        const entropy_H = []
        this.likelihoods.forEach(stim_param => { // For each response
            const elements_of_postTimesL = []
            const elements_of_pk = []
            const elements_of_posteriors = []
            const elements_of_entropy = []
            stim_param.forEach(params => { // For each stimulus parameters
                const pdf = numeric.mul(this.normalized_posteriors, params)
                elements_of_postTimesL.push(pdf)
                const s = numeric.sum(pdf)
                elements_of_pk.push(s)
                const posterior = numeric.div(pdf, s)
                elements_of_posteriors.push(posterior)

                const tmp4 = numeric.mul(posterior, numeric.log(posterior))

                // if (isNaN(tmp4[0])) {
                //     console.log("NaN")
                // } else {
                const H = (-1) * tmp4.reduce((a,b) => a + (isNaN(b) ? 0: b), 0) // nansum function 
                // https://stackoverflow.com/questions/50956086/javascript-equivalent-of-nansum-from-matlab
                elements_of_entropy.push(H)
                // }
            })
            postTimesL.push(elements_of_postTimesL)
            pk.push(elements_of_pk)
            newPosteriors.push(elements_of_posteriors)
            entropy_H.push(elements_of_entropy)

        })
        // console.log(postTimesL)
        // console.log(pk)
        // console.log(newPosteriors)
        // console.log(entropy_H)

        const elements_of_EH = []
        let EH = numeric.rep([pk[0].length], 0) // stimdomainの数だけ
        entropy_H.forEach((stim, index1) => {
            const tmp = numeric.mul(stim, pk[index1])
            EH = numeric.add(EH, tmp)
            // elements_of_EH.push(tmp)
            // const tmp = []
            // stim_param.forEach((params, index2) => {
            //     tmp.push(numeric.mul(params, pk[index1][index2]))
            // })
        })
        // console.log(EH)
        // for (let i = 0; i < elements_of_EH)
        const index = find_min_index(EH)
        // let stim = this.stimDomain[index]
        let stim = this.comb_stimDomain[index]
        // console.log(index)
        // console.log(this.stimDomain)
        // console.log(stim)

        // constrain selection if required (and if not on first trial) -- new method, based on actual domain-entry units
        // 刺激の選択について、なにか制約を設ける？
        if (typeof(this.stimConstrainToNOfPrev) !== 'undefined' && typeof(this.history_stim) !== 'undefined'){
            const prevStim = this.history_stim[this.history_stim.length - 1]

            // prevStimは、刺激の各次元の値をひとつずつ持っている
            prevStim.forEach((element, index) => {
                // this.stimDomain[index] = domain
                const tmp1 = numeric.sub(this.stimDomain[index], element)
                const tmp2 = numeric.abs(tmp1)
                const idx0 = find_min_index(tmp2)

                const targIdx = this.stimDomain.indexOf(stim[index])

                if (Math.abs(targIdx - idx0) > this.stimConstrainToNOfPrev[index]){
                    const idx1 = idx0 + Math.sign(targIdx - idx0) * this.stimConstrainToNOfPrev[index]
                    stim[index] = this.stimDomain[idx1]
                }
            })
        }



        return stim


        // numeric.mul(pk, entropy_H)

        // newPosteriors.forEach(stim_param => {
        //     stim_param.forEach(params => {

        //     })
        // })

        
    }

    update(stim, resp){
        const stimIdx = this.comb_stimDomain.indexOf(stim)
        const new_posterior = numeric.mul(this.normalized_posteriors, this.likelihoods[resp][stimIdx])
        const s = numeric.sum(new_posterior)
        this.normalized_posteriors = numeric.div(new_posterior, s)
    }
}

// It is similar to the combvec function in MATLAB.
// https://jp.mathworks.com/help/deeplearning/ref/combvec.html?lang=en
combvec = function(a, b, divide_flag){
    if (divide_flag === "undefined") divide_flag = true
    let output = [] 
    if (Array.isArray(a) && divide_flag){
        divide_flag = false
        a.forEach(element => {
            const res = combvec(element, b, divide_flag)
            output = output.concat(res)
        })
    } else if (Array.isArray(b)){
        b.forEach(element => {
            output.push(combvec(a, element, divide_flag))
        })
    }
    else {
        if (!Array.isArray(a)) a = [a]
        return a.concat(b)
    }
    return output
}

multiply_reducer = function(a, b) {
    return a*b
}

min_reducer = function (a, b) {
    return Math.min(a, b);
}

function find_min_index(array){
    const min = array.reduce(min_reducer)
    return array.indexOf(min)    
}

// https://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript
// ただし引数の順番を変更して、一番目をxとしている
function normcdf(x, mean, sigma) 
{
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