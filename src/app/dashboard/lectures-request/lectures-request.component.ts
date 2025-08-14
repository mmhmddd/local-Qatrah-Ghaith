import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LectureRequestService, PendingLectureRequest } from '../../core/services/lecture-request.service';
import { ApiEndpoints } from '../../core/constants/api-endpoints';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface FilteredRequest extends PendingLectureRequest {
  expanded?: boolean;
}

@Component({
  selector: 'app-lectures-request',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './lectures-request.component.html',
  styleUrls: ['./lectures-request.component.scss']
})
export class LecturesRequestComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  lectureRequests: FilteredRequest[] = [];
  filteredRequests: FilteredRequest[] = [];

  // UI state properties
  loading = false;
  searchTerm = '';
  selectedFilter = 'all';
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Success/Error handling
  successMessage = '';
  errorMessage = '';

  // Confirmation dialog
  showConfirmDialog = false;
  confirmAction: 'approve' | 'reject' | null = null;
  selectedRequestId = '';
  selectedRequestTitle = '';

  // Processing state
  processingRequests: Set<string> = new Set();
  loadingPdfs: Map<string, 'view' | 'download'> = new Map();

  // Filter options
  filterOptions = [
    { value: 'all', label: 'جميع الطلبات' },
    { value: 'recent', label: 'الطلبات الحديثة' },
    { value: 'thisWeek', label: 'هذا الأسبوع' },
    { value: 'thisMonth', label: 'هذا الشهر' }
  ];

  // Sort options
  sortOptions = [
    { value: 'createdAt', label: 'تاريخ الإنشاء' },
    { value: 'title', label: 'العنوان' },
    { value: 'subject', label: 'المادة' },
    { value: 'creatorName', label: 'اسم المنشئ' }
  ];

  constructor(
    private lectureRequestService: LectureRequestService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadLectureRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLectureRequests(): void {
    this.loading = true;
    this.clearMessages();

    this.lectureRequestService.getPendingLectureRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.lectureRequests = response.lectureRequests.map(request => ({
              ...request,
              expanded: false
            }));
            this.applyFilters();
            this.showSuccess(response.message);
          } else {
            this.showError('فشل في تحميل طلبات المحاضرات');
          }
          this.loading = false;
        },
        error: (error) => {
          this.showError(error.message || 'حدث خطأ أثناء تحميل البيانات');
          this.loading = false;
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.lectureRequests];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchLower) ||
        request.creatorName.toLowerCase().includes(searchLower) ||
        request.subject.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filter
    if (this.selectedFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(request => {
        const createdDate = new Date(request.createdAt);
        switch (this.selectedFilter) {
          case 'recent':
            return (now.getTime() - createdDate.getTime()) <= (24 * 60 * 60 * 1000); // Last 24 hours
          case 'thisWeek':
            const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            return createdDate >= weekAgo;
          case 'thisMonth':
            const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            return createdDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof FilteredRequest];
      let bValue: any = b[this.sortBy as keyof FilteredRequest];

      if (this.sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredRequests = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  toggleRequestDetails(requestId: string): void {
    const request = this.filteredRequests.find(r => r.id === requestId);
    if (request) {
      request.expanded = !request.expanded;
    }
  }

  showConfirmation(action: 'approve' | 'reject', requestId: string, requestTitle: string): void {
    this.confirmAction = action;
    this.selectedRequestId = requestId;
    this.selectedRequestTitle = requestTitle;
    this.showConfirmDialog = true;
  }

  cancelConfirmation(): void {
    this.showConfirmDialog = false;
    this.confirmAction = null;
    this.selectedRequestId = '';
    this.selectedRequestTitle = '';
  }

  confirmActionSubmit(): void {
    if (this.confirmAction && this.selectedRequestId) {
      this.processLectureRequest(this.selectedRequestId, this.confirmAction);
    }
    this.cancelConfirmation();
  }

  processLectureRequest(requestId: string, action: 'approve' | 'reject'): void {
    if (this.processingRequests.has(requestId)) {
      return; // Prevent duplicate processing
    }

    this.processingRequests.add(requestId);
    this.clearMessages();

    this.lectureRequestService.approveOrRejectLectureRequest(requestId, action)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Remove the processed request from the list
            this.lectureRequests = this.lectureRequests.filter(r => r.id !== requestId);
            this.applyFilters();

            const actionText = action === 'approve' ? 'الموافقة على' : 'رفض';
            this.showSuccess(`تم ${actionText} الطلب بنجاح`);
          } else {
            this.showError(response.message || 'فشل في معالجة الطلب');
          }
          this.processingRequests.delete(requestId);
        },
        error: (error) => {
          this.showError(error.message || 'حدث خطأ أثناء معالجة الطلب');
          this.processingRequests.delete(requestId);
        }
      });
  }

  isProcessing(requestId: string): boolean {
    return this.processingRequests.has(requestId);
  }

  isPdfLoading(requestId: string, action: 'view' | 'download'): boolean {
    return this.loadingPdfs.has(`${action}_${requestId}`);
  }

  refreshData(): void {
    this.loadLectureRequests();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  trackByRequestId(index: number, request: FilteredRequest): string {
    return request.id;
  }

  openPdfFile(requestId: string, fileName: string): void {
    if (this.isPdfLoading(requestId, 'view')) {
      return; // Prevent duplicate requests
    }

    this.loadingPdfs.set(`view_${requestId}`, 'view');
    this.clearMessages();

    // Get the token for authentication
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      this.showError('لا يمكن الوصول للملف، يرجى تسجيل الدخول مرة أخرى');
      this.loadingPdfs.delete(`view_${requestId}`);
      return;
    }

    // Create headers with authorization
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Fetch the PDF as blob with proper authentication
    const pdfUrl = ApiEndpoints.lectureRequests.file(requestId);

    this.http.get(pdfUrl, {
      headers: headers,
      responseType: 'blob'
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        // Create a blob URL and open it
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');

        // Clean up the blob URL after a delay to ensure it loads
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 1000);

        this.loadingPdfs.delete(`view_${requestId}`);
      },
      error: (error) => {
        console.error('Error loading PDF:', error);
        this.showError(error.error?.message || 'فشل في تحميل الملف، يرجى المحاولة مرة أخرى');
        this.loadingPdfs.delete(`view_${requestId}`);
      }
    });
  }

  downloadPdfFile(requestId: string, fileName: string): void {
    if (this.isPdfLoading(requestId, 'download')) {
      return; // Prevent duplicate requests
    }

    this.loadingPdfs.set(`download_${requestId}`, 'download');
    this.clearMessages();

    // Get the token for authentication
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }

    if (!token) {
      this.showError('لا يمكن تحميل الملف، يرجى تسجيل الدخول مرة أخرى');
      this.loadingPdfs.delete(`download_${requestId}`);
      return;
    }

    // Create headers with authorization
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Fetch the PDF as blob for download
    const pdfUrl = ApiEndpoints.lectureRequests.file(requestId);

    this.http.get(pdfUrl, {
      headers: headers,
      responseType: 'blob'
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        // Create a blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
        this.loadingPdfs.delete(`download_${requestId}`);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        this.showError(error.error?.message || 'فشل في تحميل الملف، يرجى المحاولة مرة أخرى');
        this.loadingPdfs.delete(`download_${requestId}`);
      }
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
