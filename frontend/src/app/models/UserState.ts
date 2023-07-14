import { User } from "./User";

export interface UsersState {
    users: User[];
    selectedUserAddress: string | undefined;
}

export const initialUsersState: UsersState = {
    users: [],
    selectedUserAddress: undefined
};
