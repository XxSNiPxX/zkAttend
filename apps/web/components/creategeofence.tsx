"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";

export interface GeoFenceCreatorProps {
  wallet?: string;
  loading: boolean;
  onConnectWallet: () => void;
  createGeoFence: () => void;
}

export interface GeoFenceFormData {
  lat: string;
  long: string;
  radius:string;
  event: string;
  details: string;
}

export function GeoFenceCreator({ wallet,loading,onConnectWallet, createGeoFence }: GeoFenceCreatorProps) {
  const form = useForm<GeoFenceFormData>();

  return (
    <Card className="w-full p-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold">Create GeoFence</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Create a geofence by entering a location and adding event details.
        </p>
      </div>
      <Form {...form}>
        <div className="pt-3">
          <FormField
            name="lat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter latitude" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="long"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter longitude" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="radius"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Radius</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter radius" />
                </FormControl>
              </FormItem>
            )}
          />

        </div>

        <div className="pt-3">
          <FormField
            name="event"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter event name" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Details</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter event details" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button
          size={"lg"}
          type="submit"
          className="mt-6 w-full"
          loading={loading}
          onClick={() => {
            wallet ?? onConnectWallet();
            wallet && createGeoFence();
          }}
                  >
          Create GeoFence
        </Button>
      </Form>
    </Card>
  );
}
