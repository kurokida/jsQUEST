classdef QuestPlus < handle
    % Matlab implementation of Andrew Watson's QUEST+ algorithm for
    % efficient & flexible adaptive psychophysical parameter estimation.
    %
    %   >>> How to use:
    %   For examples of use, see QuestPlus.runExample()
    %
    %   >>> Background Info:
    %   QUEST+ is highly efficient, as it uses the concept of entropy to
    %   determine the most informative point to test on each successive
    %   trial.
    %   QUEST+ is also highly flexible since, unlike ordinary QUEST, the
    %   user is no longer limited to estimating a single parameter. A
    %   multiparameter model can therefore be specified (e.g., both the
    %   mean and slope of the psychometric function, or as with the
    %   3-paramter tCSF). When using higher-dimensional searchspaces there
    %   may, however, be a noticable lag when initialising the QuestPlus
    %   object, since all possible likelihoods (conditional probabilities
    %   of each outcome at each stimulus value for each parameter value) is
    %   computed/cached. Higher dimensional search spaces also require more
    %   trials to converge on precise estimates, obviously.
    %   Like QUEST, a prior can be specified to help constrain the search
    %   space, potentially making estimates faster and more precise.
    %   (Though if the prior is inappropriate then this may introduce
    %   bias).
    %
    %   >>> Disclaimer:
    %   This software is provided as-is, and I (PRJ) have done relatively
    %   little testing/debugging. Please let me know if you spot any
    %   errors, or can suggest any improvements (<petejonze@gmail.com>).
    %
    %   >>> For further info, and to cite:
    %   Watson (in press): "QUEST+: a general multidimensional Bayesian
    %      adaptive psychometric method"
    %
    % QuestPlus Methods:
    %   * QuestPlus         - QuestPlus Constructor.
    %   * initialise        - Set priors and cache/compute likelihoods.
    %   * setStimSelectOpt  - Set and validate stimulus selection option (Expert users only).
    %   * getTargetStim     - Get target level(s) to present to the observer.
    %   * update            - Update the posterior, based on the presented stimulus level and observed outcome and stimulus location.
    %   * isFinished        - Evaluate the stopRule: return TRUE if QUEST+ if complete, FALSE otherwise.
    %   * getParamEsts      - Compute parameter estimates, using the specified rule (mean, median, mode).
    %   * disp              - Print to console info regarding the internal state of the current Quest+ object.
    %
    % Public Static Methods:
    %   * runExample	- Minimal-working-example(s) of usage
    %
    % Examples of use:
    %   QuestPlus.runExample(1)
    %   QuestPlus.runExample(2)
    %   QuestPlus.runExample(3)
    %   QuestPlus.runExample(4)
    %   QuestPlus.runExample(5)
    %   QuestPlus.runExample(6)
    %   QuestPlus.runExample(7)
    %   QuestPlus.runExample(8)
    %   QuestPlus.runExample(9)
    %
    % Author:
    %   Pete R Jones <petejonze@gmail.com>
    %
    % Verinfo:
    %   0.0.1	PJ	30/06/2016 : first_build\n
    %   0.0.2	PJ	01/08/2016 : completed core functionality, and added documentation\n
    %   0.0.3	PJ	09/10/2016 : fixed error in calculation of posterior PDFs (now properly replicates Watson's examples\n
    %   0.0.4	PJ	11/11/2016 : Correcting bugs pointed out by Josh\n
    %   0.0.5	PJ	24/09/2017 : Cosmetic adjustments for JORS\n
    %   1.0.0	PJ	28/09/2017 : First GitHub release\n
    %   1.0.1	PJ	20/04/2018 : Added Ricco's area example\n
    %
    % @todo allow for non-precomputed-target-stimuli in update?
    % @todo could add a single-precision mode for if greater
    %       speed/optimisation is absolutely required
    % @todo changing priors shouldnt affect loading of likelihoods?
    % @todo add check that priors/params/stim domains are ROW vectors (not
    % column!)
    %
    % Copyright 2016 : P R Jones <petejonze@gmail.com>
    % *********************************************************************
    %

    %% ====================================================================
    %  -----PROPERTIES-----
    %$ ====================================================================      

    properties (GetAccess = public, SetAccess = private)
        % mandatory user-specified parameters, set when creating QuestPlus object
        F               % The function / underlying model, which will be attempting to estimate the parameters for
        stimDomain      % Vector/Matrix of possible values over which the function, F, will be analysed. Each variable is a different column, such that domain is an [m n] matrix, where each m is a value, and each n is a variable (NB: currently entered by the user as a list of vectors, before being converted into a matrix)
        paramDomain     % Vector/Matrix of possible stimulus values  (NB: currently entered by the user as a list of vectors, before being converted into a matrix)
        respDomain      % Vector of possible observer response value

        % optional user-specified parameters, set when creating QuestPlus object
        stopRule            = 'entropy' % 'stdev' | 'ntrials' | 'entropy'
        stopCriterion     	= 3         % Value for stopRule: either num presentation (N), or Entropy (H)
        minNTrials          = 0         % minimum number of trials before isFin==true
        maxNTrials          = inf       % maximum number of trials before isFin==true
        
        % advanced target-stimulus selection option, set using setStimSelectOpt()
        stimSelectionMethod  	= 'min'; % Options: 'min' | 'weighted' | 'percentile' | 'minOrRand'
        stimSelectionParam  	= 2;
        stimConstrainToNOfPrev  = []; % in units of 'domain index' 
        
        % computed variables, set when using initialise()
        prior               % vector, containing probability of each parameter-combination
        likelihoods        	% 2D matrix, containing conditional probabilities of each outcome at each stimulus-combination/parameter-combination
        posterior          	% posterior probability distribution over domain.
        
        % measured variables, updated after each call to update()
        history_stim        = []        % vector of stims shown
        history_resp        = []        % vector of responses (1 HIT, 0 MISS)
    end

    
 	%% ====================================================================
    %  -----PUBLIC METHODS-----
    %$ ====================================================================
    
    methods (Access = public)
        
        %% == CONSTRUCTOR =================================================
        
        function obj = QuestPlus(F, stimDomain, paramDomain, respDomain, stopRule, stopCriterion, minNTrials, maxNTrials)
            % QuestPlus Constructor.
            %
            %   Create a new QuestPlus object. Note that this object must
            %   then be explictly initialised before usage.
            %
            % @param    F               function handle for the model that we are attempting to for the parameters of.
            %                             E.g.: F = @(x,mu)([1-normcdf(x,mu,1),normcdf(x,mu,1)])';
            % @param    stimDomain      Vector(s) of possible values over which the function, F, will be analysed. Each variable should be a row vector. If entering multiple vectors, each should be an element in a cell array.
            %                             E.g.: stimDomain = linspace(-1, 10, 50);
            %                             E.g.: stimDomain = {linspace(-1,10,50), linspace(5,40,20)};
            % @param    paramDomain     Vector(s) of possible stimulus values. Each variable should be a row vector. If entering multiple vectors, each should be an element in a cell array.
            %                             E.g.: paramDomain = linspace(-5,5,100);
            %                             E.g.: paramDomain = {linspace(-5,5,50), linspace(.01,3,45)};
            % @param    respDomain      Vector of possible observer response value.
            %                             E.g.: respDomain = [0 1];
            % @param    stopRule        How to determine if the QUEST+ algorithm is complete. Either: 'stdev' | 'ntrials' | 'entropy'. Stdev only permitted in the simple, 1-parameter, case
            %                             E.g.: stopRule = 'stdev'
            %                             Default: 'entropy'            
            % @param    stopCriterion   The criterion for the specified rule. Typically around 1.5 for stdev, 3 for entropy, or 64 for ntrials.
            %                             E.g.: stopCriterion = 1.5
           	%                             Default: 3
            % @param    minNTrials      Minimum N trials before registering as complete. Zero to use the stopRule only to assess completion.
            %                             E.g.: minNTrials = 32
            %                             Default: 0            
            % @param    maxNTrials      Maximum N trials, after which will register as complete. Inf to use the stopRule only to assess completion.
            %                             E.g.: maxNTrials = 128
            %                             Default: inf 
            % @return   QuestPlus       QuestPlus object handle
            %
            % @date     01/08/16
            % @author   PRJ
            %
            % %todo:    check F is a well formed CDF (?)
            %
            
            % ensure inputs are cells, for consistency (format required if
            % inputting multiple vectors)
            if ~iscell(stimDomain)
                stimDomain = {stimDomain};
            end
            if ~iscell(paramDomain)
                paramDomain = {paramDomain};
            end
            
            % validate mandatory inputs 
            if ~isa(F,'function_handle')
                error('F must be a function handle');
            end
            if nargin(F) ~= (length(stimDomain)+length(paramDomain))
                error('domains must contain one cell entry for each parameter of F');
            end
            
            % set mandatory inputs
            obj.F           = F;
            obj.stimDomain  = combvec(stimDomain{:});   % convert to matrix
            obj.paramDomain = combvec(paramDomain{:});  % convert to matrix
            obj.respDomain  = respDomain;

            % parse optional inputs
            if nargin >= 5 && ~isempty(stopRule),           obj.stopRule = lower(stopRule);     end
            if nargin >= 6 && ~isempty(stopCriterion),   	obj.stopCriterion = stopCriterion;  end
            if nargin >= 7 && ~isempty(minNTrials),         obj.minNTrials = minNTrials;       	end
            if nargin >= 8 && ~isempty(maxNTrials),         obj.maxNTrials = maxNTrials;       	end

            % if stop rule is 'ntrials', then ensure that nTrials are set
            % appropriately, and that all request parameters are consistent
            if strcmpi(obj.stopRule, 'ntrials')
                if nargin >= 7 && ~isempty(minNTrials) && stopCriterion ~= minNTrials
                    error('If stop rule is "ntrials" then stop criterion (%i) must match requested minNTrials (%i) -- or just don''t bother setting it minNTrials, as it''s redundant when stop rule is "ntrials"', stopCriterion, minNTrials);
                elseif nargin >= 8 && ~isempty(maxNTrials) && stopCriterion ~= maxNTrials
                    error('If stop rule is "ntrials" then stop criterion (%i) must match requested maxNTrials (%i) -- or just don''t bother setting it minNTrials, as it''s redundant when stop rule is "ntrials"', stopCriterion, maxNTrials);
                end
                obj.minNTrials = stopCriterion;
                obj.maxNTrials = stopCriterion;
            end
            
            % validate params
            if ~ismember(obj.stopRule, {'ntrials', 'stdev', 'entropy'})
                error('QuestPlus:Constructor:InvalidInput', 'stopRule (%s) must be one of "ntrials", "stdev", or "entropy"', obj.stopRule);
            end
            if strcmpi(obj.stopRule,'stdev') && size(obj.paramDomain,1)>1
                error('Stdev only defined for one dimensional search spaces. Use entropy or ntrials instead.\n');
            end
            if strcmpi(obj.stopRule,'ntrials') && obj.maxNTrials~=obj.stopCriterion
                warning('Parameter mismatch. Overwriting the maximum number of trials with the stopCriterion specified number of %i trials\n', obj.maxNTrials, obj.stopCriterion);
                obj.stopCriterion = obj.maxNTrials;
            end
            if obj.maxNTrials < obj.minNTrials
                error('minNTrials (%i) cannot exceed maxNTrials (%i)', minNTrials, maxNTrials);
            end
        end
        
        %% == METHODS =================================================
        
        function [] = initialise(obj, priors, likelihoodsFnOrDat)
            % Set priors and cache/compute likelihoods.
            %
            %   NB: Currently priors for each parameter are assumed to be
            %   independent. In future, could allow priors to be a full
            %   matrix, including covariation.
            %
            % @param    priors              ######.
            % @param    likelihoodsFnOrDat 	######.
            %
            % @date     01/08/16
            % @author   PRJ
            %
            
            % if no priors specified, initialise all as uniform
            if nargin<2 || isempty(priors)
                n = size(obj.paramDomain,1);
                warning('No priors specified, will set all %i PDFs to be uniform over their respective domains', n);
                priors = cell(1, n);
                for i = 1:n
                    nn = length(unique(obj.paramDomain(i,:)));
                    priors{i} = ones(1,nn)/nn;
                end
            end
            
            % if a likelihood file/matrix has been specified, will use
            % these values, rather than recomputing them here (which can be
            % an extremely expensive operation)
            precomputedLikelihoods = [];
            if nargin>=3 && ~isempty(likelihoodsFnOrDat)
                if ischar(likelihoodsFnOrDat) % assume the name of a file
                    likelihoodsFn = likelihoodsFnOrDat;
                    
                    % console message
                    fprintf('Loading precomputed likelihoods from file..\n');
                    
                    % check file exists
                    if ~exist(likelihoodsFn, 'file')
                        error('Specified likelihoods file not found: %s', likelihoodsFn);
                    end
                    
                    % load
                    dat = load(likelihoodsFn);
                else % assume is the data itself
                    dat = likelihoodsFnOrDat;
                    likelihoodsFn = '<var>'; % dummy value for error error messages below
                end
                
                % check content is well-formed
                if ~all(ismember({'stimDomain','paramDomain','respDomain','likelihoods'}, fieldnames(dat)))
                   tmp = fieldnames(dat); 
                   error('The following error was detected when attempting to load the precomputed likelihoods in %s:\n\n   File content not well formed.\n\n   Expected fieldnames: stimDomain,paramDomain,respDomain,likelihoods\n   Detected fieldnames: %s', likelihoodsFn, sprintf('%s, ', tmp{:}) );
                end
                
                % check dimensions match current QUEST+ object
                ok = 1;
                if ~all(size(dat.stimDomain) == size(obj.stimDomain))
                    warning('The following error was detected when attempting to load the precomputed likelihoods in %s:\n\n   Stimulus domain size mismatch.\n   Expected Dimensions: [%s]\n   Detected Dimensions: [%s]', likelihoodsFn, sprintf('%i, ',size(obj.stimDomain)), sprintf('%i, ',size(dat.stimDomain)));
                    userinpt = input('replace existing file? (y/n): ', 's');
                    ok = 0;
                    replace = lower(userinpt(1))=='y';
                elseif ~all(size(dat.paramDomain) == size(obj.paramDomain))
                    warning('The following error was detected when attempting to load the precomputed likelihoods in %s:\n\n   Parameter domain size mismatch.\n   Expected Dimensions: [%s]\n   Detected Dimensions: [%s]', likelihoodsFn, sprintf('%i, ',size(obj.paramDomain)), sprintf('%i, ',size(dat.paramDomain)));
                    userinpt = input('replace existing file? (y/n): ', 's');
                    ok = 0;
                    replace = lower(userinpt(1))=='y';
                elseif ~all(size(dat.respDomain) == size(obj.respDomain))
                    warning('The following error was detected when attempting to load the precomputed likelihoods in %s:\n\n   Response domain size mismatch.\n   Expected Dimensions: [%s]\n   Detected Dimensions: [%s]', likelihoodsFn, sprintf('%i, ',size(obj.respDomain)), sprintf('%i, ',size(dat.respDomain)));
                    userinpt = input('replace existing file? (y/n): ', 's');
                    ok = 0;
                    replace = lower(userinpt(1))=='y';
                end
                
                if ~ok
                    if replace
                        fprintf('Deleting old likelihoodsFn...\n');
                        delete(likelihoodsFn);
                        % restarting
                        obj.initialise(priors);
                        obj.saveLikelihoods(likelihoodsFn);
                        return;
                    else
                        error('Cannot continue. Delete existing likelihoodsFn, or change requested parameters to match');
                    end
                else
                    % check contents match current QUEST+ object
                    if ~all(dat.stimDomain(:) == obj.stimDomain(:))
                        disp(obj.stimDomain)
                        disp(dat.stimDomain)
                        error('The following error was detected when attempting to load the precomputed likelihoods in %s:\n\n   Stimulus domain content mismatch', likelihoodsFn);
                    elseif ~all(dat.paramDomain(:) == obj.paramDomain(:))
                        disp(obj.paramDomain)
                        disp(dat.paramDomain)
                        error('The following error was detected when attempting to load the precomputed likelihoods in %s:\n\n   Parameter domain content mismatch', likelihoodsFn);
                    elseif ~all(dat.respDomain(:) == obj.respDomain(:))
                        disp(obj.respDomain)
                        disp(dat.respDomain)
                        error('The following error was detected when attempting to load the precomputed likelihoods in %s:\n\n   Response domain content mismatch', likelihoodsFn);
                    end
                    
                    % set
                    precomputedLikelihoods = dat.likelihoods;
                end
            end

            % ensure inputs are cells, for consistency (format required if
            % inputting multiple vectors)
            if ~iscell(priors)
                priors = {priors};
            end
            
            % check right number of priors
            if length(priors) ~= size(obj.paramDomain,1)
                error('%i arrays of priors were specified, but %i parameters were expected', length(priors), size(obj.paramDomain,1))
            end
            % check each prior contains an entry for each possible value in the domain
            for i = 1:length(priors)
                if length(priors{i}) ~= length(unique(obj.paramDomain(i,:)))
                    error('length of prior %i [%i] does not match the size of domain for that parameter [%i]', i, length(priors{i}), length(unique(obj.paramDomain(i,:))));
                end
            end
            % check each prior is a valid PDF (sums to 1)
            for i = 1:length(priors)
                if abs(sum(priors{i})-1) > 0.000000000001
                    error('QuestPlus:initialise:InternalError', 'Specified prior %i is not well formed? (does not sum up to 1)', i);
                end
            end
            % check not already initialised
            if ~isempty(obj.posterior)
                error('QuestPlus has already been initialised');
            end

            % compute prior
            x = combvec(priors{:});  % get all combinations of priors
            x = prod(x,1);           % multiply together (assumes independence!!)
            x = x./sum(x);           % normalize so sum to 1
            obj.prior = x;

           	% Compute the likelihoods array (conditional probabilities of
           	% each outcome at each stimulus value for each parameter
           	% value).
            % Store the result in an [MxNxO] matrix, where M is
            % nStimuliCombinations, and N is nParameterCombinations, and O
            % is nResponseOutcomes

            % compute parameters for determining if capable of running a
            % quicker/vectorised caching mode
            nModelParameters = size(obj.paramDomain,1);
            nStimParameters = size(obj.stimDomain,1);
            if nModelParameters==1 && nStimParameters==1
                nFuncOutputs = numel(obj.F(obj.stimDomain, obj.paramDomain(:,1)))/numel(obj.stimDomain);
            end
            
            if ~isempty(precomputedLikelihoods)
                obj.likelihoods = precomputedLikelihoods;
            elseif length(obj.respDomain)==2 && nModelParameters==1 && nStimParameters==1 && nFuncOutputs==1
                % quick/vectorised, but only works if two response
                % alternatives, one model parameter to estimate, one
                % stimulus parameter to vary, and model has been specified
                % to only provide the conditional probability of the second
                % of the two responses (assumed to represent 'success')
                obj.likelihoods = nan(length(obj.stimDomain), length(obj.paramDomain), length(obj.respDomain));
                for j = 1:size(obj.paramDomain,2)
                    obj.likelihoods(:,j,2) = obj.F(obj.stimDomain, obj.paramDomain(j)); % P('success')
                end
                obj.likelihoods(:,:,1) = 1 - obj.likelihoods(:,:,2); % P('failure'): complement of P('success')
            else
                fprintf('Computing likelihoods.. NB: This may be slow. Consider using QP.saveLikelihoods() to save the outcome to disk, and then load in when making any future calls to QuestPlus.initialise() \n');
                x = num2cell([obj.stimDomain(:,1); obj.paramDomain(:,1)]);
                nOutputs = length(obj.F(x{:}));
                if length(obj.respDomain)==2 && nOutputs==1
                    % if response domain is binary, and function only
                    % provides one output, we'll assume that the the
                    % probability of the first resposne is the complement
                    % of the second
                    obj.likelihoods = nan(length(obj.stimDomain), length(obj.paramDomain), length(obj.respDomain));
                    for i = 1:size(obj.stimDomain,2)
                        for j = 1:size(obj.paramDomain,2)
                            x = num2cell([obj.stimDomain(:,i); obj.paramDomain(:,j)]);
                            y = obj.F(x{:});
                            obj.likelihoods(i,j,:) = [1-y; y]; % complement [backwards format versus above???]
                        end
                    end
                else
                    % slow but flexible (works for any number of
                    % parameters/response alternatives)
                    obj.likelihoods = nan(length(obj.stimDomain), length(obj.paramDomain), length(obj.respDomain));
                	% check the correct number of outputs returns
                    if nOutputs ~= size(obj.likelihoods,3)
                        error('Specified function returns %i outputs, but %i response categories are defined', nOutputs, size(obj.likelihoods,3));
                    end
                    % run
                    for i = 1:size(obj.stimDomain,2)
                        for j = 1:size(obj.paramDomain,2)
                            x = num2cell([obj.stimDomain(:,i); obj.paramDomain(:,j)]);
                            obj.likelihoods(i,j,:) = obj.F(x{:});
                        end
                    end
                    % ^^ NB: perhaps this could be vectorised further in future
                    % for speed ^^
                end
            end

            % validate check for every combination of stimuli/parameters,
            % the likelihood of all possible responses sums to 1
            if ~all(all(sum(obj.likelihoods,3)==1))
                error('all response likelihoods must sum to 1');
            end
            
           	% set the current posterior pdf to be the prior
            obj.posterior = obj.prior;
        end
        
        function [] = setStimSelectOpt(obj, stimSelectionMethod, stimSelectionParam, stimConstrainToNOfPrev)
         	% Set and validate stimulus selection option (expert users
         	% only).
            %
            %   In most cases it should not be necessary to impose
         	%   any constraints on the target stimulus, and doing so will
         	%   decrease test efficiency [assuming an ideal observer]. Also
         	%   note that you are in either case free to disregard the
         	%   stimulus suggested by getTargetStim().
            %
            %   See comments in code for details on each option.
            %
            % @param    stimSelectionMethod     ######.
            % @param    stimSelectionParam      ######.
            % @param    stimConstrainToNOfPrev  ######.
            %
            % @date     10/10/16
            % @author   PRJ
            %
            
            % parse inputs
            if nargin < 2 || isempty(stimSelectionMethod)
                stimSelectionMethod = obj.stimSelectionMethod;
            end
            if nargin < 4 || isempty(stimConstrainToNOfPrev)
                stimConstrainToNOfPrev = obj.stimConstrainToNOfPrev;
            end
                
            % validate stimSelectionParam value
            switch lower(obj.stimSelectionMethod)
                case 'min'
                    % stimSelectionParam is ignored
                    % <do nothing>
                case 'weighted'
                    % stimSelectionParam is the exponent applied to the
                    % inverse-expected-entropy, 1/EH,m weighting.
                    % I.e.:
                    % * x must be greater than 0
                    % * x==0 means that all values will be sampled from
                    %   with equal probability, x==1 means that values will
                    %   be sampled directly in proportion to their EH value
                    %   x>1 will increasingly favour the lowest 1/EH
                    %   value(s))
                    % * recommended value: 2
                    if stimSelectionParam < 0
                        error('Invalid stimSelectionParam value ("%1.2f"), given specified selection method "%s".\nRecommended value is 2', stimSelectionParam, stimSelectionMethod);
                    end
                case 'percentile'
                    % stimSelectionParam is the percentile of 1/EH values
                    % from which the target stimulus will be drawn.
                    % I.e.:
                    % * x must be > 0 and < 1
                    % * x==0.25 means that stimulus will be drawn randomly
                    %   from the lowest 25% of EH values
                    % * recommended value: 0.1
                    if stimSelectionParam < 0 || stimSelectionParam > 1
                        error('Invalid stimSelectionParam value ("%1.2f"), given specified selection method "%s"\nRecommended value is 0.1', stimSelectionParam, stimSelectionMethod);
                    end
                case 'minorrand'
                    % stimSelectionParam is probability of ignoring the
                    % minimum entropy value, and picking a completely
                    % random value instead
                    % I.e.:
                    % * x must be > 0 and < 1
                    % * x==0.25 means that stimulus will be the
                    %   minimum-entropy value on ~75% of trials, and a
                    %   completely random value on ~25% of trials.
                    % * recommended value: 0.1
                    if stimSelectionParam < 0 || stimSelectionParam > 1
                        error('Invalid stimSelectionParam value ("%1.2f"), given specified selection method "%s"\nRecommended value is 0.1', stimSelectionParam, stimSelectionMethod);
                    end
                otherwise
                    error('Stimulus Selection Method not recognised: "%s"', obj.stimSelectionMethod); % defensive
            end
            
            % further checks
            if ~isempty(stimConstrainToNOfPrev)% && size(obj.stimDomain,1)>1
                if ~iscolumn(stimConstrainToNOfPrev)
                    % warning('stimConstrainToNOfPrev should be a column vector. Correcting')
                    stimConstrainToNOfPrev = stimConstrainToNOfPrev(:);
                end
                if size(stimConstrainToNOfPrev,1) ~= size(obj.stimDomain, 1)
                    error('Dimension mismatch: %i stimulus domains, but only %i constraints specified.', size(obj.paramDomain, 1), length(stimConstrainToNOfPrev));
                end
                if any(mod(stimConstrainToNOfPrev,2))~=1 || any(stimConstrainToNOfPrev<1)
                    error('stimConstrainToNOfPrev (%1.2f) must be an integer, and greater than 0\n', stimConstrainToNOfPrev);
                end
            end
            
            % set values
            obj.stimSelectionMethod     = stimSelectionMethod;
            obj.stimSelectionParam      = stimSelectionParam;
            obj.stimConstrainToNOfPrev  = stimConstrainToNOfPrev;
        end
        
        function [stim, idx] = getTargetStim(obj)
            % Get target level(s) to present to the observer.
            %
            %   NB: targets are rounded to nearest domain entry
            %
            % @return   stim	stimulus target value, to present
            % @return   idx   	index of target value, in stimDomain
            %
            % @date     01/08/16
            % @author   PRJ
            %

          	% check initialised
            if isempty(obj.posterior)
                error('QuestPlus has not yet been initialised');
            end

            % Compute the product of likelihood and current
            % posterior array, at each outcome and stimulus
            % location.
            postTimesL = bsxfun(@times, obj.posterior, obj.likelihoods); % newPosteriors:[nStims nParams nResps]

            % Compute the (total) probability of each outcome at each
            % stimulus location.
            pk = sum(postTimesL,2); % pk:[nStims 1 nResps]
            
            % Computer new posterior PDFs, by normalising values so that
            % they sum to 1
            newPosteriors = bsxfun(@rdivide, postTimesL, sum(postTimesL,2));
            
            % Compute the the entropy that would result from outcome r at stimulus x,
            H = -nansum(newPosteriors .* log(newPosteriors), 2); % H:[nStims 1 nResps] -- NB: nansum, since if any newPosteriors==0, then log2(newPosteriors)==-inf, and 0*-inf is NaN
            % ALT: H = -sum(newPosteriors .* log(newPosteriors+realmin), 2); % ~20% quicker than using nansum (tested MACI64, using qCSF_v1.m), but can result in NaN values

            % Compute the expected entropy for each stimulus
            % location, summing across all responses (Dim 3)           
            EH = sum(pk.*H, 3); % EH:[nStims 1]

            % select stimulus
            switch lower(obj.stimSelectionMethod)
                case 'min'
                    % Find the index of the stimulus with the smallest
                    % expected entropy.
                    [~,idx] = min(EH);
                case 'weighted'
                    % Pick a stimulus using a weighted-random-draw, with
                    % weights proportional to inverse-exepcted-entropy
                    % (1/EH)
                    idx = randsample(1:length(EH), 1, true, (1./EH).^obj.stimSelectionParam);
                case 'percentile'                   
                    % Pick a random stimulus from the lowest X percentile
                    % of expected-entropy values
                    idx = randsample(1:length(EH), 1, true, EH < prctile(EH, obj.stimSelectionParam));
                case 'minorrand'
                    % With a probability of P, ignore the minimum entropy
                    % value, and pick another value completely at random
                    % (uniform probability)
                    idx    = randsample(1:length(EH), 1, true, (EH==min(EH))*obj.stimSelectionParam + (1-obj.stimSelectionParam)/(length(EH)-1)*(EH~=min(EH)));
                otherwise
                    error('Stimulus Selection Method not recognised: "%s"', obj.stimSelectionMethod); % defensive
            end

            % Set the next stimulus location to the location of the
            % smallest expected entropy.
            stim = obj.stimDomain(:,idx);

            % constrain selection if required (and if not on first trial)
            % -- new method, based on actual domain-entry units
            if ~isempty(obj.stimConstrainToNOfPrev) && ~isempty(obj.history_stim)
                % get values, and ensure column vectors
                prevStim = obj.history_stim(:,end);

                for i = 1:size(obj.stimDomain,1)
                    % extract unique values for this parameter
                    domain = unique(obj.stimDomain(i,:));
                    
                    % find nearest domain entry of previous stimulus
                    [~,idx0] = min(abs(domain-prevStim(i)));

                    % find equivalent target index in unique domain
                    targIdx = find(domain==stim(i));
                    
                    % if the target (e.g., minimum-entropy) stimulus change is
                    % greater than that permitted, truncate the step to be the
                    % greatest permitted
                    if abs(targIdx-idx0) > obj.stimConstrainToNOfPrev(i)
                        idx1 = idx0 + sign(targIdx-idx0) * obj.stimConstrainToNOfPrev(i);
                        stim(i) = domain(idx1);
                    end
                end
            end 
        end

        function [] = update(obj, stim, resp)
            % Update the posterior, based on the presented stimulus level
            % and observed outcome and stimulus location.
            %
            %   To do this, we multiply the existing posterior density (on
            %   trial k) by the likelihood of observing the outcome (on
            %   trial k+1).
            %
            % @param    stim  stimulus value(s).
            % @param    resp  response value.
            %
            % @date     01/08/16
            % @author   PRJ
            %
            
            % Get stimIdx, check valid
            stimIdx = all(bsxfun(@eq, stim, obj.stimDomain),1);
            if sum(stimIdx)~=1
                obj.stimDomain
                error('Stimulus "%1.2f" not recognised? (not found in stimDomain)', stim);
            end
            % Get respIdx, check valid
            respIdx = resp==obj.respDomain;
            if sum(stimIdx)~=1
                error('Response not recognised? (not found in respDomain)');
            end
            
            % Update posterior PDF (assuming trial-by-trial independence)
            obj.posterior = obj.posterior .* obj.likelihoods(stimIdx, :, respIdx);

            % renormalise posterior PDF so that it sums to 1
            obj.posterior = obj.posterior/sum(obj.posterior);
            
            % store vals for convenience
            obj.history_stim(:,end+1) = stim;
            obj.history_resp(end+1) = resp;
        end

        function isFin = isFinished(obj)
            % Evaluate the stopRule: return TRUE if QUEST+ if complete,
            % FALSE otherwise.
            %
            % @return   isFin   TRUE is routine is finished.
            %
            % @date     01/08/16
            % @author   PRJ
            %
            
            % Set to be never finished if not reached minimum number of
            % trials, and always finished if reached maximum number of
            % trials...
            nTrials = obj.nTrialsCompleted();      
            if nTrials < obj.minNTrials
                isFin = false;
                return;
            elseif nTrials >= obj.maxNTrials
                isFin = true;
                return;
            end

            % ...otherwise, for intermediate numbers of trials, determine
            % completion based on specified metric/criterion:
            switch lower(obj.stopRule)
                case 'stdev'
                    isFin = obj.stdev() <= obj.stopCriterion;
                case 'entropy'
                    isFin = obj.entropy() <= obj.stopCriterion;
                case 'ntrials'
                    isFin = false; %<do nothing> [already covered, above]
                otherwise % defensive
                    error('stopType not recognised: %s', obj.stopRule);
            end
        end

        function ests = getParamEsts(obj, thresholdingRule, roundStimuliToDomain)
            % Compute parameter estimates, using the specified rule (mean,
            % median, mode).
            %
            % @param    thresholdingRule    'mean', 'median', or 'mode'.
            %                               Recommended: 'mean'
            % @return   ests                Scalar estimates for each parameter
            %
            % @date     01/08/16
            % @author   PRJ
            %            
            
            % parse inputs: if not specified, values will be rounded to
            % nearest domain element
            if nargin<3 || isempty(roundStimuliToDomain)
                roundStimuliToDomain = true;
            end

            switch lower(thresholdingRule)
                case 'mean'
                    if ~roundStimuliToDomain
                        ests = sum(bsxfun(@times, obj.posterior, obj.paramDomain), 2);
                        return
                    else
                        [~,paramIdx] = min(sqrt(mean(bsxfun(@minus, obj.paramDomain, sum(bsxfun(@times, obj.posterior, obj.paramDomain), 2)).^2,1)));
                    end
                case 'median'  % same irrespective of roundStimuliToDomain
                    [~,paramIdx] = min(abs(cumsum(obj.posterior) - 0.5));
                case 'mode'  % same irrespective of roundStimuliToDomain
                    [~,paramIdx] = max(obj.posterior);
                otherwise
                    error('QuestPlus:getParamEsts:unknownInput', 'specified thresholdingRule ("%s") not recognised.\nMust be one of: "mean" | "median" | "mode"', thresholdingRule)
            end
            
            % get threshold estimate
            ests = obj.paramDomain(:,paramIdx);
        end
        
        function [] = saveLikelihoods(obj, fn)
            % Export likelihoods matrix to .mat file
            %
            % @date     03/10/16
            % @author   PRJ
            %
            
            % use generic file name in local directory, if none specified
            if nargin<2 || isempty(fn)
                fn = sprintf('./QuestPlus_likelihoods_%s.mat', datestr(now(),30));
            end
            
            % construct
            dat = struct();
            dat.stimDomain  = obj.stimDomain;
            dat.paramDomain = obj.paramDomain;
            dat.respDomain  = obj.respDomain;
            dat.likelihoods = obj.likelihoods; %#ok (saved below)
            
            % save to disk
            %save(fn, '-struct', 'dat')
            save(fn, '-struct', 'dat','-v7.3')
        end
        
        function [] = disp(obj)
            % Print to console info regarding the internal state of the
            % current Quest+ object.
            %
            %   NB: Uses fprintf to write to current print feed, so the
            %   output could in principle be rerouted to an offline log
            %   file.
            %
            % @date     01/08/16
            % @author   PRJ
            %
            fprintf('------------------------\nQUEST+ Properties:\n------------------------\n');
            fprintf('     stopRule: %s\n',      obj.stopRule);
            fprintf('stopCriterion: %1.2f\n',   obj.stopCriterion);
            fprintf('   minNTrials: %i\n',      obj.minNTrials);
            fprintf('   maxNTrials: %i\n',      obj.maxNTrials);
            fprintf('------------------------\nHistory:\n------------------------\n');
            fprintf('     stimulus: %s\n',      sprintf('%6.2f, ', obj.history_stim));
            fprintf('     response: %s\n',      sprintf('%6.2f, ', obj.history_resp));  
            fprintf('------------------------\nCurrent Param Estimates:\n------------------------\n');
            est_mean = obj.getParamEsts('mean');
            est_median = obj.getParamEsts('median');
            est_mode = obj.getParamEsts('mode');
            for i = 1:length(est_mean)
                fprintf('Parameter %i of %i\n', i, length(est_mean));
                fprintf('         Mean: %1.2f\n', est_mean(i));
                fprintf('       Median: %1.2f\n', est_median(i));
                fprintf('         Mode: %1.2f\n', est_mode(i));
            end
            fprintf('------------------------\nCurrent State:\n------------------------\n');
            fprintf('     Finished: %g\n',  	obj.isFinished());
            fprintf('N Trials Done: %i\n',  	obj.nTrialsCompleted());
            fprintf('      Entropy: %1.2f\n',	obj.entropy());
            if size(obj.paramDomain,1)>1
                fprintf('      Std Dev: N/A\n');
            else
                fprintf('      Std Dev: %1.2f\n',  obj.stdev());
            end
        end

    end

 	%% ====================================================================
    %  -----PRIVATE METHODS-----
    %$ ====================================================================
    
    methods (Access = private)
        
        function n = nTrialsCompleted(obj)
            % Compute n trials responded to (internal helper function).
            n = length(obj.history_stim);
        end
        
        function sd = stdev(obj)
            % Compute pdf standard deviation (internal helper function).
            sd = sqrt(sum(obj.posterior .* obj.paramDomain .* obj.paramDomain) - sum(obj.posterior .* obj.paramDomain)^2);
        end
        
        function H = entropy(obj)
            % Compute pdf entropy (internal helper function).
            H = -nansum(obj.posterior .* log2(obj.posterior), 2);
        end
        
    end
    
    

   	%% ====================================================================
    %  -----STATIC METHODS (public)-----
    %$ ====================================================================
      
    methods (Static, Access = public)

        function pC = qCSF_getPC(sf,c, Gmax,Fmax,B,D, pf_beta,pf_gamma,pf_lambda)
            % static helper function for use with QuestPlus.runTests(7)
            
            % CSF
            S = log10(Gmax) - log10(2) * ( (log10(sf) - log10(Fmax)) / (log10(2*B)/2) ).^2;
            if (sf<Fmax) && (S<(log10(Gmax)-D))
                S = log10(Gmax) - D;
            end

            % convert 'sensitivity' to 'contrast'
            S = 10^S; % linearize (convert dB to linear units)
            alpha = 1/S; % convert sensitivity to contrast threshold (e.g., 2=>50; 10=>10; 200=>0.5)

            % PF
            pC = pf_gamma+(1 - pf_gamma - pf_lambda).*(1-exp(-10.^(pf_beta.*(log10(c)-log10(alpha)))));
        end
 
        function pC = qRicco_getPC(A_deg2,c, m1,m2,Rx,Ry, pf_beta,pf_gamma,pf_lambda)
            % static helper function for use with QuestPlus.runTests(9)
            
            % fit in log-log coordinates
            A_deg2 = log10(A_deg2);
            c = log10(c);
            Rx = log10(Rx);
            Ry = log10(Ry);

          	% determine threshold
            cThresh  = (Ry - (Rx-A_deg2)*m1).*(A_deg2<Rx) + (Ry - (Rx-A_deg2)*m2).*(A_deg2>=Rx);

            % validate
            if any(imag(cThresh))
                error('invalid ??????')
            end
            
            % PF
            pC = pf_gamma+(1 - pf_gamma - pf_lambda).*(1-exp(-10.^(pf_beta.*(c-cThresh))));
        end
        
        function QP = runExample(exampleN)
            % Examples of use, demonstrating/testing key functionalities.
            % Examples include:
            %   1. Simple, 1D case
            %   2. 1D with dynamic stopping
            %   3. 1D with dynamic stopping & faster initialisation
            %   4. More complex, 2D case
            %   5. More complex, 2D case, with non-uniform prior
            %   6. A direct example from P7 of Watson's original paper
            %   7. quick CSF (requires external function qCSF_getPC.m)  
            %   8. Classic/simple psychometric function fitting
            %   9. qRicco -- fitting Ricco's area
            %
            % @param    exampleN	Example to run [1|2|3|4|5|6|7|8|9]. Defaults to 1.
            %
            % @date     20/04/18
            % @author   PRJ
            %
            
            % suppress warnings in editor of the form "There is a property
            % named X. Did you mean to reference it?"
            %#ok<*PROP>
             
            % parse inputs: if no example specified, run example 1
            if nargin<1 || isempty(exampleN)
                exampleN = 1;
            end

            % run selected example
            switch exampleN
                case 1 % Simple, 1D case
                    % set model
                    F = @(x,mu)([1-normcdf(x,mu,1),normcdf(x,mu,1)])';
                    % set true param(s)
                    mu = 7;
                    trueParams = {mu};
                    % create QUEST+ object
                    stimDomain = linspace(-10, 10, 50);
                    paramDomain = linspace(-8,8,30);
                    respDomain = [0 1];
                    QP = QuestPlus(F, stimDomain, paramDomain, respDomain, [],2.5);
                    % initialise (with default, uniform, prior)
                    QP.initialise();
                    % run
                    startGuess_mean = QP.getParamEsts('mean');
                    startGuess_mode = QP.getParamEsts('mode');        
                    while ~QP.isFinished()
                        targ = QP.getTargetStim();
                        tmp = F(targ,mu);
                        pC = tmp(2);
                        anscorrect = rand()<pC;
                        QP.update(targ, anscorrect);
                    end
             
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    endGuess_mode = QP.getParamEsts('mode');
                case 2 % 1D with dynamic stopping, explicit priors, and stimulus constraints
                    % set model
                    F = @(x,mu)([1-normcdf(x,mu,1),normcdf(x,mu,1)])';
                    % set true param(s)
                    mu = 2;
                    trueParams = {mu};
                    % create QUEST+ object
                    stimDomain      = linspace(-1, 10, 50);
                    paramDomain     = linspace(-5,5,100);
                    respDomain    	= [0 1];
                    stopRule       	= 'entropy';    % try changing
                    stopCriterion  	= 3;            % try changing
                    minNTrials    	= 10;           % try changing
                    maxNTrials   	= 512;          % try changing
                    QP = QuestPlus(F, stimDomain, paramDomain, respDomain, stopRule, stopCriterion, minNTrials, maxNTrials);
                 	% construct prior(s)
                  	% priors = ones(1,length(paramDomain))/length(paramDomain); % uniform
                    priors = normpdf(paramDomain, mu, 1); % non-uniform
                    priors = priors./sum(priors);
                    % initialise priors/likelihoods
                    QP.initialise(priors)
                    % constrain target stimulus
                    QP.setStimSelectOpt('min', [], 3);
                    % run
                    startGuess_mean = QP.getParamEsts('mean');
                    startGuess_mode = QP.getParamEsts('mode');
                    while ~QP.isFinished()
                        fprintf('. ');
                        targ = QP.getTargetStim();
                        anscorrect = (targ+randn()*1) > mu;
                        QP.update(targ, anscorrect);
                    end
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    endGuess_mode = QP.getParamEsts('mode');                    
                case 3 % 1D with dynamic stopping & faster initialisation
                    % set model
                    F = @(x,mu)(1-normcdf(x,mu,1))'; % only pass in the probability of respDomain(1). Saves approx 0.1 seconds in this simple case - but this can be substantial when running simulations(!)
                    % set true param(s)
                    mu = 2;
                    trueParams = {mu};
                    % create QUEST+ object
                    stimDomain      = linspace(-1, 10, 50);
                    paramDomain     = linspace(-5,5,100);
                    respDomain    	= [0 1];
                    stopRule       	= 'entropy';    % try changing
                    stopCriterion  	= 3;            % try changing
                    minNTrials    	= 10;           % try changing
                    maxNTrials   	= 512;          % try changing
                    QP = QuestPlus(F, stimDomain, paramDomain, respDomain, stopRule, stopCriterion, minNTrials, maxNTrials);
                    % initialise priors/likelihoods
                    priors = ones(1,length(paramDomain))/length(paramDomain);
                    QP.initialise(priors)
                    % run
                    startGuess_mean = QP.getParamEsts('mean');
                    startGuess_mode = QP.getParamEsts('mode');
                    while ~QP.isFinished()
                        fprintf('. ');
                        targ = QP.getTargetStim();
                        anscorrect = (targ+randn()*1) > mu;
                        QP.update(targ, anscorrect);
                    end
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    endGuess_mode = QP.getParamEsts('mode');
                case 4 % More complex, 2D case
                    % set model
                    F = @(x,mu,sigma)([1-normcdf(x,mu,sigma),normcdf(x,mu,sigma)])';
                    % set true param(s)
                    mu = 4;
                    sigma = 2;
                    trueParams = {mu, sigma};
                    % create QUEST+ object
                    stimDomain = linspace(0, 40, 30);
                    paramDomain = {linspace(-5,5,20), linspace(.01,3,25)};
                    respDomain = [0 1];
                    QP = QuestPlus(F, stimDomain, paramDomain, respDomain);
                    % initialise priors/likelihoods
                    priors = {ones(1,length(paramDomain{1}))/length(paramDomain{1}), ones(1,length(paramDomain{2}))/length(paramDomain{2})};
                    QP.initialise(priors)
                    % run
                    startGuess_mean = QP.getParamEsts('mean');
                    startGuess_mode = QP.getParamEsts('mode');
                    while ~QP.isFinished()
                        targ = QP.getTargetStim();
                        anscorrect = normrnd(targ,sigma) > mu;
                        QP.update(targ, anscorrect);
                    end
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    endGuess_mode = QP.getParamEsts('mode');
                case 5 % More complex, 2D case, with non-uniform prior
                    % set model
                    F = @(x,mu,sigma)([1-normcdf(x,mu,sigma),normcdf(x,mu,sigma)])';
                    % set true param(s)
                    mu = 4;
                    sigma = 2;
                    trueParams = {mu, sigma};
                    % create QUEST+ object
                    stimDomain      = linspace(0, 40, 30);
                    paramDomain     = {linspace(-5,5,25), linspace(.01,3,25)};
                    respDomain      = [0 1];                   
                    stopRule     	= 'entropy';
                    stopCriterion 	= 3; 
                    minNTrials     	= 50;
                    maxNTrials     	= 512;
                    QP = QuestPlus(F, stimDomain, paramDomain, respDomain, stopRule, stopCriterion, minNTrials, maxNTrials);
                    % initialise priors/likelihoods
                    y1 = normpdf(paramDomain{1},4,3);
                    y1 = y1./sum(y1);
                    y2 = normpdf(paramDomain{2},2,3);
                    y2 = y2./sum(y2);
                    priors = {y1, y2};
                    QP.initialise(priors)
                    % constrain target stimulus
                    QP.setStimSelectOpt('min', [], 3);
                    % run
                    startGuess_mean = QP.getParamEsts('mean');
                    startGuess_mode = QP.getParamEsts('mode');
                    while ~QP.isFinished()
                        targ = QP.getTargetStim();
                        anscorrect = normrnd(targ,sigma) > mu;
                        QP.update(targ, anscorrect);
                    end
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    endGuess_mode = QP.getParamEsts('mode');
                case 6 % A direct example from P7 of Watson's original paper
                    % set model
                    PF = @(x,mu)(.5+(1-.5-.02)*cdf('wbl',10.^(x/20),10.^(mu/20),3.5));
                    % set true param(s)
                    mu = -10;
                    trueParams = {mu};
                    % create QUEST+ object
                    stimDomain      = -40:0;
                    paramDomain     = -40:0;
                    respDomain      = [0 1];                   
                    stopRule     	= 'entropy';
                    stopCriterion 	= 2.5; 
                    minNTrials     	= 32;
                    maxNTrials     	= 512;
                    QP = QuestPlus(PF, stimDomain, paramDomain, respDomain, stopRule, stopCriterion, minNTrials, maxNTrials);
                    % initialise priors/likelihoods
                    QP.initialise();
                    % run
                    startGuess_mean = QP.getParamEsts('mean');
                    startGuess_mode = QP.getParamEsts('mode');
                    while ~QP.isFinished()
                        targ = QP.getTargetStim();
                        anscorrect = rand() < PF(targ,trueParams{:});
                        QP.update(targ, anscorrect);
                    end
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    endGuess_mode = QP.getParamEsts('mode');    
                case 7 % quick CSF (requires external function qCSF_getPC.m)  
                    % set model
                    F = @QuestPlus.qCSF_getPC;
                    
                    % set true param(s)
                    Gmax        = 400;	% peak gain (sensitivity): 2 -- 2000
                    Fmax        = 5; 	% peak spatial frequency: 0.2 to 20 cpd
                    B           = 1; 	% bandwidth (full width at half maximum): 1 to 9 octaves
                    D           = 0.5; 	% truncation level at low spatial frequencies: 0.02 to 2 decimal log units
                    pf_beta     = 2;    % psychometric function: slope
                    pf_gamma    = 0.25;  % psychometric function: guess rate
                    pf_lambda   = 0.05;    % psychometric function: lapse rate
                    trueParams  = [Gmax Fmax B D pf_beta pf_lambda pf_gamma];
                    
                    % define testing domain
                    stimDomain = {logspace(log10(.25), log10(40), 15)   ... % spatial frequency
                        ,logspace(log10(0.001), log10(1), 15)          ... % contrast
                        };
                    paramDomain = {linspace(2, 2000, 10)                ...
                        ,logspace(log10(0.2), log10(20), 10)            ...
                        ,linspace(1, 9, 10)                             ...
                        ,0.4                          ... %,linspace(0.02, 2, 10)                          ...
                        ,pf_beta                                        ...
                        ,pf_gamma                                       ...
                        ,pf_lambda                                      ...
                        };
                    respDomain = [0 1];
                    
                    % define priors
                    priors = cell(size(paramDomain));
                    priors{1} = normpdf(paramDomain{1}, 100, 200*2);
                    priors{1} = priors{1}./sum(priors{1});
                    priors{2} = normpdf(paramDomain{2}, 2.5, 2*2);
                    priors{2} = priors{2}./sum(priors{2});
                    priors{3} = normpdf(paramDomain{3}, 3, 1*2);
                    priors{3} = priors{3}./sum(priors{3});
                    priors{4} = normpdf(paramDomain{4}, 0.5, .15*2);
                    priors{4} = priors{4}./sum(priors{4});
                    priors{5} = 1;
                    priors{6} = 1;
                    priors{7} = 1;
                    
                    % define other parameters (blank for default)
                    stopRule        = [];
                    stopCriterion   = [];
                    minNTrials      = 150;
                    maxNTrials      = 250;
                    
                    % create QUEST+ object
                    QP = QuestPlus(F, stimDomain, paramDomain, respDomain, stopRule, stopCriterion, minNTrials, maxNTrials);
                    
                    % initialise priors/likelihoods
                    fn = 'myLikelihoods_CSF.mat';
                    if exist(fn, 'file')
                        QP.initialise(priors, fn);
                    else
                        QP.initialise(priors);
                        QP.saveLikelihoods(fn);
                    end
                    
                    % example constrain target stimulus (just trying this for fun)
                    % QP.setStimSelectOpt('min', [], [3, 1]);
                    % QP.setStimSelectOpt('weighted', 4);
                    
                    % display
                    QP.disp();
                    startGuess_mean = QP.getParamEsts('mean');
                    fprintf('Gmax estimate: %1.2f   [true: %1.2f]\n', startGuess_mean(1), Gmax);
                    fprintf('Fmax estimate: %1.2f   [true: %1.2f]\n', startGuess_mean(2), Fmax);
                    fprintf('   B estimate: %1.2f   [true: %1.2f]\n', startGuess_mean(3), B);
                    fprintf('   D estimate: %1.2f   [true: %1.2f]\n', startGuess_mean(4), D);

                    % run -------------------------------------------------
                    profile on
                    tic()
                    while ~QP.isFinished()
                        stim = QP.getTargetStim();
                        pC = QP.qCSF_getPC(stim(1),stim(2), Gmax,Fmax,B,D, pf_beta,pf_gamma,pf_lambda);
                        anscorrect = rand() < pC;
                        % anscorrect = rand() > 0.5; % GUESSING
                        QP.update(stim, anscorrect);
                    end
                    toc()
                    
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    
                    % display
                    QP.disp();
                    fprintf('Gmax estimate: %1.2f	[true: %1.2f]	[start: %1.2f]\n', endGuess_mean(1), Gmax, startGuess_mean(1));
                    fprintf('Fmax estimate: %1.2f	[true: %1.2f]	[start: %1.2f]\n', endGuess_mean(2), Fmax, startGuess_mean(2));
                    fprintf('   B estimate: %1.2f	[true: %1.2f]	[start: %1.2f]\n', endGuess_mean(3), B, startGuess_mean(3));
                    fprintf('   D estimate: %1.2f	[true: %1.2f]	[start: %1.2f]\n', endGuess_mean(4), D, startGuess_mean(4));
                    
                    % display debug info
                    profile viewer
                    
                    % plot ------------------------------------------------
                    % compute
                    Gmax    = trueParams(1);	% peak gain (sensitivity): 2 -- 2000
                    Fmax    = trueParams(2); 	% peak spatial frequency: 0.2 to 20 cpd
                    B       = trueParams(3);	% bandwidth (full width at half maximum): 1 to 9 octaves
                    D       = trueParams(4); 	% truncation level at low spatial frequencies: 0.02 to 2 decimal log units
                    f = logspace(log10(0.01), log10(60), 1000);
                    Sp = log10(Gmax) - log10(2) * ( (log10(f) - log10(Fmax)) / (log10(2*B)/2) ).^2;
                    idx = (f<Fmax) & (Sp<(log10(Gmax)-D));
                    S = Sp;
                    S(idx) = log10(Gmax) - D;
                    S_true = S;
                    
                  	% compute S_start
                    Gmax    = startGuess_mean(1);	% peak gain (sensitivity): 2 -- 2000
                    Fmax    = startGuess_mean(2); 	% peak spatial frequency: 0.2 to 20 cpd
                    B       = startGuess_mean(3);	% bandwidth (full width at half maximum): 1 to 9 octaves
                    D       = startGuess_mean(4); 	% truncation level at low spatial frequencies: 0.02 to 2 decimal log units
                    f = logspace(log10(0.01), log10(60), 1000);
                    Sp = log10(Gmax) - log10(2) * ( (log10(f) - log10(Fmax)) / (log10(2*B)/2) ).^2;
                    idx = (f<Fmax) & (Sp<(log10(Gmax)-D));
                    S = Sp;
                    S(idx) = log10(Gmax) - D;
                    S_start = S;
                    
                    % compute S_end
                    Gmax    = endGuess_mean(1);     % peak gain (sensitivity): 2 -- 2000
                    Fmax    = endGuess_mean(2); 	% peak spatial frequency: 0.2 to 20 cpd
                    B       = endGuess_mean(3);     % bandwidth (full width at half maximum): 1 to 9 octaves
                    D       = endGuess_mean(4); 	% truncation level at low spatial frequencies: 0.02 to 2 decimal log units
                    f = logspace(log10(0.01), log10(60), 1000);
                    Sp = log10(Gmax) - log10(2) * ( (log10(f) - log10(Fmax)) / (log10(2*B)/2) ).^2;
                    idx = (f<Fmax) & (Sp<(log10(Gmax)-D));
                    S = Sp;
                    S(idx) = log10(Gmax) - D;
                    S_end = S;
                    
                    % unlog units
                    S_start = 10^S_start;
                    S_end	= 10^S_end;
                    S_true	= 10^S_true;
                    
                    % plot
                    figure()
                    hold on
                    plot(f, S_start, 'k');
                    plot(f, S_end, 'b:');
                    plot(f, S_true, 'r--');

                    % annotate and format
                    legend('Prior','Empirical','True', 'Location','South');
                    set(gca, 'XScale','log', 'YScale','log');
                    
                    set(gca, 'XTick',[.5 1 2 5 10 20], 'YTick',[2 10 50 300 2000]);
                    xlabel('Spatial Frequency (cpd)'); ylabel('Contrast Sensitivity (1/C)')
                    xlim([.25 60]);
                    ylim([1 1000]);
                    
                    % don't bother with rest of the QuestPlus.runExamples()
                    % function
                    return;
                case 8 % classic psychometric function fitting
                    % set model
                    F = @(x,mu,sigma,gamma,lambda)gamma+(1 - gamma - lambda).*normcdf(x,mu,sigma);
                    
                    % set true param(s)
                    mu = 5;
                    sigma = 1;
                    gamma = 0.5;
                    lambda = 0.02;
                    trueParams = {mu, sigma, gamma, lambda};
                    
                    % set parameter domain(s)
                    mu = linspace(1, 20, 30);
                    sigma = 1;
                    gamma = 0.5;
                    lambda = 0.02;
                    paramDomain = {mu, sigma, gamma, lambda};
                    % set stimulus domain(s)
                    stimDomain = logspace(log10(0.1), log10(100), 40);
                    % set response domain(s)
                    respDomain = [0 1];
                    
                    % create QUEST+ object
                    QP = QuestPlus(F, stimDomain, paramDomain, respDomain, [], 2.5);
                    
                    % initialise (with default, uniform, prior)
                    QP.initialise();

                    % run
                    startGuess_mean = QP.getParamEsts('mean');
                    startGuess_mode = QP.getParamEsts('mode');
                    while ~QP.isFinished()
                        targ = QP.getTargetStim();
                        pC = F(targ, trueParams{1}, trueParams{2}, trueParams{3}, trueParams{4});
                        anscorrect = rand() < pC;
                        QP.update(targ, anscorrect);
                    end
                    
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    endGuess_mode = QP.getParamEsts('mode');
                case 9 % quick Ricco
                    % set model
                    F = @QuestPlus.qRicco_getPC;
                    
                    % set true param(s)
                    m1 = -1;        % Ricco's Law: Slope of segment 1                           [NB: fitted in log-log space]
                    m2 = 0;         % Ricco's Law: Slope of segment 2                           [NB: fitted in log-log space]
                    Rx = 5;         % Ricco's Law: Ricco's Area in deg2 (point of inflection)   [NB: in linear units, not log]
                    Ry = 0.01;    	% Ricco's Law: Threshold at the point Rx                    [NB: in linear units, not log]
                    pf_beta     = 1;    % psychometric function: slope
                    pf_gamma    = 0.1;  % psychometric function: guess rate
                    pf_lambda   = 0.3;	% psychometric function: lapse rate
                    trueParams  = [m1 m2 Rx Ry pf_beta pf_lambda pf_gamma];
             
                    % define stimulus domain
					d_deg = logspace(log10(0.5), log10(10), 15);    % stimulus size in diameter (deg)
					A_deg2 = pi * (d_deg/2).^2;                     % stimulus size in area  (deg2)
                    c = logspace(log10(0.001), log10(0.75), 15);	% Weber Contrast  dL/Lb => (Lt-Lb)/Lb, where Lb is background luminance, in cd/m2d, and Lt is the target luminance, in cd/m2d
                                                                    % NB: Increment Contrast Threshold typically defined as the log of this:  log10(dL / Lb) => log10( (Lt-Lb)/Lb )                  
                    c = [
                        0.0030
                        0.0098
                        0.0165
                        0.0233
                        0.0367
                        0.0569
                        0.0839
                        0.1378
                        0.2253
                        0.3668
                        0.6026
                        0.9798]';
                    stimDomain = {A_deg2, c};
                    
                    % define model parameter domain              
                    paramDomain = {-logspace(log10(0.75), log10(1.5), 6) 	... % 6 x m1	[slope of segment 1: should always be -1?]
                        ,[0 -logspace(log10(0.01), log10(.5), 5)]           ... % 6 x m2 	[slope of segment 2: should be 0?]
                        ,logspace(log10(0.25), log10(50), 12)             	... % 12 x Rx 	[Riccos area in deg2 -- point of inflection]
                        ,logspace(log10(c(1)), log10(c(end)), 12)           ... % 12 x Ry	[Threshold at the point Rx]
                        ,pf_beta                                            ...
                        ,pf_gamma                                           ...
                        ,pf_lambda                                          ...
                        };
                    
                    % plot psychometric function (for a given/abritrary
                    % combination of parameters)
                    tmp_m1 = prctile(paramDomain{1}, [100 50 0]);
                    tmp_m2 = prctile(paramDomain{2}, [100 50 0]);
                    tmp_Rx = prctile(paramDomain{3}, [0 50 100]);
                    tmp_Ry = prctile(paramDomain{4}, [0 50 100]);
                    figure('Position', [0 200 1400 400]);
                    ylabel('Percent Correct');
                    for i = 1:3
                        subplot(1,3,i);
                        hold on
                        for k = 1:length(c)
                            pC = QuestPlus.qRicco_getPC(A_deg2,c(k), tmp_m1(i),tmp_m2(i),tmp_Rx(i),tmp_Ry(i), pf_beta,pf_gamma,pf_lambda);
                            % plot with log x-axis
                            plot(log10(c(k)), pC, 'o')
                        end
                        set(gca, 'XTick',log10([0.001 0.01 0.1 1]), 'XTickLabel',[0.001 0.01 0.1 1]);
                        % label
                        title(sprintf('m1=%1.2f, m2=%1.2f, Rx=%1.2f, Ry=%1.2f', tmp_m1(i),tmp_m2(i),tmp_Rx(i),tmp_Ry(i)));
                        if i == 2
                            xlabel('Contrast');
                        end
                    end
                    
                    % plot search space -- the goal of Q+ is to find which
                    % of these lines best fits the observer/data
                    figure('Name', 'Search Space');
                    hold on
                    for i = 1:length(paramDomain{1})
                        for j = 1:length(paramDomain{2})
                            for k = 1:length(paramDomain{3})
                                for l = 1:length(paramDomain{4})
                                    % get params (NB: values fitted in log-log space)
                                    tmp_A_deg2 = log10(A_deg2);
                                    tmp_m1 = paramDomain{1}(i);
                                    tmp_m2 = paramDomain{2}(j);
                                    tmp_Rx = log10(paramDomain{3}(k)); % fitt
                                    tmp_Ry = log10(paramDomain{4}(l));
                                    
                                    % determine threshold (logged weber fraction)
                                    tmp_cThresh  = (tmp_Ry - (tmp_Rx-tmp_A_deg2)*tmp_m1).*(tmp_A_deg2<tmp_Rx) + (tmp_Ry - (tmp_Rx-tmp_A_deg2)*tmp_m2).*(tmp_A_deg2>=tmp_Rx);
                                    
                                    % plot
                                    plot(tmp_A_deg2, tmp_cThresh, 'r-');
                                end
                            end
                        end
                    end
                    
                    % define response domain
                    respDomain = [0 1];
                    
                    % define priors
                    priors = cell(size(paramDomain));
                    priors{1} = ones(size(paramDomain{1})) ./ length(paramDomain{1});
                    priors{2} = ones(size(paramDomain{2})) ./ length(paramDomain{2});
                    priors{3} = ones(size(paramDomain{3})) ./ length(paramDomain{3});
                    priors{4} = ones(size(paramDomain{4})) ./ length(paramDomain{4});
                    priors{5} = 1;
                    priors{6} = 1;
                    priors{7} = 1;
                                        
                    % define other parameters (blank for default)
                    stopRule        = [];
                    stopCriterion   = [];
                    minNTrials      = 150;
                    maxNTrials      = 150;
                    
                    % create QUEST+ object
                    QP = QuestPlus(F, stimDomain, paramDomain, respDomain, stopRule, stopCriterion, minNTrials, maxNTrials);
                    
                    % initialise priors/likelihoods
                    fn = 'myLikelihoods_Ricco.mat';
                    if exist(fn, 'file')
                       QP.initialise(priors, fn)
                    else
                     	QP.initialise(priors);
                     	QP.saveLikelihoods(fn);
                    end
                    
                    % display
                    QP.disp();
                    startGuess_mean = QP.getParamEsts('mean');
                    fprintf('m1 estimate: %1.2f   [true: %1.2f]\n', startGuess_mean(1), m1);
                    fprintf('m2 estimate: %1.2f   [true: %1.2f]\n', startGuess_mean(2), m2);
                    fprintf('Rx estimate: %1.2f   [true: %1.2f]\n', startGuess_mean(3), Rx);
                    fprintf('Ry estimate: %1.2f   [true: %1.2f]\n', startGuess_mean(4), Ry);

                    % run -------------------------------------------------
                    profile on
                    tic()
                    while ~QP.isFinished()
                        % get stimulus (input)
                        if rand()<=0.1 % sample randomly on 10% of trials
                            stim = [randsample(stimDomain{1}, 1, true, (1:length(stimDomain{1})).^3); % ALT: unique(QP.stimDomain(1,:))
                                    randsample(stimDomain{2}, 1, true, (1:length(stimDomain{2})).^4)]; % ALT: unique(QP.stimDomain(2,:))
                        else
                            stim = QP.getTargetStim();
                        end
                        % get response (output)
                        pC = QP.qRicco_getPC(stim(1),stim(2), m1,m2,Rx,Ry, pf_beta,pf_gamma,pf_lambda);
                        anscorrect = rand() < pC;
                        % update
                        QP.update(stim, anscorrect);
                    end
                    toc()
                    
                    % get final parameter estimates
                    endGuess_mean = QP.getParamEsts('mean');
                    
                    % display
                    QP.disp();
                    fprintf('m1 estimate: %1.2f	[true: %1.2f]	[start: %1.2f]\n', endGuess_mean(1), m1, startGuess_mean(1));
                    fprintf('m2 estimate: %1.2f	[true: %1.2f]	[start: %1.2f]\n', endGuess_mean(2), m2, startGuess_mean(2));
                    fprintf('Rx estimate: %1.2f	[true: %1.2f]	[start: %1.2f]\n', endGuess_mean(3), Rx, startGuess_mean(3));
                    fprintf('Ry estimate: %1.2f	[true: %1.2f]	[start: %1.2f]\n', endGuess_mean(4), Ry, startGuess_mean(4));
                    
                    % display debug info
                    profile viewer
                    
                    % plot ------------------------------------------------
                    % compute x values
                    d_deg = logspace(log10(0.5), log10(10), 100);	% stimulus size in diameter (deg)
					A_deg2 = pi * (d_deg/2).^2;                     % stimulus size in area  (deg2)
                    
                    % log for fitting
                    A_deg2 = log10(A_deg2);
                    
                    % compute true function (y values)
                    m1	= trueParams(1);
                    m2	= trueParams(2);
                    Rx	= log10(trueParams(3));
                    Ry	= log10(trueParams(4));
                    T_true  = (Ry - (Rx-A_deg2)*m1).*(A_deg2<Rx) + (Ry - (Rx-A_deg2)*m2).*(A_deg2>=Rx);

                  	% compute starting guess function
                    m1	= startGuess_mean(1);
                    m2	= startGuess_mean(2);
                    Rx	= log10(startGuess_mean(3));
                    Ry	= log10(startGuess_mean(4));
                    T_start  = (Ry - (Rx-A_deg2)*m1).*(A_deg2<Rx) + (Ry - (Rx-A_deg2)*m2).*(A_deg2>=Rx);

                    % compute final guess function
                    m1	= endGuess_mean(1);
                    m2	= endGuess_mean(2);
                    Rx	= log10(endGuess_mean(3));
                    Ry	= log10(endGuess_mean(4));
                    T_end  = (Ry - (Rx-A_deg2)*m1).*(A_deg2<Rx) + (Ry - (Rx-A_deg2)*m2).*(A_deg2>=Rx);

                    % plot
                    figure()
                    hold on
                    plot(A_deg2, T_start, 'k');
                    plot(A_deg2, T_end, 'b:');
                    plot(A_deg2, T_true, 'r--');
                    
                    % plot raw
                    hold on
                    for x = unique(QP.history_stim(1,:))
                        for y = unique(QP.history_stim(2,:))
                            idx = QP.history_stim(1,:)==x & QP.history_stim(2,:)==y;
                            n = sum(idx);
                            pc = mean(QP.history_resp(idx));
                            if n>0
                                fprintf('%1.2f, %1.2f = %i\n', x,y,n);
                                %plot(x,y, 'o', 'markersize',4+n, 'markerfacecolor',[1-pc^.5 pc^.5 0]);
                                plot(log10(x), log10(y), 'o', 'markersize',4+n, 'markerfacecolor',[1-pc^.5 pc^.5 0]);
                            end
                        end
                    end

                    % annotate and format
                    legend('Prior','Empirical','True', 'Location','South');
                    %set(gca, 'XScale','log', 'YScale','log');
                    %set(gca, 'XTick',[.5 1 2 5 10 20], 'YTick',[2 10 50 300 2000]);
                    %xlabel('Spatial Frequency (cpd)'); ylabel('Contrast Sensitivity (1/C)')
                    %xlim([.25 40]); ylim([1 2000]);
                    
                    % don't bother with rest of the QuestPlus.runExamples()
                    % function
                    return;
                otherwise
                    error('Specified example not recognised.\n\nTo run, type:\n   QP = QuestPlus.runExample(n)\nwhere n is an integer %i..%i\n\nE.g., QP = QuestPlus.runExample(6);', 1, 7);
            end
            
         	% display generic status report
            QP.disp(); % show QUEST+ info
            
            % compare estimates to 'ground truth' (known exactly, since
            % simulated)
            n = length(startGuess_mean);
            fprintf('\n-------------------------------------------------\n');
            for i = 1:n
                fprintf('Parameter %i of %i\n', i, n);
                fprintf(' True Value = %1.2f\n', trueParams{i});
                fprintf('Start Guess = %1.2f (mean), %1.2f (mode)\n', startGuess_mean(i), startGuess_mode(i));
                fprintf('  End Guess = %1.2f (mean), %1.2f (mode)\n', endGuess_mean(i), endGuess_mode(i));
            end
            fprintf('-------------------------------------------------\n\n\n');

            % Plot results
            n = sum(diff(sort(QP.paramDomain'))~=0)+1; %#ok
            if length(n)==1
                figure()
                P = QP.posterior;
                bar(paramDomain, P)
                [~,idx] = max(P);
                % show estimate
                hold on
                    plot([paramDomain(idx) paramDomain(idx)],ylim(),'-');
                hold off
            elseif length(n)==2
                figure()
                P = reshape(QP.posterior, n);
                imagesc(paramDomain{2}, paramDomain{1}, P)
                ests = QP.getParamEsts('mean');
                % show estimate and true vals
                hold on
                    h1 = plot(xlim(), [ests(1) ests(1)],'r-');
                    plot([ests(2) ests(2)],ylim(),'r-');
                    h2 = plot(xlim(), [trueParams{1} trueParams{1}],'r-');
                    plot([trueParams{2} trueParams{2}],ylim(),'g--');
                hold off
                % legend
                legend([h1 h2], 'est', 'true')
            else
                fprintf('too many domains to plot\n');
            end
            
            
            
            % All done
            fprintf('\n\nAll checks ok\n');
        end
    end
  
end