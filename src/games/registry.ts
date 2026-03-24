import type { SubGameDefinition } from "@/games/types";
import {
  CityCoverageEuropeGame,
  CityCoverageUSGame,
  CityCoverageCanadaGame,
  CityCoverageAsiaGame,
  CityCoverageAfricaGame,
  CityCoverageSouthAmericaGame,
  CityCoverageCentralAmericaGame,
  CityCoverageOceaniaGame,
  CityCoverageWorldGame
} from "@/games/europe-coverage/components/EuropeCoverageGame";

export const SUB_GAMES: SubGameDefinition[] = [
  {
    id: "city-coverage-europe",
    title: "City Coverage Europe",
    description:
      "Guess cities in Europe. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageEuropeGame
  },
  {
    id: "city-coverage-us",
    title: "City Coverage United States",
    description:
      "Guess cities in the United States. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageUSGame
  },
  {
    id: "city-coverage-canada",
    title: "City Coverage Canada",
    description:
      "Guess cities in Canada. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageCanadaGame
  },
  {
    id: "city-coverage-asia",
    title: "City Coverage Asia & Middle East",
    description:
      "Guess cities across all of Asia including the Middle East. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageAsiaGame
  },
  {
    id: "city-coverage-africa",
    title: "City Coverage Africa",
    description:
      "Guess cities across Africa. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageAfricaGame
  },
  {
    id: "city-coverage-south-america",
    title: "City Coverage South America",
    description:
      "Guess cities in South America. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageSouthAmericaGame
  },
  {
    id: "city-coverage-central-america",
    title: "City Coverage Central America & Caribbean",
    description:
      "Guess cities in Mexico, Central America and the Caribbean. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageCentralAmericaGame
  },
  {
    id: "city-coverage-oceania",
    title: "City Coverage Oceania",
    description:
      "Guess cities in Australia, New Zealand and the Pacific. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageOceaniaGame
  },
  {
    id: "city-coverage-world",
    title: "City Coverage World",
    description:
      "Guess cities anywhere in the world. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageWorldGame
  }
];
