#require should go here
#require(PerformanceAnalytics)

shinyServer(function(input,output) {
  data <- reactive(function(){
    #read csv data for this example
    #but this could effectively read or calculate anything
    path = "./www/testperf.csv"
    data <- read.csv(path, row.names=1)
    
    #will need to append the rownames for shiny to pass properly
    data.df <- cbind(rownames(data), data)
    colnames(data.df)[1] <- "Date"
    #send the data.frame
    data.df
  })
  
  output$perfbarplot <- reactive(function() { data() })  #when data changes, update the bar plot  
})
