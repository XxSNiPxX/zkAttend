import {
  RuntimeModule,
  runtimeMethod,
  state,
  runtimeModule,
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import {
  PublicKey,
  Field,
  UInt64,
  Bool,
  Struct,
  Signature,
  Provable,
  PrivateKey,
  MerkleMapWitness,
  Nullifier,
  Poseidon,
  CircuitString,
  ZkProgram,
} from "o1js";

const ORACLE_PUBLIC_KEY = 'B62qphyUJg3TjMKi74T2rF8Yer5rQjBr1UyEG7Wg9XEYAHjaSiSqFv1';

export class RSVPPublicOutput extends Struct({
  root: Field,
  nullifier: Field,
  geofenceid: PublicKey,
}) {}

export const message: Field[] = [Field(0)];

export async function canRSVP(
  witness: MerkleMapWitness,
  nullifier: Nullifier,
  signature: Signature,
  geofenceid: PublicKey,
): Promise<RSVPPublicOutput> {
  const oraclePublicKey = PublicKey.fromBase58(ORACLE_PUBLIC_KEY);

  const nullField = nullifier.getPublicKey().toFields();
  const geoField = geofenceid.toFields();

  const nullhash = Poseidon.hash(nullField);
  const geohash = Poseidon.hash(geoField);
  const fieldURL = [nullhash, geohash];

  const isValid = signature.verify(oraclePublicKey, fieldURL);
  isValid.assertTrue('Oracle data is not valid!');

  const key = Poseidon.hash(nullifier.getPublicKey().toFields());
  const [computedRoot, computedKey] = witness.computeRootAndKey(Bool(true).toField());
  computedKey.assertEquals(key);

  nullifier.verify(message);

  return new RSVPPublicOutput({
    root: computedRoot,
    nullifier: nullifier.key(),
    geofenceid: geofenceid,
  });
}

export const rsvped = ZkProgram({
  name: "geofence",
  publicOutput: RSVPPublicOutput,
  methods: {
    canRSVP: {
      privateInputs: [MerkleMapWitness, Nullifier, Signature, PublicKey],
      method: canRSVP,
    },
  },
});

export class RSVPedProof extends ZkProgram.Proof(rsvped) {}

export class GeoFence extends Struct({
  lat: Field,
  long: Field,
  latSign: Field,
  longSign: Field,
  radius: Field,
  event:CircuitString,
  description:CircuitString,
}) {}

export class SignedGeoFence extends Struct({
  signature: Signature,
  GeoFence: GeoFence,
}) {}

type GeoFencingConfig = Record<string, never>;

@runtimeModule()
export class GeoFencing extends RuntimeModule<GeoFencingConfig> {
  @state() public geofences = StateMap.from<PublicKey, GeoFence>(
    PublicKey,
    GeoFence
  );

  @state() public nullifiers = StateMap.from<Field, Bool>(Field, Bool);

  @state() public commitment = State.from<Field>(Field);

  @state() public oraclePublicKey = State.from<PublicKey>(PublicKey);

  @runtimeMethod()
  public async setGeoFence(oracleData: SignedGeoFence) {
    const senderHasGeoFence = await this.geofences.get(this.transaction.sender.value);

    const oraclePublicKey = PublicKey.fromBase58(ORACLE_PUBLIC_KEY);
    const event_field= CircuitString.toFields(oracleData.GeoFence.event)
    let description_field = CircuitString.toFields(oracleData.GeoFence.description)

    const eventhash = Poseidon.hash(event_field);
    const descriptionhash = Poseidon.hash(description_field);

    const isValid = await oracleData.signature.verify(
      oraclePublicKey,
      [
        oracleData.GeoFence.lat,
        oracleData.GeoFence.latSign,
        oracleData.GeoFence.long,
        oracleData.GeoFence.longSign,
        oracleData.GeoFence.radius,
        eventhash,
        descriptionhash
      ]
    );
Provable.log(isValid,"isValid")
    assert(isValid, "Oracle data is not valid!");

    await this.geofences.set(this.transaction.sender.value, oracleData.GeoFence);
  }

  @runtimeMethod()
  public async rsvp(rsvpProof: RSVPedProof) {
    rsvpProof.verify();

    // const senderHasGeoFence = await this.geofences.get(rsvpProof.publicOutput.geofenceid);
    // assert(senderHasGeoFence.isSome, "Geofence not found");

    const key = Poseidon.hash([
      rsvpProof.publicOutput.nullifier,
      ...rsvpProof.publicOutput.geofenceid.toFields()
    ]);

    const isNullifierUsed = await this.nullifiers.get(key);
    assert(isNullifierUsed.value.not(), "Nullifier has already been used");

    await this.nullifiers.set(key, Bool(true));
  }
}
