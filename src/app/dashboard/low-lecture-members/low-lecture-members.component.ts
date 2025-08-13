import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LectureService, LowLectureMembersResponse } from '../../core/services/lecture.service';

@Component({
  selector: 'app-low-lecture-members',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './low-lecture-members.component.html',
  styleUrls: ['./low-lecture-members.component.scss'],
})
export class LowLectureMembersComponent implements OnInit {
  members: { _id: string; name: string; email: string; underTargetSubjects: string[] }[] = [];
  error: string | null = null;
  successMessage: string | null = null;

  constructor(private lectureService: LectureService, private router: Router) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      this.error = 'غير مسموح بالوصول. يرجى تسجيل الدخول مرة أخرى';
      this.router.navigate(['/login']);
      return;
    }
    this.loadLowLectureMembers();
  }

  loadLowLectureMembers(): void {
    this.lectureService.getLowLectureMembers().subscribe({
      next: (response: LowLectureMembersResponse) => {
        this.members = response.members || [];
        this.successMessage = response.success ? response.message : null;
        this.error = response.success ? null : response.message;
      },
      error: (err: LowLectureMembersResponse) => {
        this.members = [];
        this.successMessage = null;
        this.error = err.message;
        if (err.message.includes('غير مسموح بالوصول')) {
          this.router.navigate(['/login']);
        }
      },
    });
  }

  viewMember(memberId: string): void {
    this.router.navigate(['/show-member', memberId]);
  }
}
