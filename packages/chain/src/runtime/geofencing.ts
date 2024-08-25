import {
  RuntimeModule,
  runtimeMethod,
  state,
  runtimeModule,
} from "@proto-kit/module";
import { State, assert,StateMap } from "@proto-kit/protocol";
import { PublicKey,Field,UInt64,Bool,Struct,Signature,Provable,PrivateKey} from "o1js";
const ORACLE_PUBLIC_KEY =
  'B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy';
export class GeoFence extends Struct({
  owner: PublicKey,
  lat:Field,
  long:Field,
  radius:Field,
  isActive:Bool,
  fieldRepresentation: [Field]


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
  @state() public oraclePublicKey = State.from<PublicKey>(PublicKey);



  @runtimeMethod()
  public setGeoFence(oracleData: SignedGeoFence): void {
    const senderHasGeoFence = this.geofences.get(this.transaction.sender.value);
    // this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
    const PRIVATE_KEY_1 = "EKEU31uonuF2rhG5f8KW4hRseqDjpPVysqcfKCKxqvs7x5oRviN1"
    const PRIVATE_KEY_0 = "EKE1h2CEeYQxDaPfjSGNNB83tXYSpn3Cqt6B3vLBHuLixZLApCpd"

    let oraclePrivateKey: PrivateKey;
    let oraclePublicKey: PublicKey;

    oraclePrivateKey = PrivateKey.fromBase58(PRIVATE_KEY_1);
    oraclePublicKey = oraclePrivateKey.toPublicKey();



    // const oraclePublicKey = this.oraclePublicKey.get().value;

    const signature = oracleData.signature;
    const isValid = oracleData.signature.verify(oraclePublicKey, GeoFence.toFields(oracleData.GeoFence));
    Provable.log(isValid);
      isValid.assertTrue('Oracle data is not valid!');
    // assert(isValid.toBe(true), "Oracle data is not valid!");
    this.geofences.set(this.transaction.sender.value,oracleData.GeoFence)
    const asenderHasGeoFence = this.geofences.get(this.transaction.sender.value);
    Provable.log(asenderHasGeoFence.value.lat.value.toString());
  }




}
// assert(senderHasGeoFence.isSome.not(), "Sender has a geofence");

// assert(isValid, "Oracle data is not valid!");
//
// this.geofences.set(this.transaction.sender.value,oracleData.GeoFence)
