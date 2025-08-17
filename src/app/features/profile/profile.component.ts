import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService, ProfileResponse } from '../../core/services/profile.service';
import { Router } from '@angular/router';
import { JoinRequestService, JoinRequestResponse, JoinRequest, Meeting } from '../../core/services/join-request.service';
import { LectureService, LectureResponse, LowLectureMembersResponse } from '../../core/services/lecture.service';
import { LectureRequestService, LectureRequestData } from '../../core/services/lecture-request.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';

interface Toast {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface MeetingData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface LectureData {
  _id?: string;
  studentEmail: string;
  subject: string;
  date: string;
  duration: number;
  link: string;
  name: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile: JoinRequest | null = null;
  activeMessage: { _id: string; content: string; displayUntil: string } | null = null;
  toasts: Toast[] = [];
  lectureForm!: FormGroup;
  pdfRequestForm!: FormGroup;
  isUploadingLecture = false;
  isUploadingPdfRequest = false;
  currentPassword = '';
  newPassword = '';
  showPasswordModal = false;
  errorCode: string | null = null;
  meeting: MeetingData = {
    title: '',
    date: '',
    startTime: '',
    endTime: ''
  };
  showMeetingModal = false;
  selectedFile: File | null = null;
  selectedPdfFile: File | null = null;
  isUploading = false;
  showUploadField = false;
  activeSection = 'profile';
  isDeletingMeeting: { [key: string]: boolean } = {};
  showLectureWarning = false;
  lectureEditMode = false;
  editingLecture: LectureData | null = null;

  subjects = [
    'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية',
    'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'العلوم الإسلامية',
    'الحاسوب', 'الفلسفة', 'علم النفس', 'الاقتصاد', 'الإحصاء'
  ];

  semesters = ['الفصل الأول', 'الفصل الثاني'];
  countries = ['الأردن', 'فلسطين'];
  academicLevels = [
    'الثانوية العامة', 'البكالوريوس', 'الماجستير', 'الدكتوراه',
    'الدبلوم', 'الدراسات العليا'
  ];

  constructor(
    private profileService: ProfileService,
    private joinRequestService: JoinRequestService,
    private lectureService: LectureService,
    private lectureRequestService: LectureRequestService,
    public translationService: TranslationService,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.checkAuth();
    this.loadProfile();
    this.loadLowLectureMembers();
  }

