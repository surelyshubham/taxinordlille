import { Plane, Route, TrainFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ServiceType } from "@/lib/db/schema";

export type ServiceDef = {
  key: ServiceType;
  /** URL segment under `/services`. Mirrors the dictionary `slug` values. */
  slug: string;
  icon: LucideIcon;
};

/**
 * The three services, in the order they appear everywhere on the site.
 * Copy lives in the dictionaries; this is the structural registry.
 */
export const SERVICES: ServiceDef[] = [
  { key: "gare", slug: "taxi-gare-lille", icon: TrainFront },
  { key: "aeroport", slug: "transfert-aeroport-lille", icon: Plane },
  { key: "longue_distance", slug: "trajets-longue-distance", icon: Route },
];