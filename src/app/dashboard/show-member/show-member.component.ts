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
  newStudent = { name: '', email: '', phone: '', grade: '', subjects: [] as string[] };
  editMode = false;
  editedVolunteerHours: number = 0;
  editedSubjects: string[] = [];
  editedStudents: { name: string; email: string; phone: string; grade?: string; subjects: string[] }[] = [];
  subjectCount: number = 0;
  subjectInputs: string[] = [];
  activeMessage: { _id: string; content: string; displayUntil: string } | null = null;
  newMessage = { content: '', displayDays: 7 };
  messageError = { content: '', displayDays: '' };
  isLoadingMessages = false;

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
      this.loadMemberMessages(this.memberId);
    } else {
      this.showToast('معرف العضو غير موجود', 'error');
      this.router.navigate(['/']);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  checkAuth() {
    if (!localStorage.getItem('token')) {
      this.showToast('يرجى تسجيل الدخول للوصول إلى تفاصيل العضو', 'error');
      this.router.navigate(['/login']);
    } else if (this.memberId) {
      this.loadMemberMessages(this.memberId);
    }
  }

  loadMemberDetails(id: string): void {
    this.joinRequestService.getMember(id).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.member) {
          this.member = {
            ...response.member,
            id: response.member.id,
            createdAt: new Date(response.member.createdAt).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }),
            lectureCount: response.member.lectureCount || 0,
            lectures: response.member.lectures.map(lecture => ({
              ...lecture,
              createdAt: new Date(lecture.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
            })) || [],
            hasNewLecture: response.member.hasNewLecture || false
          };
          this.editedVolunteerHours = this.member.volunteerHours;
          this.editedSubjects = [...this.member.subjects];
          this.editedStudents = [...this.member.students.map(student => ({
            ...student,
            grade: student.grade || '',
            subjects: student.subjects || []
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

  updateSubjectInputs(): void {
    const currentLength = this.subjectInputs.length;
    const newLength = Number(this.subjectCount);
    if (newLength > currentLength) {
      for (let i = currentLength; i < newLength; i++) {
        this.subjectInputs.push('');
      }
    } else if (newLength < currentLength) {
      this.subjectInputs.length = newLength;
    }
  }

  clearSubjectInputs(): void {
    this.subjectCount = 0;
    this.subjectInputs = [];
    this.newStudent.subjects = [];
  }

  updateStudentSubjects(index: number, value: string): void {
    this.editedStudents[index].subjects = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
  }

  addStudent(): void {
    if (!this.memberId) {
      this.showToast('معرف العضو غير موجود', 'error');
      return;
    }

    if (!this.newStudent.name.trim() || !this.newStudent.email.trim() || !this.newStudent.phone.trim()) {
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

    let subjects: string[] = [];
    if (this.subjectCount > 0) {
      const validSubjects = this.subjectInputs
        .map(subject => subject.trim())
        .filter(subject => subject !== '');
      if (validSubjects.length !== Number(this.subjectCount)) {
        this.showToast(`يرجى إدخال ${this.subjectCount} مادة/مواد بالكامل`, 'error');
        return;
      }
      if (validSubjects.some(subject => subject.length < 1 || subject.length > 100)) {
        this.showToast('كل مادة يجب أن تكون بين 1 و100 حرف', 'error');
        return;
      }
      subjects = validSubjects;
    }

    this.joinRequestService.addStudent(
      this.memberId,
      this.newStudent.name.trim(),
      this.newStudent.email.trim(),
      this.newStudent.phone.trim(),
      this.newStudent.grade?.trim() || undefined,
      subjects
    ).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.data && this.member) {
          this.member.students = response.data.students;
          this.member.numberOfStudents = response.data.numberOfStudents;
          this.member.subjects = response.data.subjects;
          this.editedStudents = [...this.member.students.map(student => ({
            ...student,
            grade: student.grade || '',
            subjects: student.subjects || []
          }))];
          this.editedSubjects = [...this.member.subjects];
          this.newStudent = { name: '', email: '', phone: '', grade: '', subjects: [] };
          this.clearSubjectInputs();
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
        subjects: student.subjects || []
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
    if (this.editedStudents.some(student => student.subjects.some(subject => subject.length < 1 || subject.length > 100))) {
      this.showToast('كل مادة يجب أن تكون بين 1 و100 حرف إذا تم توفيرها', 'error');
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
    if (subject.trim() && !this.editedSubjects.includes(subject.trim())) {
      this.editedSubjects.push(subject.trim());
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

  loadMemberMessages(id: string): void {
    this.isLoadingMessages = true;
    this.joinRequestService.getMember(id).subscribe({
      next: (response: JoinRequestResponse) => {
        this.isLoadingMessages = false;
        if (response.success && response.member) {
          const messages = response.member.messages || [];
          const activeMessages = messages.filter(
            (msg: { _id: string; content: string; displayUntil: string }) =>
              new Date(msg.displayUntil) > new Date()
          );
          this.activeMessage = activeMessages.length > 0 ? {
            _id: activeMessages[0]._id,
            content: activeMessages[0].content,
            displayUntil: new Date(activeMessages[0].displayUntil).toISOString()
          } : null;
          this.newMessage = { content: '', displayDays: 7 };
          this.messageError = { content: '', displayDays: '' };
        } else {
          this.showToast(response.message || 'فشل في جلب الرسائل', 'error');
          this.activeMessage = null;
        }
      },
      error: (err) => {
        this.isLoadingMessages = false;
        this.showToast(err.message || 'حدث خطأ أثناء جلب الرسائل', 'error');
        console.error('Load messages error:', err);
        this.activeMessage = null;
      }
    });
  }

  sendMessage(): void {
    if (!this.memberId) {
      this.showToast('معرف العضو غير موجود', 'error');
      return;
    }
    this.messageError = { content: '', displayDays: '' };
    if (!this.newMessage.content.trim()) {
      this.messageError.content = 'نص الرسالة مطلوب';
      this.showToast('يرجى إدخال نص الرسالة', 'error');
      return;
    }
    if (this.newMessage.content.length > 1000) {
      this.messageError.content = 'الرسالة يجب أن تكون أقل من 1000 حرف';
      this.showToast('الرسالة طويلة جدًا', 'error');
      return;
    }
    if (!Number.isInteger(this.newMessage.displayDays) || this.newMessage.displayDays < 1 || this.newMessage.displayDays > 30) {
      this.messageError.displayDays = 'عدد الأيام يجب أن يكون بين 1 و30';
      this.showToast('عدد الأيام غير صالح', 'error');
      return;
    }
    this.joinRequestService.sendMessage(this.memberId, this.newMessage.content.trim(), this.newMessage.displayDays).subscribe({
      next: (response) => {
        if (response.success) {
          this.activeMessage = { _id: response.data._id || '', content: this.newMessage.content, displayUntil: response.data.displayUntil };
          this.newMessage = { content: '', displayDays: 7 };
          this.showToast(response.message || 'تم إرسال الرسالة بنجاح', 'success');
          this.loadMemberMessages(this.memberId!); // Refresh messages
        } else {
          this.showToast(response.message || 'فشل في إرسال الرسالة', 'error');
        }
      },
      error: (err) => {
        if (err.data && err.data._id) {
          this.activeMessage = err.data;
          this.showToast('يوجد رسالة نشطة بالفعل، يرجى حذفها أولاً', 'error');
        } else {
          this.showToast(err.message || 'حدث خطأ أثناء إرسال الرسالة', 'error');
        }
        console.error('Send message error:', err);
      }
    });
  }

  deleteMessage(): void {
    if (!this.memberId || !this.activeMessage) {
      this.showToast('معرف العضو أو الرسالة غير موجود', 'error');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      this.joinRequestService.deleteMessage(this.memberId, this.activeMessage._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.activeMessage = null;
            this.newMessage = { content: '', displayDays: 7 };
            this.messageError = { content: '', displayDays: '' };
            this.showToast(response.message || 'تم حذف الرسالة بنجاح', 'success');
            this.loadMemberMessages(this.memberId!); // Refresh messages
          } else {
            this.showToast(response.message || 'فشل في حذف الرسالة', 'error');
          }
        },
        error: (err) => {
          this.showToast(err.message || 'حدث خطأ أثناء حذف الرسالة', 'error');
          console.error('Delete message error:', err);
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
