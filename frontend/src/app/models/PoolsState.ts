export interface SwaparooPoolsState {
    pools: Pool[];
    tokens: Set<string>; // addresses of all tokens that the pools use/provide
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
    pools: [],
    tokens: new Set()
}
