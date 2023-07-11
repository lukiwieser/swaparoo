import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Globals {
  public readonly ethereumUri: string = "ws://localhost:9545";
}