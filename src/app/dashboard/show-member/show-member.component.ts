import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinRequestService, JoinRequest } from '../../core/services/join-request.service';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

interface Toast {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface Message {
  _id: string;
  content: string;
  displayUntil: string;
}

@Component({
  selector: 'app-show-member',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './show-member.component.html',
  styleUrls: ['./show-member.component.scss']
})
export class ShowMemberComponent implements OnInit, OnDestroy {
  member: JoinRequest | null = null;
  error: string | null = null;
  isLoading: boolean = false;
  editMode: boolean = false;
  showLectureWarning: boolean = false;
  editedVolunteerHours: number = 0;
  editedSubjects: string[] = [];
  editedStudents: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[]; subjectsString?: string }[] = [];
  toasts: Toast[] = [];
  isLoadingMessages: boolean = false;
  activeMessage: Message | null = null;
  editMessageMode: boolean = false;
  messageError: { content?: string; displayDays?: string } = {};
  studentErrors: { name?: string; email?: string; phone?: string; grade?: string; subjects?: string; minLectures?: { [key: number]: string } } = {};
  newStudent = {
    name: '',
    email: '',
    phone: '',
    grade: '',
    subjects: [] as string[],
    minLectures: [] as number[],
    subjectsString: ''
  };
  newMessage = { content: '', displayDays: 1 };
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private joinRequestService: JoinRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMember();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMember(): void {
    this.isLoading = true;
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.error = 'معرف العضو غير متوفر';
          this.isLoading = false;
          return of(null);
        }
        return this.joinRequestService.getMember(id).pipe(
          catchError(error => {
            this.error = error.message || 'فشل في تحميل بيانات العضو';
            this.isLoading = false;
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      this.isLoading = false;
      if (response?.success && response.member) {
        this.member = response.member;
        this.editedVolunteerHours = response.member.volunteerHours;
        this.editedSubjects = [...response.member.subjects];
        this.editedStudents = response.member.students.map(student => ({
          ...student,
          subjectsString: student.subjects.map(s => s.name).join(', ')
        }));
        this.checkLectureWarning();
        this.loadActiveMessage();
        this.error = null;
      }
    });
  }

  private checkLectureWarning(): void {
    if (this.member) {
      this.showLectureWarning = this.member.students.some(student =>
        student.subjects.some(subject => {
          const lectureCount = this.member!.lectures.filter(l => l.studentEmail === student.email && l.subject === subject.name).length;
          return lectureCount < subject.minLectures;
        })
      );
    }
  }

