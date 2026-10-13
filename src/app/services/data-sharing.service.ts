import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DataSharingService {
  public refreshRequired: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
}
