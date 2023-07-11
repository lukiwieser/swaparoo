import { User } from "./User";

export interface UsersState {
    users: User[];
    selectedUser: User | undefined;
}

export const initialUsersState: UsersState = {
    users: [],
    selectedUser: undefined
};
