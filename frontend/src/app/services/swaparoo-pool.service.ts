import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {initialSwaparooPoolsState, SwaparooPoolsState} from '../models/SwaparooPoolsState';
import {SwaparooCoreService} from './swaparoo-core.service';
import {Web3Service} from './web3.service';
import {ERC20, SwaparooPool} from 'src/contracts/web3-types';
import SwaparooPoolJson from '../../contracts/abi/SwaparooPool.json';
import {AbiItem} from 'web3-utils';
import {callContract} from './utils/utils';
import ERC20Json from '../../contracts/abi/ERC20.json';
import { Pool } from '../models/Pool';

const SwaparooPoolAbi = SwaparooPoolJson.abi as AbiItem[];
const ERC20Abi = ERC20Json.abi as AbiItem[];

@Injectable({
  providedIn: 'root'
})
export class SwaparooPoolService {

  private readonly swaparooPoolStateSubject;
  public readonly swaparooPoolState$;

  constructor(
    private web3Service: Web3Service,
    private swaparooCoreService: SwaparooCoreService
  ) {
    this.swaparooPoolStateSubject = new BehaviorSubject<SwaparooPoolsState>(initialSwaparooPoolsState);
    this.swaparooPoolState$ = this.swaparooPoolStateSubject.asObservable();

    swaparooCoreService.swaparooCoreState$.subscribe(async (state) => {
      if(state.address) {
        await this.init();
      }
    });
  }

  get swaparooPoolState(): SwaparooPoolsState {
    return this.swaparooPoolStateSubject.value;
  }

  private async init() {
    await this.loadPools();
    this.listenToBlockUpdates();
    this.listenToContractEvents();
  }

  private async loadPools() {
    const addresses : string[] = await this.swaparooCoreService.getPools();

    const poolPromises = addresses.map(address => this.getPoolFromAddress(address));
    const pools = await Promise.all(poolPromises);

    const tokenAddresses = new Set<string>();
    for(const pool of pools) {
      tokenAddresses.add(pool.address);
      tokenAddresses.add(pool.tokenA);
      tokenAddresses.add(pool.tokenB);
    }

    const poolState: SwaparooPoolsState = { pools, tokens: tokenAddresses }
    this.swaparooPoolStateSubject.next(poolState);
  }

  private async updatePoolsState() {
    // TODO: check for new pools
    const poolsState = this.swaparooPoolStateSubject.value;
    for(const pool of poolsState.pools) {
      const updatedPool = await this.getPoolFromAddress(pool.address);
      const index = poolsState.pools.findIndex(p => p.address === pool.address);
      poolsState.pools[index] = updatedPool;
    }
    this.swaparooPoolStateSubject.next(poolsState);
  }

  private async getPoolFromAddress(address: string) : Promise<Pool> {
    const swaparooPool = new this.web3Service.web3.eth.Contract(SwaparooPoolAbi, address) as unknown as SwaparooPool;
    const {'0': reserveA, '1': reserveB} = await swaparooPool.methods.getReserves().call();
    const {'0': tokenA, '1': tokenB} = await swaparooPool.methods.getTokenAddresses().call();
    return {
      address: address,
      tokenA: tokenA,
      tokenB: tokenB,
      reserveA: reserveA,
      reserveB: reserveB,
      ether: "0",
    } as Pool;
  }

  private async addPool(address: string) {
    const pool = await this.getPoolFromAddress(address);
    const newState = this.swaparooPoolStateSubject.value;

    const tokenAddresses = newState.tokens;
    tokenAddresses.add(pool.address);
    tokenAddresses.add(pool.tokenA);
    tokenAddresses.add(pool.tokenB);

    newState.pools.push(pool);
    this.swaparooPoolStateSubject.next(newState);
  }

  private listenToContractEvents() {
    this.swaparooCoreService.PoolAddedEvent(async (error, result) => {
      console.info('got Event: PoolAdded', result);
      if(error) {
        console.log(error);
        return;
      }

      const poolAddress = result.returnValues[0];
      await this.addPool(poolAddress);
      await this.updatePoolsState();
    });
  }

  private listenToBlockUpdates() {
    this.web3Service.web3.eth.subscribe('newBlockHeaders', async (error) => {
      if (error) {
        console.log(error);
        return;
      }
      this.updatePoolsState();
    });
  }

  public async provideLiquidity(amountA: string, amountB: string, addressPool: string, addressTokenA: string, addressTokenB: string, fromAddress: string) {
    // approve
    const tokenA = new this.web3Service.web3.eth.Contract(ERC20Abi, addressTokenA) as unknown as ERC20;
    await callContract({
      from: fromAddress,
      method: tokenA.methods.approve(addressPool, amountA)
    });

    const tokenB = new this.web3Service.web3.eth.Contract(ERC20Abi, addressTokenB) as unknown as ERC20;
    await callContract({
      from: fromAddress,
      method: tokenB.methods.approve(addressPool, amountB)
    });

    const swaparooPool = new this.web3Service.web3.eth.Contract(SwaparooPoolAbi, addressPool) as unknown as SwaparooPool;
    await callContract({
      from: fromAddress,
      method: swaparooPool.methods.provideLiquidity(amountA, amountB)
    });
  }

  public async removeLiquidity(sharesToRemove: string, addressPool: string, fromAddress: string) {
    const swaparooPool = new this.web3Service.web3.eth.Contract(SwaparooPoolAbi, addressPool) as unknown as SwaparooPool;
    await callContract({
      from: fromAddress,
      method: swaparooPool.methods.removeLiquidity(sharesToRemove)
    });
  }

  public async swap(amountIn: string, addressTokenIn: string, addressPool: string, fromAddress: string) {
    const tokenIn = new this.web3Service.web3.eth.Contract(ERC20Abi, addressTokenIn) as unknown as ERC20;
    await callContract({
      from: fromAddress,
      method: tokenIn.methods.approve(addressPool, amountIn)
    });

    const swaparooPool = new this.web3Service.web3.eth.Contract(SwaparooPoolAbi, addressPool) as unknown as SwaparooPool;
    await callContract({
      from: fromAddress,
      method: swaparooPool.methods.swap(amountIn, addressTokenIn)
    });
  }

  public async payoutDividends(poolAddress: string, fromAddress: string) {
    const swaparooPool = new this.web3Service.web3.eth.Contract(SwaparooPoolAbi, poolAddress) as unknown as SwaparooPool;
    await callContract({
      from: fromAddress,
      method: swaparooPool.methods.payoutDividends()
    });
  }
}
