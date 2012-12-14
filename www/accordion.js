<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css" rel="stylesheet" type="text/css"/>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js"></script>
<script src="http://d3js.org/d3.v3.min.js"></script>
<script src="http://documentcloud.github.com/underscore/underscore.js"></script>

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
                var start = format.parse(perfdata[0].date);
                var end = format.parse(perfdata[perfdata.length-1].date);
                var range = d3.time.months(start,end);
                
                var x = d3.time.scale()
                    .range([0,width])
                    .domain(d3.extent(perfdata[0].date, function(d) { return format.parse(d); }));
                
                var y = d3.scale.linear()
                    .range([height, 0]);
                        
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
                
                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");
                
                var line = d3.svg.line()
                    .interpolate("basis")
                    .defined(function(d) { return d != null; })
                    .x(function(d,i) { return x(range[i]); })
                    .y(function(d) { return y(d); });                
                
              var values = _(perfdata).chain().pluck('cumul').flatten().value();
            
              y.domain([
                0,
                d3.max(values)
              ]);
                    
              linesvg.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis);
            
              linesvg.append("g")
                  .attr("class", "y axis")
                  .call(yAxis)
                .append("text")
                  .attr("transform", "rotate(-90)")
                  .attr("y", 6)
                  .attr("dy", ".71em")
                  .style("text-anchor", "end")
                  .style("font-weight", "bold")
                  .text("Cumulative Return");
            
              var symbol = linesvg.selectAll(".symbol")
                  .data(symbols)
                .enter().append("g")
                  .attr("class", "symbol");
            
              symbol.append("path")
                  .attr("class", "line")
                  .attr("d", function(d) { return line(d.cumul); })
                  .style("stroke", function(d,i) { return color(i); });
            
              symbol.append("path")
                  .attr("class", "invisible hover")
                  .attr("d", function(d) { return line(d.cumul); });
            
              var labels = perfdata.map(function(d) { return {name: d.symbol, y: y(d.cumul[d.cumul.length - 1])}});
            
              symbol.append("text")
                  .attr("class", "label hover")
                  .data(labels)
                  .attr("transform", function(d) { return "translate(" + x(end) + "," + d.y + ")"; })
                  .attr("x", 3)
                  .attr("dy", ".35em")
                  .style("fill", function(d,i) { return color(i); })
                  .text(function(d) { return d.name; });
            
              // constraint relaxation on labels
              var alpha = 0.5;
              var spacing = 12;
              function relax() {
                var again = false;
                labels.forEach(function(a,i) {
                  labels.slice(i+1).forEach(function(b) {
                    var dy = a.y - b.y;
                    if (Math.abs(dy) < spacing) {
                      again = true;
                      var sign = dy > 0 ? 1 : -1;
                      a.y += sign*alpha;
                      b.y -= sign*alpha;
                    }
                  });
                });
                d3.selectAll(".label")
                  .attr("transform", function(d) { return "translate(" + x(end) + "," + d.y + ")"; });
                if (again) setTimeout(relax,20);
              };
            
              relax();
            
              symbol.selectAll(".hover")
                  .on("mouseover", function(d,i) {
                    d3.selectAll(".line")
                      .style("opacity", 0.12)
                      .filter(function(p) { return p.name == d.name; })
                      .style("opacity", 1)
                      .style("stroke-width", 2.5);
                    d3.selectAll(".symbol text")
                      .style("opacity", 0)
                      .filter(function(p) { return p.name == d.name; })
                      .style("opacity", 1);
                  })
                  .on("mouseout", function(d,i) {
                    d3.selectAll(".line")
                      .style("opacity", 1)
                      .style("stroke-width", null);
                    d3.selectAll(".symbol text")
                      .style("opacity", 1);
                  });        
            }
        
    }
  });
  Shiny.outputBindings.register(networkOutputBinding, 'timelyportfolio.networkbinding');

</script>    
            