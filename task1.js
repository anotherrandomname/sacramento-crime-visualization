var width = 1000,
    height = 1000;

// Creates sources <svg> element
const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//scale map
var projection = d3.geo.mercator()
    .scale(2300)
    .translate([width * 5, height * 2.2]);

//generate path
var path = d3.geo.path()
    .projection(projection);

d3.json("/data/us.json", (json) => {
    svg.selectAll("path")
        .data(json.features)
        .enter().append("path")
        .attr("d", path)
});

// Global variable for all data
var data;

d3.csv('/data/SacramentocrimeJanuary2006-2.csv',  (error, csv) => {
    data = csv;

    update(data);
});

function update(new_data) {

    // DATA JOIN
    const rect = svg.selectAll('rect').data(new_data);

    // ENTER
    // new elements
    const rect_enter = rect.enter().append("circle", "rect")
        .attr("r", 1)
        .attr("fill", "red")
        .attr("transform", (d) => {
            return "translate(" + projection([
                d.longitude,
                d.latitude
            ]) + ")";
        });
    // EXIT
    // elements that aren't associated with data
    rect.exit().remove();

}
