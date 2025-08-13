import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiEndpoints } from '../../core/constants/api-endpoints';

interface PasswordResetResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  constructor(private http: HttpClient) {}

  // طلب إعادة تعيين كلمة المرور
  forgotPassword(email: string): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(ApiEndpoints.auth.forgotPassword, { email }).pipe(
      catchError(this.handleError)
    );
  }

  // إعادة تعيين كلمة المرور باستخدام الرمز
  resetPassword(token: string, newPassword: string): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(ApiEndpoints.auth.resetPassword(token), { newPassword }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'حدث خطأ غير متوقع';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      errorMessage = error.error.message || `خطأ في الخادم: ${error.status}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
