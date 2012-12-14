
shinyUI(pageWithSidebar(
  headerPanel(title=HTML("R Shiny Portfolio Accordion")),
  
  sidebarPanel(
    helpText(HTML("All source available on <a href = \"https://github.com/timelyportfolio/shiny-d3-accordion-portfolio\">Github</a>"))
  ),
  
  mainPanel(
    includeHTML("./www/accordion.js")
  )
)
)