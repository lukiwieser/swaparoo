
export interface UsersState {
    users: User[];
}

export interface User {
    address: string;
    // balances?
    ether: string;
    isOwner: boolean;
}

export const initialUsersState: UsersState = {
    users: []
};
