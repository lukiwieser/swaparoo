import { Component } from '@angular/core';
import { AbstractControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SwaparooPoolsState } from 'src/app/models/PoolsState';
import { SwaparooCoreState } from 'src/app/models/SwaparooCoreState';
import { UsersState } from 'src/app/models/UserState';
import { ContractService } from 'src/app/services/contract.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  form: FormGroup;
  addUserForm: FormGroup;
  swaparooCoreAddress: string | undefined;
  swaparooCoreInitialized: boolean = false;
  swaparooCoreState: SwaparooCoreState | undefined;
  swaparooPoolsState: SwaparooPoolsState | undefined;
  usersState: UsersState | undefined;

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
  }

  async ngOnInit() {
    await this.connectToClient();
    this.contractService.swaparooCoreState$.subscribe(state => this.swaparooCoreState = state);
    this.contractService.swaparooPoolsState$.subscribe(state => this.swaparooPoolsState = state);
    this.contractService.usersState$.subscribe(state => this.usersState = state);
  }

  private async connectToClient() {
    const isConnected = await this.contractService.connectToClient("ws://localhost:9545") // TODO [providerPort] Edit for desired network
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
  }
}
