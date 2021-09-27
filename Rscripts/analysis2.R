library(tidyverse)
dat_jsQUEST <- read.table('jsQuest_20210819.csv', sep=",", , header=T) 
dat_MATLAB <- read.table('originalQuest_20210819.csv', sep=",", , header=T) 

##################
## OS and device information (jsQUEST only)
dat_jsQUEST %>%
  group_by(platform_name) %>%
  summarise(count = n())

dat_jsQUEST %>%
  group_by(os) %>%
  summarise(count = n())
  
dat_jsQUEST %>%
  group_by(family) %>%
  summarise(count = n()) %>%
  spread(family,count)

# Time required to initialize jsQUEST

summary(dat_jsQUEST$create_time)
summary(dat_MATLAB$create_time)
# mean(dat_jsQUEST$create_time)
# sd(dat_jsQUEST$create_time)
# mean(dat_MATLAB$create_time)
# sd(dat_MATLAB$create_time)

# DF <- data.frame(
#   QUEST_type = c(rep("jsQUEST", nrow(dat_jsQUEST)), rep("Original", nrow(dat_MATLAB))),
#   initialization_time = c(dat_jsQUEST$create_time, dat_MATLAB$create_time)
# )
# 
# g <- ggplot(DF, aes(x = QUEST_type, y = initialization_time))
# g <- g + geom_boxplot()
# g


g <- ggplot(dat_jsQUEST, aes(x = "create_time", y = create_time))
g <- g + geom_boxplot()
g

#ggplot(dat, aes(x=))

if (nrow(dat_jsQUEST) != nrow(dat_MATLAB)) stop("Check the number of simulations.")

nSimulation <- nrow(dat_jsQUEST)

DF <- data.frame(
  methods = c(
    rep("QuestQuantile", nSimulation), 
    rep("QuestMean", nSimulation), 
    rep("QuestMode", nSimulation),
    rep("QuestQuantile", nSimulation), 
    rep("QuestMean", nSimulation), 
    rep("QuestMode", nSimulation)
    ),
  quest_type = c(
    rep("jsQUEST", nSimulation*3),
    rep("Original", nSimulation*3)
  ),
  estimate = c(
    dat_jsQUEST$quantile_mean, 
    dat_jsQUEST$mean_mean, 
    dat_jsQUEST$mode_mean,
    dat_MATLAB$quantile_mean, 
    dat_MATLAB$mean_mean, 
    dat_MATLAB$mode_mean
    ),
  standard_deviation = c(
    dat_jsQUEST$quantile_sd, 
    dat_jsQUEST$mean_sd, 
    dat_jsQUEST$mode_sd,
    dat_MATLAB$quantile_sd, 
    dat_MATLAB$mean_sd, 
    dat_MATLAB$mode_sd
    ),
  processing_time = c(
    dat_jsQUEST$time_quantile, 
    dat_jsQUEST$time_mean, 
    dat_jsQUEST$time_mode,
    dat_MATLAB$time_quantile, 
    dat_MATLAB$time_mean, 
    dat_MATLAB$time_mode
    )
)

g <- ggplot(DF, aes(x = methods, y = estimate))
g <- g + geom_boxplot(aes(fill = quest_type))
g <- g + stat_summary(fun = mean, geom = "point", shape = 21, size = 2., fill = "white")
#g <- g + stat_summary(fun = mean, geom = "point", color = "#FC4E07")
g <- g + facet_wrap(~quest_type)
g <- g + theme(legend.position = 'none')
g <- g + xlab("Intensity method") + ylab("Log threshold")
g <- g + scale_y_continuous(breaks=seq(-2.6, 1.6, 0.2))
g <- g + theme(text = element_text(size = 24))
g <- g + theme(axis.text.x = element_text(size = 14, margin = margin(10,10,10,10)))
g <- g + theme(axis.text.y = element_text(size = 14, margin = margin(2,10,2,10)))
g

mean(DF$estimate[1:nSimulation]) # jsQuest Quantile
mean(DF$estimate[(nSimulation+1):(nSimulation*2)]) # jsQuest Mean
mean(DF$estimate[(nSimulation*2+1):(nSimulation*3)]) # jsQuest Mode
mean(DF$estimate[(nSimulation*3+1):(nSimulation*4)]) # Matlab Quantile
mean(DF$estimate[(nSimulation*4+1):(nSimulation*5)]) # Matlab Mean
mean(DF$estimate[(nSimulation*5+1):(nSimulation*6)]) # Matlab Mode


#mean(DF$estimate[(nSimulation*2+1):(nSimulation*3)])

g <- ggplot(DF, aes(x = methods, y = standard_deviation))
g <- g + geom_boxplot(aes(fill = quest_type))
g <- g + stat_summary(fun = mean, geom = "point", shape = 21, size = 2., fill = "white")
g <- g + facet_wrap(~quest_type)
g <- g + theme(legend.position = 'none')
g <- g + xlab("Intensity method") + ylab("Standard deviation of the final p.d.f.")
g <- g + theme(text = element_text(size = 24))
g <- g + theme(axis.text.x = element_text(size = 14, margin = margin(10,10,10,10)))
g <- g + theme(axis.text.y = element_text(size = 14, margin = margin(2,10,2,10)))
g

mean(DF$standard_deviation[1:nSimulation]) # jsQuest Quantile
mean(DF$standard_deviation[(nSimulation+1):(nSimulation*2)]) # jsQuest Mean
mean(DF$standard_deviation[(nSimulation*2+1):(nSimulation*3)]) # jsQuest Mode
mean(DF$standard_deviation[(nSimulation*3+1):(nSimulation*4)]) # Matlab Quantile
mean(DF$standard_deviation[(nSimulation*4+1):(nSimulation*5)]) # Matlab Mean
mean(DF$standard_deviation[(nSimulation*5+1):(nSimulation*6)]) # Matlab Mode

g <- ggplot(DF, aes(x = methods, y = processing_time))
g <- g + geom_boxplot(aes(fill = quest_type))
g <- g + stat_summary(fun = mean, geom = "point", shape = 21, size = 2., fill = "white")
g <- g + facet_wrap(~quest_type)
g <- g + theme(legend.position = 'none')
g <- g + xlab("Intensity method") + ylab("Procssing time (ms)")
g <- g + theme(text = element_text(size = 24))
g <- g + theme(axis.text.x = element_text(size = 14, margin = margin(10,10,10,10)))
g <- g + theme(axis.text.y = element_text(size = 14, margin = margin(2,10,2,10)))
g

tmp <- DF$processing_time[1:nSimulation]
summary(tmp)

mean(DF$processing_time[(nSimulation*2+1):(nSimulation*3)])
#mode(DF$processing_time[(nSimulation*2+1):(nSimulation*3)])

#g <- ggplot(dat_jsQUEST, aes(x = x_data, y = y_data))
# g <- ggplot(dat3, aes(x = methods, y = estimate))
# g <- g + geom_boxplot()
# g <- g + geom_jitter(size = 0.2)
# g
# 
# g <- ggplot(dat3, aes(x = methods, y = standard_deviation))
# g <- g + geom_boxplot()
# g
# 
# # Time required to calculate the intensity of the stimulus
# g <- ggplot(dat3, aes(x = methods, y = processing_time))
# g <- g + geom_boxplot()
# #g <- g + geom_jitter(size = 0.2)
# g
