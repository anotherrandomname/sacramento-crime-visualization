/*   Main js-file  */

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



// --------------------------- map part -----------------------------
var w = 800;
var h = 400;
var projection = d3.geoAlbers()
    .translate([w * 25, h * 6.88])
    .scale([60000]);

var path = d3.geoPath()
    .projection(projection);

//used for json-map (json-files for sacramento not working properly)
//Define quantize scale to sort data values into buckets of color
//var color = d3.scaleQuantize()
//    .range(["rgb(237,248,233)", "rgb(186,228,179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"]);

var svgMap = d3.select('#svg1HereMap')
    .append("svg")
    .attr("width", w)
    .attr("height", h);

//insert svg image
d3.select("#svg1HereMap").append("image")
    .attr("xlink:href", "/data/sa_zoning.svg")
    .attr("width", 250)
    .attr("height", 250)
    .attr("opacity", 0.5)
    .attr("id", "svg-image");

//loading json (json files for sacramento not working properly)
// d3.json("/data/ca.json", function(json) {
//     svg.selectAll("path")
//         .data(json.features)
//         .enter()
//         .append("path")
//         .attr("d", path)
//         .style("fill", function(d) {
//             //Get data value
//             var value = d.properties.value;
//
//             if (value) {
//                 //If value exists…
//                 return color(value);
//             } else {
//                 //If value is undefined…
//                 return "#ccc";
//             }
//         });
// });



//Load sacramento crime data and map coordinates from csv
d3.csv("data/SacramentocrimeJanuary2006.csv", (d) => {
    // convert needed datatypes
    return {
        cdatetime: parseDate(d.cdatetime).getHours(),
        district: +d.district,
        latitude: d.latitude,
        longitude: d.longitude,
        crimedescr: d.crimedescr
    };
}, (error, csv) => {
    let data = csv;

    //svg image rotate workaround
    jQuery('#svg-image').css("transform", "rotate(15deg)").css("display", "none");

    //draw all filter
    var crimes = [];

    crimes.push("All crimes");
    data.forEach(x => {
        crimes.push(x.crimedescr);
    });

    crimes = jQuery.unique(crimes);
    //interactivity
    crimes.forEach(x => {
        jQuery('#filter_').clone().show().removeAttr('id').removeAttr('style')
            .attr('value', x)
            .insertAfter('.check-temp:last');
        jQuery('.check-temp:last').attr('value', x).attr('name', 'filter').html(x);
    });

    jQuery('select').on('change', function() {
      if(this.value != "All crimes"){
        const filtered_data = data.filter((d) => d.crimedescr == this.value);

        update(filtered_data); // Update the chart with the filtered data
      }
      else
        update(data);
    });


    update(data);
});


jQuery('#map-background').on('change', function() {
    // This will be triggered when the user selects or unselects the checkbox
    if ($(this).is(":checked"))
        $('#svg-image').show();
    else
      $('#svg-image').hide();
});


function update(data) {
    // --- map ---
    // join

    //show only crimes of selected district
    //TODO remove this and use merge
    svgMap.selectAll(".crime").remove();
    svg.selectAll("rect").remove();

    var rect = svgMap.selectAll('rect').data(data);

    // new elements
    const rect_enter = rect.enter().append("circle", "rect")
        .attr("r", 1)
        .attr("fill", function(d, i){
          return z(d.district);
        })
        .attr("transform", function(d) {
            return "translate(" + projection([
                d.longitude,
                d.latitude
            ]) + ")";
        });

    rect_enter.merge(rect_enter)
        .attr("class", (d) => "crime district-" + d.district + " crimedescr-" + d.crimedescr + " hour-" + d.cdatetime);


    // elements that aren't associated with data
    rect.exit().remove();

    //crimes filter
    let legend = svgMap.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(legendKeys.slice().reverse())
        .enter().append("g")
        .attr("class", (d, i) => "legend-dist-color-" + z(i).substring(1))
        .attr("transform", (d, i) => "translate(0," + i * 20 + ")")
        .on("mouseover", (d, i) => {
            svg.selectAll(".color-" + z(i).substring(1)).style("stroke", "black");

            //show only crimes of selected district
            svgMap.selectAll(".crime").style("fill-opacity", "0");
            svgMap.selectAll(".district-" + (i - 6) * -1).style("fill-opacity", "100");
        })
        .on("mouseout", (d, i) => {
            svg.selectAll(".color-" + z(i).substring(1)).style("stroke", "white");

            //show all crimes again
            svgMap.selectAll(".crime").style("fill-opacity", "100");
        });

    // ------------

    // group by datetime and count items
    data = d3.nest()
        .key((d) => d.cdatetime)
        .key((d) => d.district)
        .entries(data);

    let stackedData = remapData(data);


    x.domain(data.map((d) => d.key));
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
        .attr("y", y(y.ticks().pop()) - 20)
        .attr("dy", "0.5em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Crimes comitted");

    var layer = svg.selectAll("layer")
        .data(stackedData)
        .enter().append("g")
        .attr("class", (d, i) => "layer color-" + z(i).substring(1))
        .style("fill", (d, i) => z(i))
        .on("mouseover", function(d, i) {
            svg.selectAll(".legend-dist-color-" + z(i).substring(1)).style("fill", "blue");
        })
        .on("mouseout", function(d, i) {
            svg.selectAll(".legend-dist-color-" + z(i).substring(1)).style("fill", "black");
        });

    rect = layer.selectAll("rect")
        .data(function(d) {
            return d;
        })
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.data.time))
        .attr("y", (d) => y(d[1]))
        .attr("height", (d) => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function(d, i) {
            tooltip_c.style("display", null);

            //show only crimes of selected district
            svgMap.selectAll(".crime").style("fill-opacity", "0")
            svgMap.selectAll(".hour-" + d.data.time).style("fill-opacity", "100");
        })
        .on("mouseout", function(d, i) {
            tooltip_c.style("display", "none");
            //show all crimes again
            svgMap.selectAll(".crime").style("fill-opacity", "100");
        })
        .on("mousemove", function(d) {
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 25;
            tooltip_c.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip_c.select("text").text(d[1] - d[0]);
        });



    // district legend
    let legend2 = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(legendKeys.slice().reverse())
        .enter().append("g")
        .attr("class", (d, i) => "legend-dist-color-" + z(i).substring(1))
        .attr("transform", (d, i) => "translate(0," + i * 20 + ")")
        .on("mouseover", (d, i) => {
            svg.selectAll(".color-" + z(i).substring(1)).style("stroke", "black");

            //show only crimes of selected district
            svgMap.selectAll(".crime").style("fill-opacity", "0");
            svgMap.selectAll(".district-" + (i - 6) * -1).style("fill-opacity", "100");
        })
        .on("mouseout", (d, i) => {
            svg.selectAll(".color-" + z(i).substring(1)).style("stroke", "white");

            //show all crimes again
            svgMap.selectAll(".crime").style("fill-opacity", "100");
        });

    legend2.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", z);

    legend2.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) {
            return d;
        });

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


}


/* helper functions */

// parse datetime
let parseDate = d3.timeParse("%d/%m/%Y %H:%M");

function remapData(data) {
    var newData = [];
    data.forEach((d) => {
        var obj = new Entry(d.key);
        d.values.forEach((d2) => {
            switch (d2.key) {
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

function Entry(time) {
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
