import {APP_INITIALIZER, ApplicationRef, ErrorHandler, inject, NgModule, provideAppInitializer} from '@angular/core';
import {Router, TitleStrategy} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import {CommonModule, DatePipe, LowerCasePipe} from '@angular/common';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {SharedModule} from './shared/shared.module';
import {AppRoutingModule} from './app.routing';
import {ResourceService} from './services/resource.service';
import {ReusableComponentsModule} from './shared/reusablecomponents/reusable-components.module';
import {ProviderService} from './services/provider.service';
import {ComparisonService} from './services/comparison.service';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxMatomoModule, NgxMatomoRouterModule} from 'ngx-matomo-client';
import {environment} from '../environments/environment';
import {DataSharingService} from './services/data-sharing.service';
import {AuthenticationInterceptor} from './services/authentication-interceptor';
import {ServiceWorkerModule} from '@angular/service-worker';
import {UserService} from './services/user.service';
import {TrackingService} from './services/tracking.service';
import {PageTitleStrategy} from './services/page-title.strategy';


@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    AppComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableComponentsModule,
    SharedModule,
    NgSelectModule,
    // The Matomo script is loaded by TrackingService once the visitor has agreed to statistics.
    NgxMatomoModule.forRoot({mode: 'deferred'}),
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
    // Sets the document title and meta tags from the `title` of the route on screen.
    {provide: TitleStrategy, useExisting: PageTitleStrategy},
    // Creates TrackingService, which starts Matomo and Sentry if consent was given on an earlier visit.
    provideAppInitializer(() => {
      inject(TrackingService);
    }),
  ],
  exports: [
    LowerCasePipe
  ],
})
export class AppModule {
  // A standalone component cannot go in the `bootstrap` array of an NgModule.
  ngDoBootstrap(appRef: ApplicationRef): void {
    appRef.bootstrap(AppComponent);
  }
}
