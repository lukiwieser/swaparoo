import Web3 from "web3";

declare global {
    interface Window {
        web3: Web3;
    }
}
window.web3 = window.web3 || {};
  
  
export interface CallOptions {
    from: string,
    method: any,
    value?: any,
}

export function callContract({from, method, value = 0}: CallOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        method.estimateGas({from: from, value: value}, (error: any, result: any) => {
            if (error) {
                console.log(errorMessage(error));
                reject(error);
            } else {
                method.send({from: from, value: value, gas: result}).then((result: any) => {
                        console.log(transactionSuccess(result));
                        resolve(result);
                    }
                );
            }
        }).catch((e: any) => {
            console.log(errorMessage(e));
            reject(e);
        });
      } catch (e: any) {
            console.log(errorMessage(e));
            reject(e);
      }
    });
}

export function errorMessage(message: string) {
    return {severity: 'error', summary: 'Error', detail: message};
}

export function transactionSuccess(receipt: any) {
    return {severity: 'success', summary: 'Transaction sent', detail: receipt.transactionHash};
}