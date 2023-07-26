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


interface UserAddressesState {
  userAddresses: string[],
  selectedUserAddress: string
}


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
        await this.loadUsersFromLocalStorage();
        this.listenToBlockUpdates();
      }
    });
    this.swaparooPoolService.swaparooPoolState$.subscribe(async () => {
      await this.updateUserState();
    });
  }

  private async loadUsersFromLocalStorage() {
    const userAddressesStateString = localStorage.getItem("user-addresses-state");
    if(!userAddressesStateString) {
      return;
    }

    const userAddressesState = JSON.parse(userAddressesStateString) as UserAddressesState;

    const userPromises = userAddressesState.userAddresses.map(address => this.loadUserFromAddress(address));
    const users = await Promise.all(userPromises);

    const state: UsersState = {
      ...this.usersStateSubject.value,
      users,
      selectedUserAddress: userAddressesState.selectedUserAddress
    };
    this.usersStateSubject.next(state);
  }

  public async addUser(address: string) {
    // check if user is already added
    const userAddresses = this.usersStateSubject.value.users.map(user => user.address);
    if (userAddresses.includes(address)) {
      console.warn("Address already invited.");
      return;
    }

    // create object for user
    const newUser = await this.loadUserFromAddress(address);

    // update state & set selected-user if neccessary
    const newState = this.usersStateSubject.value;
    newState.users.push(newUser);
    if(newState.users.length == 1) {
      newState.selectedUserAddress = newState.users[0].address;
    }
    this.usersStateSubject.next(newState);

    this.saveAddressesToLocalStorage();
  }

  public async removeUser(address: string) {
    const usersState = this.usersStateSubject.value;
    usersState.users = usersState.users.filter(user => user.address !== address);
    if(usersState.selectedUserAddress === address) {
      usersState.selectedUserAddress = usersState.users.length > 0 ? usersState.users[0].address : undefined;
    }
    this.usersStateSubject.next(usersState);
    this.saveAddressesToLocalStorage();
  }

  private async loadUserFromAddress(address: string): Promise<User> {
    const ether = await this.getEtherBalanceInWei(address);
    const isOwner = await this.swaparooCoreService.isOwner(address);
    const tokenBalances = await this.getTokenBalances(address);
    return {
      address,
      isOwner,
      ether,
      tokenBalances
    } as User;
  }

  private saveAddressesToLocalStorage() {
    const state = this.usersStateSubject.value;
    const userAddresses = state.users.map(user => user.address);
    const selectedUserAddress = state.selectedUserAddress;

    const userAddressesState = { userAddresses, selectedUserAddress } as UserAddressesState;
    localStorage.setItem("user-addresses-state", JSON.stringify(userAddressesState));
  }

  public selectUser(user: User) {
    const newState = this.usersStateSubject.value;
    newState.selectedUserAddress = user.address;
    this.usersStateSubject.next(newState);
    this.saveAddressesToLocalStorage();
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
      const updatedUser : User = await this.loadUserFromAddress(user.address);
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
