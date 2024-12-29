import { geoInterpolate, geoGraticule, geoCircle, geoCentroid, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { extent } from "d3-array";
import { json} from "d3-fetch";
import { create } from "d3-selection";
import {
  geoRhombic,
  geoIcosahedral,
  geoDeltoidal,
  geoTetrahedralLee,
  geoCubic,
  geoDodecahedral,
  geoDesicPolyhedral
} from "../src/index.js";

const width = 960;
const height = 500;


function recurse(state, face) {
  var site = geoCentroid({type:"MultiPoint", coordinates:face.face});
  site.id = face.id || state.i++;
  state.sites.push(site);
  var line = [...face.face, face.face[0]]
  state.cuts.push({
          type:"LineString",
          coordinates: line.map(
            e => geoInterpolate(e, face.centroid)(1e-5)
          )
  });
  face.face.forEach(function(v) {
    state.corners.push({
          type:"Point",
          coordinates: geoInterpolate(v, face.centroid)(0.115)
    });        
  });
  if (face.children) {
    face.children.forEach(function(child) {
      state.folds.push({
        type:"LineString",
        coordinates: child.shared.map(
          e => geoInterpolate(e, face.centroid)(1e-5)
        )
      });
      recurse(state, child);
    });
  }
}

async function getMapData() {
  const [m, s, l, b, n, L] = await Promise.all([
    await json("https://ofrohn.github.io/data/mw.json"),
    await json("https://ofrohn.github.io/data/stars.6.json"),
    await json("https://ofrohn.github.io/data/constellations.lines.json"),
    await json("https://ofrohn.github.io/data/constellations.bounds.json"),
    await json("https://ofrohn.github.io/data/constellations.json"),
    await json("https://unpkg.com/visionscarto-world-atlas@0.0.4/world/110m_land.geojson")
  ]);
  return {
    constellations: {
      lines: l,
      bounds: b,
      names: n
    },
    stars: {
      type: "FeatureCollection",
      features: s.features.filter(d => d.properties.mag < 5)
    },
    milkyway: {
      mw: m,
      mwbg: getMwbackground(m)
    },
    land: L
  }
}

function getMwbackground(d) {
  // geoJson object to darken the mw-outside, prevent greying of whole map in some orientations 
  var res = {'type': 'FeatureCollection', 'features': [ {'type': 'Feature', 
              'geometry': { 'type': 'MultiPolygon', 'coordinates' : [] }
            }]};

  // reverse the polygons, inside -> outside
  var l1 = d.features[0].geometry.coordinates[0];
  res.features[0].geometry.coordinates[0] = [];
  for (var i=0; i<l1.length; i++) {
    res.features[0].geometry.coordinates[0][i] = l1[i].slice().reverse();
  }
  
  return res;
}

function map(data, projection, config) {
  const context = create("svg")
      .attr("viewBox", [0, 0, width, width/2]);

  projection.fitExtent([[2,2],[width-2, width/2-2]], {type:"Sphere"});
  var path = geoPath(projection);
  var magnitudeScale = scaleLinear()
      .domain(extent(data.stars.features, d => d.properties.mag))
      .range([3, 1]);
  var starPath = geoPath(projection)
    .pointRadius(d => magnitudeScale(d.properties.mag));
  var map = context.append("g").attr("class", "map").attr("id", "map");
  var f = map.append("g").attr("class", "faces").attr("id", "faces");
  var facecircles = f.append("g").attr("class", "facecircles").attr("id", "facecircles");
  var facelabels = f.append("g").attr("class", "facelabels").attr("id", "facelabels");
  var c = map.append("g").attr("class", "cuts").attr("id", "cuts");
  var holes = c.append("g").attr("class", "holes").attr("id", "holes");
  var edges = c.append("g").attr("class", "edges").attr("id", "edges");
  var grid = map.append("g").attr("class", "grid").attr("id", "grid");
  var eq = map.append("g").attr("class", "eq").attr("id", "eq");
  var cnc = map.append("g").attr("class", "cnc").attr("id", "cnc");
  var cap = map.append("g").attr("class", "cap").attr("id", "cap");
  var countries = map.append("g").attr("class", "countries").attr("id", "countries");    
  var constellations = map.append("g").attr("class", "constellations").attr("id", "constellations");
  var cons_bounds = constellations.append("g").attr("class", "cons_bounds").attr("id", "cons_bounds");
  var cons_lines = constellations.append("g").attr("class", "cons_lines").attr("id", "cons_lines");
  var cons_names = constellations.append("g").attr("class", "cons_names").attr("id", "cons_names");
  var stars = constellations.append("g").attr("class", "stars").attr("id", "stars");
  var milkyway = map.append("g").attr("class", "milkyway").attr("id", "milkyway");
  var mw = data.milkyway.mwbg;
  if (config.inverse_milkyway) {
    mw = data.milkyway.mw;
  }
  
  
  if (config.show_sphere)
    grid.append("path").datum(geoGraticule()())
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("opacity", .3)
      .attr("stroke-width", 1);
  if (config.show_land) {
    countries.append("path")
        .datum(data.land)
          .attr("d", path)
          .attr("fill", "black")
          .attr("opacity", 0.4);
  }
  if (config.show_stars) {
    cons_bounds.append("path")
       .datum(data.constellations.bounds)
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("opacity", .5)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", [3, 4]);
    cons_lines.append("path")
       .datum(data.constellations.lines)
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("opacity", .5)
          .attr("stroke-width", 1);
    cons_names
    .selectAll("text")
      .data(data.constellations.names.features)
      .join("text")
        .datum(d => d)
        .text(c => c.properties.desig)
        .attr("dy", ".4em")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("font-size", 8)
        .attr("x", c => projection(c.geometry.coordinates)[0])
        .attr("y", c => projection(c.geometry.coordinates)[1])
        .attr("opacity", 0.3);
    stars
      .selectAll("path")
      .data(data.stars.features)
      .enter().append('path')
      .attr("d", starPath)          
          .attr("fill", "black")
          .attr("opacity", 1);
    milkyway.append("path")
      .datum(mw)
          .attr("d", path)
          .attr("fill", "blue")
          .attr("stroke", "blue")
          .attr("opacity", .2);
  }

  if (config.show_equator)
    eq.append("path").datum(geoGraticule().step([0,100]).extent([[-179.99, -25], [179.99, 25]])())
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("opacity", .3)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", [2, 2]);
    cnc.append("path").datum(geoCircle().center([0, 90]).radius(90 - 23.43656)())
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("opacity", .3)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", [2, 2]);
    cap.append("path").datum(geoCircle().center([0, 90]).radius(90 + 23.43656)())
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("opacity", .3)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", [2, 2]); 

  // Polyhedral projections expose their structure as projection.tree()
  // To draw them we need to cancel the rotate
  if (config.show_structure) {
    var rotate = projection.rotate();
    projection.rotate([0,0,0]);

    // run the tree of faces to get all sites and folds
    var state = {
      sites: [], 
      folds: [], 
      cuts: [], 
      corners: [], 
      i: 0
    };
    recurse(state, projection.tree());

    // sites & numbers
    if (config.show_labels) {
      facecircles
      .selectAll("circle")
        .data(state.sites)
        .join("circle")
          .datum(d => d)
          .attr("cx", c => projection(c)[0])
          .attr("cy", c => projection(c)[1])
          .attr("r", 10)          
          .attr("fill", "white")
          .attr("stroke", "black")
          .attr("opacity", 1);
      facelabels
      .selectAll("text")
        .data(state.sites)
        .join("text")
          .datum(d => d)
          .text(c => c.id)
          .attr("dy", ".4em")
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .attr("font-size", 14)
          .attr("x", c => projection(c)[0])
          .attr("y", c => projection(c)[1])
          .attr("opacity", 1);
    }
    holes
    .selectAll("circle")
      .data(state.corners)
      .join("circle")
        .datum(d => d)
        .attr("cx", c => projection(c.coordinates)[0])
        .attr("cy", c => projection(c.coordinates)[1])
        .attr("r", 1)          
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("opacity", 1);
  
    // map piece edges
    
    edges.selectAll("path")
      .data(state.cuts)
      .join("path")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("opacity", 1)
        .attr("stroke-width", 1);

    // restore the projection’s rotate
    projection.rotate(rotate);
  }
  return context.node().outerHTML;
}

async function renderStars(projection, inverse_milkyway = false) {
  var data = await getMapData();
  var config = {
    show_sphere: true, 
    show_stars: true, 
    show_structure: true, 
    show_labels: true,
    show_equator: true,
    show_land: false,
    inverse_milkyway: inverse_milkyway
  };
  var svg_data = map(data, projection, config);
  return svg_data;
}

async function renderMap(projection, inverse_milkyway = false) {
  var data = await getMapData();
  var config = {
    show_sphere: true, 
    show_stars: false, 
    show_structure: true, 
    show_labels: true,
    show_equator: true,
    show_land: true,
    inverse_milkyway: inverse_milkyway
  };
  var svg_data = map(data, projection, config);
  return svg_data;
}

export async function rhombic() {
  return renderStars(
    geoRhombic()
      .rotate([0, -95, 115])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" }),
      false
  );
}

export async function icosahedral() {
  return renderStars(
    geoIcosahedral()
      .rotate([-76.5, 27, -84])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" }),
      false
  );
}

export async function deltoidal() {
  return renderStars(
    geoDeltoidal()
      .rotate([-70.5, 18, -85])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" })
  );
}

export async function geodesic() {
  const lat = 52.377956;
  const lon = 4.89707;
  return renderMap(
    geoDesicPolyhedral(false)
      .rotate([-lon, 90-lat, 0]).angle(5)
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" })
  );
}

export async function tetrahedralLee() {
  return renderStars(
    geoTetrahedralLee()
      .parents([-1, 0, 1, 2])
      .rotate([115, -54.735610317245346, 90])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" })
  );
}

export async function tetra1() {
  return renderStars(
    geoTetrahedralLee()
      .parents([-1, 3, 1, 2])
      .rotate([115, -54.735610317245346, 90])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" })
  );
}

export async function tetra2() {
  return renderStars(
    geoTetrahedralLee()
      .parents([2, -1, 3, 0])
      .angle(90)
      .rotate([115, -54.735610317245346, 90])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" })
  );
}

export async function tetra3() {
  return renderStars(
    geoTetrahedralLee()
      .parents([3, 0, -1, 1])
      .angle(-30)
      .rotate([115, -54.735610317245346, 90])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" })
  );
}

export async function tetra4() {
  return renderStars(
    geoTetrahedralLee()
      .parents([1, 2, 0, -1])
      .angle(210)
      .rotate([115, -54.735610317245346, 90])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" })
  );
}

export async function cubic() {
  return renderStars(
    geoCubic()
      .parents([-1, 0, 1, 5, 0, 1])
      .angle(45)
      .rotate([76.5, -27, 84])
      .precision(0.1)
      .fitSize([width, height], { type: "Sphere" }),
      false
  );
}

export async function dodecahedral() {
  return renderStars(
    geoDodecahedral()
    .rotate([-73.5, 18, -85])
    .precision(0.1)
    .fitSize([width, height], { type: "Sphere" }),
    false
    );
}