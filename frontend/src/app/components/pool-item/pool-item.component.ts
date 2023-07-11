import { Component, Input, SimpleChanges } from '@angular/core';
import { Pool } from 'src/app/models/PoolsState';
import { AbstractControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from 'src/app/models/UserState';
import { SwaparooPoolService } from 'src/app/services/swaparoo-pool.service';

@Component({
  selector: 'app-pool-item',
  templateUrl: './pool-item.component.html',
  styleUrls: ['./pool-item.component.scss']
})
export class PoolItemComponent {
  @Input() pool!: Pool;
  @Input() selectedUser: User | undefined;
  provideLiqudityForm: FormGroup;
  removeLiqudityForm: FormGroup;
  swapForm: FormGroup;
  dividendsForm: FormGroup;

  ngOnChanges(changes: SimpleChanges) {
    this.selectedUser = changes['selectedUser']?.currentValue;
    console.log(changes);
  }

  constructor(
    private formBuilder: FormBuilder,
    private swaparooPoolService: SwaparooPoolService
  ) {
    this.provideLiqudityForm = this.formBuilder.group({
      amountTokenA: ['', [Validators.required]],
      amountTokenB: ['', [Validators.required]],
    });

    this.removeLiqudityForm = this.formBuilder.group({
      sharesToRemove: ['', [Validators.required]],
    });

    this.swapForm = this.formBuilder.group({
      tokenInAmount: ['', [Validators.required]],
      tokenInType: ['', [Validators.required]],
    });

    this.dividendsForm = this.formBuilder.group({
    });
  }

  public async provideLiquidity() {
    if(!this.selectedUser) return;
    if(this.provideLiqudityForm.invalid) return;

    const amountA = this.provideLiqudityForm.get('amountTokenA')?.value;
    const amountB = this.provideLiqudityForm.get('amountTokenB')?.value;

    this.swaparooPoolService.provideLiquidity(
      amountA, amountB, this.pool.address, this.pool.tokenA, this.pool.tokenB, this.selectedUser.address
    );
  }

  public async removeLiquidity() {
    if(!this.selectedUser) return;
    if(this.removeLiqudityForm.invalid) return;

    const sharesToRemove = this.removeLiqudityForm.get('sharesToRemove')?.value;
    this.swaparooPoolService.removeLiquidity(sharesToRemove, this.pool.address, this.selectedUser.address);
  }

  public async swap() {
    if(!this.selectedUser) return;
    if(this.swapForm.invalid) return;

    const tokenInType = this.swapForm.get('tokenInType')?.value;
    const tokenInAmount = this.swapForm.get('tokenInAmount')?.value;
    const tokenInAddress = (tokenInType == "tokenA") ? this.pool.tokenA : this.pool.tokenB;

    this.swaparooPoolService.swap(tokenInAmount, tokenInAddress, this.pool.address, this.selectedUser.address);
  }

  public async payoutDividends() {
    if(!this.selectedUser) return;
    this.swaparooPoolService.payoutDividends(this.pool.address, this.selectedUser.address);
  }
}
