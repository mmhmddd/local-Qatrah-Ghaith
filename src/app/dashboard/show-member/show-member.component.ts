import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinRequestService, JoinRequestResponse, JoinRequest } from '../../core/services/join-request.service';
import { LectureService, LectureResponse } from '../../core/services/lecture.service';
import { NotificationService, NotificationResponse } from '../../core/services/Notification.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-show-member',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './show-member.component.html',
  styleUrls: ['./show-member.component.scss']
})
export class ShowMemberComponent implements OnInit {
  member: JoinRequest | null = null;
  toastMessage: { message: string; type: 'success' | 'error' } | null = null;
  memberId: string | null = null;
  newStudent = { name: '', email: '', phone: '', grade: '', subject: '' };
  editMode = false;
  editedVolunteerHours: number = 0;
  editedSubjects: string[] = [];
  editedStudents: { name: string; email: string; phone: string; grade?: string; subject?: string }[] = [];

  constructor(
    private joinRequestService: JoinRequestService,
    private lectureService: LectureService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuth();
    this.memberId = this.route.snapshot.paramMap.get('id');
    if (this.memberId) {
      this.loadMemberDetails(this.memberId);
      this.loadNotifications();
    } else {
      this.showToast('معرف العضو غير موجود', 'error');
    }
  }

  checkAuth() {
    if (!localStorage.getItem('token')) {
      this.showToast('يرجى تسجيل الدخول للوصول إلى تفاصيل العضو', 'error');
      this.router.navigate(['/login']);
    }
  }

