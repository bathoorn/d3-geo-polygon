/*
 * Geodesic Polyhedron Frequency 3 Class I map
 *
 * Implemented for D3.js by Ronnie Bathoorn (2024),
 * based on Icosahedron map by Jason Davies (2013)
 * Enrico Spinielli (2017) and Philippe Rivière (2017, 2018)
 *
 */
import { atan, degrees } from "./math.js";
import voronoi from "./polyhedral/voronoi.js";
import { geoContains, geoCentroid, geoInterpolate } from "d3-geo";

export default function (sphere = true) {
  const theta = atan(0.5) * degrees;

  // construction inspired by
  // https://en.wikipedia.org/wiki/Regular_icosahedron#Spherical_coordinates
  const vertices = [[0, 90], [0, -90]].concat(
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [
      ((i * 36 + 180) % 360) - 180,
      i & 1 ? theta : -theta
    ])
  );

  // icosahedron
  const polyhedron = [
    [0, 3, 11],
    [0, 5, 3],
    [0, 7, 5],
    [0, 9, 7],
    [0, 11, 9], // North
    [2, 11, 3],
    [3, 4, 2],
    [4, 3, 5],
    [5, 6, 4],
    [6, 5, 7],
    [7, 8, 6],
    [8, 7, 9],
    [9, 10, 8],
    [10, 9, 11],
    [11, 2, 10], // Equator
    [1, 2, 4],
    [1, 4, 6],
    [1, 6, 8],
    [1, 8, 10],
    [1, 10, 2], // South
  ].map((face) => {
    const t = face.map((i) => vertices[i]);
    // create 3 polygons from these using centroid and midpoints
    const a0 = geoInterpolate(t[0], t[1])(0.3333);
    const a1 = geoInterpolate(t[0], t[1])(0.6667);
    const b2 = geoInterpolate(t[1], t[2])(0.3333);
    const b3 = geoInterpolate(t[1], t[2])(0.6667);
    const c4 = geoInterpolate(t[2], t[0])(0.3333);
    const c5 = geoInterpolate(t[2], t[0])(0.6667);
    const m  = geoCentroid({
          type: "MultiPoint",
          coordinates: t,
    });
    return [
      [t[0], a0, c5],
      [c5, m, c4], [c5, a0, m], [a0, a1, m],
      [c4, b3, t[2]], [c4, m, b3], [m, b2, b3], [m, a1, b2], [a1, t[1], b2]
    ];
  });

  const polygons = {
    type: "FeatureCollection",
    features: polyhedron.flat().map((face) => ({
      type: "Feature",
      properties: {
        sitecoordinates: geoCentroid({
          type: "MultiPoint",
          coordinates: face,
        }),
      },
      geometry: {
        type: "Polygon",
        coordinates: [[...face, face[0]]],
      },
    }))
  };

  const parents = sphere ? [
    -1, 2, 0, 2, 5, 1, 5, 3, 7, 
     0, 11, 9, 11, 14, 10, 14, 12, 16, 
     9, 20, 18, 20, 23, 19, 23, 21, 25, 
    18, 29, 27, 29, 32, 28, 32, 30, 34, 
    27, 38, 36, 38, 41, 37, 41, 39, 43, 
   
    58, 50, 48, 52, 50, 51, 52, 53, 4, 
    49, 56, 54, 56, 59, 58, 59, 60, 61, 
    76, 68, 66, 70, 68, 69, 70, 71, 13, 
    67, 74, 72, 74, 77, 76, 77, 78, 79, 
    94, 86, 84, 88, 86, 87, 88, 89, 22, 
    85, 92, 90, 92, 95, 94, 95, 96, 97, 
    112, 104, 102, 106, 104, 105, 106, 107, 31, 
    103, 110, 108, 110, 113, 112, 113, 114, 115, 
    130, 122, 120, 124, 122, 123, 124, 125, 40, 
    121, 128, 126, 128, 131, 130, 131, 132, 133, 
    ]:[
      -1, 2, 0, 2, 5, 1, 5, 3, 7, 
      0, 11, 9, 11, 14, 10, 14, 12, 16, 
      9, 20, 18, 20, 23, 19, 23, 21, 25, 
     18, 29, 27, 29, 32, 28, 32, 30, 34, 
     27, 38, 36, 38, 41, 37, 41, 39, 43, 
    
     58, 50, 48, 52, 50, 51, 52, 53, 4, 
     49, 56, 54, 56, 59, 58, 59, 60, 61, 
     76, 68, 66, 70, 68, 69, 70, 71, 13, 
     67, 74, 72, 74, 77, 76, 77, 78, 79, 
     94, 86, 84, 88, 86, 87, 88, 89, 22, 
     85, 92, 90, 92, 95, 94, 95, 96, 97, 
     112, 104, 102, 106, 104, 105, 106, 107, 31, 
     103, 110, 108, 110, 113, 112, 113, 114, 115, 
     130, 122, 120, 124, 122, 123, 124, 125, 40, 
     121, 128, 126, 128, 131, 130, 131, 132, 133,
    ];
   /*
    137, 140, 138, 142, 140, 141, 142, 143, 58, 
    146, 149, 147, 151, 149, 150, 151, 152, 76, 
    155, 158, 156, 160, 158, 159, 160, 161, 94, 
    164, 167, 165, 169, 167, 168, 169, 170, 112, 
    173, 176, 174, 178, 176, 177, 178, 179, 130]; */
  
    /* [
    -1, 2, 0, 2, 5, 1, 5, 3, 7, 
     0, 11, 9, 11, 14, 10, 14, 12, 16, 
     9, 20, 18, 20, 23, 19, 23, 21, 25, 
    18, 29, 27, 29, 32, 28, 32, 30, 34, 
    27, 38, 36, 38, 41, 37, 41, 39, 43, 
   
    47, 50, 48, 52, 50, 51, 52, 53, 4, 
    49, 56, 54, 56, 59, 55, 59, 57, 61, 
    65, 68, 66, 70, 68, 69, 70, 71, 13, 
    67, 74, 72, 74, 77, 73, 77, 75, 79, 
    83, 86, 84, 88, 86, 87, 88, 89, 22, 
    85, 92, 90, 92, 95, 91, 95, 93, 97, 
    101, 104, 102, 106, 104, 105, 106, 107, 31, 
    103, 110, 108, 110, 113, 109, 113, 111, 115, 
    119, 122, 120, 124, 122, 123, 124, 125, 40, 
    121, 128, 126, 128, 131, 127, 131, 129, 133, 
      
    137, 140, 138, 142, 140, 141, 142, 143, 58, 
    146, 149, 147, 151, 149, 150, 151, 152, 76, 
    155, 158, 156, 160, 158, 159, 160, 161, 94, 
    164, 167, 165, 169, 167, 168, 169, 170, 112, 
    173, 176, 174, 178, 176, 177, 178, 179, 130]; */
  
    function myfind(lambda, phi) {
      let found = -1;
      let faces = polyhedron.flat().map((face) => ({
          type: "Polygon",
          coordinates: [[...face, face[0]]],
        }));
      for (let i = 0; i < faces.length; i++) {
        if (geoContains(faces[i], [lambda, phi])) {
          found = i;
        }
      }
      return found;
    }

  //return polygons;
  return voronoi()
    .parents(parents)
    .polygons(polygons)
    .faceFind(myfind)
    .angle(3)
    .rotate([108, 0])
    .translate([72, 252])
    .scale(136.67);
}
