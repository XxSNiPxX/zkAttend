import "reflect-metadata";
import { log } from "@proto-kit/common";
import { TestingAppChain } from "@proto-kit/sdk";

import { Field, Poseidon, PrivateKey, PublicKey, Signature, UInt64, Bool,Nullifier,MerkleMap,CircuitString } from "o1js";
import { config, modules } from "../../src/runtime";
import { GeoFencing, SignedGeoFence, GeoFence, RSVPedProof, RSVPPublicOutput, canRSVP,message } from "../../src/runtime/geofencing";
import { fromRuntime } from "../testing-appchain";
import { Pickles } from "o1js/dist/node/snarky";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof_system";

log.setLevel("ERROR");
export {};
let appChain: ReturnType<typeof fromRuntime<typeof modules>>;

describe("GeoFencing integration", () => {


    const PRIVATE_KEY_0 = "EKE1h2CEeYQxDaPfjSGNNB83tXYSpn3Cqt6B3vLBHuLixZLApCpd"
    let alicePrivateKey: PrivateKey;
    let alicePublicKey: PublicKey;


  let geoFencing: GeoFencing;
  const PRIVATE_KEY_1 = "EKEU31uonuF2rhG5f8KW4hRseqDjpPVysqcfKCKxqvs7x5oRviN1"
  let oraclePrivateKey: PrivateKey;
  let oraclePublicKey: PublicKey;

  oraclePrivateKey = PrivateKey.fromBase58(PRIVATE_KEY_1);
  oraclePublicKey = oraclePrivateKey.toPublicKey();

  alicePrivateKey = PrivateKey.fromBase58(PRIVATE_KEY_0);
    alicePublicKey = alicePrivateKey.toPublicKey();

  beforeAll(async () => {
    appChain = fromRuntime(modules);

    appChain.configurePartial({
      Runtime: config,
    });

    await appChain.start();
    appChain.setSigner(alicePrivateKey);

    geoFencing = appChain.runtime.resolve("GeoFencing");

    // Set the oracle public key in the module
    // await appChain.transaction(alicePublicKey, async () => {
    //   await geoFencing.oraclePublicKey.set(oracleKey.toPublicKey());
    // }).sign().send();
    //
    // await appChain.produceBlock();
  });



  it("should set a geofence with valid oracle data", async () => {



    const geoFenceData = new GeoFence({
           lat: Field(1991),
           long: Field(2222),
           latSign:Field(1),
           longSign:Field(0),
           radius: Field(1000),


       });


       const geoFenceSignature = Signature.create(oraclePrivateKey, GeoFence.toFields(geoFenceData));
       //
       console.log(GeoFence.toFields(geoFenceData))
       const signedGeoFence = new SignedGeoFence({
           signature: geoFenceSignature,
           GeoFence: geoFenceData,
       });

       //
       const geoFencing = appChain.runtime.resolve("GeoFencing");

       const tx = await appChain.transaction(alicePublicKey, async () => {
           await geoFencing.setGeoFence(signedGeoFence);
       });






       const bobKey = PrivateKey.random();
       const bob = bobKey.toPublicKey();
       appChain.setSigner(bobKey);
       alicePrivateKey = PrivateKey.fromBase58(PRIVATE_KEY_0);
         alicePublicKey = alicePrivateKey.toPublicKey();


      const map = new MerkleMap();
        const key = Poseidon.hash(bob.toFields());
        map.set(key, Bool(true).toField());
        const witness = map.getWitness(key);

        async function mockProof(
          publicOutput: RSVPPublicOutput
        ): Promise<RSVPedProof> {
          const [, proof] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
          return new RSVPedProof({
            proof: proof,
            maxProofsVerified: 2,
            publicInput: undefined,
            publicOutput,
          });
        }

        const nullifier = Nullifier.fromJSON(
     Nullifier.createTestNullifier(message, bobKey)
     );


     let test=nullifier.getPublicKey().toFields()
     let test2=alicePublicKey.toFields()

     let test3=nullifier.getPublicKey().toBase58();
     let test4=alicePublicKey.toBase58();
     console.log(test4,test3,test3.concat(test4))
     let test5=test3.concat(test4)
     const fieldURL = CircuitString.fromString(test5).hash();

     const geoFenceSignature1 = Signature.create(oraclePrivateKey, [fieldURL]);
     console.log(geoFenceSignature1)
     const rsvpProof = await mockProof(canRSVP(witness, nullifier,geoFenceSignature1,alicePublicKey));
     const tx1 = appChain.transaction(bob, async () => {
         await geoFencing.rsvp(rsvpProof);
       });






       // await tx.sign();
       // await tx.send();
       // console.log(geoFencing,tx)


    // appChain.setSigner(senderKey);
    //
    // const geoFenceData = new GeoFence({
    //   owner: senderKey.toPublicKey(),
    //   lat: UInt64.from(1234567890),
    //   long: UInt64.from(9876543210),
    //   radius: UInt64.from(500),
    //   isActive: Bool(true),
    // });
    //
    // const geoFenceSignature = Signature.create(oraclePrivateKey, geoFenceData.toFields());
    //
    // const signedGeoFence = new SignedGeoFence({
    //   signature: geoFenceSignature,
    //   GeoFence: geoFenceData,
    // });
    //
    // const tx = await appChain.transaction(senderKey.toPublicKey(), () => {
    //   geoFencing.setGeoFence(signedGeoFence);
    // });
    //
    // await tx.sign();
    // await tx.send();
    // await appChain.produceBlock();
    //
    // // Verify the geofence is set
    // const storedGeoFence = geoFencing.geofences.get(senderKey.toPublicKey().toField());
    // expect(storedGeoFence.isSome).toBeTruthy();
    // expect(storedGeoFence.value.owner.equals(senderKey.toPublicKey())).toBe(true);
  });


  it("should send a req t rsvp with valid oracle data", async () => {


});




  //
  // it("should not allow setting a second geofence for the same sender", async () => {
  //   const geoFenceData = new GeoFence({
  //     owner: senderKey.toPublicKey(),
  //     lat: UInt64.from(1111111111),
  //     long: UInt64.from(2222222222),
  //     radius: UInt64.from(1000),
  //     isActive: Bool(false),
  //   });
  //
  //   const geoFenceSignature = Signature.create(oracleKey, geoFenceData.toFields());
  //
  //   const signedGeoFence = new SignedGeoFence({
  //     signature: geoFenceSignature,
  //     GeoFence: geoFenceData,
  //   });
  //
  //   const tx = await appChain.transaction(senderKey.toPublicKey(), () => {
  //     geoFencing.setGeoFence(signedGeoFence);
  //   });
  //
  //   await tx.sign();
  //   try {
  //     await tx.send();
  //     throw new Error("Transaction should have failed");
  //   } catch (e) {
  //     expect(e.message).toContain("Sender has a geofence");
  //   }
  // });
});
