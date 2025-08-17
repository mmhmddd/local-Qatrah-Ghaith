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
  userId?: string; // Add userId to response if provided by backend
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
            } else {
              console.warn('No userId found in token or response');
            }
            console.log('Login successful, token:', response.token, 'userId:', userId);
            if (payload.role === 'admin') {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/home']);
            }
          } else {
            console.error('Invalid login response:', response);
          }
        },
        error: (error) => {
          console.error('Login error:', error);
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      console.log('Logged out, token and userId removed');
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      console.log('Retrieved token:', token ? 'Present' : 'Missing');
      return token;
    }
    return null;
  }

  getUserId(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      console.log('Retrieved userId:', userId ? userId : 'Missing');
      return userId;
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log('isLoggedIn: No token found');
      return false;
    }
    const isExpired = this.isTokenExpired(token);
    console.log('isLoggedIn: Token expired:', isExpired);
    return !isExpired;
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      console.log('isAdmin: No token or token expired');
      return false;
    }
    const payload = this.decodeToken(token);
    const isAdmin = payload.role === 'admin';
    console.log('isAdmin:', isAdmin);
    return isAdmin;
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token:', error);
      return {};
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const expiry = payload.exp * 1000; // Convert seconds to milliseconds
      const isExpired = Date.now() >= expiry;
      console.log('Token expiry check:', { expiry, now: Date.now(), isExpired });
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  checkTokenExpiration(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getToken();
      if (token && this.isTokenExpired(token)) {
        console.log('Token expired, logging out');
        this.logout();
      } else if (!token) {
        console.log('No token found, skipping expiration check');
      }
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Server error: ${error.status}`;
      console.error('Error details:', { status: error.status, message: errorMessage, error: error.error });
    }
    return throwError(() => new Error(errorMessage));
  }
}