  loadMemberDetails(id: string): void {
    this.joinRequestService.getMember(id).subscribe({
      next: (response: JoinRequestResponse) => {
        console.log('Member response:', response);
        if (response.success && response.member) {
          this.member = {
            ...response.member,
            id: response.member.id || response.member.id,
            createdAt: new Date(response.member.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }), // Format member createdAt as Gregorian (Miladi)
            lectureCount: response.member.lectureCount || 0,
            lectures: response.member.lectures.map(lecture => ({
              ...lecture,
              createdAt: new Date(lecture.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }) // Format lecture createdAt as Gregorian (Miladi)
            })) || [],
            hasNewLecture: response.member.hasNewLecture || false
          };
          this.editedVolunteerHours = this.member.volunteerHours;
          this.editedSubjects = [...this.member.subjects];
          this.editedStudents = [...this.member.students.map(student => ({
            ...student,
            grade: student.grade || '',
            subject: student.subject || ''
          }))];
          this.checkMonthlyLectures();
          this.showToast('تم جلب بيانات العضو بنجاح', 'success');
        } else {
          this.showToast(response.message || 'فشل في جلب بيانات العضو', 'error');
        }
      },
      error: (err) => {
        this.showToast(err.message || 'حدث خطأ أثناء جلب بيانات العضو', 'error');
        console.error('Member loading error:', err);
      }
    });
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (response: NotificationResponse) => {
        if (response.success && response.notifications && this.member) {
          const unreadLectureNotifications = response.notifications
            .filter(n => n.type === 'lecture_added' && !n.read && n.lectureDetails)
            .map(n => ({
              link: n.lectureDetails!.link,
              name: n.lectureDetails!.name,
              subject: n.lectureDetails!.subject
            }));

          this.member.lectures = this.member.lectures.map(lecture => ({
            ...lecture,
            hasNewLecture: unreadLectureNotifications.some(n =>
              n.link === lecture.link &&
              n.name === lecture.name &&
              n.subject === lecture.subject
            )
          }));

          // Mark notifications as read after loading
          this.markNotificationsAsRead();
        }
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.showToast('خطأ في جلب الإشعارات', 'error');
      }
    });
  }

  markNotificationsAsRead(): void {
    this.notificationService.markNotificationsAsRead().subscribe({
      next: (response: NotificationResponse) => {
        if (response.success && this.member) {
          this.member.lectures = this.member.lectures.map(lecture => ({
            ...lecture,
            hasNewLecture: false
          }));
        }
      },
      error: (err) => {
        console.error('Error marking notifications as read:', err);
        this.showToast('خطأ في تحديد الإشعارات كمقروءة', 'error');
      }
    });
  }

  checkMonthlyLectures(): void {
    if (this.member && this.member.lectures) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyLectures = this.member.lectures.filter(lecture => new Date(lecture.createdAt) >= startOfMonth).length;
      this.member.showLectureWarning = monthlyLectures < 2;
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  addStudent(): void {
    if (!this.memberId) {
      this.showToast('معرف العضو غير موجود', 'error');
      return;
    }
    if (!this.newStudent.name || !this.newStudent.email || !this.newStudent.phone) {
      this.showToast('يرجى إدخال جميع تفاصيل الطالب الأساسية (الاسم، البريد الإلكتروني، الهاتف)', 'error');
      return;
    }
    if (!this.isValidEmail(this.newStudent.email)) {
      this.showToast('البريد الإلكتروني للطالب غير صالح', 'error');
      return;
    }
    if (this.newStudent.grade && (this.newStudent.grade.length < 1 || this.newStudent.grade.length > 50)) {
      this.showToast('الصف يجب أن يكون بين 1 و50 حرفًا إذا تم توفيره', 'error');
      return;
    }
    if (this.newStudent.subject && (this.newStudent.subject.length < 1 || this.newStudent.subject.length > 100)) {
      this.showToast('المادة يجب أن تكون بين 1 و100 حرف إذا تم توفيرها', 'error');
      return;
    }
    this.joinRequestService.addStudent(
      this.memberId,
      this.newStudent.name,
      this.newStudent.email,
      this.newStudent.phone,
      this.newStudent.grade || undefined,
      this.newStudent.subject || undefined
    ).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.data && this.member) {
          this.member.students = response.data.students;
          this.member.numberOfStudents = response.data.numberOfStudents;
          this.editedStudents = [...this.member.students.map(student => ({
            ...student,
            grade: student.grade || '',
            subject: student.subject || ''
          }))];
          this.newStudent = { name: '', email: '', phone: '', grade: '', subject: '' };
          this.showToast(response.message || 'تم إضافة الطالب بنجاح', 'success');
          this.checkMonthlyLectures();
        } else {
          this.showToast(response.message || 'فشل في إضافة الطالب', 'error');
        }
      },
      error: (err) => {
        this.showToast(err.message || 'حدث خطأ أثناء إضافة الطالب', 'error');
        console.error('Add student error:', err);
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.member) {
      this.editedVolunteerHours = this.member.volunteerHours;
      this.editedSubjects = [...this.member.subjects];
      this.editedStudents = [...this.member.students.map(student => ({
        ...student,
        grade: student.grade || '',
        subject: student.subject || ''
      }))];
    }
  }

  saveChanges(): void {
    if (!this.memberId) {
      this.showToast('معرف العضو غير موجود', 'error');
      return;
    }
    if (this.editedVolunteerHours < 0 || !Number.isInteger(this.editedVolunteerHours)) {
      this.showToast('يجب أن تكون ساعات التطوع رقمًا صحيحًا غير سالب', 'error');
      return;
    }
    if (this.editedStudents.some(student => !student.name || !student.email || !student.phone || !this.isValidEmail(student.email))) {
      this.showToast('بيانات الطلاب يجب أن تحتوي على الاسم، البريد الإلكتروني الصحيح، والهاتف', 'error');
      return;
    }
    if (this.editedStudents.some(student => student.grade && (student.grade.length < 1 || student.grade.length > 50))) {
      this.showToast('الصف يجب أن يكون بين 1 و50 حرفًا إذا تم توفيره', 'error');
      return;
    }
    if (this.editedStudents.some(student => student.subject && (student.subject.length < 1 || student.subject.length > 100))) {
      this.showToast('المادة يجب أن تكون بين 1 و100 حرف إذا تم توفيرها', 'error');
      return;
    }
    this.joinRequestService.updateMemberDetails(
      this.memberId,
      this.editedVolunteerHours,
      this.editedStudents.length,
      this.editedStudents,
      this.editedSubjects
    ).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.data && this.member) {
          this.member.volunteerHours = response.data.volunteerHours;
          this.member.numberOfStudents = response.data.numberOfStudents;
          this.member.students = response.data.students;
          this.member.subjects = response.data.subjects;
          this.editMode = false;
          this.showToast(response.message || 'تم تحديث تفاصيل العضو بنجاح', 'success');
          this.checkMonthlyLectures();
        } else {
          this.showToast(response.message || 'فشل في تحديث تفاصيل العضو', 'error');
        }
      },
      error: (err) => {
        this.showToast(err.message || 'حدث خطأ أثناء تحديث تفاصيل العضو', 'error');
        console.error('Update member error:', err);
      }
    });
  }

  deleteStudent(index: number): void {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      this.editedStudents.splice(index, 1);
    }
  }

  addSubject(subject: string): void {
    if (subject && !this.editedSubjects.includes(subject)) {
      this.editedSubjects.push(subject);
    }
  }

  removeSubject(index: number): void {
    this.editedSubjects.splice(index, 1);
  }

  deleteLecture(index: number): void {
    if (!this.memberId || !this.member || !this.member.lectures[index] || !this.member.lectures[index]._id) {
      this.showToast('لا يمكن حذف المحاضرة، تحقق من البيانات', 'error');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
      const lectureId = this.member.lectures[index]._id;
      this.lectureService.deleteLecture(lectureId).subscribe({
        next: (response: LectureResponse) => {
          if (response.success) {
            this.member!.lectures.splice(index, 1);
            this.member!.lectureCount = (this.member!.lectureCount || 0) - 1;
            this.showToast(response.message || 'تم حذف المحاضرة بنجاح', 'success');
            this.checkMonthlyLectures();
          } else {
            this.showToast(response.message || 'فشل في حذف المحاضرة', 'error');
          }
        },
        error: (err) => {
          this.showToast(err.message || 'حدث خطأ أثناء حذف المحاضرة', 'error');
          console.error('Delete lecture error:', err);
        }
      });
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = { message, type };
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }
}
