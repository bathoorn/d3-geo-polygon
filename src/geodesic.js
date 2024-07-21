/*
 * Deltoidal Hexecontahedron map
 *
 * Implemented for D3.js by Ronnie Bathoorn (2024),
 * based on Icosahedron map by Jason Davies (2013)
 * Enrico Spinielli (2017) and Philippe Rivière (2017, 2018)
 *
 */
import { atan, degrees } from "./math.js";
import voronoi from "./polyhedral/voronoi.js";
import { geoCentroid, geoInterpolate } from "d3-geo";

export default function () {
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
    const a0 = geoInterpolate(t[1], t[2])(0.5);
    const a1 = geoInterpolate(t[0], t[2])(0.5);
    const a2 = geoInterpolate(t[0], t[1])(0.5);
    return [
      [t[0], a2, a1],
      [a1, a0, t[2]],
      [a1, a2, a0],
      [a2, t[1], a0]
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

  const parents = [
    -1, // 0
    2, // 1
    0, // 2
    2, // 3
    6, // 4
    31, // 5
    5, // 6
    6, // 7
    10, // 8
    39, // 9
    9, // 10
    10, // 11
    14, // 12
    47, // 13
    13, // 14
    14, // 15
    18, // 16
    55, // 17
    17, // 18
    18, // 19
    22, // 20
    22, // 21
    23, // 22
    1, // 23
    21, // 24
    26, // 25
    24, // 26
    26, // 27
    27, // 28
    30, // 29
    28, // 30
    30, // 31
    29, // 32
    34, // 33
    32, // 34
    34, // 35
    35, // 36
    38, // 37
    36, // 38
    38, // 39
    37, // 40
    42, // 41
    40, // 42
    42, // 43
    43, // 44
    46, // 45
    44, // 46
    46, // 47
    45, // 48
    50, // 49
    48, // 50
    50, // 51
    51, // 52
    54, // 53
    52, // 54
    54, // 55
    53, // 56
    58, // 57
    56, // 58
    58, // 59
    62, // 60
    62, // 61
    63, // 62
    25, // 63
    66, // 64
    66, // 65
    67, // 66
    33, // 67
    70, // 68
    70, // 69
    71, // 70
    41, // 71
    74, // 72
    74, // 73
    75, // 74
    49, // 75
    78, // 76
    78, // 77
    79, // 78
    57, // 79
  ];

  //return polygons;
  return voronoi()
    .parents(parents)
    .polygons(polygons)
    .angle(3)
    .rotate([108, 0])
    .translate([72, 252])
    .scale(136.67);
}
