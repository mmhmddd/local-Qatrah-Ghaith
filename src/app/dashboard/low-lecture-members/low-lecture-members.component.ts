import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  LowLecturesService,
  LowLectureMember,
  UnderTargetStudent,
  LowLectureMembersResponse,
  DeleteMemberResponse
} from '../../core/services/low-lectures.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-low-lecture-members',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './low-lecture-members.component.html',
  styleUrls: ['./low-lecture-members.component.scss']
})
export class LowLectureMembersComponent implements OnInit, OnDestroy {
  members: LowLectureMember[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  loading = false;
  deletingMemberIds: Set<string> = new Set();
  debugInfo: {
    weekStart?: string;
    weekEnd?: string;
    totalUsersProcessed?: number;
    membersWithLowLectures?: number;
  } = {};

  private destroy$ = new Subject<void>();

  constructor(private lowLecturesService: LowLecturesService) {}

  ngOnInit(): void {
    this.fetchLowLectureMembers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchLowLectureMembers(): void {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    console.log('🔍 Fetching low lecture members...');

    this.lowLecturesService.getLowLectureMembers()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response: LowLectureMembersResponse) => {
          console.log('📥 API Response received:', {
            success: response.success,
            message: response.message,
            membersCount: response.members?.length || 0,
            debug: response.debug
          });

          if (response.success) {
            this.members = response.members || [];
            this.debugInfo = response.debug || {};
            this.successMessage = response.message;

            // Log formatted week range for debugging
            console.log('🗓️ Formatted week range:', this.formatWeekRange());
            // Log sample date formatting for verification
            console.log('🗓️ Sample date (2025-08-09):', this.formatDate('2025-08-09T00:00:00Z'));

            setTimeout(() => (this.successMessage = null), 5000);

            console.log('✅ Members loaded successfully:', {
              count: this.members.length,
              debug: this.debugInfo
            });
          } else {
            this.errorMessage = response.message || 'فشل في تحميل البيانات';
            console.warn('⚠️ API returned success=false:', response.message);
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.';
          console.error('❌ Error fetching low lecture members:', error);
        }
      });
  }

  deleteMember(memberId: string, memberName: string): void {
    if (!memberId || typeof memberId !== 'string' || memberId.trim() === '') {
      this.errorMessage = 'معرف العضو غير صالح';
      console.error('Invalid member ID:', memberId);
      return;
    }

    const trimmedMemberId = memberId.trim();
    const confirmMessage = `هل أنت متأكد من إزالة ${memberName || 'هذا العضو'} من تقرير المحاضرات المنخفضة لهذا الأسبوع؟`;
    if (!confirm(confirmMessage)) return;

    if (this.deletingMemberIds.has(trimmedMemberId)) {
      console.warn('Delete operation already in progress for member:', trimmedMemberId);
      return;
    }

    this.deletingMemberIds.add(trimmedMemberId);
    this.errorMessage = null;
    this.successMessage = null;

    console.log('🗑️ Removing member from low lecture report:', { memberId: trimmedMemberId });

    this.lowLecturesService.deleteMember(trimmedMemberId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.deletingMemberIds.delete(trimmedMemberId))
      )
      .subscribe({
        next: (response: DeleteMemberResponse) => {
          if (response.success) {
            this.successMessage = response.message || 'تمت إزالة العضو بنجاح من تقرير المحاضرات المنخفضة';
            console.log('✅ Member removed successfully:', { memberId: trimmedMemberId, message: response.message });

            this.members = this.members.filter(member => member._id !== trimmedMemberId);
            setTimeout(() => (this.successMessage = null), 5000);
          } else {
            this.errorMessage = response.message || 'فشل في إزالة العضو من التقرير';
            console.warn('⚠️ Failed to remove member:', response.message);
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'حدث خطأ أثناء إزالة العضو. الرجاء المحاولة مرة أخرى.';
          console.error('❌ Error removing member:', { memberId: trimmedMemberId, error: error.message });
        }
      });
  }

  refreshData(): void {
    this.successMessage = null;
    this.errorMessage = null;
    this.fetchLowLectureMembers();
  }

  getProgressPercentage(delivered: number, required: number): number {
    if (!required || required === 0) return 0;
    return Math.min(100, Math.round((delivered / required) * 100));
  }

  getSubjectStatus(delivered: number, required: number): string {
    if (!required || required === 0) return 'غير محدد';
    if (delivered === 0) return 'حرج';
    if (delivered < required * 0.5) return 'منخفض';
    if (delivered < required) return 'تحتاج متابعة';
    return 'مكتمل';
  }

  getProgressClass(delivered: number, required: number): string {
    if (!required || required === 0) return '';
    if (delivered < required * 0.5) return 'low';
    if (delivered < required) return 'medium';
    return '';
  }

  getTotalStudentsCount(): number {
    return this.members.reduce((total, member) => total + (member.underTargetStudents?.length || 0), 0);
  }

  getTotalSubjectsCount(): number {
    return this.members.reduce((total, member) => {
      const memberSubjects = member.underTargetStudents?.reduce(
        (subTotal, student) => subTotal + (student.underTargetSubjects?.length || 0),
        0
      ) || 0;
      return total + memberSubjects;
    }, 0);
  }

  formatDate(dateString?: string): string {
    if (!dateString) {
      console.warn('Invalid or missing date string:', dateString);
      return 'تاريخ غير متوفر';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date parsed:', dateString);
        return 'تاريخ غير صالح';
      }
      const formatted = new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'gregory' // Explicitly set Gregorian calendar
      }).format(date);
      // Verify the output is not in Hijri
      if (formatted.includes('هـ')) {
        console.warn('Unexpected Hijri format detected:', formatted);
      }
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'تاريخ غير صالح';
    }
  }

  formatWeekRange(): string {
    if (this.debugInfo.weekStart && this.debugInfo.weekEnd) {
      const start = this.formatDate(this.debugInfo.weekStart);
      const end = this.formatDate(this.debugInfo.weekEnd);
      return `من ${start} إلى ${end}`;
    }
    return 'فترة الأسبوع غير متوفرة';
  }

  trackByMemberId(index: number, member: LowLectureMember): string {
    return member._id || `member-${index}`;
  }

  trackByStudentEmail(index: number, student: UnderTargetStudent): string {
    return student.studentEmail || `student-${index}`;
  }

  isDeleting(memberId: string): boolean {
    return this.deletingMemberIds.has(memberId);
  }

  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}
