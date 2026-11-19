import {NgModule} from '@angular/core';
import {PremiumSortFacetValuesPipe, PremiumSortPipe} from './pipes/premium-sort.pipe';
import {StringArraySortPipe} from './pipes/sort.pipe';
import {JoinPipe} from './pipes/join.pipe';
import {KeysPipe} from './pipes/keys.pipe';
import {LookUpPipe} from './pipes/lookup.pipe';
import {SafePipe} from './pipes/safe.pipe';
import {ValuesPipe} from './pipes/getValues.pipe';
import { EmailModalComponent } from './email-modal/email-modal.component';

@NgModule({
  imports: [
    JoinPipe,
    KeysPipe,
    StringArraySortPipe,
    LookUpPipe,
    PremiumSortPipe,
    PremiumSortFacetValuesPipe,
    SafePipe,
    ValuesPipe,
    EmailModalComponent,
  ],
  exports: [
    JoinPipe,
    KeysPipe,
    StringArraySortPipe,
    LookUpPipe,
    PremiumSortPipe,
    PremiumSortFacetValuesPipe,
    SafePipe,
    ValuesPipe,
    EmailModalComponent,
  ]
})
export class SharedModule {
}
