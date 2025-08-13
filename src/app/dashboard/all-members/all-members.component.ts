import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { JoinRequest, JoinRequestService } from '../../core/services/join-request.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { FormsModule } from '@angular/forms';

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
        next: (members) => {
          this.approvedMembers = members;
          this.filteredMembers = members;
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'خطأ في جلب الأعضاء المعتمدين';
          this.isLoading = false;
          console.error('Error fetching approved members:', error);
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
}
