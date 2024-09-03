
const geolib = require('geolib');
const { CircuitString,Signature,PublicKey,PrivateKey,Encoding,Poseidon } = require("o1js");
import {addDataToFile,getDataFromFile,readDataFromFile} from './utils';

export default function handler(req, res) {
 const { publicKey, publicKeyGeofence, lat, long } = req.query;
 let privateKey =
 process.env.PRIVATE_KEY ??
 'EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53';

console.log(lat,long)



 try {

   const existingData = readDataFromFile(); // Assume this function reads and returns all data from your file as an array of objects
   let tmpData;
   let found = false;
   if(existingData.length!=0){

     for (const item of existingData) {

       if (item.pubkey === publicKeyGeofence) {
         console.log(item)
         found = true;
         tmpData=item
       }
     }

   }

   if (found==false) {
     return res.status(400).json({ status: "ERROR GEO FENCE NOT FOUND KEY ALREADY ADDED PRESENT" });
   }
   console.log(tmpData,"TMP DATA")
   let reconstructedLat = tmpData.lat / 10000;
   let reconstructedLong = tmpData.long / 10000;

   // Apply the sign based on signedLatSign and signedLongSign
   const originalLat = tmpData.signedLatSign === 1 ? reconstructedLat : -reconstructedLat;
   const originalLong = tmpData.signedLongSign === 1 ? reconstructedLong : -reconstructedLong;

   // If needed, handle radius similarly
   const originalRadius = tmpData.radius;
   console.log(reconstructedLat,reconstructedLong,originalLat,originalLong)


   const point = { latitude: lat, longitude: long };
   const circle = {
       latitude: originalLat,
       longitude: originalLong,
       radius: originalRadius // meters
   };

   const isInside = geolib.isPointWithinRadius(point, circle, circle.radius);

   console.log(isInside,point)
   if(!isInside){
     return res.status(400).json({ status: "NOT WITHIN LOCATION" });
   }

   let nullfierPub=PublicKey.fromBase58(publicKey)
   let geofencePub=PublicKey.fromBase58(publicKeyGeofence)
   console.log(nullfierPub,geofencePub,"pubs")
   let nullField=nullfierPub.toFields();
   let geoField=geofencePub.toFields();
   const nullhash = Poseidon.hash(nullField);
   const geohash = Poseidon.hash(geoField);
   const fieldURL=[nullhash,geohash];

   let oraclePrivateKey = PrivateKey.fromBase58(privateKey);

   const signature = Signature.create(oraclePrivateKey, fieldURL);
   console.log(signature.toBase58())



   // const string1 =  CircuitString.fromString(publicKey);
   //     const string2 =  CircuitString.fromString('B62qkWtT8KfRvHdpA6YTjKdoH44Z7ey7KVWeMCgEEG6q4vpGZvCusTE');
   //     let aa2= CircuitString.toFields(string1)
   //     let aa3 = CircuitString.toFields(string2)
   //     const combinedFields = aa2.concat(aa3);
   // console.log(Encoding.stringToFields(news))
   // const fieldURL = BigInt(CircuitString.fromString(news).hash());
       //
       // const signature = testnetSignatureClient.signFields(
       //     fieldURL,
       //     privateKey
       //   );

         // const signature = testnetSignatureClient.signFields(
         //     Encoding.stringToFields(news),
         //     privateKey
         //   );
   // const verifyBody = {
   //   signature: signature,
   //   data: [news],
   // };

   console.log(signature,"lollll bro");
   var JsonCompatibleSignature = {};
   JsonCompatibleSignature["signature"] = signature.toBase58();
   JsonCompatibleSignature["publicKey"] = signature.publicKey;
  return res.status(200).json( JsonCompatibleSignature );
 } catch (err) {
   console.log(err)
   return res.status(400).json({ status: 0 });
 }
}
