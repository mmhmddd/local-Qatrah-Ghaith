import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { Router } from '@angular/router';
import { JoinRequestService, JoinRequestResponse } from '../../core/services/join-request.service';
import { LectureService, LectureResponse, NotificationResponse } from '../../core/services/lecture.service';
import { LectureRequestService, LectureRequestData } from '../../core/services/lecture-request.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile: JoinRequestResponse['data'] | null = null;
  activeMessage: { _id: string; content: string; displayUntil: string } | null = null;
  toasts: { id: string; type: 'success' | 'error'; title: string; message: string }[] = [];
  lectureForm: FormGroup;
  pdfRequestForm: FormGroup;
  isUploadingLecture: boolean = false;
  isUploadingPdfRequest: boolean = false;
  notifications: NotificationResponse['notifications'] = [];
  unreadNotificationsCount: number = 0;
  currentPassword: string = '';
  newPassword: string = '';
  showPasswordModal: boolean = false;
  errorCode: string | null = null;
  meeting: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  } = {
    title: '',
    date: '',
    startTime: '',
    endTime: ''
  };
  showMeetingModal: boolean = false;
  selectedFile: File | null = null;
  selectedPdfFile: File | null = null;
  isUploading: boolean = false;
  showUploadField: boolean = true;
  activeSection: string = 'profile';
  isDeletingMeeting: { [key: string]: boolean } = {};

  subjects = [
    'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية',
    'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'العلوم الإسلامية',
    'الحاسوب', 'الفلسفة', 'علم النفس', 'الاقتصاد', 'الإحصاء'
  ];

  semesters = ['الفصل الأول', 'الفصل الثاني'];

  countries = [
    'الأردن', 'فلسطين',
  ];

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
    private fb: FormBuilder
  ) {
    this.lectureForm = this.fb.group({
      link: ['', [Validators.required, Validators.pattern('https?://.+')]],
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      subject: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]]
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

  ngOnInit(): void {
    this.loadProfile();
    this.fetchNotifications();
  }

  // Get translated subjects based on current language
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

  // Get translated semesters based on current language
  getTranslatedSemesters(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    if (currentLang === 'en') {
      return ['First Semester', 'Second Semester'];
    }
    return this.semesters;
  }

  // Get translated countries based on current language
  getTranslatedCountries(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    if (currentLang === 'en') {
      return ['Jordan', 'Palestine'];
    }
    return this.countries;
  }

  // Get translated academic levels based on current language
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
    this.profileService.getProfile().subscribe({
      next: (response) => {
        console.log('Profile response:', response);
        if (response.success && response.data) {
          this.profile = {
            ...response.data,
            students: response.data.students.map((student: any) => ({
              ...student,
              grade: student.grade || '',
              subjects: student.subjects || []
            })),
            meetings: response.data.meetings.map((meeting: any) => ({
              ...meeting,
              id: meeting.id || meeting._id
            }))
          };
          // Set active message
          const messages = response.data.messages || [];
          const activeMessages = messages.filter((msg: { displayUntil: string | number | Date; }) => new Date(msg.displayUntil) > new Date());
          this.activeMessage = activeMessages.length > 0 ? activeMessages[0] : null;
          this.showUploadField = !this.profile.profileImage;
          console.log('Students:', this.profile.students);
          console.log('Number of Students:', this.profile.numberOfStudents);
          if (this.profile.numberOfStudents > 0 && this.profile.students.length === 0) {
            this.showToast('error', 'profile.error', 'profile.studentDataMismatch');
            console.warn('Student data mismatch');
          } else {
            this.showToast('success', 'profile.success', 'profile.loadSuccess');
          }
        } else {
          this.showToast('error', 'profile.error', 'profile.loadError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        console.error('Profile loading error:', err);
      }
    });
  }

  fetchNotifications(): void {
    this.lectureService.getNotifications().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = response.notifications.filter(n => !n.read);
          this.unreadNotificationsCount = this.notifications.length;
          this.showToast('success', 'profile.success', 'profile.notificationsLoadSuccess');
        } else {
          this.showToast('error', 'profile.error', 'profile.notificationsLoadError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        console.error('Notification fetch error:', err);
      }
    });
  }

  markNotificationsRead(): void {
    this.lectureService.markNotificationsRead().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = response.notifications.filter(n => !n.read);
          this.unreadNotificationsCount = this.notifications.length;
          this.showToast('success', 'profile.success', 'profile.notificationsMarkedRead');
        } else {
          this.showToast('error', 'profile.error', 'profile.notificationsMarkError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        console.error('Mark notifications read error:', err);
      }
    });
  }

  deleteNotification(notificationId: string): void {
    this.lectureService.deleteNotification(notificationId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = this.notifications.filter(n => n._id !== notificationId);
          this.unreadNotificationsCount = this.notifications.length;
          this.showToast('success', 'profile.success', 'profile.notificationDeleted');
        } else {
          this.showToast('error', 'profile.error', 'profile.notificationDeleteError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        console.error('Delete notification error:', err);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      if (this.selectedFile.size > 10 * 1024 * 1024) {
        this.showToast('error', 'profile.error', 'profile.fileSizeError');
        this.selectedFile = null;
        return;
      }
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
          this.showToast('error', 'profile.error', 'profile.imageUploadError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        console.error('Upload image error:', err);
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
          this.fetchNotifications();
        } else {
          this.showToast('error', 'profile.error', 'profile.pdfRequestError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        console.error('Upload PDF request error:', err);
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
    this.errorCode = null;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
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
          this.currentPassword = '';
          this.newPassword = '';
          this.showPasswordModal = false;
          this.errorCode = null;
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', 'profile.passwordChangeError');
        this.errorCode = err.error ?? 'unknown_error';
        console.error('Change password error:', err);
      }
    });
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['forgot-password']);
    this.closePasswordModal();
  }

  openMeetingModal(): void {
    this.showMeetingModal = true;
  }

  closeMeetingModal(): void {
    this.showMeetingModal = false;
    this.meeting = { title: '', date: '', startTime: '', endTime: '' };
  }

  addMeeting(): void {
    if (this.meeting.title && this.meeting.date && this.meeting.startTime && this.meeting.endTime) {
      this.profileService.addMeeting(
        this.meeting.title,
        this.meeting.date,
        this.meeting.startTime,
        this.meeting.endTime
      ).subscribe({
        next: (response) => {
          if (response.success && response.data && this.profile) {
            this.profile.meetings = response.data.meetings.map((meeting: any) => ({
              ...meeting,
              id: meeting.id || meeting._id
            }));
            this.showToast('success', 'profile.success', 'profile.meetingAddSuccess');
            this.closeMeetingModal();
          } else {
            this.showToast('error', 'profile.error', 'profile.meetingAddError');
          }
        },
        error: (err) => {
          this.showToast('error', 'profile.error', this.getErrorMessage(err));
        }
      });
    } else {
      this.showToast('error', 'profile.error', 'profile.meetingFieldsRequired');
    }
  }

  deleteMeeting(meetingId: string): void {
    const confirmMessage = this.translationService.translate('profile.confirmDeleteMeeting');
    if (confirm(confirmMessage)) {
      this.isDeletingMeeting[meetingId] = true;
      this.profileService.deleteMeeting(meetingId).subscribe({
        next: (response) => {
          if (response.success && response.data && this.profile) {
            this.profile.meetings = response.data.meetings.map((meeting: any) => ({
              ...meeting,
              id: meeting.id || meeting._id
            }));
            this.showToast('success', 'profile.success', 'profile.meetingDeleteSuccess');
          } else {
            this.showToast('error', 'profile.error', 'profile.meetingDeleteError');
          }
        },
        error: (err) => {
          this.showToast('error', 'profile.error', this.getErrorMessage(err));
        },
        complete: () => {
          this.isDeletingMeeting[meetingId] = false;
        }
      });
    }
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  uploadLecture(): void {
    if (this.lectureForm.invalid) {
      this.showToast('error', 'profile.error', 'profile.fillAllFields');
      this.lectureForm.markAllAsTouched();
      return;
    }

    this.isUploadingLecture = true;
    const { link, name, subject } = this.lectureForm.value;

    this.lectureService.uploadLecture(link, name, subject).subscribe({
      next: (response: LectureResponse) => {
        if (response.success && this.profile) {
          this.profile.lectures.push({
            _id: response.lecture?._id || '',
            link: response.lecture?.link || '',
            name: response.lecture?.name || '',
            subject: response.lecture?.subject || '',
            createdAt: response.lecture?.createdAt || new Date().toISOString()
          });
          this.profile.lectureCount = response.lectureCount || (this.profile.lectureCount || 0) + 1;
          this.profile.volunteerHours = response.volunteerHours || this.profile.volunteerHours;
          this.showToast('success', 'profile.success', 'profile.lectureUploadSuccess');
          this.lectureForm.reset();
          this.fetchNotifications();
        } else {
          this.showToast('error', 'profile.error', 'profile.lectureUploadError');
        }
      },
      error: (err) => {
        this.showToast('error', 'profile.error', this.getErrorMessage(err));
        console.error('Upload lecture error:', err);
      },
      complete: () => {
        this.isUploadingLecture = false;
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 0) {
      return 'profile.networkError';
    }
    if (err.status === 401) {
      return 'profile.unauthorizedError';
    }
    if (err.status === 403) {
      return 'profile.forbiddenError';
    }
    if (err.status === 400) {
      return 'profile.badRequestError';
    }
    if (err.status === 500) {
      return 'profile.serverError';
    }
    return 'profile.unexpectedError';
  }

  getStudentSubjects(student: any): string {
    if (!student.subjects || !Array.isArray(student.subjects)) {
      return this.translationService.translate('profile.notSpecified');
    }
    if (student.subjects.length === 0) {
      return this.translationService.translate('profile.notSpecified');
    }
    return student.subjects.join(', ');
  }

  // Helper method to get validation error message
  getValidationError(fieldName: string, errorType: string): string {
    return this.translationService.translate(`profile.validation.${fieldName}.${errorType}`);
  }
}
