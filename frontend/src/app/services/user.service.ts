import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {initialUsersState, UsersState} from '../models/UserState';
import {SwaparooCoreService} from './swaparoo-core.service';
import {Web3Service} from './web3.service';
import ERC20Json from '../../contracts/abi/ERC20.json';
import {AbiItem} from 'web3-utils';
import {ERC20} from 'src/contracts/web3-types';
import {SwaparooPoolService} from './swaparoo-pool.service';
import { User } from '../models/User';
import { TokenBalance } from '../models/TokenBalance';

const SwaparooCoreAbi = ERC20Json.abi as AbiItem[];


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly usersStateSubject;
  public readonly usersState$;

  constructor(
    private web3Service: Web3Service,
    private swaparooCoreService: SwaparooCoreService,
    private swaparooPoolService: SwaparooPoolService
  ) {
    this.usersStateSubject = new BehaviorSubject<UsersState>(initialUsersState);
    this.usersState$ = this.usersStateSubject.asObservable();

    this.swaparooCoreService.swaparooCoreState$.subscribe(async (state) => {
      if(state.address) {
        await this.init();
      }
    });
    this.swaparooPoolService.swaparooPoolState$.subscribe(async () => {
      console.log("update user state cause pools changed")
      await this.updateUserState();
    });
  }

  private async init() {
    this.listenToBlockUpdates();
  }

  public async addUser(address: string) {
    // check if user is already added
    const userAddresses = this.usersStateSubject.value.users.map(user => user.address);
    if (userAddresses.includes(address)) {
      console.warn("Address already invited.")
      return;
    }

    // create object for user
    const ether = await this.getEtherBalanceInWei(address);
    const isOwner = await this.swaparooCoreService.isOwner(address);
    const tokenBalances = await this.getTokenBalances(address);
    const newUser: User = {
      address,
      isOwner,
      ether,
      tokenBalances
    }

    // update state & set selected-user if neccessary
    const newState = this.usersStateSubject.value;
    newState.users.push(newUser);
    if(newState.users.length == 1) {
      newState.selectedUserAddress = newState.users[0].address;
    }
    this.usersStateSubject.next(newState);
  }

  public selectUser(user: User) {
    const newState = this.usersStateSubject.value;
    newState.selectedUserAddress = user.address;
    this.usersStateSubject.next(newState);
  }

  private async getEtherBalanceInWei(address: string) : Promise<string> {
    return this.web3Service.web3.utils.fromWei(await this.web3Service.web3.eth.getBalance(address), "ether");
  }

  private async getTokenBalances(userAddress: string) : Promise<TokenBalance[]> {
    const balances : TokenBalance[] = [];
    const tokenAddresses = this.swaparooPoolService.swaparooPoolState.tokens;
    for (const tokenAddress of tokenAddresses) {
      const token = new this.web3Service.web3.eth.Contract(SwaparooCoreAbi, tokenAddress) as unknown as ERC20;
      const amount = await token.methods.balanceOf(userAddress).call();
      const balance : TokenBalance = {address: tokenAddress, amount};
      balances.push(balance);
    }
    return balances;
  }

  private async updateUserState() {
    const usersState = this.usersStateSubject.value;
    for(const user of usersState.users) {
      const ether = await this.getEtherBalanceInWei(user.address);
      const isOwner = await this.swaparooCoreService.isOwner(user.address);
      const tokenBalances = await this.getTokenBalances(user.address);
      const updatedUser : User = {
        address: user.address,
        ether,
        isOwner,
        tokenBalances
      }

      const index = usersState.users.findIndex(u => u.address === user.address);
      usersState.users[index] = updatedUser;
    }
    this.usersStateSubject.next(usersState);
  }

  private listenToBlockUpdates() {
    this.web3Service.web3.eth.subscribe('newBlockHeaders', async (error) => {
      if (error) {
        console.log(error);
        return;
      }
      await this.updateUserState();
    });
  }
}
