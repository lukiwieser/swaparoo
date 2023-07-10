import { Injectable } from '@angular/core';
import Web3 from 'web3';
import SwaparooCore from '../../contracts/abi/SwaparooCore.json';
import SwaparooPool from '../../contracts/abi/SwaparooPool.json';
import Contract from 'web3-eth-contract';
import { SwaparooCoreState, initalSwaparooCoreState } from '../models/SwaparooCoreState';
import { BehaviorSubject } from 'rxjs';
import { SwaparooPoolsState, initialSwaparooPoolsState, Pool } from '../models/PoolsState';
import { TokenBalance, User, UsersState, initialUsersState } from '../models/UserState';
import { callContract} from "./utils";
import ERC20 from '../../contracts/abi/ERC20.json';
import { TokensState, initialTokensState } from '../models/TokensState';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private web3!: Web3;

  public swaparooCore: Contract | undefined;
  
  public swaparooCoreState$ = new BehaviorSubject<SwaparooCoreState>(initalSwaparooCoreState);
  public swaparooPoolsState$ = new BehaviorSubject<SwaparooPoolsState>(initialSwaparooPoolsState);
  public usersState$ = new BehaviorSubject<UsersState>(initialUsersState);
  public tokensState$ = new BehaviorSubject<TokensState>(initialTokensState);

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
      await this.initSwaparooCoreContract(address);
      await this.loadSwaparooCoreContract();
      await this.loadPools();
      this.listenToBlockUpdates();
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

    // TODO: parallize
    const pools : Pool[] = [];
    for(let address of addresses) {
      pools.push(await this.getPoolFromAddress(address));
    }
    this.swaparooPoolsState$.next({pools});

    const tokenAddresses = new Set<string>();
    for(let pool of pools) {
      tokenAddresses.add(pool.address);
      tokenAddresses.add(pool.tokenA);
      tokenAddresses.add(pool.tokenB);
    }
    this.tokensState$.next({addresses: tokenAddresses});
  }

  public async addUser(address: string) {
    const userAddresses = this.usersState$.value.users.map(user => user.address);
    if (userAddresses.includes(address)) {
      console.warn("Address already invited.")
      return;
    }

    const ether = this.web3.utils.fromWei(await this.web3.eth.getBalance(address), "ether");
    const isOwner = await this.swaparooCore?.methods.isOwner(address).call();
    const tokenBalances = await this.getTokenBalancesOfUser(address);
    const newUser : User = {
      address,
      isOwner,
      ether,
      tokenBalances
    }

    const newState = this.usersState$.value;
    newState.users.push(newUser);
    this.usersState$.next(newState);
  }

  private async updateTokenAddressesFromPool(pool: Pool) {
    const tokenAddresses = this.tokensState$.value.addresses;
    tokenAddresses.add(pool.address);
    tokenAddresses.add(pool.tokenA);
    tokenAddresses.add(pool.tokenB);
    this.tokensState$.next({addresses: tokenAddresses});
  }

  private async getTokenBalancesOfUser(userAddress: string) : Promise<TokenBalance[]> {
    const tokenAddresses = this.tokensState$.value.addresses;
    const balances : TokenBalance[] = [];
    for (const tokenAddress of tokenAddresses) {
      // @ts-ignore
      const token = new this.web3.eth.Contract(ERC20.abi, tokenAddress);
      const amount = await token.methods.balanceOf(userAddress).call();
      const balance : TokenBalance = {address: tokenAddress, amount};
      balances.push(balance);
    }
    return balances;
  }

  public async createPool(addressTokenA: string, addressTokenB: string, userAddress: string) {
    if(!this.swaparooCore) return;

    // NOTE: somehow simply calling this.swaparooCore.methods.createPool(addressTokenA, addressTokenB) does not work.
    const method = this.swaparooCore.methods.createPool(addressTokenA, addressTokenB);
    await callContract({from: userAddress, method});
  }

  public async addOwner(newOwnerAddress: string, userAddress: string) {
    if(!this.swaparooCore) return;
    await callContract({
      from: userAddress,
      method: this.swaparooCore.methods.addOwner(newOwnerAddress)
    });
  }

  public async renounceOwner(userAddress: string) {
    if(!this.swaparooCore) return;
    await callContract({
      from: userAddress,
      method: this.swaparooCore.methods.renounceOwner()
    });
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
        this.updateTokenAddressesFromPool(pool);
        this.updateUserState();
      } else {
        console.log(error);
      }
    });
  }

  private listenToBlockUpdates() {
    this.web3.eth.subscribe('newBlockHeaders', async (error: any, result: any) => {
      console.log("New block mined: ", result);

      if (error) {
        console.log(error);
        return;
      }
      
      this.updateUserState();
      this.updatePoolsState();
    });
  }

  private async updateUserState() {
      const usersState = this.usersState$.value;
      for(const user of usersState.users) {
        const ether = this.web3.utils.fromWei(await this.web3.eth.getBalance(user.address), "ether");
        const tokenBalances = await this.getTokenBalancesOfUser(user.address);
        const isOwner = await this.swaparooCore?.methods.isOwner(user.address).call();
        const updatedUser : User = {
          address: user.address,
          ether,
          isOwner,
          tokenBalances
        }

        const index = usersState.users.findIndex(u => u.address === user.address);
        usersState.users[index] = updatedUser;
      }
      console.log(usersState);
      this.usersState$.next(usersState);
  }

  private async updatePoolsState() {
    const poolsState = this.swaparooPoolsState$.value;
    for(const pool of poolsState.pools) {
      const updatedPool = await this.getPoolFromAddress(pool.address);
      const index = poolsState.pools.findIndex(p => p.address === pool.address);
      poolsState.pools[index] = updatedPool;
    }
    this.swaparooPoolsState$.next(poolsState);
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

  public async provideLiquidity(amountA: string, amountB: string, addressPool: string, addressTokenA: string, addressTokenB: string, userAddress: string) {
    // approve
    // @ts-ignore
    const tokenA = new this.web3.eth.Contract(ERC20.abi, addressTokenA);
    await callContract({
      from: userAddress, 
      method: tokenA?.methods.approve(addressPool, amountA)
    });

    // @ts-ignore
    const tokenB = new this.web3.eth.Contract(ERC20.abi, addressTokenB);
    await callContract({
      from: userAddress, 
      method: tokenB?.methods.approve(addressPool, amountB)
    });

    // @ts-ignore
    const swaparooPool = new this.web3.eth.Contract(SwaparooPool.abi, addressPool);
    await callContract({
      from: userAddress, 
      method: swaparooPool?.methods.provideLiquidity(amountA, amountB)
    });
  }

  
  public async removeLiquidity(sharesToRemove: string, addressPool: string, userAddress: string) {
    // @ts-ignore
    const swaparooPool = new this.web3.eth.Contract(SwaparooPool.abi, addressPool);
    await callContract({
      from: userAddress, 
      method: swaparooPool?.methods.removeLiquidity(sharesToRemove)
    });
  }

  public async swap(amountIn: string, addressTokenIn: string, addressPool: string, userAddress: string) {
    // approve
    // @ts-ignore
    const tokenIn = new this.web3.eth.Contract(ERC20.abi, addressTokenIn);
    await callContract({
      from: userAddress, 
      method: tokenIn?.methods.approve(addressPool, amountIn)
    });

    // @ts-ignore
    const swaparooPool = new this.web3.eth.Contract(SwaparooPool.abi, addressPool);
    await callContract({
      from: userAddress, 
      method: swaparooPool?.methods.swap(amountIn, addressTokenIn)
    });
  }

  public async payoutDividends(poolAddress: string, userAddress: string) {
    // @ts-ignore
    const swaparooPool = new this.web3.eth.Contract(SwaparooPool.abi, poolAddress);
    await callContract({
      from: userAddress, 
      method: swaparooPool?.methods.payoutDividends()
    });
  }
}

