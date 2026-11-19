import {NgModule} from '@angular/core';
import {AdminRouting} from './admin.routing';
import {AdminDashboardComponent} from './admin-dashboard.component';
import {AllProvidersDashboardComponent} from './providers/all-providers.component';
import {AllServicesDashboardComponent} from './services/all-services.component';
import {AllDatasourcesDashboardComponent} from './datasources/all-datasources.component';


@NgModule({
  imports: [
    AdminRouting,
    AdminDashboardComponent,
    AllProvidersDashboardComponent,
    AllServicesDashboardComponent,
    AllDatasourcesDashboardComponent,
  ],
})

export class AdminModule {
}
