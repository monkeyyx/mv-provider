import { Catalog } from "../types";

export const catalog: Catalog[] = [
  {
    title: "Latest Movies",
    filter: "/movies",
  },
  {
    title: "TV Shows",
    filter: "/tv-shows",
  },
  {
    title: "Anime",
    filter: "/anime",
  },
  {
    title: "Most Viewed",
    filter: "/top-imdb",
  },
  {
    title: "Af-Somali (Dubbed)",
    filter: "tag:AfSomali",
  },
];

export const genres: Catalog[] = [
  { title: "Animation", filter: "genre:Animation" },
  { title: "Action", filter: "genre:Action" },
  { title: "Thriller", filter: "genre:Thriller" },
  { title: "Drama", filter: "genre:Drama" },
  { title: "Romance", filter: "genre:Romance" },
  { title: "History", filter: "genre:History" },
  { title: "Horror", filter: "genre:Horror" },
  { title: "Family", filter: "genre:Family" },
  { title: "Fantasy", filter: "genre:Fantasy" },
  { title: "Mystery", filter: "genre:Mystery" },
  { title: "Comedy", filter: "genre:Comedy" },
];
