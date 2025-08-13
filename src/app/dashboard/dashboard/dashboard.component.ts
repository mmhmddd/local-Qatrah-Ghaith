import { Testimonial } from './../../core/services/testimonials.service';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { JoinRequestService } from '../../core/services/join-request.service';
import { NotificationService, NotificationResponse } from '../../core/services/Notification.service';
import { AddTestimonialsComponent } from '../add-testimonials/add-testimonials.component';
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
  notifications: NotificationResponse['notifications'] = [];
  unreadNotificationsCount: number = 0;
  showNotifications: boolean = false;

  navItems = [
    { label: 'عرض جميع الأعضاء', icon: 'fas fa-users', link: '/all-join-request' },
    { label: 'عرض جميع الطلبات', icon: 'fas fa-file-alt', link: '/requests' },
    { label: 'إضافة كتاب', icon: 'fas fa-book', link: '/add-book' },
    { label: 'إضافة متصدر', icon: 'fas fa-book', link: '/add-leaderboards' },
    { label: 'إضافة صوره في معرض الصور', icon: 'fas fa-img', link: '/add-gallery' }
  ];

  constructor(
    private router: Router,
    private joinRequestService: JoinRequestService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      this.activeNavIndex = this.navItems.findIndex(item => item.link === currentRoute);
    });
  }

  ngOnInit(): void {
    this.loadCounts();
    this.loadNotifications();
  }

  loadCounts(): void {
    this.joinRequestService.getAll().subscribe({
      next: (requests) => {
        this.joinRequestsCount = requests.length;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.message || 'فشل في جلب عدد طلبات الانضمام';
        console.error('Error fetching join requests:', err);
        this.cdr.detectChanges();
      }
    });

    this.joinRequestService.getApprovedMembers().subscribe({
      next: (members) => {
        this.membersCount = members.length;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.message || 'فشل في جلب عدد الأعضاء المعتمدين';
        console.error('Error fetching approved members:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadNotifications(): void {
    console.log('Fetching notifications...');
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        console.log('Notification response:', response);
        if (response.success) {
          this.notifications = response.notifications ?? [];
          this.unreadNotificationsCount = this.notifications.filter(n => !n.read).length;
          console.log('Notifications loaded:', this.notifications);
          console.log('Unread count:', this.unreadNotificationsCount);
          this.cdr.detectChanges();
        } else {
          this.error = response.message || 'فشل في جلب الإشعارات';
          console.error('Notification error:', this.error);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.error = err.message || 'فشل في جلب الإشعارات';
        console.error('Error fetching notifications:', err);
        this.cdr.detectChanges();
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications && this.unreadNotificationsCount > 0 && this.notifications) {
      this.notificationService.markNotificationsAsRead().subscribe({
        next: (response) => {
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
        error: (err) => {
          this.error = err.message || 'فشل في تحديد الإشعارات كمقروءة';
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
