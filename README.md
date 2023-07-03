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

The frontend should then be up and running at `localhost:4200`. It may take a few seconds for everything to start.

## Contracts

*SwaparooCore*:

- This contract is the heart of the project, and manages all the pools (SwaparooPools).
- Manage Roles:
  - the creator of this contract gets the role `OWNER`
  - `OWNER`s can give others the role `OWNER` or renounce their own role
  - There must always be at least 1 `OWNER`, to prevent lockout of the contract
- Create Pools:
  - `OWNER`s can create new pools by specifying a token pair (e.g. WETH & DAI)
  - a mapping (hashmap) is used to ensure that for a given token-pair only 1 pool can exist
- This contract uses an array & mapping to store the pools. (Mapping: for fast check of duplicates, Array: for efficently returning all pools)

*SwaparooPool*:

- This contract represents a LiquidityPool for a given token-pair
- A core idea of this contract is, that the product of the amount of tokens must always stay constant during trades:
  - `amountTokenA * amountTokenB = k`
  - this is called constant product market maker
  - the natur of this forumlar can emulate supply and demand quite well. The more token a user wants to buy, the more expensive the tokens get.
- Trade:
  - `Users` can swap one token for the other one (e.g. swap 2 WETH for 1000 DAI)
  - Swapping costs fees, which are distributed proportional to `Users` that provide liquidity 
- Provide Liquidity:
  - `Users` can provide tokens as liquidity to the contract
  - they get special "liqudidity tokens" back in return

*DualDividendToken*:
- is a ERC20 token that yields dividends in 2 assets
- SwaparooPool inherits this contract, and uses it for it's liquidity tokens 
- a core idea of this contract is, that the distribution of dividends is ammortized and not computed when profits are received, but rather when the users want to payout the dividends.

There are also some dummy contracts for easier development & testing in `contracts/dummy-contracts`

## Attribution

This project was orginally created as part of a lecture at the *Vienna University of Technology*.

This project uses some external resources and inspirations:

- [Theory of Constant Product Market Maker (Video)](https://www.youtube.com/watch?v=QNPyFs8Wybk)
- [Dividend yielding tokens (Article)](https://weka.medium.com/dividend-bearing-tokens-on-ethereum-42d01c710657)
