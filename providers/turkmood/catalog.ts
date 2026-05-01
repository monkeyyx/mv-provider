import { Catalog } from "../types";

export const catalog: Catalog[] = [
  { title: "Turkish Movies", filter: "movies" },
  { title: "Turkish Series", filter: "series" },
  { title: "Translated Series (Subtitled)", filter: "translated-series" },
];

export const genres: Catalog[] = [
  { title: "Romantic", filter: "movies?genre=romantic" },
  { title: "Drama", filter: "movies?genre=drama" },
  { title: "Action", filter: "movies?genre=action" },
];
