# Swaparoo

A dencentralized ERC20 Token Exchange, using a Constant Product Market Maker.

## Getting started

This project requires [Node](https://nodejs.org/en) to be installed on your machine.

### Install Dependecies

The dependencies can be installed by executing the following command in the folders `frontend` & `smart-contracts`:

```bash
npm install
```

### Start Local Blockchain

Start the local blockchain by executing in the folder `smart-contracts`:

```bash
npm run dev
```

This starts the truffle developer console.

Now simply type `migrate`, to deploy the contracts to the local blockchain.
This will also list the addresses of the smart-contracts, and the user accounts.

### Start Frontend

Open a new console window, and start the frontend by executing in the folder `frontend`:

```bash
npm run start
```
