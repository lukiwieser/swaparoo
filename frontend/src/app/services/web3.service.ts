import { Injectable } from '@angular/core';
import Web3 from 'web3';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  private _web3!: Web3;
  private _isConnected = false;

  public get isConnected() : boolean {
    return this._isConnected;
  }

  public get web3() {
    return this._web3;
  }

  public async connect(host: string) : Promise<void> {
    try {
      const provider = new Web3.providers.WebsocketProvider(host);
      this._web3 = new Web3(provider);
      this._isConnected = await this.web3.eth.net.isListening();
      if(this._isConnected) {
        console.log("connected!");
      }
    } catch (e) {
      console.error("Connection failed with error: ", e)
      this._isConnected = false;
    }
  }
}
