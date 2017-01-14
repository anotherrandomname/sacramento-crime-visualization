/*   D3 Stuff     */

const margin = {
    top: 40,
    bottom: 30,
    left: 200,
    right: 20
};
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let x = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.1)
    .align(0.1);

let y = d3.scaleLinear()
    .range([height, 0]);

let z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c"]);

let xAxis = d3.axisBottom()
    .scale(x);

let yAxis = d3.axisLeft()
    .scale(y);

// Creates sources <svg> element and inner g (for margins)
const svg = d3.select('.svg2Here').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

d3.csv("data/SacramentocrimeJanuary2006.csv", function(error, data) {
    if (error) throw error;

    // convert datatypes
    data.forEach(function(d){
        d.cdatetime = parseDate(d.cdatetime).getHours();
        d.district = +d.district;

    });

    // group by datetime and count items
    data = d3.nest()
        .key((d) =>  d.cdatetime)
        .key((d) => d.district)
        .entries(data);

    let stackedData = remapData(data);


    x.domain(data.map( (d) => d.key ));
    y.domain([0, 600]).nice();
    z.domain(keys);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width - 60)
        .attr("y", y(y.ticks().pop()) + 25)
        .attr("dy", "0.5em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Time in 24-h");

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", -30)
        .attr("y", y(y.ticks().pop()) -20)
        .attr("dy", "0.5em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Crimes comitted");

    var layer = svg.selectAll("layer")
        .data(stackedData)
        .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) { return z(i); })

    var rect = layer.selectAll("rect")
        .data(function(d){return d;})
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.data.time) )
        .attr("y", (d) => y(d[1]) )
        .attr("height", (d) => y(d[0]) - y(d[1]) )
        .attr("width", x.bandwidth())
        .on("mouseover", function() { tooltip_c.style("display", null); })
        .on("mouseout", function() { tooltip_c.style("display", "none"); })
        .on("mousemove", function(d) {
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 25;
            tooltip_c.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip_c.select("text").text(d[1] - d[0]);
        });

    let legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(legendKeys.slice().reverse())
        .enter().append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", z);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

    // Prep the tooltip bits, initial display is hidden
    let tooltip_c = svg.append("g")
        .attr("class", "tooltip_c")
        .style("display", "none");

    tooltip_c.append("rect")
        .attr("width", 30)
        .attr("height", 20)
        .attr("fill", "white")
        .style("opacity", 0.5);

    tooltip_c.append("text")
        .attr("x", 15)
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

});

/* helper functions */

// parse datetime
let parseDate = d3.timeParse("%d/%m/%Y %H:%M");

function remapData(data){
    var newData = [];
    data.forEach((d) => {
        var obj = new Entry(d.key);
        d.values.forEach((d2) => {
            switch (d2.key){
                case "1":
                    obj.district1 = d2.values.length;
                    break;
                case "2":
                    obj.district2 = d2.values.length;
                    break;
                case "3":
                    obj.district3 = d2.values.length;
                    break;
                case "4":
                    obj.district4 = d2.values.length;
                    break;
                case "5":
                    obj.district5 = d2.values.length;
                    break;
                case "6":
                    obj.district6 = d2.values.length;
                    break;
            }
        })
        newData.push(obj)
    })
    let stacked = d3.stack().keys(keys)(newData);
    return stacked;
}

function Entry (time) {
    this.time = time;
    this.district1 = 0;
    this.district2 = 0;
    this.district3 = 0;
    this.district4 = 0;
    this.district5 = 0;
    this.district6 = 0;
}

let keys = ["district1", "district2", "district3", "district4", "district5", "district6"];
let legendKeys = ["District 1", "District 2", "District 3", "District 4", "District 5", "District 6"];





