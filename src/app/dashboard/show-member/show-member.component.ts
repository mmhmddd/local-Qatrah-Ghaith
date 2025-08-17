import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinRequestService, JoinRequestResponse, JoinRequest } from '../../core/services/join-request.service';
import { LectureService, LectureResponse, LowLectureMembersResponse } from '../../core/services/lecture.service';
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
  toasts: { id: string; title: string; message: string; type: 'success' | 'error' }[] = [];
  memberId: string | null = null;
  newStudent = {
    name: '',
    email: '',
    phone: '',
    grade: '',
    subjects: [] as string[],
    minLectures: [] as number[],
    subjectsString: ''
  };
  studentErrors = { name: '', email: '', phone: '', grade: '', subjects: '', minLectures: [] as string[] };
  editMode = false;
  editedVolunteerHours: number = 0;
  editedSubjects: string[] = [];
  editedStudents: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[]; subjectsString: string }[] = [];
  activeMessage: { _id: string; content: string; displayUntil: string } | null = null;
  newMessage = { content: '', displayDays: 7 };
  messageError = { content: '', displayDays: '' };
  isLoadingMessages = false;
  showLectureWarning = false;

  constructor(
    private joinRequestService: JoinRequestService,
    private lectureService: LectureService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkAuth();
    this.memberId = this.route.snapshot.paramMap.get('id');
    if (this.memberId) {
      this.loadMemberDetails(this.memberId);
      this.loadMemberMessages(this.memberId);
      this.loadLowLectureMembers();
    } else {
      this.showToast('خطأ', 'معرف العضو غير موجود', 'error');
      this.router.navigate(['/']);
    }
  }

  checkAuth(): void {
    if (!localStorage.getItem('token')) {
      this.showToast('خطأ في تسجيل الدخول', 'يرجى تسجيل الدخول للوصول إلى تفاصيل العضو', 'error');
      this.router.navigate(['/login']);
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
            lectures: response.member.lectures?.map(lecture => ({
              ...lecture,
              date: new Date(lecture.date).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
            })) || [],
            students: response.member.students?.map((student) => ({
              ...student,
              name: student.name || 'غير محدد',
              email: student.email || 'غير محدد',
              phone: student.phone || 'غير محدد',
              grade: student.grade || 'غير محدد',
              subjects: (student.subjects || []).map(subject => ({
                name: subject.name || 'غير محدد',
                minLectures: subject.minLectures ?? 0
              }))
            })) || []
          };
          this.editedVolunteerHours = this.member.volunteerHours;
          this.editedSubjects = [...this.member.subjects];
          this.editedStudents = [...this.member.students.map((student) => ({
            ...student,
            grade: student.grade || '',
            subjects: [...student.subjects],
            subjectsString: student.subjects.map(s => s.name).join(', ')
          }))];
          this.showToast('نجاح', 'تم جلب بيانات العضو بنجاح', 'success');
        } else {
          this.showToast('خطأ', response.message || 'فشل في جلب بيانات العضو', 'error');
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message || err.message || 'حدث خطأ أثناء جلب بيانات العضو';
        this.showToast('خطأ في جلب البيانات', errorMessage, 'error');
        console.error('Member loading error:', err);
      }
    });
  }

  loadLowLectureMembers(): void {
    this.lectureService.getLowLectureMembers().subscribe({
      next: (response: LowLectureMembersResponse) => {
        if (response.success && this.memberId) {
          const memberData = response.members.find(m => m.id === this.memberId);
          this.showLectureWarning = !!memberData && memberData.lowLectureStudents.length > 0;
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'خطأ في جلب بيانات الأعضاء ذوي المحاضرات المنخفضة';
        this.showToast('خطأ', errorMessage, 'error');
        console.error('Error loading low lecture members:', err);
      }
    });
  }

  loadMemberMessages(id: string): void {
    this.isLoadingMessages = true;
    this.joinRequestService.getMember(id).subscribe({
      next: (response: JoinRequestResponse) => {
        this.isLoadingMessages = false;
        if (response.success && response.member) {
          const messages = response.member.messages || [];
          const activeMessages = messages.filter(
            (msg) => new Date(msg.displayUntil) > new Date()
          );
          this.activeMessage = activeMessages.length > 0 ? {
            _id: activeMessages[0]._id,
            content: activeMessages[0].content,
            displayUntil: new Date(activeMessages[0].displayUntil).toISOString()
          } : null;
          this.newMessage = { content: '', displayDays: 7 };
          this.messageError = { content: '', displayDays: '' };
        } else {
          this.showToast('خطأ', response.message || 'فشل في جلب الرسائل', 'error');
        }
      },
      error: (err) => {
        this.isLoadingMessages = false;
        const errorMessage = err.error?.message || 'حدث خطأ أثناء جلب الرسائل';
        this.showToast('خطأ في جلب الرسائل', errorMessage, 'error');
        console.error('Load messages error:', err);
        this.activeMessage = null;
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidSubjects(subjects: { name: string; minLectures: number }[]): boolean {
    return subjects.every(subject =>
      subject.name && subject.name.trim() && this.member?.subjects.includes(subject.name) &&
      Number.isInteger(subject.minLectures) && subject.minLectures >= 0
    );
  }

  updateStudentSubjects(index: number, value: string): void {
    const subjects = value
      ? value.split(',').map(s => s.trim()).filter(s => s).map(name => ({
          name,
          minLectures: this.editedStudents[index].subjects.find(s => s.name === name)?.minLectures || 0
        }))
      : [];
    this.editedStudents[index].subjects = subjects;
    this.editedStudents[index].subjectsString = value;
  }

  updateNewStudentSubjects(value: string): void {
    const subjects = value
      ? value.split(',').map(s => s.trim()).filter(s => s)
      : [];
    this.newStudent.subjects = subjects;
    this.newStudent.minLectures = subjects.map((_, index) =>
      this.newStudent.minLectures[index] !== undefined ? this.newStudent.minLectures[index] : 0
    );
    this.validateMinLectures();
  }

  validateMinLectures(): void {
    this.studentErrors.minLectures = this.newStudent.subjects.map((_, index) => {
      const value = this.newStudent.minLectures[index];
      if (!Number.isInteger(value) || value < 0) {
        return 'الحد الأدنى للمحاضرات يجب أن يكون رقمًا صحيحًا غير سالب';
      }
      return '';
    });
  }

  getSubjectsDisplay(subjects: { name: string; minLectures: number }[]): string {
    const validSubjects = subjects.filter(subject =>
      subject.name && typeof subject.name === 'string' && subject.name.trim() &&
      Number.isInteger(subject.minLectures) && subject.minLectures >= 0
    );
    return validSubjects.length > 0
      ? validSubjects.map(s => `${s.name} (${s.minLectures} محاضرة)`).join(', ')
      : 'لا توجد مواد';
  }

  isValidEditedStudents(): boolean {
    if (this.editedVolunteerHours < 0 || !Number.isInteger(this.editedVolunteerHours)) {
      return false;
    }
    return !this.editedStudents.some(student =>
      !student.name.trim() ||
      !student.email.trim() ||
      !student.phone.trim() ||
      !this.isValidEmail(student.email) ||
      (student.grade && (student.grade.length < 1 || student.grade.length > 50)) ||
      (student.subjects.length > 0 && !this.isValidSubjects(student.subjects))
    );
  }

  isValidNewStudent(): boolean {
    this.studentErrors = { name: '', email: '', phone: '', grade: '', subjects: '', minLectures: [] };
    let isValid = true;

    if (!this.newStudent.name.trim()) {
      this.studentErrors.name = 'الاسم مطلوب';
      isValid = false;
    } else if (this.newStudent.name.length > 100) {
      this.studentErrors.name = 'الاسم طويل جدًا';
      isValid = false;
    }

    if (!this.newStudent.email.trim()) {
      this.studentErrors.email = 'البريد الإلكتروني مطلوب';
      isValid = false;
    } else if (!this.isValidEmail(this.newStudent.email)) {
      this.studentErrors.email = 'البريد الإلكتروني غير صالح';
      isValid = false;
    }

    if (!this.newStudent.phone.trim()) {
      this.studentErrors.phone = 'رقم الهاتف مطلوب';
      isValid = false;
    } else if (!/^\+?\d{10,15}$/.test(this.newStudent.phone)) {
      this.studentErrors.phone = 'رقم الهاتف غير صالح';
      isValid = false;
    }

    if (this.newStudent.grade && (this.newStudent.grade.length < 1 || this.newStudent.grade.length > 50)) {
      this.studentErrors.grade = 'الصف يجب أن يكون بين 1 و50 حرفًا';
      isValid = false;
    }

    if (this.newStudent.subjects.length > 0) {
      if (this.newStudent.subjects.some(subject => !subject || subject.length < 1 || subject.length > 100)) {
        this.studentErrors.subjects = 'كل مادة يجب أن تكون بين 1 و100 حرف';
        isValid = false;
      } else if (this.newStudent.subjects.some(subject => !this.member?.subjects.includes(subject))) {
        this.studentErrors.subjects = 'يجب اختيار مواد من قائمة المواد المتاحة';
        isValid = false;
      } else if (this.newStudent.subjects.length !== this.newStudent.minLectures.length) {
        this.studentErrors.subjects = 'عدد المواد لا يتطابق مع عدد الحد الأدنى للمحاضرات';
        isValid = false;
      } else if (this.newStudent.minLectures.some((lectures) => !Number.isInteger(lectures) || lectures < 0)) {
        this.studentErrors.subjects = 'الحد الأدنى للمحاضرات يجب أن يكون رقمًا صحيحًا غير سالب';
        this.studentErrors.minLectures = this.newStudent.minLectures.map((lectures) =>
          !Number.isInteger(lectures) || lectures < 0
            ? 'الحد الأدنى للمحاضرات يجب أن يكون رقمًا صحيحًا غير سالب'
            : ''
        );
        isValid = false;
      }
    }

    return isValid;
  }

  addStudent(studentForm: NgForm): void {
    if (!this.memberId) {
      this.showToast('خطأ', 'معرف العضو غير موجود', 'error');
      return;
    }
    if (!this.isValidNewStudent()) {
      this.showToast('خطأ في البيانات', 'يرجى إدخال بيانات طالب صالحة', 'error');
      return;
    }

    // Store form data temporarily to restore on failure
    const tempStudent = { ...this.newStudent };

    const subjects = this.newStudent.subjects.map((subject, index) => ({
      name: subject.trim(),
      minLectures: Number(this.newStudent.minLectures[index]) || 0
    }));

    this.joinRequestService.addStudent(
      this.memberId,
      this.newStudent.name.trim(),
      this.newStudent.email.trim(),
      this.newStudent.phone.trim(),
      this.newStudent.grade?.trim() || undefined,
      subjects
    ).subscribe({
      next: (response: JoinRequestResponse) => {
        console.log('Add student response:', response);
        if (response.success && response.data && this.member) {
          this.member.students = [...response.data.students.map((student: any) => ({
            name: student.name || 'غير محدد',
            email: student.email || 'غير محدد',
            phone: student.phone || 'غير محدد',
            grade: student.grade || 'غير محدد',
            subjects: (student.subjects || []).map((subject: any) => ({
              name: subject.name || 'غير محدد',
              minLectures: subject.minLectures ?? 0
            }))
          }))];
          this.member.numberOfStudents = response.data.numberOfStudents;
          this.member.subjects = [...(response.data.subjects || this.member.subjects)];

          this.editedStudents = [...this.member.students.map((student) => ({
            ...student,
            grade: student.grade || '',
            subjects: [...student.subjects],
            subjectsString: student.subjects.map((s) => s.name).join(', ')
          }))];
          this.editedSubjects = [...this.member.subjects];

          // Clear the form only after successful database operation
          this.clearStudentForm(studentForm);

          this.showToast('نجاح', 'تم إضافة الطالب بنجاح', 'success');
          this.loadLowLectureMembers();
          this.cdr.detectChanges();
        } else {
          // Restore form data on failure
          this.newStudent = tempStudent;
          this.showToast('خطأ', response.message || 'فشل في إضافة الطالب', 'error');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        // Restore form data on error
        this.newStudent = tempStudent;
        const errorMessage = err.error?.message || 'حدث خطأ أثناء إضافة الطالب';
        this.showToast('خطأ في الإضافة', errorMessage, 'error');
        console.error('Add student error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  clearStudentForm(studentForm: NgForm): void {
    this.newStudent = {
      name: '',
      email: '',
      phone: '',
      grade: '',
      subjects: [],
      minLectures: [],
      subjectsString: ''
    };
    this.studentErrors = {
      name: '',
      email: '',
      phone: '',
      grade: '',
      subjects: '',
      minLectures: []
    };
    studentForm.resetForm();
    studentForm.form.markAsPristine();
    studentForm.form.markAsUntouched();
    Object.keys(studentForm.controls).forEach(key => {
      studentForm.controls[key].setValue('');
      studentForm.controls[key].markAsPristine();
      studentForm.controls[key].markAsUntouched();
      studentForm.controls[key].setErrors(null);
    });
    this.cdr.detectChanges();
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.member) {
      this.editedVolunteerHours = this.member.volunteerHours;
      this.editedSubjects = [...this.member.subjects];
      this.editedStudents = [...this.member.students.map((student) => ({
        ...student,
        grade: student.grade || '',
        subjects: [...student.subjects],
        subjectsString: student.subjects.map((s) => s.name).join(', ')
      }))];
    }
  }

  saveChanges(): void {
    if (!this.memberId) {
      this.showToast('خطأ', 'معرف العضو غير موجود', 'error');
      return;
    }
    if (!this.isValidEditedStudents()) {
      this.showToast('خطأ في البيانات', 'يرجى إدخال بيانات صالحة للطلاب وساعات التطوع', 'error');
      return;
    }
    this.joinRequestService.updateMemberDetails(
      this.memberId,
      this.editedVolunteerHours,
      this.editedStudents.length,
      this.editedStudents.map((student) => ({
        name: student.name.trim(),
        email: student.email.trim(),
        phone: student.phone.trim(),
        grade: student.grade?.trim() || undefined,
        subjects: student.subjects.filter((subject) =>
          subject.name && typeof subject.name === 'string' && subject.name.trim() &&
          Number.isInteger(subject.minLectures) && subject.minLectures >= 0
        )
      })),
      this.editedSubjects
    ).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.data && this.member) {
          this.member.volunteerHours = response.data.volunteerHours;
          this.member.numberOfStudents = response.data.numberOfStudents;
          this.member.students = [...response.data.students.map((student: any) => ({
            name: student.name || 'غير محدد',
            email: student.email || 'غير محدد',
            phone: student.phone || 'غير محدد',
            grade: student.grade || 'غير محدد',
            subjects: (student.subjects || []).map((subject: any) => ({
              name: subject.name || 'غير محدد',
              minLectures: subject.minLectures ?? 0
            }))
          }))];
          this.member.subjects = [...response.data.subjects];
          this.editMode = false;
          this.showToast('نجاح', 'تم تحديث تفاصيل العضو بنجاح', 'success');
          this.loadLowLectureMembers();
          this.cdr.detectChanges();
        } else {
          this.showToast('خطأ', response.message || 'فشل في تحديث تفاصيل العضو', 'error');
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'حدث خطأ أثناء تحديث تفاصيل العضو';
        this.showToast('خطأ في التحديث', errorMessage, 'error');
        console.error('Update member error:', err);
      }
    });
  }

  deleteStudent(index: number): void {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      this.editedStudents.splice(index, 1);
      this.showToast('نجاح', 'تم حذف الطالب بنجاح', 'success');
      this.cdr.detectChanges();
    }
  }

  addSubject(subject: string): void {
    const trimmedSubject = subject.trim();
    if (trimmedSubject && !this.editedSubjects.includes(trimmedSubject)) {
      this.editedSubjects = [...this.editedSubjects, trimmedSubject];
      this.showToast('نجاح', 'تم إضافة المادة بنجاح', 'success');
      this.cdr.detectChanges();
    } else {
      this.showToast('خطأ', 'المادة موجودة بالفعل أو غير صالحة', 'error');
    }
  }

  removeSubject(index: number): void {
    this.editedSubjects = [...this.editedSubjects.slice(0, index), ...this.editedSubjects.slice(index + 1)];
    this.showToast('نجاح', 'تم حذف المادة بنجاح', 'success');
    this.cdr.detectChanges();
  }

  deleteLecture(index: number): void {
    if (!this.memberId || !this.member || !this.member.lectures[index] || !this.member.lectures[index]._id) {
      this.showToast('خطأ', 'لا يمكن حذف المحاضرة، تحقق من البيانات', 'error');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
      const lectureId = this.member.lectures[index]._id;
      this.lectureService.deleteLecture(lectureId).subscribe({
        next: (response: LectureResponse) => {
          if (response.success) {
            this.member!.lectures = [...this.member!.lectures.slice(0, index), ...this.member!.lectures.slice(index + 1)];
            this.member!.lectureCount = response.lectureCount || (this.member!.lectureCount || 0) - 1;
            this.showToast('نجاح', response.message || 'تم حذف المحاضرة بنجاح', 'success');
            this.loadLowLectureMembers();
            this.cdr.detectChanges();
          } else {
            this.showToast('خطأ', response.message || 'فشل في حذف المحاضرة', 'error');
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'حدث خطأ أثناء حذف المحاضرة';
          this.showToast('خطأ في الحذف', errorMessage, 'error');
          console.error('Delete lecture error:', err);
        }
      });
    }
  }

  sendMessage(): void {
    if (!this.memberId) {
      this.showToast('خطأ', 'معرف العضو غير موجود', 'error');
      return;
    }
    this.messageError = { content: '', displayDays: '' };
    if (!this.newMessage.content.trim()) {
      this.messageError.content = 'نص الرسالة مطلوب';
      this.showToast('خطأ في الإدخال', 'يرجى إدخال نص الرسالة', 'error');
      return;
    }
    if (this.newMessage.content.length > 1000) {
      this.messageError.content = 'الرسالة يجب أن تكون أقل من 1000 حرف';
      this.showToast('خطأ في الإدخال', 'الرسالة طويلة جدًا', 'error');
      return;
    }
    if (!Number.isInteger(this.newMessage.displayDays) || this.newMessage.displayDays < 1 || this.newMessage.displayDays > 30) {
      this.messageError.displayDays = 'عدد الأيام يجب أن يكون بين 1 و30';
      this.showToast('خطأ في الإدخال', 'عدد الأيام غير صالح', 'error');
      return;
    }
    this.joinRequestService.sendMessage(this.memberId, this.newMessage.content.trim(), this.newMessage.displayDays).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success) {
          this.activeMessage = { _id: response.data._id || '', content: this.newMessage.content, displayUntil: response.data.displayUntil };
          this.newMessage = { content: '', displayDays: 7 };
          this.showToast('نجاح', response.message || 'تم إرسال الرسالة بنجاح', 'success');
          this.loadMemberMessages(this.memberId!);
        } else {
          this.showToast('خطأ', response.message || 'فشل في إرسال الرسالة', 'error');
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'حدث خطأ أثناء إرسال الرسالة';
        if (err.error && err.error.data?._id) {
          this.activeMessage = err.error.data;
          this.showToast('خطأ', 'يوجد رسالة نشطة بالفعل، يرجى حذفها أولاً', 'error');
        } else {
          this.showToast('خطأ في الإرسال', errorMessage, 'error');
        }
        console.error('Send message error:', err);
      }
    });
  }

  deleteMessage(): void {
    if (!this.memberId || !this.activeMessage) {
      this.showToast('خطأ', 'معرف العضو أو الرسالة غير موجود', 'error');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      this.joinRequestService.deleteMessage(this.memberId, this.activeMessage._id).subscribe({
        next: (response: JoinRequestResponse) => {
          if (response.success) {
            this.activeMessage = null;
            this.newMessage = { content: '', displayDays: 7 };
            this.messageError = { content: '', displayDays: '' };
            this.showToast('نجاح', response.message || 'تم حذف الرسالة بنجاح', 'success');
            this.loadMemberMessages(this.memberId!);
          } else {
            this.showToast('خطأ', response.message || 'فشل في حذف الرسالة', 'error');
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'حدث خطأ أثناء حذف الرسالة';
          this.showToast('خطأ في الحذف', errorMessage, 'error');
          console.error('Delete message error:', err);
        }
      });
    }
  }

  showToast(title: string, message: string, type: 'success' | 'error'): void {
    const id = Math.random().toString(36).substring(2);
    this.toasts.push({ id, title, message, type });
    setTimeout(() => this.closeToast(id), 4000);
  }

  closeToast(id: string): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.cdr.detectChanges();
  }
}
