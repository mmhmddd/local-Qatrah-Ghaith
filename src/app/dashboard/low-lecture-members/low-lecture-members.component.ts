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
  members: { _id: string; name: string; email: string; underTargetSubjects: { name: string; minLectures: number; deliveredLectures: number }[] }[] = [];
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
        this.members = (response.members || []).map(member => ({
          ...member,
          underTargetSubjects: member['underTargetSubjects'].map((subject: { name: any; minLectures: any; deliveredLectures: any; }) => ({
            name: subject.name,
            minLectures: subject.minLectures || 2, // Default to 2 if not provided
            deliveredLectures: subject.deliveredLectures || 0 // Default to 0 if not provided
          }))
        }));
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

  getUnderTargetSubjectsDisplay(subjects: { name: string; minLectures: number; deliveredLectures: number }[]): string {
    return subjects.length > 0
      ? subjects.map(s => `${s.name} (الحد الأدنى: ${s.minLectures}, تم تسليم: ${s.deliveredLectures})`).join(', ')
      : 'لا توجد مواد';
  }

  viewMember(memberId: string): void {
    this.router.navigate(['/show-member', memberId]);
  }
}
