import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrivateKey, Field, Signature, PublicKey } from 'snarkyjs';
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

// @ts-ignore
import Client from 'mina-signer';

const client = new Client({ network: process.env.NETWORK_KIND ?? 'testnet' });

// Implement toJSON for BigInt so we can include values in response
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

function getSignedCreditScore(userId: number) {
  let privateKey =
    process.env.PRIVATE_KEY ??
    'EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53';


  const knownCreditScore = (userId: number) => (userId === 1 ? 787 : 536);
  const creditScore = knownCreditScore(userId);


  const signature = client.signFields(
    [BigInt(userId), BigInt(creditScore)],
    privateKey
  );

  console.log(signature, "Credit Score Signature");
  return {
    data: { id: userId, creditScore: creditScore },
    signature: signature,
  };
}

function signedGeofence(publicKey: string, lat: number, long: number, radius: number) {
  let privateKey =
    process.env.PRIVATE_KEY ??
    'EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53';

  // Convert latitude and longitude to whole numbers
  const latWhole = Math.round(Math.abs(lat) * 10000);
  const longWhole = Math.round(Math.abs(long) * 10000);

  // Determine the sign
  const signedLat = latWhole >= 0 ? latWhole : -latWhole;
  const signedLatSign = lat >= 0 ? 1 : 0;

  const signedLong = longWhole >= 0 ? longWhole : -longWhole;
  const signedLongSign = long >= 0 ? 1 : 0;
  console.log(signedLatSign,signedLongSign)
  // Prepare data for signing
  const fieldsToSign = [
    BigInt(latWhole),
    BigInt(signedLatSign),
    BigInt(longWhole),
    BigInt(signedLongSign),
    BigInt(radius), // Assuming radius should also be multiplied for consistency
  ];

  // Sign the data
  const signature = client.signFields(fieldsToSign, privateKey);

  console.log(signature, "Geofence Signature");

  return {
    data: {
      pubkey:publicKey,
      lat: latWhole , // Return lat and long as floating-point values
      signedLatSign:signedLatSign,
      long: longWhole ,
      signedLongSign:signedLongSign,
      radius:radius,
    },
    signature: signature,
  };
}


function canRsvp(publicKey: string, lat: number, long: number) {
  let privateKey =
    process.env.PRIVATE_KEY ??
    'EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53';





    const signature = client.signFields(
      [ BigInt(lat),BigInt(long)],
      privateKey
    );


  console.log(signature, "RSVP Signature");

  return {
    data: { publicKey, lat, long },
    signature: signature,
  };
}

export function GET(request: NextRequest) {
  const searchParams = new URLSearchParams(request.nextUrl.search);
  const action = searchParams.get('action') ?? '';
  const userId = +(searchParams.get('user') ?? 0);
  const publicKey = searchParams.get('publicKey') ?? '';
  const lat = +(searchParams.get('lat') ?? 0);
  const long = +(searchParams.get('long') ?? 0);
  const radius = +(searchParams.get('radius') ?? 0);

  let response;
console.log(searchParams)
  switch (action) {
    case 'credit':
      response = getSignedCreditScore(userId);
      break;
    case 'geofence':
      if (publicKey && lat && long && radius) {
        response = signedGeofence(publicKey, lat, long, radius);
      } else {
        return NextResponse.json(
          { error: 'Missing parameters for geofence action' },
          { status: 400 }
        );
      }
      break;
    case 'rsvp':
      if (publicKey && lat && long) {
        response = canRsvp(publicKey, lat, long);
      } else {
        return NextResponse.json(
          { error: 'Missing parameters for RSVP action' },
          { status: 400 }
        );
      }
      break;
    default:
      return NextResponse.json(
        { error: 'Invalid or missing action parameter' },
        { status: 400 }
      );
  }

  return NextResponse.json(response, { status: 200 });
}
