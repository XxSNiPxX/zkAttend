import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { GeoFencing } from "./modules/geofencing";

export const modules = VanillaRuntimeModules.with({
  Balances,
  GeoFencing,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  GeoFencing:{},
};

export default {
  modules,
  config,
};
