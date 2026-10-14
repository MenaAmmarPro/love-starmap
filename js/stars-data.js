"use strict";

/*
 * A small, real star catalog for the love-starmap page.
 *
 * Each star: { id, name, ra (hours 0-24), dec (degrees -90..90), mag }
 *   ra  = right ascension, dec = declination, mag = apparent magnitude
 *   (smaller mag = brighter).
 *
 * CONSTELLATIONS lists line segments between star ids, so a few well-known
 * patterns can be drawn: Orion, the Big Dipper, Cassiopeia, Cygnus, Scorpius.
 *
 * This is only the brightest handful of the real sky — plenty to make a
 * recognisable, honest map without shipping a huge catalog.
 */
window.MENA_STARS = [
  { id: "sirius", name: "Sirius", ra: 6.752, dec: -16.716, mag: -1.46 },
  { id: "canopus", name: "Canopus", ra: 6.399, dec: -52.696, mag: -0.74 },
  { id: "arcturus", name: "Arcturus", ra: 14.261, dec: 19.182, mag: -0.05 },
  { id: "vega", name: "Vega", ra: 18.615, dec: 38.784, mag: 0.03 },
  { id: "capella", name: "Capella", ra: 5.278, dec: 45.998, mag: 0.08 },
  { id: "rigel", name: "Rigel", ra: 5.242, dec: -8.202, mag: 0.13 },
  { id: "procyon", name: "Procyon", ra: 7.655, dec: 5.225, mag: 0.34 },
  { id: "betelgeuse", name: "Betelgeuse", ra: 5.919, dec: 7.407, mag: 0.50 },
  { id: "altair", name: "Altair", ra: 19.846, dec: 8.868, mag: 0.77 },
  { id: "aldebaran", name: "Aldebaran", ra: 4.599, dec: 16.509, mag: 0.85 },
  { id: "antares", name: "Antares", ra: 16.490, dec: -26.432, mag: 1.06 },
  { id: "spica", name: "Spica", ra: 13.420, dec: -11.161, mag: 1.04 },
  { id: "pollux", name: "Pollux", ra: 7.755, dec: 28.026, mag: 1.14 },
  { id: "deneb", name: "Deneb", ra: 20.690, dec: 45.280, mag: 1.25 },
  { id: "regulus", name: "Regulus", ra: 10.139, dec: 11.967, mag: 1.35 },
  { id: "castor", name: "Castor", ra: 7.577, dec: 31.888, mag: 1.58 },
  { id: "bellatrix", name: "Bellatrix", ra: 5.418, dec: 6.350, mag: 1.64 },
  { id: "polaris", name: "Polaris", ra: 2.530, dec: 89.264, mag: 1.97 },
  { id: "alnitak", name: "Alnitak", ra: 5.679, dec: -1.943, mag: 1.74 },
  { id: "alnilam", name: "Alnilam", ra: 5.604, dec: -1.202, mag: 1.69 },
  { id: "mintaka", name: "Mintaka", ra: 5.533, dec: -0.299, mag: 2.23 },
  { id: "saiph", name: "Saiph", ra: 5.796, dec: -9.670, mag: 2.09 },
  { id: "dubhe", name: "Dubhe", ra: 11.062, dec: 61.751, mag: 1.79 },
  { id: "merak", name: "Merak", ra: 11.030, dec: 56.382, mag: 2.37 },
  { id: "phecda", name: "Phecda", ra: 11.897, dec: 53.695, mag: 2.44 },
  { id: "megrez", name: "Megrez", ra: 12.257, dec: 57.033, mag: 3.31 },
  { id: "alioth", name: "Alioth", ra: 12.900, dec: 55.960, mag: 1.77 },
  { id: "mizar", name: "Mizar", ra: 13.399, dec: 54.925, mag: 2.23 },
  { id: "alkaid", name: "Alkaid", ra: 13.792, dec: 49.313, mag: 1.86 },
  { id: "schedar", name: "Schedar", ra: 0.675, dec: 56.537, mag: 2.24 },
  { id: "caph", name: "Caph", ra: 0.153, dec: 59.150, mag: 2.28 },
  { id: "gammacas", name: "Gamma Cas", ra: 0.945, dec: 60.717, mag: 2.47 },
  { id: "ruchbah", name: "Ruchbah", ra: 1.430, dec: 60.235, mag: 2.68 },
  { id: "segin", name: "Segin", ra: 1.906, dec: 63.670, mag: 3.35 },
  { id: "sadr", name: "Sadr", ra: 20.370, dec: 40.256, mag: 2.23 },
  { id: "gienah", name: "Gienah", ra: 20.770, dec: 33.970, mag: 2.46 },
  { id: "deltacyg", name: "Delta Cyg", ra: 19.750, dec: 45.131, mag: 2.87 },
  { id: "albireo", name: "Albireo", ra: 19.512, dec: 27.960, mag: 3.05 },
  { id: "shaula", name: "Shaula", ra: 17.560, dec: -37.104, mag: 1.62 }
];

window.MENA_CONSTELLATIONS = [
  {
    name: "Orion",
    segments: [
      ["betelgeuse", "bellatrix"],
      ["bellatrix", "mintaka"],
      ["mintaka", "alnilam"],
      ["alnilam", "alnitak"],
      ["alnitak", "betelgeuse"],
      ["mintaka", "rigel"],
      ["alnitak", "saiph"],
      ["rigel", "saiph"]
    ]
  },
  {
    name: "Big Dipper",
    segments: [
      ["dubhe", "merak"],
      ["merak", "phecda"],
      ["phecda", "megrez"],
      ["megrez", "dubhe"],
      ["megrez", "alioth"],
      ["alioth", "mizar"],
      ["mizar", "alkaid"]
    ]
  },
  {
    name: "Cassiopeia",
    segments: [
      ["caph", "schedar"],
      ["schedar", "gammacas"],
      ["gammacas", "ruchbah"],
      ["ruchbah", "segin"]
    ]
  },
  {
    name: "Cygnus",
    segments: [
      ["deneb", "sadr"],
      ["sadr", "albireo"],
      ["gienah", "sadr"],
      ["deltacyg", "sadr"]
    ]
  },
  {
    name: "Scorpius",
    segments: [
      ["antares", "shaula"]
    ]
  }
];
