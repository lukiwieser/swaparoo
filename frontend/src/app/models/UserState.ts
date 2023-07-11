import { User } from "./User";

export interface UsersState {
    users: User[];
}

export const initialUsersState: UsersState = {
    users: []
};
