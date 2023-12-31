import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {SwaparooPoolsState} from 'src/app/models/SwaparooPoolsState';
import {SwaparooCoreState} from 'src/app/models/SwaparooCoreState';
import {UsersState} from 'src/app/models/UserState';
import {SwaparooCoreService} from 'src/app/services/swaparoo-core.service';
import {SwaparooPoolService} from 'src/app/services/swaparoo-pool.service';
import {UserService} from 'src/app/services/user.service';
import {Web3Service} from 'src/app/services/web3.service';
import { User } from 'src/app/models/User';
import { Globals } from '../../globals/globals';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  private componentDestroyed$ = new Subject<void>();
  // forms:
  form: FormGroup;
  addUserForm: FormGroup;
  addPoolForm: FormGroup;
  addOwnerForm: FormGroup;
  renounceOwnerForm: FormGroup;
  // state:
  swaparooCoreState: SwaparooCoreState | undefined;
  swaparooPoolsState: SwaparooPoolsState | undefined;
  usersState: UsersState | undefined;

  constructor(
    private formBuilder: FormBuilder,
    private web3Service: Web3Service,
    private swaparooCoreService: SwaparooCoreService,
    private swaparooPoolService: SwaparooPoolService,
    private userService: UserService,
    private globals: Globals
  ) {
    this.form = this.formBuilder.group({
      swaparoo_core_address: ['', [Validators.required]],
    });
    this.addUserForm = this.formBuilder.group({
      user_address: ['', [Validators.required]],
    });
    this.addPoolForm = this.formBuilder.group({
      addressTokenA: ['', [Validators.required]],
      addressTokenB: ['', [Validators.required]],
    });
    this.addOwnerForm = this.formBuilder.group({
      newOwnerAddress: ['', [Validators.required]],
    });
    this.renounceOwnerForm = this.formBuilder.group({
    });
  }

  get selectedUser(): User | undefined {
    return this.usersState?.users.find(u => u.address === this.usersState?.selectedUserAddress);
  }

  async ngOnInit() {
    await this.web3Service.connect(this.globals.ethereumUri);

    this.swaparooCoreService.swaparooCoreState$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(state => this.swaparooCoreState = state);

    this.swaparooPoolService.swaparooPoolState$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(state => this.swaparooPoolsState = state);

    this.userService.usersState$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(state => this.usersState = state);
  }

  async ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  public async setSwaparooCoreAddress() {
    const swaparooCoreAddress = this.form.get('swaparoo_core_address')?.value;

    console.log("btn pressed: " + swaparooCoreAddress);
    if(this.form.invalid) {
      return;
    }

    await this.swaparooCoreService.setSwaparooCoreAddress(swaparooCoreAddress);
    this.form.reset();
  }

  public async clearSwaparooCoreAddress() {
    this.swaparooCoreService.clearSwaparooCoreAddress();
  }

  public async addUser() {
    if(this.addUserForm.invalid) {
      return;
    }
    const address = this.addUserForm.get('user_address')?.value;
    await this.userService.addUser(address);
    this.addUserForm.reset();
  }

  public async removeUser(user: User) {
    this.userService.removeUser(user.address);
  }

  public async addPool() {
    if(this.addPoolForm.invalid) return;
    if(!this.usersState?.selectedUserAddress) return;

    const addressTokenA = this.addPoolForm.get('addressTokenA')?.value;
    const addressTokenB = this.addPoolForm.get('addressTokenB')?.value;

    await this.swaparooCoreService.createPool(addressTokenA, addressTokenB, this.usersState.selectedUserAddress);
    this.addPoolForm.reset();
  }

  public async selectUser(user: User) {
    this.userService.selectUser(user);
  }

  public async addOwner() {
    if(this.addOwnerForm.invalid) return;
    if(!this.usersState?.selectedUserAddress) return;

    const newOwnerAddress = this.addOwnerForm.get('newOwnerAddress')?.value;
    await this.swaparooCoreService.addOwner(newOwnerAddress, this.usersState.selectedUserAddress);
    this.addOwnerForm.reset();
  }

  public async renounceOwner() {
    if(!this.usersState?.selectedUserAddress) return;
    await this.swaparooCoreService.renounceOwner(this.usersState.selectedUserAddress);
  }
}
