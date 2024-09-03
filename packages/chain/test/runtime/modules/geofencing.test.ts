import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import {
GeoFencing, SignedGeoFence, GeoFence, RSVPedProof, RSVPPublicOutput, canRSVP,message,rsvped as rsvpedProgram
} from "../../../src/runtime/modules/geofencing";
import {
  PrivateKey,
  Nullifier,
  MerkleMap,
  Poseidon,
  Bool,
  PublicKey,
  setNumberOfWorkers,
  CircuitString,
  Signature,
  Field,
  MerkleMapWitness
} from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { Balance, BalancesKey, TokenId } from "@proto-kit/library";




const PRIVATE_KEY_0 = "EKE1h2CEeYQxDaPfjSGNNB83tXYSpn3Cqt6B3vLBHuLixZLApCpd"
let alicePrivateKey: PrivateKey;
let alicePublicKey: PublicKey;

const bobKey = PrivateKey.random();
const bob = bobKey.toPublicKey();
let geoFencing: GeoFencing;
const PRIVATE_KEY_1 = "EKEU31uonuF2rhG5f8KW4hRseqDjpPVysqcfKCKxqvs7x5oRviN1"
let oraclePrivateKey: PrivateKey;
let oraclePublicKey: PublicKey;
oraclePrivateKey = PrivateKey.fromBase58(PRIVATE_KEY_1);
oraclePublicKey = oraclePrivateKey.toPublicKey();




