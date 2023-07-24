# Swaparoo

A decentralized ERC20 Token Exchange, using the concept of a Constant Product Market Maker.

*How it works:*
- Swaparoo has "Pools" for different ERC20 token pairs (e.g. WETH-DAI):
- Users can *provide tokens* to a pool, earning dividends as reward 
- Users can *trade* one token for another on a pool (e.g. WETH for DAI, or vice versa).
- Trading costs a small fee, which funds the dividends
- Owners of Swaparoo can create new pools

The cool thing is, that these pools are based on quite simple math formulas, and no complex logic is needed like pricing oracles.
The exact type of math used as basis is a special form of a [Constant Function Market Maker](https://en.wikipedia.org/wiki/Constant_function_market_maker) called *Constant Product Market Maker*.

*Technical Details:*

The smart contracts are written in Solidity for the Ethereum blockchain, using Truffle as a framework for developing & testing the contracts.
The frontend uses Angular & Web3.js. 
Typechain is used to generate typescript types for the truffle testcases and frontend.

## Getting started

This project requires [Node](https://nodejs.org/en) to be installed on your machine.

### Install Dependencies

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
  - the nature of this format can emulate supply and demand quite well. The more token a user wants to buy, the more expensive the tokens get.
- Trade:
  - `Users` can swap one token for the other one (e.g. swap 2 WETH for 1000 DAI)
  - Swapping costs fees, which are distributed proportional to `Users` that provide liquidity 
- Provide Liquidity:
  - `Users` can provide tokens as liquidity to the contract
  - they get special "liquidity tokens" back in return
  - the ratio of the amount of tokens provided must equal of the ratio of the tokens already in the pool 

*DualDividendToken*:
- is a ERC20 token that yields dividends in 2 assets
- SwaparooPool inherits this contract, and uses it for its liquidity tokens 
- a core idea of this contract is, that the distribution of dividends is amortized and not computed when profits are received, but rather when the users want to payout the dividends.

There are also some dummy contracts for easier development & testing in `contracts/dummy-contracts`

## Testcases

We use truffle for the unit tests for the smart contracts. The tests are defined in the folder `smart-contracts/test`.

You can run all testcases with `npm run test`, or by specifying a file e.g. `npm run test test/SwaparooCore.js`.

## Frontend

This project provides a simple frontend to interact with the contracts.

1. Connect to a SwaparooCore contract
2. Add users, by specifying their addresses
    - there is always one user "selected" and all information/actions on the frontend are done by this user
    - similar if you login to e.g. google, there you can switch between your accounts, but at one time there is only one account active
    - some users are owners, thus more options are displayed for them
3. Interact with the contracts e.g.:
    - deploy a new pool
    - provide liquidity to an existing pool
    - swap tokens on an existing pool
    - remove liquidity from a pool
    - grant others the role of owner

In the section "User Balance" the ether and amounts of the ERC20 tokens of the user is displayed.

## Good to know

After changing a smart contract, you can simply execute `npm run postinstall` in `smart-contracts` directory, to compile the contracts, and copy the generated abi files & type declarations into frontend folder

The exact version of Node used for the project was v18.16.0.

## Attribution

This project was originally created as part of a lecture at the *Vienna University of Technology*.

It uses the following sources as main inspirations:

- [Theory of Constant Product Market Maker (Video)](https://www.youtube.com/watch?v=QNPyFs8Wybk)
- [Dividend yielding tokens (Article)](https://weka.medium.com/dividend-bearing-tokens-on-ethereum-42d01c710657)

Other interesting and helpful resources:

- [Uniswap V2 Contracts](https://github.com/Uniswap/v2-core/tree/master/contracts)
- [AAVE V2 Contracts](https://github.com/aave/protocol-v2/blob/master/contracts/protocol/lendingpool/LendingPool.sol)
- [Typescript with Truffle & React](https://github.com/mseemann/truffle-react-typescript)