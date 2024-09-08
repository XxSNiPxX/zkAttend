import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // for generating unique file names

// Define the path to the JSON file

const dataFilePath = path.join(process.cwd(), `data/${uuidv4()}.json`);

// Utility function to read JSON data from the file
function readDataFromFile() {
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  const jsonData = fs.readFileSync(dataFilePath, 'utf8');
  if (!jsonData) {
    return [];
  }
  return JSON.parse(jsonData);
}

// Utility function to write JSON data to the file
function writeDataToFile(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Function to add data to the JSON file
function addDataToFile(newData) {
  const data = readDataFromFile();
  data.push(newData);
  writeDataToFile(data);
}

// Function to get data from the JSON file by a specific key and value
function getDataFromFile(key, value) {
  const data = readDataFromFile();
  return data.filter((item) => item[key] === value);
}

export { addDataToFile, getDataFromFile, readDataFromFile };
