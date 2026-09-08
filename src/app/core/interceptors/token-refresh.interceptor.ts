import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isTokenExpired =
        error.status === 401 && error.error?.error?.code === 'TOKEN_EXPIRED';

      const isAuthEndpoint = req.url.includes('/auth/');

      if (!isTokenExpired || isAuthEndpoint) {
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap((res) => {
            isRefreshing = false;
            refreshTokenSubject.next(res.accessToken);

            const retriedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` }
            });
            return next(retriedReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            authService.clearSession();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => {
          const retriedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next(retriedReq);
        })
      );
    })
  );
};