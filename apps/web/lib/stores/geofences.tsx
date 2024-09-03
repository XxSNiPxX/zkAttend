import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, BalancesKey, TokenId } from "@proto-kit/library";
import { PublicKey, UInt64 } from "o1js";
import { useCallback, useEffect } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";



export interface BalancesState {
  loading: boolean;
  balances: {
    // address - balance
    [key: string]: string;
  };
  loadBalance: (client: Client, address: string) => Promise<void>;
  faucet: (client: Client, address: string) => Promise<PendingTransaction>;
}

export class IndividualGeoFence extends Struct({
  lat: String,
  long: String,
  radius: String,
}) {}

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

export const useBalancesStore = create<
  BalancesState,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    loading: Boolean(false),
    balances: {},
    async loadBalance(client: Client, address: string) {
      set((state) => {
        state.loading = true;
      });

      const key = BalancesKey.from(tokenId, PublicKey.fromBase58(address));

      const balance = await client.query.runtime.Balances.balances.get(key);

      set((state) => {
        state.loading = false;
        state.balances[address] = balance?.toString() ?? "0";
      });
    },
    async faucet(client: Client, address: string) {
      const balances = client.runtime.resolve("Balances");
      const sender = PublicKey.fromBase58(address);

      const tx = await client.transaction(sender, async () => {
        await balances.addBalance(tokenId, sender, Balance.from(1000));
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },
  })),
);

export const useGeoFenceStore = create<
  GeoFencingState,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    loading: Boolean(false),
    geofences:[],
    async getGeofence(client: Client, address: string) {
      set((state) => {
        state.loading = true;
      });

      const key = PublicKey.fromBase58(address);

      const balance = await client.query.runtime.GeoFencing.geofences.get(key);
      console.log(balance)
      set((state) => {
        state.loading = false;
        // state.balances[address] = balance?.toString() ?? "0";
      });
    },
    async setGeofence(client: Client, address: string,lat:string,long:string,radius:string) {
      const balances = client.runtime.resolve("GeoFencing");
      // const sender = PublicKey.fromBase58(address);
      // const geofenceaddr = PublicKey.fromBase58(address_geofence);

      // const tx = await client.transaction(sender, async () => {
      //   await balances.addBalance(tokenId, sender, Balance.from(1000));
      // });
      //
      // await tx.sign();
      // await tx.send();
      //
      // isPendingTransaction(tx.transaction);
      // return tx.transaction;
    },
    async setRSVP(client: Client, address: string,address_geofence:string) {
      const balances = client.runtime.resolve("GeoFencing");
      const sender = PublicKey.fromBase58(address);
      const geofenceaddr = PublicKey.fromBase58(address_geofence);

      // const tx = await client.transaction(sender, async () => {
      //   await balances.addBalance(tokenId, sender, Balance.from(1000));
      // });
      //
      // await tx.sign();
      // await tx.send();
      //
      // isPendingTransaction(tx.transaction);
      // return tx.transaction;
    },
  })),
);



export const useObserveBalance = () => {
  const client = useClientStore();
  const chain = useChainStore();
  const wallet = useWalletStore();
  const balances = useBalancesStore();

  useEffect(() => {
    if (!client.client || !wallet.wallet) return;

    balances.loadBalance(client.client, wallet.wallet);
  }, [client.client, chain.block?.height, wallet.wallet]);
};

export const useFaucet = () => {
  const client = useClientStore();
  const balances = useBalancesStore();
  const wallet = useWalletStore();

  return useCallback(async () => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await balances.faucet(
      client.client,
      wallet.wallet,
    );

    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet]);
};
