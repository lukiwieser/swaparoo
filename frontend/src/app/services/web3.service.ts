import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Web3 from 'web3';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  private _web3!: Web3;

  private readonly _isConnected$ = new BehaviorSubject<boolean>(false);
  public readonly isConnected$ = this._isConnected$.asObservable();

  public get isConnected() : boolean {
    return this._isConnected$.value;
  }

  public get web3() {
    return this._web3;
  }

  public async connect(host: string) : Promise<void> {
    try {
      const provider = new Web3.providers.WebsocketProvider(host);
      this._web3 = new Web3(provider);

      const result = await this.web3.eth.net.isListening();
      this._isConnected$.next(result);
      
      if(result) {
        console.log("connected!");
      } else {
        console.log("not connected!");
      }
    } catch (e) {
      console.error("Connection failed with error: ", e);
      this._isConnected$.next(false);
    }
  }
}
