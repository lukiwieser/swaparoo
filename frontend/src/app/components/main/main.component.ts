import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {SwaparooPoolsState} from 'src/app/models/PoolsState';
import {SwaparooCoreState} from 'src/app/models/SwaparooCoreState';
import {User, UsersState} from 'src/app/models/UserState';
import {SwaparooCoreService} from 'src/app/services/swaparoo-core.service';
import {SwaparooPoolService} from 'src/app/services/swaparoo-pool.service';
import {UserService} from 'src/app/services/user.service';
import {Web3Service} from 'src/app/services/web3.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
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
  selectedUser: User | undefined;
  // misc:
  swaparooCoreAddress: string | undefined;
  swaparooCoreInitialized: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    //private contractService: ContractService,
    private web3Service: Web3Service,
    private swaparooCoreService: SwaparooCoreService,
    private swaparooPoolService: SwaparooPoolService,
    private userService: UserService
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

  async ngOnInit() {
    await this.web3Service.connect("ws://localhost:9545");

    this.swaparooCoreService.swaparooCoreState$.subscribe(state => this.swaparooCoreState = state);
    this.swaparooPoolService.swaparooPoolState$.subscribe(state => this.swaparooPoolsState = state);
    this.userService.usersState$.subscribe(state => {
      this.usersState = state;
      const selectedUserIndex = this.usersState.users.findIndex(u => u.address === this.selectedUser?.address);
      if(selectedUserIndex >= 0) {
        this.selectedUser = this.usersState.users[selectedUserIndex];
      }
    });
  }


  public async submit() {
    const swaparooCoreAddress = this.form.get('swaparoo_core_address')?.value;

    console.log("btn pressed: " + swaparooCoreAddress);
    if(this.form.invalid) {
      return;
    }

    if(swaparooCoreAddress) {
      this.swaparooCoreAddress = swaparooCoreAddress;
      await this.swaparooCoreService.setSwaparooCoreAddress(swaparooCoreAddress);
    }
  }

  public async addUser() {
    if(this.addUserForm.invalid) {
      return;
    }
    const address = this.addUserForm.get('user_address')?.value;
    await this.userService.addUser(address);
    this.addUserForm.reset();

    if(this.usersState?.users?.length == 1) {
      this.selectedUser = this.usersState?.users[0];
    }
  }

  public async addPool() {
    if(this.addPoolForm.invalid) {
      return;
    }
    const addressTokenA = this.addPoolForm.get('addressTokenA')?.value;
    const addressTokenB = this.addPoolForm.get('addressTokenB')?.value;

    await this.swaparooCoreService.createPool(addressTokenA, addressTokenB, this.selectedUser?.address ?? "");
    this.addPoolForm.reset();
  }

  public async selectUser(user: User) {
    this.selectedUser = user;
  }

  public async addOwner() {
    if(this.addOwnerForm.invalid) return;
    if(!this.selectedUser) return;

    const newOwnerAddress = this.addOwnerForm.get('newOwnerAddress')?.value;
    await this.swaparooCoreService.addOwner(newOwnerAddress, this.selectedUser.address);
    this.addOwnerForm.reset();
  }

  public async renounceOwner() {
    if(!this.selectedUser) return;
    await this.swaparooCoreService.renounceOwner(this.selectedUser.address);
  }
}
