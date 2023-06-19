import { Component, Input, SimpleChanges } from '@angular/core';
import { Pool } from 'src/app/models/PoolsState';
import { AbstractControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ContractService } from 'src/app/services/contract.service';
import { User } from 'src/app/models/UserState';

@Component({
  selector: 'app-pool-item',
  templateUrl: './pool-item.component.html',
  styleUrls: ['./pool-item.component.scss']
})
export class PoolItemComponent {
  @Input() pool!: Pool;
  @Input() selectedUser: User | undefined;
  provideLiqudityForm: FormGroup;
  
  ngOnChanges(changes: SimpleChanges) {
    this.selectedUser = changes['selectedUser']?.currentValue;
    console.log(changes);
  }

  constructor(
    private formBuilder: FormBuilder,
    private contractService: ContractService
  ) {
    this.provideLiqudityForm = this.formBuilder.group({
      amountTokenA: ['', [Validators.required]],
      amountTokenB: ['', [Validators.required]],
    });
  }

  public async provideLiquidity() {
    if(!this.selectedUser) return;
    if(this.provideLiqudityForm.invalid) return;

    const amountA = this.provideLiqudityForm.get('amountTokenA')?.value;
    const amountB = this.provideLiqudityForm.get('amountTokenB')?.value;

    this.contractService.provideLiquidity(
      amountA, amountB, this.pool.address, this.pool.tokenA, this.pool.tokenB, this.selectedUser.address
    );
  }
}
