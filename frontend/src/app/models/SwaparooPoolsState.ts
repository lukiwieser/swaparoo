import { Pool } from "./Pool";

export interface SwaparooPoolsState {
    pools: Pool[];
    tokens: Set<string>; // addresses of all tokens that the pools use/provide
}

export const initialSwaparooPoolsState: SwaparooPoolsState =  {
    pools: [],
    tokens: new Set()
};
