import "reflect-metadata";
import { log } from "@proto-kit/common";
import { TestingAppChain } from "@proto-kit/sdk";

import { Bool, Field, Poseidon, PrivateKey, Provable } from "o1js";

import { Balance, BalancesKey, TokenId } from "@proto-kit/library";
import { config, modules } from "../../src/runtime";
import { Admin } from "../../src/runtime/admin";
import { fromRuntime } from "../testing-appchain";



log.setLevel("ERROR");

  let appChain: ReturnType<typeof fromRuntime<typeof modules>>;
  let admin: Admin;


describe("integration", () => {


  const adminKey = PrivateKey.random();
  const judgeKey = PrivateKey.random();
  const credentialOwnerKey = PrivateKey.random();

  let admin: Admin;


  beforeAll(async () => {
    appChain = fromRuntime(modules);

    appChain.configurePartial({
      Runtime: config,
    });

    await appChain.start();

    admin = appChain.runtime.resolve("Admin");

  });

  it("should set an admin", async () => {
    appChain.setSigner(adminKey);

    const tx = await appChain.transaction(adminKey.toPublicKey(), () => {
      admin.setAdmin(adminKey.toPublicKey());
    });

    await tx.sign();
    await tx.send();

    await appChain.produceBlock();
  });



});
