function output = mynormcdf(x_list, mean, sigma)
    output = zeros(1, length(x_list));
    for idx = 1:length(x_list)
        output(idx) = core_calc(x_list(idx), mean, sigma);
    end
    
end

% https://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript
function output = core_calc(x, mean, sigma)
    z = (x-mean)/sqrt(2*sigma*sigma);
    t = 1/(1+0.3275911*abs(z));
    a1 =  0.254829592;
    a2 = -0.284496736;
    a3 =  1.421413741;
    a4 = -1.453152027;
    a5 =  1.061405429;
    erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*exp(-z*z);
    sign = 1;
    if(z < 0)
    
        sign = -1;
    end
    output = (1/2)*(1+sign*erf);
end
