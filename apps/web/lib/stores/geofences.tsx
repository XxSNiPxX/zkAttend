import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, BalancesKey, TokenId } from "@proto-kit/library";
import { PublicKey, UInt64 } from "o1js";
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

interface JsonCompatibleSignature {
  signature: string;
  publicKey: string;
  lat: number;
  signedLatSign: number;
  long: number;
  signedLongSign: number;
  radius: number;
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

// export class IndividualGeoFence extends Struct({
//   lat: String,
//   long: String,
//   radius: String,
// }) {}

export interface GeoFencingState {
  loading: boolean;
  // geofences:IndividualGeoFence[];
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
    // async getGeofence(client: Client, address: string) {
    //   set((state) => {
    //     state.loading = true;
    //   });
    //
    //   const dkey = PublicKey.fromBase58(address);
    //
    //   const dataq = await client.query.runtime.GeoFencing.geofences.get(dkey);
    //   console.log(dataq)
    //   set((state) => {
    //     state.loading = false;
    //     // state.balances[address] = balance?.toString() ?? "0";
    //   });
    // },
    async setGeofence(
  client: Client,
  address: string,
  lat: string,
  long: string,
  radius: string,
  event: string,
  description: string
) {
  console.log(client.runtime)
  const geofences = client.runtime.resolve("GeoFencing");
  const sender = PublicKey.fromBase58(address);
  const response = await fetch(
    `http://localhost:3000/api/get/geofence/createGeofence?publicKey=${address}&lat=${lat}&long=${long}&radius=${radius}&events=${encodeURIComponent(
      event
    )}&description=${encodeURIComponent(description)}`
  );
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
    // async setRSVP(client: Client, address: string,address_geofence:string) {
    //   const balances = client.runtime.resolve("GeoFencing");
    //   const sender = PublicKey.fromBase58(address);
    //   const geofenceaddr = PublicKey.fromBase58(address_geofence);
    //
    //   // const tx = await client.transaction(sender, async () => {
    //   //   await balances.addBalance(tokenId, sender, Balance.from(1000));
    //   // });
    //   //
    //   // await tx.sign();
    //   // await tx.send();
    //   //
    //   // isPendingTransaction(tx.transaction);
    //   // return tx.transaction;
    // },
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

export const createGeofence = (lat:string,long:string,radius:string,event:string,description:string) => {
  const client = useClientStore();
  const geofences = useGeoFenceStore();
  const wallet = useWalletStore();

  return useCallback(async () => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await geofences.setGeofence(
      client.client,
      wallet.wallet,
      lat,
      long,
      radius,
      event,
      description,
    );

    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};
