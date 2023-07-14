import { ERC20Instance, SwaparooPoolInstance } from "../../build/contracts/truffle-types";

export async function _swap(
    amountTokenIn: BN, 
    contractTokenIn: ERC20Instance,
    pool: SwaparooPoolInstance, 
    account: string
) {
    await contractTokenIn.approve(pool.address, amountTokenIn, {from: account});
    await pool.swap(amountTokenIn, contractTokenIn.address, {from: account})
}

export async function _provideLiquidity(
    amountTokenA: BN, 
    contractTokenA: ERC20Instance, 
    amountTokenB: BN, 
    contractTokenB: ERC20Instance, 
    pool: SwaparooPoolInstance, 
    account: string
) {
    await contractTokenA.approve(pool.address, amountTokenA, {from: account});
    await contractTokenB.approve(pool.address, amountTokenB, {from: account});
    await pool.provideLiquidity(amountTokenA, amountTokenB, {from: account});
}