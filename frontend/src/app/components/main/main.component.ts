import { Component } from '@angular/core';
import { AbstractControl, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  form: FormGroup;
  swaparooCoreAddress: string | undefined;

  constructor(
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      swaparoo_core_address: ['', [Validators.required]],
    });
  }

  public submit(): void {
    console.log("btn pressed: " + this.form.get('swaparoo_core_address')?.value);

    if(this.form.invalid) {
      return;
    }

    this.swaparooCoreAddress = this.form.get('swaparoo_core_address')?.value;
  }
}
