import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiEndpoints } from '../../core/constants/api-endpoints';

export interface AuthResponse {
  token: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkTokenExpiration();
    }
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(ApiEndpoints.auth.login, credentials).pipe(
      tap({
        next: (response) => {
          if (response && response.token && isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', response.token);
            const payload = this.decodeToken(response.token);
            if (payload.role === 'admin') {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/home']);
            }
          }
        },
        error: (error) => {
          console.error('خطأ في تسجيل الدخول:', error);
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) return false;
    const payload = this.decodeToken(token);
    return payload.role === 'admin';
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('خطأ في فك تشفير التوكن:', error);
      return {};
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const expiry = payload.exp * 1000; // Convert seconds to milliseconds
      return Date.now() >= expiry;
    } catch (error) {
      console.error('خطأ في فك تشفير التوكن:', error);
      return true;
    }
  }

  checkTokenExpiration(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getToken();
      if (token && this.isTokenExpired(token)) {
        this.logout();
      }
    }
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
