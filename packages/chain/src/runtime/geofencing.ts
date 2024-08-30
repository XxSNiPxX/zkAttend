import {
  RuntimeModule,
  runtimeMethod,
  state,
  runtimeModule,
} from "@proto-kit/module";
import { State, assert,StateMap } from "@proto-kit/protocol";
import { PublicKey,Field,UInt64,Bool,Struct,Signature,Provable,PrivateKey ,Experimental,  MerkleMapWitness,
  Nullifier,Poseidon} from "o1js";

const ORACLE_PUBLIC_KEY =
  'B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy';


  export class RSVPPublicOutput extends Struct({
    root: Field,
    nullifier: Field,
    geofenceid:PublicKey
  }) {}

  export const message: Field[] = [Field(0)];

  export function canRSVP(
    witness: MerkleMapWitness,
    nullifier: Nullifier,
    signature: Signature,
    geofenceid:PublicKey,
  ): RSVPPublicOutput {
    const PRIVATE_KEY_1 = "EKEU31uonuF2rhG5f8KW4hRseqDjpPVysqcfKCKxqvs7x5oRviN1"
    const PRIVATE_KEY_0 = "EKE1h2CEeYQxDaPfjSGNNB83tXYSpn3Cqt6B3vLBHuLixZLApCpd"

    let oraclePrivateKey: PrivateKey;
    let oraclePublicKey: PublicKey;

    oraclePrivateKey = PrivateKey.fromBase58(PRIVATE_KEY_1);
    oraclePublicKey = oraclePrivateKey.toPublicKey();
    let test=nullifier.getPublicKey().toFields()

    let test2=geofenceid.toFields()
    console.log(test[0],test[1],test2[0],test[2])


    const isValid1 = signature.verify(oraclePublicKey, [test[0],test2[1],test2[0],test2[1]]);
    Provable.log(isValid1,"ASDSDSADSAD");
    isValid1.assertTrue('Oracle data is not valid!');


    const key = Poseidon.hash(nullifier.getPublicKey().toFields());
    const [computedRoot, computedKey] = witness.computeRootAndKey(
      Bool(true).toField()
    );
    computedKey.assertEquals(key);

    nullifier.verify(message);
    Provable.log(nullifier);

    return new RSVPPublicOutput({
      root: computedRoot,
      nullifier: nullifier.key(),
      geofenceid:geofenceid

    });
  }


  export const rsvped = Experimental.ZkProgram({
  publicOutput: RSVPPublicOutput,
  methods: {
    canRSVP: {
      privateInputs: [MerkleMapWitness, Nullifier,Signature,PublicKey],
      method: canRSVP,
    },
  },
});


export class RSVPedProof extends Experimental.ZkProgram.Proof(rsvped) {}



//   export class Nullifier extends Struct({
//   key: Field,  // Unique identifier for the nullifier
//   isUsed: Bool // Indicates whether the nullifier has been used
// }) {}

export class GeoFence extends Struct({
  lat:Field,
  long:Field,
  radius:Field,
}) {}

export class SignedGeoFence extends Struct({
  signature: Signature,
  GeoFence:GeoFence,
}) {}


interface GeoFencingConfig {
  oraclePublicKey: PublicKey;
}

@runtimeModule()
export class GeoFencing extends RuntimeModule<GeoFencingConfig> {
  @state() public geofences = StateMap.from<PublicKey, GeoFence>(
    PublicKey,
    GeoFence
  );
  @state() public nullifiers = StateMap.from<Field, Bool>(Field, Bool);




  @state() public oraclePublicKey = State.from<PublicKey>(PublicKey);



  @runtimeMethod()
  public setGeoFence(oracleData: SignedGeoFence): void {
    const senderHasGeoFence = this.geofences.get(this.transaction.sender.value);
    // assert(senderHasGeoFence.value, "You have created a geofence already");
    Provable.log(senderHasGeoFence);
    assert(senderHasGeoFence.isSome, "You created a geofence already");

    // this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
    const PRIVATE_KEY_1 = "EKEU31uonuF2rhG5f8KW4hRseqDjpPVysqcfKCKxqvs7x5oRviN1"
    let oraclePrivateKey: PrivateKey;
    let oraclePublicKey: PublicKey;

    oraclePrivateKey = PrivateKey.fromBase58(PRIVATE_KEY_1);
    oraclePublicKey = oraclePrivateKey.toPublicKey();

    // const oraclePublicKey = this.oraclePublicKey.get().value;

    const signature = oracleData.signature;
    const isValid = oracleData.signature.verify(oraclePublicKey, GeoFence.toFields(oracleData.GeoFence));
    Provable.log(isValid);
    assert(isValid.not(), "Oracle data is not valid!");
    // assert(isValid.toBe(true), "Oracle data is not valid!");
    this.geofences.set(this.transaction.sender.value,oracleData.GeoFence)


    const asenderHasGeoFence = this.geofences.get(this.transaction.sender.value);
    Provable.log(asenderHasGeoFence,"CRETATED",this.transaction.sender.value);
  }

    public rsvp(rsvpProof: RSVPedProof) {
      rsvpProof.verify();


      Provable.log(rsvpProof.publicOutput);
      const asenderHasGeoFence = this.geofences.get(rsvpProof.publicOutput.geofenceid);
      Provable.log(asenderHasGeoFence);
      assert(asenderHasGeoFence.isSome, "Geofence Not found");

      let test=rsvpProof.publicOutput.geofenceid.toFields()
      const key = Poseidon.hash([rsvpProof.publicOutput.nullifier,test[0],test[1]]);
      Provable.log(key);

      const isNullifierUsed = this.nullifiers.get(
        key
      );
      assert(isNullifierUsed.value.not(), "Nullifier has already been used");
      this.nullifiers.set(key, Bool(true));


    }


}
// assert(senderHasGeoFence.isSome.not(), "Sender has a geofence");

// assert(isValid, "Oracle data is not valid!");
//
// this.geofences.set(this.transaction.sender.value,oracleData.GeoFence)
