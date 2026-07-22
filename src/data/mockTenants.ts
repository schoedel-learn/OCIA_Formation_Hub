import { Tenant } from "../types";

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: "tenant-st-jude",
    name: "St. Jude Catholic Parish",
    type: "parish",
    city: "Cityville",
    stateOrRegion: "ST",
    patronSaint: "St. Jude Thaddeus",
    subscriptionStatus: "premium",
    billingContactName: "Angela Martinez (Parish Administrator)",
    billingContactEmail: "admin@stjudeparish.org",
    createdAt: "2026-01-10T00:00:00.000Z",
    memberCount: 24,
    description: "Primary active parish instance serving the OCIA cohort and local community."
  },
  {
    id: "tenant-holy-family-cluster",
    name: "Holy Family Parish Cluster",
    type: "parish_group",
    city: "Springfield",
    stateOrRegion: "ST",
    patronSaint: "Holy Family of Jesus, Mary & Joseph",
    subscriptionStatus: "premium",
    billingContactName: "Fr. Joseph Benedict (Pastor)",
    billingContactEmail: "pastor@holyfamilycluster.org",
    createdAt: "2026-02-15T00:00:00.000Z",
    memberCount: 52,
    description: "Combined parish family group sharing joint OCIA catechists, retreats, and liturgies."
  },
  {
    id: "tenant-diocese-arlington",
    name: "Diocese of Arlington & Eastern Eparchy",
    type: "diocese",
    city: "Arlington",
    stateOrRegion: "VA",
    patronSaint: "St. Thomas More",
    subscriptionStatus: "premium",
    billingContactName: "Marcus Vance (IT Support & Systems Admin)",
    billingContactEmail: "it.support@arlingtondiocese.org",
    createdAt: "2026-03-01T00:00:00.000Z",
    memberCount: 180,
    description: "Diocesan level instance supporting multiple parish OCIA directors and regional formation hubs."
  }
];
