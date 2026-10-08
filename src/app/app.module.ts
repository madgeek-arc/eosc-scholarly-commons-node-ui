import {APP_INITIALIZER, ErrorHandler, NgModule} from '@angular/core';
import {Router} from '@angular/router';
import * as Sentry from '@sentry/angular';
import {CommonModule, DatePipe, LowerCasePipe} from '@angular/common';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {SharedModule} from './shared/shared.module';
import {AppRoutingModule} from './app.routing';
import {ResourceService} from './services/resource.service';
import {ScTopMenuComponent} from './shared/scholarly-commons/top-menu/top-menu.component';
import {ScFooterComponent} from './shared/scholarly-commons/footer/footer.component';
import {ReusableComponentsModule} from './shared/reusablecomponents/reusable-components.module';
import {ProviderService} from './services/provider.service';
import {ComparisonService} from './services/comparison.service';
import {SearchAireComponent} from './pages/search/search.aire.component';
import {CookieLawModule} from './shared/reusablecomponents/cookie-law/cookie-law.module';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxMatomoModule, NgxMatomoRouterModule} from 'ngx-matomo-client';
import {environment} from '../environments/environment';
import {PortfolioItemComponent} from './pages/landingpages/portfolio/portfolio-item.component';
import {UserItemComponent} from './pages/landingpages/user/user-item.component';
import {DataSharingService} from './services/data-sharing.service';
import {AuthenticationInterceptor} from './services/authentication-interceptor';
import {DatasourceSearchComponent} from './pages/search/datasources-search/datasourceSearch.component';
import {Datasource} from './pages/landingpages/datasource/datasource';
import {ServiceWorkerModule} from '@angular/service-worker';
import {UserService} from './services/user.service';


declare let require: any;

@NgModule({
  declarations: [
    AppComponent,
    SearchAireComponent,
    DatasourceSearchComponent,
    Datasource,
    PortfolioItemComponent,
    UserItemComponent,
    // ServiceLandingPageComponent,
  ],
  imports: [
    CommonModule,
    ScTopMenuComponent,
    ScFooterComponent,
    FormsModule,
    ReactiveFormsModule,
    ReusableComponentsModule,
    SharedModule,
    CookieLawModule,
    NgSelectModule,
    NgxMatomoModule.forRoot({
      scriptUrl: environment.MATOMO_URL + 'matomo.js',
      trackers: [
        {
          trackerUrl: environment.MATOMO_URL,
          siteId: environment.MATOMO_SITE
        }
      ]
    }),
    NgxMatomoRouterModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationInterceptor,
      multi: true
    },
    ComparisonService,
    ResourceService,
    UserService,
    ProviderService,
    DataSharingService,
    DatePipe,
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
    }, {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
      },
      deps: [Sentry.TraceService],
      multi: true,
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
  exports: [
    LowerCasePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
