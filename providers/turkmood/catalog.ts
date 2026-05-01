import { Catalog } from "../types";

export const catalog: Catalog[] = [
  { title: "Latest Releases", filter: "series" },
  { title: "Turkish Movies", filter: "movies" },
  { title: "Turkish Series", filter: "series" },
  { title: "Translated Series", filter: "translated-series" },
  // { title: "Dubbed Series", filter: "series?cat=dubbed" },
];

export const genres: Catalog[] = [
  { title: "Romantic", filter: "movies?genre=romantic" },
  { title: "Drama", filter: "movies?genre=drama" },
  { title: "Action", filter: "movies?genre=action" },
];
