import { HttpInterceptorFn } from '@angular/common/http';

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
