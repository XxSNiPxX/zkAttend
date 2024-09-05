# zkAttend: Decentralized Proof-of-Location System

zkAttend is a decentralized Proof-of-Location system built on Mina Protocol's Protokit. It leverages zero-knowledge proofs (zk-SNARKs) to privately verify a user's location without revealing sensitive data. This system is suitable for event attendance, location-based rewards, and logistics verification.

## **DISCLAIMER:**

1. zkAttend does not prevent location spoofing and is dependent on browser geolocation to get the user's location. Android and iOS can detect and prevent spoofing more effectively and can be leveraged in future iterations for more reliable data.
2. The Haversine formula used to determine whether a user is within a specific location is calculated by the oracle. This can later be done with `o1js`, but it is complex and not currently implemented.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Running zkAttend](#running-zkattend)
   - [Run in Development Mode](#run-in-development-mode)
   - [Run with Persistence](#run-with-persistence)
   - [Deploying to a Server](#deploying-to-a-server)
5. [CLI Options](#cli-options)

---

## Tech Stack

- **Mina Protocol's Protokit**
- **Zero-knowledge proofs (zk-SNARKs)**
- **Geofence Oracle for location validation**
- **Docker** for containerization

---

## Architecture

- **Geofence Creation**: Users define a geofence by providing latitude, longitude, radius, and event details. Latitude and longitude are converted to whole numbers (multiplied by 10^4) with sign encoding for positive/negative.
- **Oracle**: The oracle calculates the distance using the Haversine formula and signs an attendance proof.
- **RSVP**: Generates unique signatures to prevent duplicate RSVPs for the same event using user and event creator public keys.

---

## Prerequisites

Make sure you have the following installed:
- **Node.js** `v18` (recommended: use NVM)
- **pnpm** `v9.8`
- **nvm** for Node version management
- **Docker** `>= 24.0`
- **Docker-compose** `>= 2.22.0`

---

## Running zkAttend

### 1. Clone the Repository

Start by cloning the repository and navigating into the project folder:

```zsh
git clone https://github.com/XxSNiPxX/zkAttend.git
cd zkAttend
```

### 2. Start the Oracle

Its important to start the oracle first:

```zsh
cd geofence_oracle
npm install
npm run dev
```
### 3. Start the Chain

Open another tab, navigate to the zkAttend directory, and run the chain:

```zsh
nvm use
pnpm install
pnpm env:inmemory dev
```


## Testing zkAttend

### 1. Clone the Repository

Start by cloning the repository and navigating into the project folder:

```zsh
git clone https://github.com/XxSNiPxX/zkAttend.git
cd zkAttend
```
### 2. Start the Oracle

Its important to start the oracle first:

```zsh
nvm use
pnpm install
pnpm run test --filter=chain -- --watchAll
```
