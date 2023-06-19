
export interface TokensState {
    addresses: Set<string>;
}

export const initialTokensState: TokensState = {
    addresses: new Set<string>()
};
