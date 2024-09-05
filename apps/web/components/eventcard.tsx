"use client";
import { Card } from "@/components/ui/card";
import { Button } from "./ui/button";
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
import { useGeoFenceStore } from "@/lib/stores/geofences";
import { IndividualGeoFence } from "@/lib/stores/geofences";
import { rsvp } from "@/lib/stores/geofences";
import Loader from "./ui/loader";

export interface EventCardData {
  publicKey: string;
  lat: string;
  long: string;
  radius: string;
  event: string;
  description: string;
}

export interface EventCardProps {
  eventData: IndividualGeoFence;
  wallet?: string;
  loading: boolean;
  onConnectWallet: () => void;
  rsvp: () => void;
}

export function EventCard({
  eventData,
  wallet,
  loading,
  onConnectWallet,
  rsvp,
}: EventCardProps) {
  const onRSVPClick = () => {
    if (!wallet) {
      onConnectWallet();
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude.toString();
            const long = position.coords.longitude.toString();
            console.log(rsvp)
            rsvp(eventData.address,lat, long);
          },
          (error) => {
            console.error("Error getting location", error);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    }
  };

  console.log(loading,"loadings")

  return (
    <>
        {loading && <Loader />}
    <Card className="p-4">
      <h2 className="text-xl font-bold">{eventData.event}</h2>
      <p className="text-sm text-zinc-500">{eventData.description}</p>
      <div className="mt-3 text-sm">
        <p><strong>Latitude:</strong> {eventData.lat}</p>
        <p><strong>Longitude:</strong> {eventData.long}</p>
        <p><strong>Radius:</strong> {eventData.radius}</p>
      </div>
      <Button
        size={"lg"}
        type="button"
        className="mt-4 w-full"
        loading={loading}
        onClick={onRSVPClick}
      >
        RSVP
      </Button>
    </Card>

        </>
  );
}

export interface EventCardGridProps {
  events: IndividualGeoFence[];
  wallet?: string;
  loading: boolean;
  onConnectWallet: () => void;
  rsvp: () => void;
}

export function EventCardGrid({
  events,
  wallet,
  loading,
  onConnectWallet,
  rsvp,
}: EventCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {events.map((eventData, index) => (
        <EventCard
          key={index}
          eventData={eventData}
          wallet={wallet}
          loading={loading}
          onConnectWallet={onConnectWallet}
          rsvp={rsvp}
        />
      ))}
    </div>
  );
}
