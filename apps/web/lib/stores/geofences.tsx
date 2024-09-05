import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, BalancesKey, TokenId } from "@proto-kit/library";
import { PublicKey, UInt64,Field,CircuitString,Signature,MerkleMap,Poseidon,Bool,Nullifier } from "o1js";
import { useCallback, useEffect } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";
import {
  GeoFencing,
  SignedGeoFence,
  GeoFence,
  RSVPedProof,
  RSVPPublicOutput,
  canRSVP,
  message,
  rsvped as rsvpedProgram,
} from "chain";

console.log(canRSVP,"console.log(canRSVP)")


interface JsonCompatibleSignature {
  signature: string;
  publicKey: string;
  lat: number;
  signedLatSign: number;
  long: number;
  signedLongSign: number;
  radius: number;
}


interface Geodata {
  publicKey: string;
  lat: string;
  long: string;
  radius: string;
  event:string;
  description:string;
}


export interface BalancesState {
  loading: boolean;
  balances: {
    // address - balance
    [key: string]: string;
  };
  loadBalance: (client: Client, address: string) => Promise<void>;
  faucet: (client: Client, address: string) => Promise<PendingTransaction>;
}

export interface IndividualGeoFence {
  address:String,
  lat: String,
  long: String,
  radius: String,
  event:String,
  description:String,
}

export interface GeoFencingState {
  loading: boolean;
  geofences:IndividualGeoFence[];
  getGeofence: (client: Client, address: string) => Promise<void>;
  setRSVP: (client: Client, address: string,address_geofence:string) => Promise<PendingTransaction>;
  setGeofence: (client: Client, address: string,lat:string,long:string,radius:string) => Promise<PendingTransaction>;

}

function isPendingTransaction(
  transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
  if (!(transaction instanceof PendingTransaction))
    throw new Error("Transaction is not a PendingTransaction");
}

export const tokenId = TokenId.from(0);



export const useGeoFenceStore = create<
  GeoFencingState,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    loading: Boolean(false),
    geofences:[],
    async getGeofence(client: Client, address: string,geofence_address:string) {
      set((state) => {
        state.loading = true;
      });
      interface IndividualGeoFence {
        address:String,
        lat: String,
        long: String,
        radius: String,
        event:String,
        description:String,
      }
      const dkey = PublicKey.fromBase58(geofence_address);

      const dataq = await client.query.runtime.GeoFencing.geofences.get(dkey);
      if (!dataq){
        return
      }
      const latstring=dataq.lat.toString()
      const longstring=dataq.long.toString()
      const latsignstring= dataq.latSign.toString()
      const longsignstring=dataq.longSign.toString()
      const radiusstring=dataq.radius.toString()
      const lat = parseInt(dataq.lat.toString(), 10);
      const long = parseInt(dataq.long.toString(), 10);
      const latsign = parseInt(dataq.latSign.toString(), 10);
      const longsign = parseInt(dataq.longSign.toString(), 10);
      const radius=parseInt(dataq.radius.toString(), 10);

      let reconstructedLat = lat / 10000;
      let reconstructedLong = long / 10000;

      // Apply the sign based on signedLatSign and signedLongSign
      const originalLat = latsign === 1 ? reconstructedLat : -reconstructedLat;
      const originalLong = longsign === 1 ? reconstructedLong : -reconstructedLong;

      // If needed, handle radius similarly
      const originalRadius = radius;
      console.log(reconstructedLat,reconstructedLong,originalLat,originalLong,radius)
      const newGeoFence: IndividualGeoFence = {
        address: geofence_address,
        lat: originalLat.toString(),
        long: originalLong.toString(),
        radius: radius.toString(),
        event: dataq.event.toString(),
        description: dataq.description.toString()
      };


      console.log(dataq,dataq.lat.toString(),dataq.long.toString(),dataq.latSign.toString(),dataq.longSign.toString(),dataq.event.toString(),dataq.description.toString())
      set((state) => {
        state.loading = false;
          state.geofences=[...state.geofences, newGeoFence] // Add the new geofence
        // state.balances[address] = balance?.toString() ?? "0";
      });
    },
    async setGeofence(
  client: Client,
  address: string,
  lat: string,
  long: string,
  radius: string,
  event: string,
  description: string
) {
  console.log(description,event)
  console.log(GeoFence)
  const geofences = client.runtime.resolve("GeoFencing");
  const sender = PublicKey.fromBase58(address);
  const response = await fetch(
    `http://localhost:3000/api/get/geofence/createGeofence?publicKey=${address}&lat=${lat}&long=${long}&radius=${radius}&events=${encodeURIComponent(
      event
    )}&description=${encodeURIComponent(description)}`
  );
  console.log(response)
  const data = (await response.json()) as JsonCompatibleSignature;

  const latitude = Field(data.lat); // Changed variable name
  const longitude = Field(data.long); // Changed variable name

  const signedLat = Field(data.signedLatSign); // Changed variable name
  const signedLong = Field(data.signedLongSign); // Changed variable name

  const geofenceRadius = Field(data.radius); // Changed variable name
  const circuitEvent = CircuitString.fromString(event);
  const circuitDescription = CircuitString.fromString(description);
  const signature = Signature.fromBase58(data.signature);

  const geoFenceData = new GeoFence({
    lat: latitude,
    long: longitude,
    latSign: signedLat,
    longSign: signedLong,
    radius: geofenceRadius,
    event: circuitEvent,
    description: circuitDescription,
  });
  console.log(geoFenceData)

  const signedGeoFence = new SignedGeoFence({
    signature: signature,
    GeoFence: geoFenceData,
  });

  const tx = await client.transaction(sender, async () => {
    await geofences.setGeoFence(signedGeoFence);
  });
  await tx.sign();
  await tx.send();

  isPendingTransaction(tx.transaction);
  return tx.transaction;
},
async setRSVP(client: Client, address: string, address_geofence: string, lat: string, long: string) {
  let witness: MerkleMapWitness;
  let nullifier: Nullifier;
  const sender = PublicKey.fromBase58(address);
  const geofences = client.runtime.resolve("GeoFencing");

  const map = new MerkleMap();
  const key = Poseidon.hash(sender.toFields());
  map.set(key, Bool(true).toField());
  witness = map.getWitness(key);

  try {
    nullifier = await mina.createNullifier({ message: [0] });
    console.log(nullifier, address_geofence);

    // Convert the string values to Fields
    const xField = Field(nullifier.publicKey.x);
    const yField = Field(nullifier.publicKey.y);

    const nullpublicKey = PublicKey.fromFields([xField, yField]);
    const nullstring = nullpublicKey.toBase58();
    console.log(nullstring);

    interface JsonCompatibleRSVPSignature {
      signature: string;
      publicKey: string;
    }

    const rsvpresponse = await fetch(
      `http://localhost:3000/api/get/geofence/canRSVP?publicKey=${nullstring}&publicKeyGeofence=${address_geofence}&lat=${lat}&long=${long}`
    );

    const rsvpdata = (await rsvpresponse.json()) as JsonCompatibleRSVPSignature;
    console.log(rsvpdata);

    let o1jsNullifier = Nullifier.fromValue(nullifier);
    console.log(o1jsNullifier, "tmpp");

    let rsvpSignature = Signature.fromBase58(rsvpdata.signature);

    // Define a function to handle proof generation with a timeout
    async function realProof(publicOutput: RSVPPublicOutput): Promise<RSVPedProof> {
      console.log("Compiling geofencing program");
      console.time("compile");

      await rsvpedProgram.compile();
      console.timeEnd("compile");

      console.log("Generating RSVP proof");
      console.time("proof");
      const proof =  await rsvpedProgram.canRSVP(
          witness,
          o1jsNullifier,
          rsvpSignature,
          sender
        )
      console.timeEnd("proof",proof);
      return proof;
    }

    console.log("Starting RSVP proof generation...");
    console.log(witness, o1jsNullifier, rsvpSignature, sender,canRSVP,realProof)
    let rsvpProof = await realProof(await canRSVP(witness, o1jsNullifier, rsvpSignature, sender));
    console.log(rsvpProof);

    const tx = await client.transaction(sender, async () => {
      await geofences.rsvp(rsvpProof);
    });
    await tx.sign();
    await tx.send();

    isPendingTransaction(tx.transaction);
    return tx.transaction;

    // Here you can handle the transaction or further processing
    // const tx = await appChain.transaction(alice, async () => {
    //   await geoFencing.rsvp(rsvpProof);
    // });
    // await tx.sign();
    // await tx.send();

  } catch (error) {
    console.error('Error during RSVP process:', error);
  }
}
,
  })),
);



