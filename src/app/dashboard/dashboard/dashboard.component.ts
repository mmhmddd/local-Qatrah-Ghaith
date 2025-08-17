import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { JoinRequestService, JoinRequestResponse } from '../../core/services/join-request.service';
import { filter } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationResponse, AppNotification, NotificationService } from '../../core/services/Notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isSidebarCollapsed = false;
  activeNavIndex = 0;
  joinRequestsCount: number = 0;
  membersCount: number = 0;
  error: string | null = null;
  notifications: AppNotification[] = [];
  unreadNotificationsCount: number = 0;
  showNotifications: boolean = false;

  navItems = [
    { label: 'عرض جميع الأعضاء', icon: 'fas fa-users', link: '/all-members' },
    { label: 'عرض جميع الطلبات', icon: 'fas fa-file-alt', link: '/requests' },
    { label: 'إضافة كتاب', icon: 'fas fa-book', link: '/upload-pdf' },
    { label: 'إضافة متصدر', icon: 'fas fa-trophy', link: '/add-leaderboards' },
    { label: 'إضافة صورة في معرض الصور', icon: 'fas fa-image', link: '/add-gallery' },
    { label: 'إضافة رأي', icon: 'fas fa-comment-dots', link: '/add-testimonials' },
    { label: 'الأعضاء المقصرون', icon: 'fas fa-user-times', link: '/low-lecture-members' },
    { label: 'طلبات pdf المحاضرات', icon: 'fas fa-file-alt', link: '/lectures-request' }
  ];

  constructor(
    private router: Router,
    private joinRequestService: JoinRequestService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.activeNavIndex = this.navItems.findIndex(item => item.link === event.urlAfterRedirects);
        this.cdr.detectChanges();
      });
  }

  ngOnInit(): void {
    this.checkAuth();
    this.loadCounts();
    this.loadNotifications();
  }

  checkAuth(): void {
    if (!localStorage.getItem('token')) {
      this.error = 'غير مسموح بالوصول. يرجى تسجيل الدخول مرة أخرى';
      this.router.navigate(['/login']);
      this.cdr.detectChanges();
    }
  }

  loadCounts(): void {
    this.joinRequestService.getAll().subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success) {
          this.joinRequestsCount = response.members?.length || 0;
        } else {
          this.error = response.message || 'فشل في جلب عدد طلبات الانضمام';
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب عدد طلبات الانضمام';
        console.error('Error fetching join requests:', err);
        this.cdr.detectChanges();
      }
    });

    this.joinRequestService.getApprovedMembers().subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success) {
          this.membersCount = response.members?.length || 0;
        } else {
          this.error = response.message || 'فشل في جلب عدد الأعضاء المعتمدين';
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب عدد الأعضاء المعتمدين';
        if (err.error === 'Unauthorized') {
          this.router.navigate(['/login']);
        }
        console.error('Error fetching approved members:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadNotifications(): void {
    console.log('Fetching notifications...');
    this.notificationService.getNotifications().subscribe({
      next: (response: NotificationResponse) => {
        console.log('Notification response:', response);
        if (response.success) {
          this.notifications = response.notifications ?? [];
          this.unreadNotificationsCount = this.notifications.filter((n: AppNotification) => !n.read).length;
          console.log('Notifications loaded:', this.notifications);
          console.log('Unread count:', this.unreadNotificationsCount);
          this.cdr.detectChanges();
        } else {
          this.error = response.message || 'فشل في جلب الإشعارات';
          console.error('Notification error:', this.error);
          this.cdr.detectChanges();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب الإشعارات';
        console.error('Error fetching notifications:', err);
        this.cdr.detectChanges();
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications && this.unreadNotificationsCount > 0 && this.notifications) {
      this.notificationService.markNotificationsAsRead().subscribe({
        next: (response: NotificationResponse) => {
          console.log('Mark read response:', response);
          if (response.success) {
            this.notifications = response.notifications ?? [];
            this.unreadNotificationsCount = 0;
            this.cdr.detectChanges();
          } else {
            this.error = response.message || 'فشل في تحديد الإشعارات كمقروءة';
            console.error('Mark read error:', this.error);
            this.cdr.detectChanges();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'فشل في تحديد الإشعارات كمقروءة';
          console.error('Error marking notifications as read:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  navigateTo(link: string): void {
    this.router.navigate([link]);
  }
}
