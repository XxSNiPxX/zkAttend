
import fs from 'fs';
import path from 'path';
import {addDataToFile,getDataFromFile,readDataFromFile} from './utils';
const { CircuitString,Signature,PublicKey,PrivateKey,Encoding,Poseidon,Field } = require("o1js");

export default function handler(req, res) {
  const { publicKey, lat, long,radius,events,description } = req.query;
  console.log(events,description)
  let privateKey =
  process.env.PRIVATE_KEY ??
  'EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53';

  try {

    const latWhole = Math.round(Math.abs(lat) * 10000);
    const longWhole = Math.round(Math.abs(long) * 10000);
    const _radius=Math.round(Math.abs(radius));
    // Determine the sign
    const signedLat = latWhole >= 0 ? latWhole : -latWhole;
    const signedLatSign = lat >= 0 ? 1 : 0;

    const signedLong = longWhole >= 0 ? longWhole : -longWhole;
    const signedLongSign = long >= 0 ? 1 : 0;

     const event_circuit =  CircuitString.fromString(events);
     const description_circuit =  CircuitString.fromString(description);

        const event_field= CircuitString.toFields(event_circuit)
        let description_field = CircuitString.toFields(description_circuit)

        const eventhash = Poseidon.hash(event_field);
        const descriptionhash = Poseidon.hash(description_field);


    const existingData = readDataFromFile(); // Assume this function reads and returns all data from your file as an array of objects

    let found = false;
    if(existingData.length!=0){

      for (const item of existingData) {
        console.log(item.pubkey,"DADAD")

        if (item.pubkey === publicKey) {
          console.log(item.pubkey)
          found = true;
          break; // Exit the loop once found
        }
      }

    }

    if (found==true) {
      return res.status(400).json({ status: "ERROR GEO FENCE FOR THIS PUBKEY ALREADY ADDED PRESENT" });

    }

    addDataToFile({

        pubkey:publicKey,
        lat: latWhole ,
        signedLatSign:signedLatSign,
        long: longWhole ,
        signedLongSign:signedLongSign,
        radius:_radius,
        event:events,
        description:description,

    });
    const fieldsToSign = [
          Field(latWhole),
          Field(signedLatSign),
          Field(longWhole),
          Field(signedLongSign),
          Field(_radius), // Assuming radius should also be multiplied for consistency
          eventhash,
          descriptionhash
  ];

  // Sign the data
  let oraclePrivateKey = PrivateKey.fromBase58(privateKey);

  const signature = Signature.create(oraclePrivateKey, fieldsToSign);

        // const signature = testnetSignatureClient.signFields(
        //     fieldsToSign,
        //     privateKey
        //   );
          console.log(signature, "Geofence Signature");


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
    JsonCompatibleSignature["lat"] = latWhole;
    JsonCompatibleSignature["signedLatSign"] = signedLatSign;
    JsonCompatibleSignature["long"] = longWhole;
    JsonCompatibleSignature["signedLongSign"] = signedLongSign;
    JsonCompatibleSignature["radius"] = _radius;

   return res.status(200).json( JsonCompatibleSignature );
  } catch (err) {
    console.log(err)
    return res.status(200).json({ status: 0 });
  }
}