  private initializeForms(): void {
    this.lectureForm = this.fb.group({
      studentEmail: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      date: ['', [Validators.required]],
      duration: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]], // Empty string as default
      link: ['', [Validators.required, Validators.pattern(/^https?:\/\/[^\s/$.?#].[^\s]*$/)]],
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]]
    });

    this.pdfRequestForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      creatorName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      subject: ['', [Validators.required]],
      semester: ['', [Validators.required]],
      country: ['', [Validators.required]],
      academicLevel: ['', [Validators.required]]
    });
  }

  checkAuth(): void {
    const userId = this.authService.getUserId();
    const token = this.authService.getToken();
    if (!token || !userId || !this.authService.isLoggedIn()) {
      this.showToast('error', 'profile.error', 'profile.unauthorizedError');
      this.router.navigate(['/login']);
    }
  }

  getTranslatedSubjects(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    if (currentLang === 'en') {
      return [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Arabic Language',
        'English Language', 'History', 'Geography', 'Islamic Studies',
        'Computer Science', 'Philosophy', 'Psychology', 'Economics', 'Statistics'
      ];
    }
    return this.subjects;
  }

  getTranslatedSemesters(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    if (currentLang === 'en') {
      return ['First Semester', 'Second Semester'];
    }
    return this.semesters;
  }

  getTranslatedCountries(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    if (currentLang === 'en') {
      return ['Jordan', 'Palestine'];
    }
    return this.countries;
  }

  getTranslatedAcademicLevels(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    if (currentLang === 'en') {
      return [
        'High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD',
        'Diploma', 'Graduate Studies'
      ];
    }
    return this.academicLevels;
  }

  private showToast(type: 'success' | 'error', titleKey: string, messageKey: string): void {
    const id = Math.random().toString(36).substr(2, 9);
    const title = this.translationService.translate(titleKey);
    const message = this.translationService.translate(messageKey);
    this.toasts.push({ id, type, title, message });
    setTimeout(() => this.closeToast(id), 5000);
    setTimeout(() => {
      const toastElement = document.querySelector(`.toast[id="${id}"]`);
      if (toastElement) {
        toastElement.classList.add('show');
      }
    }, 100);
  }

  closeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  loadProfile(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.showToast('error', 'profile.error', 'profile.unauthorizedError');
      this.router.navigate(['/login']);
      return;
    }

    this.profileService.getProfile().subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.data) {
          this.profile = this.processProfileData(response.data);
          this.setActiveMessage();
          this.showUploadField = !this.profile.profileImage;
          // Enable/disable lecture form based on students availability
          if (this.profile.students?.length) {
            this.lectureForm.enable();
          } else {
            this.lectureForm.disable();
          }
          if (this.profile.numberOfStudents > 0 && this.profile.students.length === 0) {
            this.showToast('error', 'profile.error', 'profile.studentDataMismatch');
          } else {
            this.showToast('success', 'profile.success', 'profile.loadSuccess');
          }
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.loadError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        if (err.status === 401) {
          this.authService.logout();
        }
      }
    });
  }

  private processProfileData(member: any): JoinRequest {
    const isRtl = this.translationService.isRtl();
    const locale = isRtl ? 'ar-EG' : 'en-US';
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    return {
      ...member,
      id: member.id,
      createdAt: new Date(member.createdAt || new Date()).toLocaleDateString(locale, dateOptions),
      lectureCount: member.lectureCount || 0,
      lectures: (member.lectures || []).map((lecture: any) => ({
        ...lecture,
        date: new Date(lecture.date).toLocaleDateString(locale, dateOptions)
      })),
      students: (member.students || []).map((student: any) => ({
        ...student,
        name: student.name || this.translationService.translate('profile.notSpecified'),
        email: student.email || this.translationService.translate('profile.notSpecified'),
        phone: student.phone || this.translationService.translate('profile.notSpecified'),
        grade: student.grade || this.translationService.translate('profile.notSpecified'),
        subjects: (student.subjects || []).map((subject: any) => ({
          name: subject.name || this.translationService.translate('profile.notSpecified'),
          minLectures: subject.minLectures ?? 0
        }))
      })),
      meetings: (member.meetings || []).map((meeting: Meeting, index: number) => ({
        id: meeting.id || meeting._id || `meeting-${index}-${Date.now()}`,
        title: meeting.title || this.translationService.translate('profile.notSpecified'),
        date: typeof meeting.date === 'string' ? meeting.date : new Date(meeting.date).toISOString().split('T')[0],
        startTime: meeting.startTime || '',
        endTime: meeting.endTime || ''
      })),
      messages: (member.messages || []).map((message: any) => ({
        _id: message._id || '',
        content: message.content || '',
        createdAt: message.createdAt || new Date().toISOString(),
        displayUntil: message.displayUntil || new Date().toISOString()
      }))
    };
  }

  private setActiveMessage(): void {
    if (this.profile?.messages) {
      const activeMessages = this.profile.messages.filter(
        msg => new Date(msg.displayUntil) > new Date()
      );
      this.activeMessage = activeMessages.length > 0 ? activeMessages[0] : null;
    }
  }

  loadLowLectureMembers(): void {
    this.lectureService.getLowLectureMembers().subscribe({
      next: (response: LowLectureMembersResponse) => {
        if (response.success) {
          const userId = this.authService.getUserId();
          const memberData = response.members.find(m => m.id === userId);
          this.showLectureWarning = !!memberData && memberData.lowLectureStudents.length > 0;
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.size > 10 * 1024 * 1024) {
        this.showToast('error', 'profile.error', 'profile.fileSizeError');
        this.selectedFile = null;
        input.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.showToast('error', 'profile.error', 'profile.invalidImageType');
        this.selectedFile = null;
        input.value = '';
        return;
      }

      this.selectedFile = file;
    }
  }

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type !== 'application/pdf') {
        this.showToast('error', 'profile.error', 'profile.pdfFileTypeError');
        input.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.showToast('error', 'profile.error', 'profile.fileSizeError');
        input.value = '';
        return;
      }

      this.selectedPdfFile = file;
    }
  }

  uploadProfileImage(): void {
    if (!this.selectedFile) {
      this.showToast('error', 'profile.error', 'profile.selectImageFirst');
      return;
    }

    this.isUploading = true;
    this.profileService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        if (response.success && response.data && this.profile) {
          this.profile.profileImage = response.data.profileImage;
          this.showUploadField = false;
          this.selectedFile = null;
          this.showToast('success', 'profile.success', 'profile.imageUploadSuccess');

          const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.imageUploadError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        if (err.status === 401) {
          this.authService.logout();
        }
      },
      complete: () => {
        this.isUploading = false;
      }
    });
  }

  uploadPdfRequest(): void {
    if (this.pdfRequestForm.invalid) {
      this.showToast('error', 'profile.error', 'profile.fillAllFields');
      this.pdfRequestForm.markAllAsTouched();
      return;
    }

    if (!this.selectedPdfFile) {
      this.showToast('error', 'profile.error', 'profile.selectPdfFile');
      return;
    }

    this.isUploadingPdfRequest = true;
    const lectureData: LectureRequestData = this.pdfRequestForm.value;

    this.lectureRequestService.uploadLectureRequest(lectureData, this.selectedPdfFile).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToast('success', 'profile.success', 'profile.pdfRequestSuccess');
          this.pdfRequestForm.reset();
          this.selectedPdfFile = null;

          const fileInput = document.getElementById('pdfFileInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.pdfRequestError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        if (err.status === 401) {
          this.authService.logout();
        }
      },
      complete: () => {
        this.isUploadingPdfRequest = false;
      }
    });
  }

  changeImage(): void {
    this.showUploadField = true;
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.errorCode = null;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.errorCode = null;
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.showToast('error', 'profile.error', 'profile.passwordFieldsRequired');
      this.errorCode = 'missing_fields';
      return;
    }

    this.profileService.updatePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToast('success', 'profile.success', 'profile.passwordChangeSuccess');
          this.closePasswordModal();
        }
      },
      error: (err) => {
        this.errorCode = err.error || 'unknown_error';
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        if (err.status === 401) {
          this.authService.logout();
        }
      }
    });
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['forgot-password']);
    this.closePasswordModal();
  }

  openMeetingModal(): void {
    this.showMeetingModal = true;
    this.meeting = { title: '', date: '', startTime: '', endTime: '' };
  }

  closeMeetingModal(): void {
    this.showMeetingModal = false;
    this.meeting = { title: '', date: '', startTime: '', endTime: '' };
  }

  addMeeting(): void {
    if (!this.meeting.title || !this.meeting.date || !this.meeting.startTime || !this.meeting.endTime) {
      this.showToast('error', 'profile.error', 'profile.meetingFieldsRequired');
      return;
    }

    this.profileService.addMeeting(
      this.meeting.title,
      this.meeting.date,
      this.meeting.startTime,
      this.meeting.endTime
    ).subscribe({
      next: (response) => {
        if (response.success && response.data && this.profile) {
          this.profile.meetings = (response.data.meetings || []).map((meeting: Meeting, index: number) => ({
            id: meeting.id || meeting._id || `meeting-${index}-${Date.now()}`,
            title: meeting.title || this.translationService.translate('profile.notSpecified'),
            date: typeof meeting.date === 'string' ? meeting.date : new Date(meeting.date).toISOString().split('T')[0],
            startTime: meeting.startTime || '',
            endTime: meeting.endTime || ''
          }));
          this.showToast('success', 'profile.success', 'profile.meetingAddSuccess');
          this.closeMeetingModal();
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.meetingAddError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        if (err.status === 401) {
          this.authService.logout();
        }
      }
    });
  }

  deleteMeeting(meetingId: string): void {
    if (!meetingId) {
      this.showToast('error', 'profile.error', 'profile.invalidMeetingId');
      return;
    }

    const confirmMessage = this.translationService.translate('profile.confirmDeleteMeeting');
    if (confirm(confirmMessage)) {
      this.isDeletingMeeting[meetingId] = true;

      this.profileService.deleteMeeting(meetingId).subscribe({
        next: (response) => {
          if (response.success && response.data && this.profile) {
            this.profile.meetings = (response.data.meetings || []).map((meeting: Meeting, index: number) => ({
              id: meeting.id || meeting._id || `meeting-${index}-${Date.now()}`,
              title: meeting.title || this.translationService.translate('profile.notSpecified'),
              date: typeof meeting.date === 'string' ? meeting.date : new Date(meeting.date).toISOString().split('T')[0],
              startTime: meeting.startTime || '',
              endTime: meeting.endTime || ''
            }));
            this.showToast('success', 'profile.success', 'profile.meetingDeleteSuccess');
          } else {
            this.showToast('error', 'profile.error', response.message || 'profile.meetingDeleteError');
          }
        },
        error: (err) => {
          this.showToast('error', 'profile.error', this.getErrorMessage(err));
          if (err.status === 401) {
            this.authService.logout();
          }
        },
        complete: () => {
          delete this.isDeletingMeeting[meetingId];
        }
      });
    }
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  uploadLecture(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.showToast('error', 'profile.error', 'profile.unauthorizedError');
      this.authService.logout();
      return;
    }
    if (!this.profile?.students?.length) {
      this.showToast('error', 'profile.error', 'profile.noStudentsAvailable');
      return;
    }
    if (this.lectureForm.invalid) {
      this.showToast('error', 'profile.error', 'profile.fillAllFields');
      this.lectureForm.markAllAsTouched();
      return;
    }

    this.isUploadingLecture = true;
    const { studentEmail, subject, date, duration, link, name } = this.lectureForm.value;

    this.lectureService.uploadLecture(userId, studentEmail, subject, date, duration, link, name).subscribe({
      next: (response: LectureResponse) => {
        if (response.success && response.lecture && this.profile) {
          this.loadProfile();
          this.showToast('success', 'profile.success', 'profile.lectureUploadSuccess');
          this.lectureForm.reset();
          this.loadLowLectureMembers();
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.lectureUploadError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        if (err.status === 401) {
          this.authService.logout();
        }
      },
      complete: () => {
        this.isUploadingLecture = false;
      }
    });
  }

  startEditLecture(lecture: LectureData): void {
    this.lectureEditMode = true;
    this.editingLecture = {
      ...lecture,
      date: new Date(lecture.date).toISOString().split('T')[0]
    };
    this.lectureForm.patchValue(this.editingLecture);
    if (this.profile?.students?.length) {
      this.lectureForm.enable();
    }
  }

  updateLecture(): void {
    if (this.lectureForm.invalid || !this.editingLecture || !this.editingLecture._id) {
      this.showToast('error', 'profile.error', 'profile.fillAllFields');
      this.lectureForm.markAllAsTouched();
      return;
    }

    this.isUploadingLecture = true;
    const { studentEmail, subject, date, duration, link, name } = this.lectureForm.value;
    const userId = this.authService.getUserId() || '';

    this.lectureService.updateLecture(
      this.editingLecture._id,
      userId,
      studentEmail,
      subject,
      date,
      duration,
      link,
      name
    ).subscribe({
      next: (response: LectureResponse) => {
        if (response.success && response.lecture && this.profile) {
          const isRtl = this.translationService.isRtl();
          const locale = isRtl ? 'ar-EG' : 'en-US';
          const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          };

          const index = this.profile.lectures.findIndex(l => l._id === this.editingLecture!._id);
          if (index !== -1) {
            this.profile.lectures[index] = {
              ...response.lecture,
              date: new Date(response.lecture.date).toLocaleDateString(locale, dateOptions)
            };
          }
          this.profile.lectureCount = response.lectureCount || this.profile.lectureCount;
          this.lectureEditMode = false;
          this.editingLecture = null;
          this.showToast('success', 'profile.success', 'profile.lectureUpdateSuccess');
          this.lectureForm.reset();
          this.loadLowLectureMembers();
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.lectureUpdateError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        if (err.status === 401) {
          this.authService.logout();
        }
      },
      complete: () => {
        this.isUploadingLecture = false;
      }
    });
  }

  cancelEditLecture(): void {
    this.lectureEditMode = false;
    this.editingLecture = null;
    this.lectureForm.reset();
    if (!this.profile?.students?.length) {
      this.lectureForm.disable();
    }
  }

  deleteLecture(lectureId: string): void {
    if (!lectureId) {
      this.showToast('error', 'profile.error', 'profile.invalidLectureId');
      return;
    }

    const confirmMessage = this.translationService.translate('profile.confirmDeleteLecture');
    if (confirm(confirmMessage)) {
      this.lectureService.deleteLecture(lectureId).subscribe({
        next: (response: LectureResponse) => {
          if (response.success && this.profile) {
            this.profile.lectures = this.profile.lectures.filter(l => l._id !== lectureId);
            this.profile.lectureCount = response.lectureCount || Math.max((this.profile.lectureCount || 0) - 1, 0);
            this.showToast('success', 'profile.success', 'profile.lectureDeleteSuccess');
            this.loadLowLectureMembers();
          } else {
            this.showToast('error', 'profile.error', response.message || 'profile.lectureDeleteError');
          }
        },
        error: (err) => {
          this.showToast('error', 'profile.error', this.getErrorMessage(err));
          if (err.status === 401) {
            this.authService.logout();
          }
        }
      });
    }
  }

  getStudentSubjects(student: any): string {
    if (!student?.subjects || !Array.isArray(student.subjects) || student.subjects.length === 0) {
      return this.translationService.translate('profile.notSpecified');
    }
    return student.subjects
      .map((subject: any) => `${subject.name} (${subject.minLectures} ${this.translationService.translate('profile.lectures')})`)
      .join(', ');
  }

  private getErrorMessage(err: any): string {
    if (err.error?.message) {
      return err.error.message;
    }

    switch (err.status) {
      case 0:
        return 'profile.networkError';
      case 401:
        return 'profile.unauthorizedError';
      case 403:
        return 'profile.forbiddenError';
      case 404:
        return 'profile.studentEmailNotFound';
      case 400:
        return err.error?.message || 'profile.invalidLectureData';
      case 500:
        return 'profile.serverError';
      default:
        return 'profile.unexpectedError';
    }
  }
}