describe("Geofencing",  () => {
  let appChain = TestingAppChain.fromRuntime({
    GeoFencing: GeoFencing,


  });
  let geoFencing: GeoFencing;
  let rsvpProof: RSVPedProof;
  let geoFenceSignature:Signature;
  let witness: MerkleMapWitness;
  let nullifier: Nullifier;

  const aliceKey = PrivateKey.random();
  const alice = aliceKey.toPublicKey();


//RSVP LOGIC

  //
  //


  // async function mockProof(
  //   publicOutput: RSVPPublicOutput
  // ): Promise<RSVPedProof> {
  //   console.log("generating mock proof");
  //   console.time("mockProof");
  //   const proof = await RSVPedProof.dummy(undefined, publicOutput, 0);
  //   console.timeEnd("mockProof");
  //   return proof;
  // }

  async function realProof(
    publicOutput: RSVPPublicOutput
  ): Promise<RSVPedProof> {
    console.log("compiling geofencing program");
    console.time("compile");
    await rsvpedProgram.compile();
    console.timeEnd("compile");

    console.log("generating rsvp proof");
    console.time("proof");
    const proof = await rsvpedProgram.canRSVP(witness, nullifier,geoFenceSignature,alice);
    console.timeEnd("proof");
    return proof;
  }


  beforeAll(async () => {
    appChain = TestingAppChain.fromRuntime({
      GeoFencing: GeoFencing,

    });

    appChain.configurePartial({
      Runtime: {
        GeoFencing: {   },
        Balances: {
          totalSupply: Balance.from(10000),
        },
      },
    });

    await appChain.start();
    geoFencing = appChain.runtime.resolve("GeoFencing");

    appChain.setSigner(aliceKey);

  }, 1_000_000);




  it("should set geofence so that a user can send a request", async () => {
    let aliceString=alice.toBase58()
    interface JsonCompatibleSignature {
      signature: string;
      publicKey: string;
      lat: number;
      signedLatSign: number;
      long: number;
      signedLongSign: number;
      radius: number;
    }
     let tmp_event="Myevent";
     let tmp_description="some descripton";

    const response = await fetch(
      `http://localhost:3000/api/get/geofence/createGeofence?publicKey=${aliceString}&lat=37.7749&long=-122.4194&radius=100&events=${encodeURIComponent(tmp_event)}&description=${encodeURIComponent(tmp_description)}`
    );
    const data = await response.json() as JsonCompatibleSignature; // Type assertion

    const lat = Field(data.lat);
    const long = Field(data.long);

    const slat = Field(data.signedLatSign);
    const slong = Field(data.signedLongSign);

    const radius = Field(data.radius);
    let circuitevent=CircuitString.fromString(tmp_event)
    let circuitdescription=CircuitString.fromString(tmp_description)
    const signature = Signature.fromBase58(data.signature);
    const geoFenceData = new GeoFence({
           lat: lat,
           long: long,
           latSign:slat,
           longSign:slong,
           radius: radius,
           event:circuitevent,
           description:circuitdescription,

       });


    const signedGeoFence = new SignedGeoFence({
        signature: signature,
        GeoFence: geoFenceData,
    });


    const tx = await appChain.transaction(alice, async () => {
        await geoFencing.setGeoFence(signedGeoFence);
    });



    await tx.sign();
    await tx.send()



    const block = await appChain.produceBlock();

    const storedGeofence = await appChain.query.runtime.GeoFencing.geofences.get(
      alice
    );
    console.log(storedGeofence,storedGeofence?.lat.value)

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    // expect(storedGeofence?.toBoolean()).toBe(true);
  });




  it("should allow RSVP if a valid proof is provided", async () => {
    const map = new MerkleMap();
    const key = Poseidon.hash(alice.toFields());
    map.set(key, Bool(true).toField());

     witness = map.getWitness(key);

    nullifier = Nullifier.fromJSON(
      Nullifier.createTestNullifier(message, aliceKey)
    );

    let nullstring=nullifier.getPublicKey().toBase58()

    let geostring=alice.toBase58()
    interface JsonCompatibleRSVPSignature {
      signature: string;
      publicKey: string;

    }
    const rsvpresponse = await fetch(
            `http://localhost:3000/api/get/geofence/canRSVP?publicKey=${nullstring}&publicKeyGeofence=${geostring}&lat=37.7749&long=-122.4194&radius=100`
          );

        const rsvpdata = await rsvpresponse.json() as JsonCompatibleRSVPSignature; // Type assertion
      console.log(rsvpdata)
    let nullField=nullifier.getPublicKey().toFields();
    let geoField=alice.toFields();
    const nullhash = Poseidon.hash(nullField);
    const geohash = Poseidon.hash(geoField);
    const fieldURL=[nullhash,geohash]
    //
    //
    //
     geoFenceSignature = Signature.fromBase58(rsvpdata.signature);


    rsvpProof = await realProof(await canRSVP(witness, nullifier,geoFenceSignature,alice));

    const tx = await appChain.transaction(alice, async () => {
      await geoFencing.rsvp(rsvpProof);
    });

    await tx.sign();
    await tx.send();

    const block = await appChain.produceBlock();

    let aliceField=alice.toFields()
    const keystored = Poseidon.hash([rsvpProof.publicOutput.nullifier,aliceField[0],aliceField[1]]);


    const storedNullifier = await appChain.query.runtime.GeoFencing.nullifiers.get(
      keystored
    );


    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(storedNullifier?.toBoolean()).toBe(true);
  },1_000_000);

  it("should not allow RSVP if a spent nullifier is used", async () => {
    const tx = await appChain.transaction(alice, async () => {
      await geoFencing.rsvp(rsvpProof);
    });

    await tx.sign();
    await tx.send();

    const block = await appChain.produceBlock();

        let aliceField=alice.toFields()
        const key = Poseidon.hash([rsvpProof.publicOutput.nullifier,aliceField[0],aliceField[1]]);


    const storedNullifier = await appChain.query.runtime.GeoFencing.nullifiers.get(
      key
    );
    console.log(block?.transactions[0].statusMessage)

    expect(block?.transactions[0].status.toBoolean()).toBe(false);
    expect(block?.transactions[0].statusMessage).toMatch(
      /Nullifier has already been used/
    );
    expect(storedNullifier?.toBoolean()).toBe(true);

  });
});
