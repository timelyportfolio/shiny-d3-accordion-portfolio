<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css" rel="stylesheet" type="text/css"/>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js"></script>
<script src="http://d3js.org/d3.v3.min.js"></script>

<style>
    .axis path, .axis line {
        fill: none;
        stroke: #000;
        shape-rendering: crispEdges;
    }
    .line {
        fill: none;
        stroke-width: 1.5px;
    }
</style>
    
<script>
$(document).ready(function() {
$("#accordion").accordion();
});
</script>
      
<div id="accordion">
	<h3><a href="#">Performance Bar Chart</a></h3>
    <div id="perfbarplot" class="shiny-barplot-output"><svg style="height:400px"></svg></div>
	<h3><a href="#">Cumulative Return Chart</a></h3>
	<div id="perflineplot" class="shiny-barplot-output"><svg style="height:400px"></svg></div>
</div>

<script>
    
var networkOutputBinding = new Shiny.OutputBinding();
  $.extend(networkOutputBinding, {
    find: function(scope) {
      return $(scope).find('.shiny-barplot-output');
    },
    renderValue: function(el, data) {
        var margin = {top: 60, right: 60, bottom: 60, left: 60},
            width =  800 - margin.right - margin.left,
            height = 400 - margin.top - margin.bottom;      

        //remove the old graph
          var barsvg = d3.select("#perfbarplot").select("svg")
                        .remove();

          var linesvg = d3.select("#perflineplot").select("svg")
                        .remove();
          
          //append two new graphs - one bar and one line
          barsvg = d3.select("#perfbarplot").append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
          linesvg = d3.select("#perflineplot").append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

        
        var perfdata = new Array();
        var cumul1 = 1;
        var cumul2 = 1;

        var parse = d3.time.format("%m/%d/%Y").parse, format = d3.time.format("%Y")      
        
        for (var inc=0;inc<data.Date.length;inc++)  { 
                //here is where my javascript ineptness shows best
                //i need to figure out the proper way to loop through each of the symbols (columns from the r data.frame)
                //within the object data rather than manually coding this

                cumul1 = cumul1 * (1 + parseFloat(data.SP500[inc])/100)
                cumul2 = cumul2 * (1 + parseFloat(data.BarAgg[inc])/100)

                perfdata[inc]  = { date: parse(data.Date[inc]) , perf : parseFloat(data.SP500[inc]), symbol : "SP500", cumul : cumul1 };
                perfdata[inc + data.Date.length] = { date: parse(data.Date[inc]) , perf : parseFloat(data.BarAgg[inc]), symbol : "BarAgg", cumul : cumul2 };
            }

            // Nest stock values by symbol.
            symbols = d3.nest()
              .key(function(d) { return d.symbol; })
              .entries(perfdata);        
    
            var x = d3.time.scale()
                .range([0, width - 60]);
            
            var y = d3.scale.linear()
                .range([height - 20, 0]);
            
            var duration = 1500,
                delay = 500;
            
            var color = d3.scale.category10();
            
           //svg
            //    .attr("id","svgchart")
            //    .attr("width", width + margin.right + margin.left)
            //    .attr("height", height + margin.top + margin.bottom)
            //    .append("g")
            //        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
                
                // do the minimum and maximum dates
                x.domain([
                    parse(data.Date[0]),
                    parse(data.Date[data.Date.length-1])
                ]);
                                            
            groupedBar();
            cumulLine();
            
            
            function groupedBar() {
                  x = d3.scale.ordinal()
                      .domain(symbols[0].values.map(function(d) { return d.date; }))
                      .rangeBands([0, width - 60], .1);
                
                  var x1 = d3.scale.ordinal()
                      .domain(symbols.map(function(d) { return d.key; }))
                      .rangeBands([0, x.rangeBand()]);
    
                var y0 = Math.max(Math.abs(d3.min(symbols.map(function(d) { return d3.min(d.values.map(function(d) { return d.perf; })); }))), d3.max(symbols.map(function(d) { return d3.max(d.values.map(function(d) { return d.perf; })); })));                
                y
                    .domain([-y0, y0])
                    //.domain([d3.min(symbols.map(function(d) { return d3.min(d.values.map(function(d) { return d.perf; })); })), d3.max(symbols.map(function(d) { return d3.max(d.values.map(function(d) { return d.perf; })); }))])
                    .range([height, 0])
                    .nice();
                
                var yAxis = d3.svg.axis().scale(y).orient("left"); 
                
                var g = barsvg.selectAll("g")
                    .data(symbols)
                    .enter().append("g")
                        .attr("class", "symbol");                  

                barsvg.selectAll(".labels")
                    .data(symbols[0].values.map(function(d) { return d.date; }))
                    .enter().append("text")
                        .attr("class", "labels")
                        .attr("text-anchor", "middle")
                        .attr("x", function(d,i) { return x(i) + x.rangeBand() / 2 ; })
                        .attr("y", height / 2 + 15)
                        .text(function(d) {return format(d) })
                        .style("fill-opacity", 1);

                
                  var g = barsvg.selectAll(".symbol");
                
                  var t = g.transition()
                      .duration(duration);
                      
                    //got working with lots of help but this section particularly dedicated to http://stackoverflow.com/questions/10127402/bar-chart-with-negative-values
                  g.each(function(p, j) {
                    d3.select(this).selectAll("rect")
                        .data(function(d) { return d.values; })
                      .enter().append("rect")
                        .attr("x", function(d) { return x(d.date) + x1(p.key); })
                        .attr("y", function(d, i) { return y(Math.max(0, d.perf)); })                        
                        //.attr("y", function(d) { return y(d.perf); })
                        .attr("width", x1.rangeBand())
                        .attr("height", function(d, i) { return Math.abs(y(d.perf) - y(0)); })                        
                        //.attr("height", function(d) { return height - y(d.perf); })
                        .style("fill", color(p.key))
                        .style("fill-opacity", 1e-6)                    
                      .transition()
                        .duration(duration)
                        .style("fill-opacity", 0.8);
                      
                    d3.select(this).selectAll("text")
                        .data(function(d) { return d.values; })
                        .enter().append("text")
                            .attr("class","barlabels")
                            .attr("x", function(d) { return x(d.date) + x1(p.key) + x1.rangeBand() / 2 ; })
                            .attr("y", function(d, i) { return y(d.perf) ; })
                            .attr("text-anchor", "middle")                        
                            .text(function(d) { return d.perf; })
                            .style("fill-opacity", 1e-6)                    
                       .transition()
                        .duration(duration)
                        .style("fill-opacity", 1);
                  });            
                        
            
                    barsvg.append("g")
                        .attr("class", "y axis")
                        .call(yAxis);
            };
        
            function cumulLine() {
                var g = linesvg.selectAll("g")
                    .data(symbols)
                    .enter().append("g")
                        .attr("class", "symbol");                  
        
                x = d3.time.scale()
                    .domain([perfdata[0].date, perfdata[perfdata.length - 1].date])
                    .range([0,width])
                    
                var y0 =  d3.max(symbols.map(function(d) { return d3.max(d.values.map(function(d) { return d.cumul; })); }));
                
                y
                  .domain([d3.min(symbols.map(function(d) { return d3.min(d.values.map(function(d) { return d.cumul; })); })), 
                          d3.max(symbols.map(function(d) { return d3.max(d.values.map(function(d) { return d.cumul; })); }))])
                  .range([height, 0])
                  .nice();
                
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .ticks(d3.time.years, 1)
                    .tickSubdivide(data.length-1)
                    .tickValues([perfdata[0].date, perfdata[perfdata.length - 1].date])
                    .tickFormat(d3.time.format("%b %Y"));
                    
                var yAxis = d3.svg.axis().scale(y).orient("left");
                
                
                  // Add the x-axis.
                  linesvg.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + y(1) + ")")
                      .call(xAxis);
                
                  // Add the y-axis.
                  linesvg.append("g")
                      .attr("class", "y axis")
                      //.attr("transform", "translate(" + width + ",0)")
                      .call(yAxis);

               var line = d3.svg.line()
                    .x(function (d) {return x(d.date);})
                    .y(function (d) {return y(d.cumul);});
                
                var g = linesvg.selectAll(".symbol");
                
                g.each(function(p) {
                     d3.select(this).append("path")
                        .attr("class", "line")
                        .attr("d", line(p.values))
                        .style("stroke", color(p.key));
                    
                      d3.select(this).append("path")
                          .attr("class", "invisible hover")
                          .attr("d", line(p.values));                    
                    
                    d3.select(this).selectAll(".dot")
                        .data(function(d) { return d.values; })
                      .enter().append("circle")
                        .attr("class", "dot")
                        .attr("cx", line.x())
                        .attr("cy", line.y())
                        .attr("r", 3.5)
                        .style("fill", color(p.key));                    
                });
            };      
        
        
        
    }
  });
  Shiny.outputBindings.register(networkOutputBinding, 'timelyportfolio.networkbinding');

</script>    
            