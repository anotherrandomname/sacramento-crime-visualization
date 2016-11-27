var width = 1000,
        height = 1000;

    // Creates sources <svg> element
        const svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

        var projection = d3.geo.mercator()
        .scale(1800) // scales your map
        .translate([width * 4, height *1.8]); // centers in SVG

        var path = d3.geo.path()
       .projection(projection);

       d3.json("/data/us.json", function(json) { // loads JSON file
      svg.selectAll("path") // selects path elements, will make them if they don't exist
       .data(json.features) // iterates over geo feature
       .enter() // adds feature if it doesn't exist as an element
       .append("path") // defines element as a path
       .attr("d", path) // path generator translates geo data to SVG
    });



    // Global variable for all data
    var data;

    d3.csv('/data/SacramentocrimeJanuary2006-2.csv', (d) => {
      return {
        latitude: d.latitude,
        longitude: d.longitude
      };
    }, (error, csv) => {
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
            .attr("transform", function(d) {
                return "translate(" + projection([
                    d.longitude,
                    d.latitude
                ]) + ")";
            });
        // EXIT
        // elements that aren't associated with data
        rect.exit().remove();

    }
