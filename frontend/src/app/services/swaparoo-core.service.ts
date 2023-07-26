import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {initalSwaparooCoreState, SwaparooCoreState} from '../models/SwaparooCoreState';
import {SwaparooCore} from 'src/contracts/web3-types';
import {Web3Service} from './web3.service';
import SwaparooCoreJson from '../../contracts/abi/SwaparooCore.json';
import {AbiItem} from 'web3-utils';
import {callContract} from './utils/utils';
import {Callback} from 'src/contracts/web3-types/types';
import {OwnerAdded, OwnerRemoved, PoolAdded} from 'src/contracts/web3-types/SwaparooCore';

const SwaparooCoreAbi = SwaparooCoreJson.abi as AbiItem[];

interface SwaparooCoreStorage {
  address: string
}


@Injectable({
  providedIn: 'root'
})
export class SwaparooCoreService {

  private swaparooCore?: SwaparooCore;
  private readonly swaparooCoreStateSubject: BehaviorSubject<SwaparooCoreState>;
  public readonly swaparooCoreState$: Observable<SwaparooCoreState>;

  constructor(private web3service: Web3Service) {
    this.swaparooCoreStateSubject = new BehaviorSubject<SwaparooCoreState>(initalSwaparooCoreState);
    this.swaparooCoreState$ = this.swaparooCoreStateSubject.asObservable();

    this.web3service.isConnected$.subscribe(isConnected => {
      if(isConnected) {
        this.loadFromLocalStorage();
      }
    });
  }

  public async setSwaparooCoreAddress(address: string) {
    if(!await this.isContractDeployed(address)) {
      return;
    }
    await this.updateSwaparooCore(address);
    this.saveToLocalStorage();
  }

  public clearSwaparooCoreAddress() {
    this.swaparooCoreStateSubject.next(initalSwaparooCoreState);
    this.swaparooCore = undefined;
    localStorage.removeItem("swaparoo-core-address");
  }
  
  private saveToLocalStorage() {
    const swaparooCoreStorage: SwaparooCoreStorage = {
      address: this.swaparooCoreStateSubject.value.address
    };
    localStorage.setItem("swaparoo-core-address", JSON.stringify(swaparooCoreStorage));
  }

  private async loadFromLocalStorage() {
    const swaparooCoreStorageString = localStorage.getItem("swaparoo-core-address");
    if(!swaparooCoreStorageString) {
      return;
    }
    const swaparooCoreStorage = JSON.parse(swaparooCoreStorageString) as SwaparooCoreStorage;
    await this.updateSwaparooCore(swaparooCoreStorage.address);
  }

  private async updateSwaparooCore(address: string) {
    this.swaparooCore = new this.web3service.web3.eth.Contract(SwaparooCoreAbi, address) as unknown as SwaparooCore;
    const ether = this.web3service.web3.utils.fromWei(await this.web3service.web3.eth.getBalance(address), "ether");
    const swaparooCoreState: SwaparooCoreState = { address, ether };
    this.swaparooCoreStateSubject.next(swaparooCoreState);
  }

  public async createPool(addressTokenA: string, addressTokenB: string, userAddress: string) {
    if(!this.swaparooCore) return;

    // NOTE: somehow simply calling this.swaparooCore.methods.createPool(addressTokenA, addressTokenB) does not work.
    const method = this.swaparooCore.methods.createPool(addressTokenA, addressTokenB);
    await callContract({from: userAddress, method});
  }

  public async getPools() : Promise<string[]> {
    if(!this.swaparooCore) return [];
    return await this.swaparooCore.methods.getPools().call();
  }

  public PoolAddedEvent(cb?: Callback<PoolAdded>) {
    this.swaparooCore?.events.PoolAdded(cb);
  }

  public async isOwner(address: string) : Promise<boolean> {
    if(!this.swaparooCore) return false;
    return this.swaparooCore?.methods.isOwner(address).call();
  }

  public async addOwner(newOwnerAddress: string, fromAddress: string) {
    if(!this.swaparooCore) return;
    await callContract({
      from: fromAddress,
      method: this.swaparooCore.methods.addOwner(newOwnerAddress)
    });
  }

  public async renounceOwner(fromAddress: string) {
    if(!this.swaparooCore) return;
    await callContract({
      from: fromAddress,
      method: this.swaparooCore.methods.renounceOwner()
    });
  }

  public OwnerAddedEvent(cb?: Callback<OwnerAdded>) {
    this.swaparooCore?.events.OwnerAdded(cb);
  }

  public OwnerRemovedEvent(cb?: Callback<OwnerRemoved>) {
    this.swaparooCore?.events.OwnerRemoved(cb);
  }

  /**
   * Checks if the contract is deployed, by checking whether there is code deployed on that address
   * @param address of the contract
   */
  private async isContractDeployed(address: string): Promise<boolean> {
    // Check whether bar contract is deployed by checking
    const data = await this.web3service.web3.eth.getCode(address);
    return data !== "0x";
  }
}
