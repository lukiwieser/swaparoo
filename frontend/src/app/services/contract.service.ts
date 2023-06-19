import { Injectable } from '@angular/core';
import Web3 from 'web3';
import SwaparooCore from '../../abi/SwaparooCore.json';
import SwaparooPool from '../../abi/SwaparooPool.json';
import Contract from 'web3-eth-contract';
import { SwaparooCoreState, initalSwaparooCoreState } from '../models/SwaparooCoreState';
import { BehaviorSubject } from 'rxjs';
import { SwaparooPoolsState, initialSwaparooPoolsState, Pool } from '../models/PoolsState';
import { User, UsersState, initialUsersState } from '../models/UserState';
import { CallOptions, callContract} from "./utils";


@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private web3!: Web3;

  public swaparooCore: Contract | undefined;
  
  public swaparooCoreState$ = new BehaviorSubject<SwaparooCoreState>(initalSwaparooCoreState);
  public swaparooPoolsState$ = new BehaviorSubject<SwaparooPoolsState>(initialSwaparooPoolsState);
  public usersState$ = new BehaviorSubject<UsersState>(initialUsersState);

  public async connectToClient(host: string): Promise<boolean> {
    try {
      const provider = new Web3.providers.WebsocketProvider(host);
      this.web3 = new Web3(provider);
      window.web3 = this.web3 = new Web3(provider);
      return await this.web3.eth.net.isListening();
    } catch (e) {
      console.error("Connection failed with error: ", e)
      return false;
    }
  }

  public async loadSwaparooCore(address: string) {
    const isValid = await this.isContractDeployed(address);
    if (isValid) {
      this.initSwaparooCoreContract(address);
      this.loadSwaparooCoreContract();
      this.loadPools();
      this.listenToContractEvents();
    } 
    return isValid;
  }

  private async isContractDeployed(address: string): Promise<boolean> {
    // Check whether bar contract is deployed by checking whether there is code deployed on that address
    const data = await this.web3.eth.getCode(address);
    if (data === "0x") {
      window.alert("No contract deployed on that address!");
      return false;
    }
    return true;
  }

  private async initSwaparooCoreContract(address: string) {
    // @ts-ignore
    this.swaparooCore = new this.web3.eth.Contract(SwaparooCore.abi, address);
  }

  private async loadSwaparooCoreContract() {
    if(!this.swaparooCore) return;

    const address = this.swaparooCore.options.address;
    const ether = this.web3.utils.fromWei(await this.web3.eth.getBalance(address), "ether");
    const state : SwaparooCoreState = { address, ether };
    this.swaparooCoreState$.next(state);
  }

  private async loadPools() {
    const addresses : string[] = await this.swaparooCore?.methods.getPools().call();
    const pools : Pool[] = [];

    // TODO: parallize
    for(let address of addresses) {
      pools.push(await this.getPoolFromAddress(address));
    }

    this.swaparooPoolsState$.next({pools});
  }

  public async addUser(address: string) {
    const userAddresses = this.usersState$.value.users.map(user => user.address);
    if (userAddresses.includes(address)) {
      console.warn("Address already invited.")
      return;
    }

    const ether = this.web3.utils.fromWei(await this.web3.eth.getBalance(address), "ether");
    const isOwner = await this.swaparooCore?.methods.isOwner(address).call();
    const newUser : User = {
      address,
      isOwner,
      ether
    }

    const newState = this.usersState$.value;
    newState.users.push(newUser);
    this.usersState$.next(newState);
  }

  public async createPool(addressTokenA: string, addressTokenB: string, userAddress: string) {
    if(!this.swaparooCore) return;

    // NOTE: somehow simply calling this.swaparooCore.methods.createPool(addressTokenA, addressTokenB) does not work.
    const method = this.swaparooCore.methods.createPool(addressTokenA, addressTokenB);
    await callContract({from: userAddress, method});
  }

  private listenToContractEvents() {
    this.swaparooCore?.events.PoolAdded(async (error: any, result: any) => {
      console.info('got Event: PoolAdded', result);
      if (!error) {
        console.log(result);
        const poolAddress = result.returnValues[0];
        const pool = await this.getPoolFromAddress(poolAddress);
        const newState = this.swaparooPoolsState$.value;
        newState.pools.push(pool);
        this.swaparooPoolsState$.next(newState);
      } else {
        console.log(error);
      }
    });
  }

  private async getPoolFromAddress(address: string) : Promise<Pool> {
      // @ts-ignore
      const swaparooPool =  new this.web3.eth.Contract(SwaparooPool.abi, address);
      const {'0': reserveA, '1': reserveB} = await swaparooPool?.methods.getReserves().call();
      const {'0': tokenA, '1': tokenB} = await swaparooPool?.methods.getTokenAddresses().call();
      const pool : Pool = {
        address: address,
        tokenA: tokenA,
        tokenB: tokenB,
        reserveA: reserveA,
        reserveB: reserveB,
        ether: "0",
      }
      return pool;
  }
}

