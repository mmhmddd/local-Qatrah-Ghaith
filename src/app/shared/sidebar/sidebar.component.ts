import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isSidebarCollapsed = false;
  activeNavIndex = 0;

  navItems = [
    { label: 'لوحة التحكم الرئيسية', icon: 'fas fa-users', link: '/dashboard' },
    { label: 'عرض جميع الأعضاء', icon: 'fas fa-users', link: '/all-members' },
    { label: 'عرض جميع الطلبات', icon: 'fas fa-file-alt', link: '/all-join-request' },
    { label: 'عرض جميع طلبات المحاضرات', icon: 'fas fa-file-alt', link: '/lectures-request' },
    { label: 'إضافة كتاب', icon: 'fas fa-plus', link: '/upload-pdf' },
    { label: 'إضافة رأي', icon: 'fas fa-plus', link: '/add-testimonials' },
    { label: 'إضافة متصدر', icon: 'fas fa-plus', link: '/add-leaderboards' },
    { label: 'إضافة صوره الي المعرض ', icon: 'fas fa-plus', link: '/add-gallery' },
    { label: 'العضاء المقصرون', icon: 'fas fa-user-times', link: '/low-lecture-members', class: 'low-lecture-members' }

  ];

  constructor(private router: Router, private authService: AuthService) {
    // Set active nav based on current route
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      this.activeNavIndex = this.navItems.findIndex(item => item.link === currentRoute);
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  setActiveNav(index: number) {
    this.activeNavIndex = index;
  }

  goHome() {
    this.router.navigate(['/home']);
    this.activeNavIndex = -1; // Reset active nav since home is not in navItems
  }

  goBack() {
    window.history.back();
  }

  logout() {
    try {
      this.authService.logout();
      this.router.navigate(['/home']);
    } catch (err) {
      console.error('Logout failed:', err);
      this.router.navigate(['/login']);
    }
  }
}
