import type { ComponentType } from "react";

export interface SubGameDefinition {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
}
