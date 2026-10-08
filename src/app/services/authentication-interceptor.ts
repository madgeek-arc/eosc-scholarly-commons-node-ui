import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';
import {Router} from '@angular/router';
import {EMPTY, Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '../../environments/environment';

/**
 * Handles failed API calls in one place. Every error reaches the caller as the original HttpErrorResponse, so each
 * page decides what to show (the search and service pages render their own error states). The interceptor only does
 * what is the same everywhere:
 *  - 401 on the user-info call: forget the session data kept in sessionStorage;
 *  - 403: show the forbidden page.
 * Network failures (status 0) of the FAQ service, which is known to be unreliable, end quietly instead of erroring.
 *
 * It is a class registered under HTTP_INTERCEPTORS, not a functional interceptor: catalogue-ui provides its own
 * HttpClient with `withInterceptorsFromDi()`, and only DI-registered interceptors reach the requests it makes.
 */
@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse)) {
          return throwError(error);
        }
        if (error.status === 0 && request.url.startsWith(environment.FAQ_ENDPOINT)) {
          return EMPTY;
        }
        if (error.status === 401 && request.url.includes('user/info')) {
          sessionStorage.clear();
        } else if (error.status === 403) {
          void this.router.navigate(['/forbidden']);
        }
        return throwError(error);
      }),
    );
  }
}
