import { TokenBalance } from "./TokenBalance";

export interface User {
    address: string;
    ether: string;
    isOwner: boolean;
    tokenBalances: TokenBalance[]
}