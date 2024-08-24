import {
  RuntimeModule,
  runtimeMethod,
  state,
  runtimeModule,
} from "@proto-kit/module";
import { State, assert } from "@proto-kit/protocol";
import { PublicKey,Field,UInt64,Bool } from "o1js";

export class GeoFence extends Struct({
  owner: PublicKey,
  lat:UInt64,
  long:UInt64,
  radius:UInt64,
  isActive:Bool,

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
  @state() public geofences = StateMap.from<Field, GeoFence>(
    Field,
    GeoFence
  );
  @state() public oraclePublicKey = State.from<PublicKey>(PublicKey);



  @runtimeMethod()
  public setGeoFence(oracleData: SignedGeoFence): void {

    const senderHasGeoFence = this.geofences.get(this.transaction.sender.value).value;
    assert(senderHasGeoFence.isSome.not(), "Sender has a geofence");

    const oraclePublicKey = this.oraclePublicKey.get().value;
    const signature = oracleData.signature;
    const isValid = signature.verify(oraclePublicKey, oracleData.GeoFence.fieldRepresentation);
    assert(isValid, "Oracle data is not valid!");

    this.geofences.set(this.transaction.sender.value,oracleData.GeoFence)

  }




}
