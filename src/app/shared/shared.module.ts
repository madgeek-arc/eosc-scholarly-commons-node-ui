import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {PremiumSortFacetsPipe, PremiumSortFacetValuesPipe, PremiumSortPipe} from './pipes/premium-sort.pipe';
import {StringArraySortPipe} from './pipes/sort.pipe';
import {JoinPipe} from './pipes/join.pipe';
import {KeysPipe} from './pipes/keys.pipe';
import {LookUpPipe} from './pipes/lookup.pipe';
import {SafePipe} from './pipes/safe.pipe';
import {ValuesPipe} from './pipes/getValues.pipe';
import { EmailModalComponent } from './email-modal/email-modal.component';
// import {BreadcrumbsComponent} from './breadcrumbs/breadcrumbs.component';
// import {PendingServicesComponent} from '../pages/provider/dashboard/pendingservices/pending-services.component';
// import {PreviewResourceComponent} from '../pages/previewresource/preview-resource.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  declarations: [
    JoinPipe,
    KeysPipe,
    StringArraySortPipe,
    LookUpPipe,
    PremiumSortPipe,
    PremiumSortFacetValuesPipe,
    PremiumSortFacetsPipe,
    SafePipe,
    ValuesPipe,
    EmailModalComponent,
    // BreadcrumbsComponent,
    // PendingServicesComponent,
    // PreviewResourceComponent
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
    // BreadcrumbsComponent,
    // PendingServicesComponent,
    // PreviewResourceComponent
  ]
})
export class SharedModule {
}
