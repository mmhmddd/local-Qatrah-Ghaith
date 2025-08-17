import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { JoinRequest, JoinRequestService, JoinRequestResponse } from '../../core/services/join-request.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-all-members',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, FormsModule],
  templateUrl: './all-members.component.html',
  styleUrls: ['./all-members.component.scss']
})
export class AllMembersComponent implements OnInit, OnDestroy {
  approvedMembers: JoinRequest[] = [];
  filteredMembers: JoinRequest[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  isSidebarVisible = true;
  searchTerm: string = '';
  showConfirmDialog = false;
  memberIdToDelete: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private joinRequestService: JoinRequestService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.fetchApprovedMembers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isSidebarVisible = window.innerWidth > 1024;
    } else {
      this.isSidebarVisible = true;
    }
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  fetchApprovedMembers(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.joinRequestService.getApprovedMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JoinRequestResponse) => {
          if (response.success && response.members) {
            this.approvedMembers = response.members;
            this.filteredMembers = response.members;
            this.successMessage = response.message || 'تم جلب الأعضاء المعتمدين بنجاح';
            this.errorMessage = null;
            this.isLoading = false;
          } else {
            this.errorMessage = response.message || 'فشل في جلب الأعضاء المعتمدين';
            this.approvedMembers = [];
            this.filteredMembers = [];
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'خطأ في جلب الأعضاء المعتمدين';
          this.isLoading = false;
          this.approvedMembers = [];
          this.filteredMembers = [];
          console.error('Error fetching approved members:', error);
          if (error.error === 'Unauthorized') {
            // Optionally redirect to login
            // this.router.navigate(['/login']);
          }
        }
      });
  }

  filterMembers(): void {
    const searchLower = this.searchTerm.toLowerCase().trim();
    if (!searchLower) {
      this.filteredMembers = [...this.approvedMembers];
    } else {
      this.filteredMembers = this.approvedMembers.filter(member =>
        (member.name?.toLowerCase().includes(searchLower) || false) ||
        (member.email?.toLowerCase().includes(searchLower) || false)
      );
    }
  }

  retryFetch(): void {
    this.fetchApprovedMembers();
  }

  trackByMemberId(index: number, member: JoinRequest): any {
    return member.id || index;
  }

  confirmDelete(memberId: string, event: Event): void {
    event.stopPropagation(); // Prevent row click navigation
    this.memberIdToDelete = memberId;
    this.showConfirmDialog = true;
  }

  cancelDelete(): void {
    this.showConfirmDialog = false;
    this.memberIdToDelete = null;
  }

  deleteMember(): void {
    if (!this.memberIdToDelete) {
      this.errorMessage = 'معرف العضو غير موجود';
      this.showConfirmDialog = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.joinRequestService.deleteMember(this.memberIdToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message || 'تم حذف العضو بنجاح';
          this.approvedMembers = this.approvedMembers.filter(member => member.id !== this.memberIdToDelete);
          this.filteredMembers = this.filteredMembers.filter(member => member.id !== this.memberIdToDelete);
          this.isLoading = false;
          this.showConfirmDialog = false;
          this.memberIdToDelete = null;
        },
        error: (error) => {
          this.errorMessage = error.message || 'فشل في حذف العضو';
          this.isLoading = false;
          this.showConfirmDialog = false;
          this.memberIdToDelete = null;
          console.error('Error deleting member:', error);
        }
      });
  }

  exportToExcel(): void {
    // Prepare data for Excel
    const exportData = this.filteredMembers.map(member => ({
      'الاسم': member.name || 'غير محدد',
      'البريد الإلكتروني': member.email || 'غير محدد',
      'رقم الهاتف': member.phone || 'غير محدد',
      'التخصص الجامعي': member.academicSpecialization || 'غير محدد',
      'ساعات التطوع': member.volunteerHours || 0,
      'عدد المحاضرات': member.lectureCount || 0,
      'عدد المواد': member.subjectsCount || 0,
      'المواد': member.subjects.join(', ') || 'غير محدد',
      'عدد الطلاب': member.numberOfStudents || 0
    }));

    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // Define column headers in Arabic
    const headers = {
      'الاسم': 'الاسم',
      'البريد الإلكتروني': 'البريد الإلكتروني',
      'رقم الهاتف': 'رقم الهاتف',
      'التخصص الجامعي': 'التخصص الجامعي',
      'ساعات التطوع': 'ساعات التطوع',
      'عدد المحاضرات': 'عدد المحاضرات',
      'عدد المواد': 'عدد المواد',
      'المواد': 'المواد',
      'عدد الطلاب': 'عدد الطلاب'
    };
    XLSX.utils.sheet_add_aoa(worksheet, [Object.values(headers)], { origin: 'A1' });

    // Create workbook and add the worksheet
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الأعضاء المعتمدون');

    // Generate Excel file and trigger download
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `approved_members_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}
