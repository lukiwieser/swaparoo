# Project details

## Title

Swaparoo

## Addresses

Main Contract:

- SwaparooCore: 0xb55eEdE69558a3Bc9E0CE76Ef2c974FF8e93140c

Dummy Contracts:

- GLDToken: 0x11A199675bc4A7244571E78FaCB4901522B3C740
- SILToken: 0xdEe5e093632791E62C7d1aaf093e53cbab5b6eEE
- BRZToken: 0x2166eF560bD534ceffAD24DD70029505D5a60256

## Description

Swaparoo is a dencentralized ERC20 Token Exchange.

A core concept is the Liquidity Pool:
- A liquidity pool exists between two tokens (e.g. WETH-DAI).
- Anybody can provide tokens to this pool, we call such actors "Liquidity Providers".
- Buyers and Sellers trade directly with this pool, instead of with each other.
- This leads to cheaper and more efficient trading!
- "Liquidity Providers" earn a small fee that the Sellers/Buyers have to pay.

The cool thing is, that Liquidity Pools are based on quite simple math formulars, and no complex logic is needed like pricing oracles. The exact term for the type of liquidity pool used is "Constant Product Market Maker".

The owners of "Swaparoo" can add new pools & manage roles.

In short, its basically a *very* simple version of Uniswap.

## Usage

1. Enter the SwaparooCore Address
2. Add users, by specifying their addresses
    - there is always one user "selected" and all information/actions on the frontend are done by this user
        - similar if you login to e.g. google, there you can switch between your accounts, but at one time there is only one account active
    - some users are owners, thus more options are displayed for them
3. Select a user
    - the selected user is indicated by a checkmark.
4. Look at the users balance
    - in the section "User Balance" the ether and amounts of the ERC20 tokens of the user is displayed
5. Add pool
    - Add a pool by specifying the addresses of the 2 tokens
        - e.g. the addresses of the dummy-contracts (GLD-SIL)
6. Provide Liqudity
    - Provide Liqudity to a pool by using the "Provide Liqudity" fieldset
    - be aware that the ratio of provided tokens must be the same as the tokens in the pool
7. Switch to another user & swap tokens
    - switch to another user (or if lazy stay with the same user)
    - since the pools now have tokens you can swap tokens
8. Collect Dividends
    - switch back to the user that provided liqudity
    - after swapping with the other user, we should have collected some dividends, which we can payout with "payout dividens"
9. Remove Liqudity
    - we can specify how many LiqudityTokens we want to remove, and will get some parts of our original tokens back
10. Manage Owners
    - if we are owner, we can grant others the role of owner
    - we can also renounce or own role, but only if there are more than 1 owners exisiting.

## Implementation

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

Main sources of Inspiration:

- [Video on theory of Constant Product Market Maker](https://www.youtube.com/watch?v=QNPyFs8Wybk)
- [Article on dividend yielding tokens](https://weka.medium.com/dividend-bearing-tokens-on-ethereum-42d01c710657)

Other sources:

- [Uniswap V2 Contracts](https://github.com/Uniswap/v2-core/tree/master/contracts)
. [AAVE V2 Contracts](https://github.com/aave/protocol-v2/blob/master/contracts/protocol/lendingpool/LendingPool.sol)

## Effort breakdown

- 2h Project Setup (Gitlab, IDE, solhint, dependecies)
- 15h Theory ()
- 20h Contract Development & Testcases
- 10h Frontend Dvelopment
- 2h Deployment

=> ~49h total

## Difficulties

- *Lots of Theory*: getting into the theory of how exatly Constant Product Market Makers work, how the formulars are derived, how to best distribute dividends, etc. was quite some work.
- *Arithmetics*: working only with uint can be tricky, there is potential for rounding errors and other effects that must be accounted for
- *Naming variables*
- *Contract Site*: I has struggles with to large contract sizes, fortunatly i could resolve them by using the optimizer.

## Feedback for future changes

- *Effort Breakdown*: Maybe mention the effort breakdown earlier, i completly overlooked it, since i only looked at the Notes.md when i was finished with the project.
