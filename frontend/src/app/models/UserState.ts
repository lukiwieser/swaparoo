
export interface UsersState {
    users: User[];
}

export interface User {
    address: string;
    // balances?
    ether: string;
    isOwner: boolean;
    tokenBalances: TokenBalance[]
}

export interface TokenBalance {
    address: string;
    amount: string;
}

export const initialUsersState: UsersState = {
    users: []
};
