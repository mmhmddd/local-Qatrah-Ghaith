import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { JoinRequestService, JoinRequestResponse, JoinRequest } from '../../core/services/join-request.service';
import { NotificationResponse, AppNotification, NotificationService } from '../../core/services/Notification.service';
import { filter } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
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
  pendingCount: number = 0;
  approvedCount: number = 0;
  rejectedCount: number = 0;
  topVolunteers: JoinRequest[] = [];

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top', labels: { font: { size: 12, family: 'Noto Kufi Arabic' } } },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(2) + '%';
            return `${label}: ${value} (${percentage})`;
          },
        },
      },
    },
  };
  pieChartLabels: string[] = ['المعلقة', 'المقبولة', 'المرفوضة'];
  pieChartData: ChartData<'pie', number[]> = {
    labels: this.pieChartLabels,
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#FFC107', '#28A745', '#DC3545'],
        label: 'حالة الطلبات',
      },
    ],
  };
  pieChartType: ChartType = 'pie';

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value} ساعة تطوع`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'الأعضاء', font: { size: 14, family: 'Noto Kufi Arabic' } } },
      y: { title: { display: true, text: 'ساعات التطوع', font: { size: 14, family: 'Noto Kufi Arabic' } }, beginAtZero: true },
    },
  };
  barChartLabels: string[] = [];
  barChartData: ChartData<'bar', number[]> = {
    labels: this.barChartLabels,
    datasets: [
      {
        data: [],
        backgroundColor: ['#00adb5', '#0097b2', '#ff914d', '#545454', '#1a1a1a'],
        label: 'ساعات التطوع',
        borderRadius: 4,
      },
    ],
  };
  barChartType: ChartType = 'bar';

  navItems = [
    { label: 'عرض جميع الأعضاء', icon: 'fas fa-users', link: '/all-members' },
    { label: 'عرض جميع الطلبات', icon: 'fas fa-file-alt', link: '/requests' },
    { label: 'إضافة كتاب', icon: 'fas fa-book', link: '/upload-pdf' },
    { label: 'إضافة متصدر', icon: 'fas fa-trophy', link: '/add-leaderboards' },
    { label: 'إضافة صورة في معرض الصور', icon: 'fas fa-image', link: '/add-gallery' },
    { label: 'إضافة رأي', icon: 'fas fa-comment-dots', link: '/add-testimonials' },
    { label: 'الأعضاء المقصرون', icon: 'fas fa-user-times', link: '/low-lecture-members' },
    { label: 'طلبات pdf المحاضرات', icon: 'fas fa-file-alt', link: '/lectures-request' },
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
        this.activeNavIndex = this.navItems.findIndex((item) => item.link === event.urlAfterRedirects);
        this.cdr.detectChanges();
      });
  }

  ngOnInit(): void {
    this.checkAuth();
    this.loadCounts();
    this.loadNotifications();
    this.loadTopVolunteers();
  }

  checkAuth(): void {
    if (!localStorage.getItem('token')) {
      this.error = 'غير مسموح بالوصول. يرجى تسجيل الدخول مرة أخرى';
      this.router.navigate(['/login']);
      this.cdr.detectChanges();
    }
  }

  loadCounts(): void {
    forkJoin({
      all: this.joinRequestService.getAll(),
      approved: this.joinRequestService.getApprovedMembers(),
    }).subscribe({
      next: ({ all, approved }) => {
        if (all.success && approved.success) {
          const allRequests = all.members || [];
          this.pendingCount = allRequests.filter((m) => m.status === 'Pending').length;
          this.rejectedCount = allRequests.filter((m) => m.status === 'Rejected').length;
          this.joinRequestsCount = allRequests.length;
          this.approvedCount = approved.members?.length || 0;
          this.membersCount = this.approvedCount;
          this.updateChart();
        } else {
          this.error = all.message || approved.message || 'فشل في جلب البيانات';
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب عدد الطلبات والأعضاء';
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
        console.error('Error fetching counts:', err);
        this.cdr.detectChanges();
      },
    });
  }

  updateChart(): void {
    this.pieChartData = {
      labels: this.pieChartLabels,
      datasets: [
        {
          data: [this.pendingCount, this.approvedCount, this.rejectedCount],
          backgroundColor: ['#FFC107', '#28A745', '#DC3545'],
          label: 'حالة الطلبات',
        },
      ],
    };
    this.cdr.detectChanges();
  }

  loadTopVolunteers(): void {
    this.joinRequestService.getApprovedMembers().subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.members) {
          this.topVolunteers = response.members
            .sort((a, b) => (b.volunteerHours || 0) - (a.volunteerHours || 0))
            .slice(0, 5);
          this.updateBarChart();
        } else {
          this.error = response.message || 'فشل في جلب بيانات المتطوعين';
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب بيانات المتطوعين';
        console.error('Error fetching top volunteers:', err);
        this.cdr.detectChanges();
      },
    });
  }

  updateBarChart(): void {
    this.barChartLabels = this.topVolunteers.map((member) => member.name || 'غير معروف');
    this.barChartData = {
      labels: this.barChartLabels,
      datasets: [
        {
          data: this.topVolunteers.map((member) => member.volunteerHours || 0),
          backgroundColor: ['#00adb5', '#0097b2', '#ff914d', '#545454', '#1a1a1a'],
          label: 'ساعات التطوع',
          borderRadius: 4,
        },
      ],
    };
    this.cdr.detectChanges();
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
      },
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
        },
      });
    }
  }

  navigateTo(link: string): void {
    this.router.navigate([link]);
  }
}
