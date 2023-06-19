export interface SwaparooPoolsState {
    pools: Pool[];
}

export interface Pool {
    address: string;
    tokenA: string;
    tokenB: string;
    reserveA: string;
    reserveB: string;
    ether: string;
}

export const initialSwaparooPoolsState: SwaparooPoolsState =  {
    pools: []
}