  private loadActiveMessage(): void {
    if (!this.member?.id) {
      this.isLoadingMessages = false;
      return;
    }
    this.isLoadingMessages = true;
    this.joinRequestService.getMember(this.member.id).pipe(
      switchMap(response => {
        if (response?.success && response.member) {
          const messages = response.member.messages || [];
          const activeMessages = messages.filter(msg => new Date(msg.displayUntil) > new Date());
          if (activeMessages.length > 0) {
            this.activeMessage = activeMessages[0]; // Take the first active message
          } else {
            this.activeMessage = null;
          }
          return of(null);
        }
        return of(null);
      }),
      catchError(error => {
        console.error('Error loading message:', error);
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: 'فشل في تحميل الرسالة'
        });
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoadingMessages = false;
    });
  }

  closeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.editedVolunteerHours = this.member?.volunteerHours || 0;
      this.editedSubjects = this.member?.subjects ? [...this.member.subjects] : [];
      this.editedStudents = this.member?.students.map(student => ({
        ...student,
        subjectsString: student.subjects.map(s => s.name).join(', ')
      })) || [];
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    return /^\+?\d{10,15}$/.test(phone);
  }

  updateStudentSubjects(index: number, subjectsString: string): void {
    const subjects = subjectsString.split(',').map(s => s.trim()).filter(s => s);
    this.editedStudents[index].subjects = subjects.map(name => ({
      name,
      minLectures: this.editedStudents[index].subjects.find(s => s.name === name)?.minLectures || 0
    }));
    this.editedStudents[index].subjectsString = subjectsString;
  }

  isValidSubjects(subjects: { name: string; minLectures: number }[]): boolean {
    return subjects.every(subject =>
      subject.name &&
      subject.name.length >= 1 &&
      subject.name.length <= 100 &&
      this.editedSubjects.includes(subject.name)
    );
  }

  deleteStudent(index: number): void {
    this.editedStudents.splice(index, 1);
  }

  isValidEditedStudents(): boolean {
    return this.editedStudents.every(student =>
      student.name &&
      this.isValidEmail(student.email) &&
      this.isValidPhone(student.phone) &&
      (!student.grade || (student.grade.length >= 1 && student.grade.length <= 50)) &&
      this.isValidSubjects(student.subjects)
    );
  }

  saveChanges(): void {
    if (!this.member?.id || !this.isValidEditedStudents()) {
      this.toasts.push({
        id: 'error-' + Date.now(),
        type: 'error',
        title: 'خطأ',
        message: 'يرجى التحقق من بيانات الطلاب'
      });
      return;
    }
    this.joinRequestService.updateMemberDetails(
      this.member.id,
      this.editedVolunteerHours,
      this.editedStudents.length,
      this.editedStudents,
      this.editedSubjects
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.member!.volunteerHours = response.data.volunteerHours;
          this.member!.numberOfStudents = response.data.numberOfStudents;
          this.member!.students = response.data.students;
          this.member!.subjects = response.data.subjects;
          this.editMode = false;
          this.toasts.push({
            id: 'success-' + Date.now(),
            type: 'success',
            title: 'نجاح',
            message: response.message
          });
        }
      },
      error: err => {
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: err.message
        });
      }
    });
  }

  addSubject(subject: string): void {
    if (subject && !this.editedSubjects.includes(subject)) {
      this.editedSubjects.push(subject);
    }
  }

  removeSubject(index: number): void {
    this.editedSubjects.splice(index, 1);
  }

  updateNewStudentSubjects(subjectsString: string): void {
    this.newStudent.subjects = subjectsString.split(',').map(s => s.trim()).filter(s => s);
    this.newStudent.minLectures = new Array(this.newStudent.subjects.length).fill(0);
  }

  validateMinLectures(): void {
    this.studentErrors.minLectures = {};
    this.newStudent.minLectures.forEach((minLectures, i) => {
      if (!Number.isInteger(minLectures) || minLectures < 0) {
        this.studentErrors.minLectures = this.studentErrors.minLectures || {};
        this.studentErrors.minLectures[i] = 'الحد الأدنى للمحاضرات يجب أن يكون عددًا صحيحًا غير سالب';
      }
    });
  }

  isValidNewStudent(): boolean {
    this.studentErrors = {};
    if (!this.newStudent.name) this.studentErrors.name = 'الاسم مطلوب';
    if (!this.newStudent.email || !this.isValidEmail(this.newStudent.email)) this.studentErrors.email = 'بريد إلكتروني غير صالح';
    if (!this.newStudent.phone || !this.isValidPhone(this.newStudent.phone)) this.studentErrors.phone = 'رقم هاتف غير صالح';
    if (this.newStudent.grade && (this.newStudent.grade.length < 1 || this.newStudent.grade.length > 50)) {
      this.studentErrors.grade = 'الصف يجب أن يكون بين 1 و50 حرفًا';
    }
    if (this.newStudent.subjects.some(s => !this.member?.subjects.includes(s))) {
      this.studentErrors.subjects = 'يرجى إدخال مواد صالحة من قائمة المواد المتاحة';
    }
    return Object.keys(this.studentErrors).length === 0;
  }

  clearStudentForm(form: NgForm): void {
    this.newStudent = { name: '', email: '', phone: '', grade: '', subjects: [], minLectures: [], subjectsString: '' };
    this.studentErrors = {};
    form.resetForm();
  }

  getSubjectsDisplay(subjects: { name: string; minLectures: number }[]): string {
    return subjects.map(s => `${s.name} (${s.minLectures} محاضرة)`).join(', ');
  }

  deleteLecture(index: number): void {
    if (!this.member?.lectures) return;
    this.member.lectures.splice(index, 1);
    this.checkLectureWarning();
    this.toasts.push({
      id: 'success-' + Date.now(),
      type: 'success',
      title: 'نجاح',
      message: 'تم حذف المحاضرة بنجاح'
    });
  }

  startEditMessage(): void {
    if (this.activeMessage) {
      this.newMessage = {
        content: this.activeMessage.content,
        displayDays: Math.ceil((new Date(this.activeMessage.displayUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      };
      this.editMessageMode = true;
    }
  }

  updateMessage(): void {
    if (!this.member?.id || !this.activeMessage?._id) return;
    if (!this.newMessage.content || !this.newMessage.displayDays || this.newMessage.displayDays < 1 || this.newMessage.displayDays > 30) {
      this.messageError = {
        content: !this.newMessage.content ? 'نص الرسالة مطلوب' : undefined,
        displayDays: !this.newMessage.displayDays || this.newMessage.displayDays < 1 || this.newMessage.displayDays > 30 ? 'مدة العرض يجب أن تكون بين 1 و30 يومًا' : undefined
      };
      return;
    }
    this.joinRequestService.editMessage(this.member.id, this.activeMessage._id, this.newMessage.content, this.newMessage.displayDays).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        if (response.success) {
          this.activeMessage = {
            _id: this.activeMessage!._id,
            content: this.newMessage.content,
            displayUntil: response.data?.displayUntil || this.activeMessage!.displayUntil
          };
          this.editMessageMode = false;
          this.newMessage = { content: '', displayDays: 1 };
          this.messageError = {};
          this.toasts.push({
            id: 'success-' + Date.now(),
            type: 'success',
            title: 'نجاح',
            message: response.message
          });
        }
      },
      error: err => {
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: err.message
        });
      }
    });
  }

  cancelEditMessage(): void {
    this.editMessageMode = false;
    this.newMessage = { content: '', displayDays: 1 };
    this.messageError = {};
  }

  approveMember(): void {
    if (!this.member?.id) return;
    this.joinRequestService.approve(this.member.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        if (response.success) {
          this.member!.status = 'Approved';
          this.toasts.push({
            id: 'success-' + Date.now(),
            type: 'success',
            title: 'نجاح',
            message: response.message
          });
        }
      },
      error: err => {
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: err.message
        });
      }
    });
  }

  rejectMember(): void {
    if (!this.member?.id) return;
    this.joinRequestService.reject(this.member.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        if (response.success) {
          this.member!.status = 'Rejected';
          this.toasts.push({
            id: 'success-' + Date.now(),
            type: 'success',
            title: 'نجاح',
            message: response.message
          });
        }
      },
      error: err => {
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: err.message
        });
      }
    });
  }

  deleteMember(): void {
    if (!this.member?.id || !confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
    this.joinRequestService.deleteMember(this.member.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        if (response.success) {
          this.toasts.push({
            id: 'success-' + Date.now(),
            type: 'success',
            title: 'نجاح',
            message: response.message
          });
          this.router.navigate(['/dashboard']);
        }
      },
      error: err => {
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: err.message
        });
      }
    });
  }

  addStudent(form: NgForm): void {
    if (!this.member?.id || !this.isValidNewStudent()) {
      this.toasts.push({
        id: 'error-' + Date.now(),
        type: 'error',
        title: 'خطأ',
        message: 'يرجى التحقق من بيانات الطالب'
      });
      return;
    }
    const subjects = this.newStudent.subjects.map((name, i) => ({
      name,
      minLectures: this.newStudent.minLectures[i] || 0
    }));
    this.joinRequestService.addStudent(
      this.member.id,
      this.newStudent.name,
      this.newStudent.email,
      this.newStudent.phone,
      this.newStudent.grade,
      subjects
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.member!.students = response.data.students;
          this.member!.numberOfStudents = response.data.numberOfStudents;
          this.member!.subjects = response.data.subjects;
          this.clearStudentForm(form);
          this.checkLectureWarning();
          this.toasts.push({
            id: 'success-' + Date.now(),
            type: 'success',
            title: 'نجاح',
            message: response.message
          });
        }
      },
      error: err => {
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: err.message
        });
      }
    });
  }

  sendMessage(): void {
    if (!this.member?.id || !this.newMessage.content || !this.newMessage.displayDays || this.newMessage.displayDays < 1 || this.newMessage.displayDays > 30) {
      this.messageError = {
        content: !this.newMessage.content ? 'نص الرسالة مطلوب' : undefined,
        displayDays: !this.newMessage.displayDays || this.newMessage.displayDays < 1 || this.newMessage.displayDays > 30 ? 'مدة العرض يجب أن تكون بين 1 و30 يومًا' : undefined
      };
      return;
    }
    this.joinRequestService.sendMessage(
      this.member.id,
      this.newMessage.content,
      this.newMessage.displayDays
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.activeMessage = {
            _id: response.data._id,
            content: response.data.content,
            displayUntil: response.data.displayUntil
          };
          this.newMessage = { content: '', displayDays: 1 };
          this.messageError = {};
          this.toasts.push({
            id: 'success-' + Date.now(),
            type: 'success',
            title: 'نجاح',
            message: response.message
          });
        }
      },
      error: err => {
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: err.message
        });
      }
    });
  }

  deleteMessage(): void {
    if (!this.member?.id || !this.activeMessage?._id) return;
    this.joinRequestService.deleteMessage(this.member.id, this.activeMessage._id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        if (response.success) {
          this.activeMessage = null;
          this.newMessage = { content: '', displayDays: 1 };
          this.editMessageMode = false;
          this.toasts.push({
            id: 'success-' + Date.now(),
            type: 'success',
            title: 'نجاح',
            message: response.message
          });
        }
      },
      error: err => {
        this.toasts.push({
          id: 'error-' + Date.now(),
          type: 'error',
          title: 'خطأ',
          message: err.message
        });
      }
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString('ar-EG');
  }
}
