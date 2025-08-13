import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const token = localStorage.getItem('token');
    if (token && this.authService.isLoggedIn()) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'admin') {
        return true; // المستخدم مشرف، يسمح بالوصول
      }
    }
    // إعادة توجيه إلى صفحة غير مصرح بها أو الصفحة الرئيسية
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