// export const useObserveBalance = () => {
//   const client = useClientStore();
//   const chain = useChainStore();
//   const wallet = useWalletStore();
//   const balances = useBalancesStore();
//
//   useEffect(() => {
//     if (!client.client || !wallet.wallet) return;
//
//     balances.loadBalance(client.client, wallet.wallet);
//   }, [client.client, chain.block?.height, wallet.wallet]);
// };

export interface GeoFenceFormData {
  lat: string;
  long: string;
  radius:string;
  event: string;
  description: string;
}

export interface GetGeoFence {
  geofenceAddress: string;
}



export const createGeofence = () => {
  const client = useClientStore();
  const geofences = useGeoFenceStore();
  const wallet = useWalletStore();

  return useCallback(async (data:GeoFenceFormData) => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await geofences.setGeofence(
      client.client,
      wallet.wallet,
      data.lat,
      data.long,
      data.radius,
      data.event,
      data.description,
    );

    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};

export const useObserveUserGeofence = () => {
  const client = useClientStore();
  const chain = useChainStore();
  const wallet = useWalletStore();
  const geofences = useGeoFenceStore();

  useEffect(() => {
    if (!client.client || !wallet.wallet || geofences.geofences.length!=0 ) return;

    geofences.getGeofence(client.client, wallet.wallet,wallet.wallet);
  }, [client.client, chain.block?.height, wallet.wallet]);
};


export const getGeofence = () => {
  const client = useClientStore();
  const geofences = useGeoFenceStore();
  const wallet = useWalletStore();

  return useCallback(async (data:GetGeoFence) => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await geofences.getGeofence(
      client.client,
      wallet.wallet,
      data.geofenceAddress,
    );

    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};


export const rsvp = () => {
  const client = useClientStore();
  const geofences = useGeoFenceStore();
  const wallet = useWalletStore();

  return useCallback(async (address_geofence:string,lat:string,long:string) => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await geofences.setRSVP(
      client.client,
      wallet.wallet,
      address_geofence,
      lat,
      long,
    );

    // wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};
