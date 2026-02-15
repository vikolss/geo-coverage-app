import type { SubGameDefinition } from "@/games/types";
import {
  CityCoverageEuropeGame,
  CityCoverageUSGame
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
    title: "City Coverage US",
    description:
      "Guess cities in the United States. Each guess creates a coverage circle, and every city within the radius counts as covered.",
    component: CityCoverageUSGame
  }
];
