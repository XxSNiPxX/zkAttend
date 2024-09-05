"use client";
import { Faucet } from "@/components/faucet";
import { GeoFenceCreator } from "@/components/creategeofence";
import { EventCardGrid } from "@/components/eventcard";

import { useFaucet } from "@/lib/stores/balances";
import { createGeofence } from "@/lib/stores/geofences";

import { useWalletStore } from "@/lib/stores/wallet";
import { useGeoFenceStore } from "@/lib/stores/geofences";
import { rsvp } from "@/lib/stores/geofences";

export default function Home() {
  const wallet = useWalletStore();
  const drip = useFaucet();
  const geofencestuff = createGeofence()
  const geofencestore=useGeoFenceStore()
  const rsvpstuff = rsvp()
  console.log(rsvpstuff)

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">

          <GeoFenceCreator
            wallet={wallet.wallet}
            onConnectWallet={wallet.connectWallet}
            createGeoFence={geofencestuff}
            loading={false}
          />

          <EventCardGrid
            events={geofencestore.geofences}
            wallet={wallet.wallet}
            onConnectWallet={wallet.connectWallet}
            rsvp={rsvpstuff}
            loading={false}
          />

        </div>
      </div>
    </div>
  );
}
