import { Component } from '@angular/core';
import { AbstractControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SwaparooPoolsState } from 'src/app/models/PoolsState';
import { SwaparooCoreState } from 'src/app/models/SwaparooCoreState';
import { User, UsersState } from 'src/app/models/UserState';
import { ContractService } from 'src/app/services/contract.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  form: FormGroup;
  addUserForm: FormGroup;
  addPoolForm: FormGroup;
  addOwnerForm: FormGroup;
  renounceOwnerForm: FormGroup;
  swaparooCoreAddress: string | undefined;
  swaparooCoreInitialized: boolean = false;
  swaparooCoreState: SwaparooCoreState | undefined;
  swaparooPoolsState: SwaparooPoolsState | undefined;
  usersState: UsersState | undefined;
  selectedUser: User | undefined;

  constructor(
    private formBuilder: FormBuilder,
    private contractService: ContractService
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
    await this.connectToClient();
    this.contractService.swaparooCoreState$.subscribe(state => this.swaparooCoreState = state);
    this.contractService.swaparooPoolsState$.subscribe(state => this.swaparooPoolsState = state);
    this.contractService.usersState$.subscribe(state => {
      this.usersState = state;

      const selectedUserIndex = this.usersState.users.findIndex(u => u.address === this.selectedUser?.address);
      if(selectedUserIndex >= 0) {
        this.selectedUser = this.usersState.users[selectedUserIndex];
      }
      console.log("updatedState");
    });
  }

  private async connectToClient() {
    const isConnected = await this.contractService.connectToClient("ws://localhost:9545") 
    if (isConnected) {
      console.info("Connected!");
    } else {
      window.alert("Failed to connect! Check your port!")
    }
  }

  public async submit() {
    const swaparooCoreAddress = this.form.get('swaparoo_core_address')?.value;

    console.log("btn pressed: " + swaparooCoreAddress);
    if(this.form.invalid) {
      return;
    }

    if(swaparooCoreAddress) {
      this.swaparooCoreAddress = swaparooCoreAddress;
      this.swaparooCoreInitialized = await this.contractService.loadSwaparooCore(swaparooCoreAddress);
    }
  }

  public async addUser() {
    if(this.addUserForm.invalid) {
      return;
    }
    const address = this.addUserForm.get('user_address')?.value;
    await this.contractService.addUser(address);
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

    await this.contractService.createPool(addressTokenA, addressTokenB, this.selectedUser?.address ?? "");
    this.addPoolForm.reset();
  }

  public async selectUser(user: User) {
    this.selectedUser = user;
  }

  public async addOwner() {
    if(this.addOwnerForm.invalid) return;
    if(!this.selectedUser) return;

    const newOwnerAddress = this.addOwnerForm.get('newOwnerAddress')?.value;
    await this.contractService.addOwner(newOwnerAddress, this.selectedUser.address);
    this.addOwnerForm.reset();
  }

  public async renounceOwner() {
    if(!this.selectedUser) return;
    await this.contractService.renounceOwner(this.selectedUser.address);
  }
}
