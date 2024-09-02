import fs from 'fs';
import path from 'path';

// Define the path to the JSON file
const dataFilePath = path.join(process.cwd(), 'data.json');

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
function writeDataToFile(data: any) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Function to add data to the JSON file
function addDataToFile(newData: any) {
  const data = readDataFromFile();
  data.push(newData);
  writeDataToFile(data);
}

// Function to get data from the JSON file by a specific key and value
function getDataFromFile(key: string, value: any) {
  const data = readDataFromFile();
  return data.filter((item: any) => item[key] === value);
}

export { addDataToFile, getDataFromFile, readDataFromFile };
