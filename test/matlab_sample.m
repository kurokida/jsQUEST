tGuess = 50;
tGuessSd = 50;
pThreshold = 0.82;
beta = 3.5;
delta = 0.01;
gamma = 0.5;
grain = 0.01;
range = 80;
responses = [1, 1, 0, 0, 1, 1, 0, 0, 1, 1];
q=QuestCreate(tGuess,tGuessSd,pThreshold,beta,delta,gamma, grain, range);
q.normalizePdf=1;

for k = 1:length(responses)
	% Get recommended level.  Choose your favorite algorithm.
	tTest=QuestQuantile(q);	% Recommended by Pelli (1987), and still our favorite.
	% 	tTest=QuestMean(q);		% Recommended by King-Smith et al. (1994)
	% 	tTest=QuestMode(q);		% Recommended by Watson & Pelli (1983)
	
 	fprintf('Trial %3d at %5.2f is %d\n', k , tTest, responses(k));
	% Update the pdf
	q=QuestUpdate(q, tTest, responses(k)); % Add the new datum (actual test intensity and observer response) to the database.
  
end

% Ask Quest for the final estimate of threshold.
t=QuestMean(q);		% Recommended by Pelli (1989) and King-Smith et al. (1994). Still our favorite.
sd=QuestSd(q);
fprintf('Final threshold estimate (mean+-sd) is %f +- %f\n',t,sd);