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
  userId?: string;
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
            // Store userId from token payload or response
            const userId = response.userId || payload.sub || payload.id;
            if (userId) {
              localStorage.setItem('userId', userId);
            }
            if (payload.role === 'admin') {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/home']);
            }
          }
        },
        error: (error) => {}
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      return token;
    }
    return null;
  }

  getUserId(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      return userId;
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const isExpired = this.isTokenExpired(token);
    return !isExpired;
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      return false;
    }
    const payload = this.decodeToken(token);
    const isAdmin = payload.role === 'admin';
    return isAdmin;
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return {};
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const expiry = payload.exp * 1000;
      const isExpired = Date.now() >= expiry;
      return isExpired;
    } catch (error) {
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
    let errorMessage = 'An unexpected error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Server error: ${error.status}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
