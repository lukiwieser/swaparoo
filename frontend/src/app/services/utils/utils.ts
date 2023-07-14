import { NonPayableTransactionObject, NonPayableTx } from "src/contracts/web3-types/types";
import type BN from "bn.js";
import type { TransactionReceipt } from "web3-core/types";
  
export interface CallOptions<T> {
    from: string,
    method: NonPayableTransactionObject<T>,
    value?: string | number | BN,
}

export function callContract<T>({from, method, value = 0}: CallOptions<T>): Promise<TransactionReceipt> {
    return new Promise((resolve, reject) => {        
        method.estimateGas({from: from, value: value} as NonPayableTx)
            .then(result => {
                method.send({from: from, value: value, gas: result} as NonPayableTx)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(error => {
                        reject(error);
                    });
            })
            .catch(error => {
                reject(error);
            });
    });
}
