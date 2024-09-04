"use client";
import { Faucet } from "@/components/faucet";
import { GeoFenceCreator } from "@/components/creategeofence";

import { useFaucet } from "@/lib/stores/balances";
import { createGeofence } from "@/lib/stores/geofences";

import { useWalletStore } from "@/lib/stores/wallet";

export default function Home() {
  const wallet = useWalletStore();
  const drip = useFaucet();
  const geofencestuff = createGeofence()

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Faucet
            wallet={wallet.wallet}
            onConnectWallet={wallet.connectWallet}
            onDrip={drip}
            loading={false}
          />
          <GeoFenceCreator
            wallet={wallet.wallet}
            onConnectWallet={wallet.connectWallet}
            createGeoFence={geofencestuff}
            loading={false}
          />
        </div>
      </div>
    </div>
  );
}
