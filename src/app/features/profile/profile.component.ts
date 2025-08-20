import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ProfileService, ProfileResponse, UserProfile, UpdatePasswordResponse } from '../../core/services/profile.service';
import { Router } from '@angular/router';
import { JoinRequestService, JoinRequest, Meeting, JoinRequestResponse } from '../../core/services/join-request.service';
import { LectureService, LectureResponse, LowLectureMembersResponse } from '../../core/services/lecture.service';
import { LectureRequestService, LectureRequestData } from '../../core/services/lecture-request.service';
import { TranslationService } from '../../core/services/translation.service';
import { AuthService } from '../../core/services/auth.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import { Toast as BootstrapToast } from 'bootstrap';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  source?: string;
}

interface MeetingData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Student {
  id?: string;
  name: string;
  email: string;
  phone: string;
  grade?: string;
  subjects: { name: string; minLectures: number }[];
}

interface UploadImageResponse {
  success: boolean;
  data?: { profileImage: string };
  message?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FullCalendarModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: JoinRequest | null = null;
  activeMessage: { _id: string; content: string; createdAt: string; displayUntil: string } | null = null;
  toasts: Toast[] = [];
  lectureForm: FormGroup;
  pdfRequestForm: FormGroup;
  meetingForm: FormGroup;
  isUploadingLecture = false;
  isUploadingPdfRequest = false;
  isAddingMeeting = false;
  currentPassword = '';
  newPassword = '';
  showPasswordModal = false;
  errorCode: string | null = null;
  showMeetingModal = false;
  selectedFile: File | null = null;
  selectedPdfFile: File | null = null;
  isUploading = false;
  showUploadField = false;
  activeSection = 'profile';
  isDeletingMeeting: { [key: string]: boolean } = {};
  showLectureWarning = false;
  lowLectureWeekCount = 0;
  private submitSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private isInitialLoad = true;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    locale: 'ar',
    direction: 'rtl',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'اليوم',
      month: 'شهر',
      week: 'أسبوع',
      day: 'يوم'
    }
  };

  subjectKeys = [
    'mathematics', 'physics', 'chemistry', 'biology', 'arabic',
    'english', 'history', 'geography', 'islamic_studies',
    'computer_science', 'philosophy', 'psychology', 'economics', 'statistics'
  ];

  subjectsTranslations = {
    ar: [
      'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية',
      'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'العلوم الإسلامية',
      'الحاسوب', 'الفلسفة', 'علم النفس', 'الاقتصاد', 'الإحصاء'
    ],
    en: [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Arabic Language',
      'English Language', 'History', 'Geography', 'Islamic Studies',
      'Computer Science', 'Philosophy', 'Psychology', 'Economics', 'Statistics'
    ]
  };

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
    this.lectureForm = this.fb.group({
      studentEmail: ['', [Validators.required, Validators.email, this.studentEmailValidator.bind(this)]],
      subject: ['', [Validators.required, this.subjectValidator.bind(this)]],
      date: ['', [Validators.required, this.dateValidator.bind(this)]],
      duration: ['', [Validators.required, Validators.min(1), Validators.max(180), Validators.pattern(/^[1-9]\d*$/)]],
      link: ['', [Validators.required, Validators.pattern(/^https?:\/\/[^\s/$.?#].[^\s]*$/)]],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]]
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

    this.meetingForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      date: ['', [Validators.required]],
      startTime: ['', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: ['', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)]]
    }, { validators: this.meetingFormValidator.bind(this) });
  }

  ngOnInit(): void {
    this.toasts = [];
    if (!this.validateAuth()) {
      return;
    }
    this.loadProfile();
    this.submitSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('ProfileComponent: Submitting lecture...');
      this.uploadLecture();
    });
    this.isInitialLoad = false;
  }

  ngOnDestroy(): void {
    this.toasts = [];
    this.submitSubject.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validateAuth(): boolean {
    const userId = this.authService.getUserId();
    const token = this.authService.getToken();
    console.log('ProfileComponent: Validating auth:', { userId, token });
    if (!token || !userId || !this.authService.isLoggedIn()) {
      if (!this.isInitialLoad) {
        this.showToast('error', 'profile.error', 'profile.unauthorizedError', 'validateAuth');
      }
      this.authService.logout();
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  studentEmailValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!this.profile?.students?.some(student => student.email === control.value)) {
      return { invalidStudent: true };
    }
    return null;
  }

  subjectValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!this.subjectKeys.includes(control.value)) {
      return { invalidSubject: true };
    }
    return null;
  }

  dateValidator(control: AbstractControl): { [key: string]: any } | null {
    const date = control.value;
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    if (date < today || date > maxDateStr) {
      return { invalidDate: true };
    }
    return null;
  }

  meetingFormValidator(form: FormGroup): { [key: string]: any } | null {
    const date = form.get('date')?.value;
    const startTime = form.get('startTime')?.value;
    const endTime = form.get('endTime')?.value;
    const today = new Date().toISOString().split('T')[0];

    if (date && date < today) {
      return { invalidDate: true };
    }

    if (startTime && endTime && startTime >= endTime) {
      return { invalidTimeOrder: true };
    }

    return null;
  }

  getTranslatedSubjects(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    return this.subjectsTranslations[currentLang as keyof typeof this.subjectsTranslations] || this.subjectsTranslations.en;
  }

  getTranslatedSemesters(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    return currentLang === 'en' ? ['First Semester', 'Second Semester'] : this.semesters;
  }

  getTranslatedCountries(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    return currentLang === 'en' ? ['Jordan', 'Palestine'] : this.countries;
  }

  getTranslatedAcademicLevels(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    return currentLang === 'en'
      ? ['High School', "Bachelor's Degree", "Master's Degree", 'PhD', 'Diploma', 'Graduate Studies']
      : this.academicLevels;
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  }

  getStudentSubjects(student: Student): string {
    if (!student.subjects || student.subjects.length === 0) {
      return this.translationService.translate('profile.notSpecified') || 'غير محدد';
    }
    const currentLang = this.translationService.getCurrentLanguage();
    const translations = this.subjectsTranslations[currentLang as keyof typeof this.subjectsTranslations] || this.subjectsTranslations.en;
    return student.subjects.map(subject => {
      const index = this.subjectKeys.indexOf(subject.name);
      return index !== -1 ? translations[index] : subject.name;
    }).join(', ');
  }

  private showToast(type: 'success' | 'error' | 'info', titleKey: string, messageKey: string, source?: string): void {
    if (this.isInitialLoad) {
      console.log(`ProfileComponent: Suppressing toast during initial load (source: ${source || 'unknown'}):`, { type, titleKey, messageKey });
      return;
    }

    if (!titleKey || titleKey.trim() === '') {
      console.error(`ProfileComponent: Invalid title key (source: ${source || 'unknown'})`, { titleKey });
      titleKey = 'profile.error';
    }
    if (!messageKey || messageKey.trim() === '') {
      console.error(`ProfileComponent: Invalid message key (source: ${source || 'unknown'})`, { messageKey });
      messageKey = 'profile.unknownError';
    }

    const title = this.translationService.translate(titleKey) || 'Notification';
    const message = this.translationService.translate(messageKey) || 'Operation completed successfully';

    if (!message || message.trim() === '') {
      console.error(`ProfileComponent: Translated message is empty (source: ${source || 'unknown'})`, { messageKey, translated: message });
      return;
    }

    if (this.toasts.some(toast => toast.message === message && toast.source === source && toast.type === type)) {
      console.log(`ProfileComponent: Ignoring duplicate toast (source: ${source || 'unknown'}):`, { type, title, message });
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    this.toasts = [...this.toasts, { id, type, title, message, source }];
    console.log(`ProfileComponent: Showing toast (source: ${source || 'unknown'}):`, { id, type, title, message });

    setTimeout(() => {
      const toastElement = document.querySelector(`.toast[id="${id}"]`);
      if (toastElement) {
        const bootstrapToast = new BootstrapToast(toastElement, {
          autohide: true,
          delay: 5000
        });
        toastElement.addEventListener('hidden.bs.toast', () => {
          this.closeToast(id);
        });
        bootstrapToast.show();
      } else {
        console.error(`ProfileComponent: Toast element not found for ID: ${id}`);
        this.closeToast(id);
      }
    }, 100);
  }

  closeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  loadProfile(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      if (!this.isInitialLoad) {
        this.showToast('error', 'profile.error', 'profile.unauthorizedError', 'loadProfile');
      }
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.profileService.getProfile().subscribe({
      next: (response: JoinRequestResponse) => {
        console.log('ProfileComponent: Profile load response:', JSON.stringify(response, null, 2));
        if (response.success && response.data) {
          this.profile = this.processProfileData(response.data);
          this.setActiveMessage();
          this.showUploadField = !this.profile.profileImage;
          if (this.profile.students.length) {
            this.lectureForm.enable();
          } else {
            this.lectureForm.disable();
          }
          if (this.profile.numberOfStudents > 0 && this.profile.students.length === 0 && !this.isInitialLoad) {
            this.showToast('error', 'profile.error', 'profile.studentDataMismatch', 'loadProfile');
          }
          this.loadLowLectureMembers();
          this.updateCalendarEvents();
        } else {
          console.warn('ProfileComponent: Failed to load profile:', response.message);
          if (!this.isInitialLoad && response.message) {
            const messageKey = response.message === 'no_token' || response.message === 'invalid_headers'
              ? 'profile.unauthorizedError'
              : 'profile.loadError';
            this.showToast('error', 'profile.error', messageKey, 'loadProfile');
          }
        }
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error loading profile:', err);
        if (!this.isInitialLoad) {
          const messageKey = this.getErrorMessage(err);
          this.showToast('error', 'profile.error', messageKey, 'loadProfile');
        }
        if (err.error === 'no_token' || err.error === 'invalid_headers' || err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  private processProfileData(member: JoinRequest): JoinRequest {
    const isRtl = this.translationService.isRtl();
    const locale = isRtl ? 'ar-EG' : 'en-US';
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    return {
      ...member,
      id: member.id || '',
      createdAt: member.createdAt ? new Date(member.createdAt).toLocaleDateString(locale, dateOptions) : new Date().toLocaleDateString(locale, dateOptions),
      lectureCount: member.lectureCount || 0,
      lectures: member.lectures || [],
      students: (member.students || []).map((student: Student) => ({
        ...student,
        id: student.id || '',
        name: student.name || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        email: student.email || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        phone: student.phone || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        grade: student.grade || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        subjects: (student.subjects || []).map((subject: { name: string; minLectures: number }) => ({
          name: subject.name || this.translationService.translate('profile.notSpecified') || 'غير محدد',
          minLectures: subject.minLectures ?? 0
        }))
      })),
      meetings: (member.meetings || []).map((meeting: Meeting, index: number) => ({
        id: meeting.id || meeting._id || `meeting-${index}-${Date.now()}`,
        title: meeting.title || this.translationService.translate('profile.notSpecified') || 'غير محدد',
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

  private updateCalendarEvents(): void {
    if (this.profile?.meetings) {
      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.profile.meetings.map(meeting => ({
          id: meeting.id,
          title: meeting.title,
          start: `${meeting.date}T${meeting.startTime}`,
          end: `${meeting.date}T${meeting.endTime}`
        }))
      };
    }
  }

  loadLowLectureMembers(): void {
    this.lectureService.getLowLectureMembers().subscribe({
      next: (response: LowLectureMembersResponse) => {
        console.log('ProfileComponent: Low lecture members response:', JSON.stringify(response, null, 2));
        if (response.success) {
          const userId = this.authService.getUserId();
          const memberData = response.members.find(m => m.id === userId);
          this.showLectureWarning = !!memberData && memberData.underTargetStudents.length > 0;
          this.lowLectureWeekCount = memberData?.lowLectureWeekCount || 0;
          if (this.showLectureWarning && !this.isInitialLoad) {
            this.showToast('error', 'profile.warning', 'profile.lowLectureWarning', 'loadLowLectureMembers');
          }
        } else {
          console.warn('ProfileComponent: Failed to load low lecture members:', response.message);
          if (!this.isInitialLoad && response.message) {
            this.showToast('error', 'profile.error', response.message || 'profile.lowLectureLoadError', 'loadLowLectureMembers');
          }
        }
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error loading low lecture members:', err);
        if (!this.isInitialLoad) {
          this.showToast('error', 'profile.error', this.getErrorMessage(err), 'loadLowLectureMembers');
        }
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 401 || err.error === 'no_token' || err.error === 'invalid_headers') {
      return 'profile.unauthorizedError';
    } else if (err.status === 400) {
      return err.error?.message || 'profile.invalidRequest';
    } else if (err.status === 500) {
      return 'profile.serverError';
    }
    return 'profile.networkError';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 10 * 1024 * 1024) {
        this.showToast('error', 'profile.error', 'profile.fileSizeError', 'onFileSelected');
        this.selectedFile = null;
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        this.showToast('error', 'profile.error', 'profile.invalidFileType', 'onFileSelected');
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 20 * 1024 * 1024) {
        this.showToast('error', 'profile.error', 'profile.pdfFileSizeError', 'onPdfFileSelected');
        this.selectedPdfFile = null;
        return;
      }
      if (file.type !== 'application/pdf') {
        this.showToast('error', 'profile.error', 'profile.invalidPdfFileType', 'onPdfFileSelected');
        this.selectedPdfFile = null;
        return;
      }
      this.selectedPdfFile = file;
    } else {
      this.selectedPdfFile = null;
    }
  }

  uploadProfileImage(): void {
    if (!this.selectedFile) {
      this.showToast('error', 'profile.error', 'profile.noFileSelected', 'uploadProfileImage');
      return;
    }

    this.isUploading = true;
    this.profileService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response: UploadImageResponse) => {
        if (response.success && response.data) {
          if (this.profile) {
            this.profile.profileImage = response.data.profileImage;
          }
          this.showUploadField = false;
          this.selectedFile = null;
          this.showToast('success', 'profile.success', 'profile.imageUploaded', 'uploadProfileImage');
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.imageUploadError', 'uploadProfileImage');
        }
        this.isUploading = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error uploading profile image:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'uploadProfileImage');
        this.isUploading = false;
      }
    });
  }

  changeImage(): void {
    this.showUploadField = !this.showUploadField;
  }

  onSubmitLecture(): void {
    if (this.lectureForm.invalid) {
      this.lectureForm.markAllAsTouched();
      this.showToast('error', 'profile.error', 'profile.formInvalid', 'onSubmitLecture');
      return;
    }
    if (!this.profile?.students?.length) {
      this.showToast('error', 'profile.error', 'profile.noStudentsAvailable', 'onSubmitLecture');
      return;
    }
    this.submitSubject.next();
  }

  uploadLecture(): void {
    if (!this.profile?.students?.length) {
      this.showToast('error', 'profile.error', 'profile.noStudentsAvailable', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }

    const lectureData = this.lectureForm.value;
    const { studentEmail, subject, date, duration, link, name } = lectureData;

    const selectedStudent = this.profile.students.find(student => student.email === studentEmail);
    if (!selectedStudent) {
      this.showToast('error', 'profile.error', 'profile.invalidStudent', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }
    if (!this.subjectKeys.includes(subject)) {
      this.showToast('error', 'profile.error', 'profile.invalidSubject', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    if (date < today || date > maxDateStr) {
      this.showToast('error', 'profile.error', 'profile.invalidDate', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }
    if (duration < 1 || duration > 180) {
      this.showToast('error', 'profile.error', 'profile.invalidDuration', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }

    this.isUploadingLecture = true;
    this.lectureService.uploadLecture(studentEmail, subject, link, name).subscribe({
      next: (response: LectureResponse) => {
        if (response.success) {
          this.lectureForm.reset();
          Object.keys(this.lectureForm.controls).forEach(key => {
            this.lectureForm.get(key)?.setErrors(null);
            this.lectureForm.get(key)?.markAsUntouched();
          });
          this.loadProfile();
          this.showToast('success', 'profile.success', 'profile.lectureUploaded', 'uploadLecture');
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.lectureUploadError', 'uploadLecture');
        }
        this.isUploadingLecture = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error uploading lecture:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'uploadLecture');
        this.isUploadingLecture = false;
      }
    });
  }

  uploadPdfRequest(): void {
    if (this.pdfRequestForm.invalid) {
      this.pdfRequestForm.markAllAsTouched();
      this.showToast('error', 'profile.error', 'profile.formInvalid', 'uploadPdfRequest');
      return;
    }
    if (!this.selectedPdfFile) {
      this.showToast('error', 'profile.error', 'profile.noFileSelected', 'uploadPdfRequest');
      return;
    }

    const pdfRequestData: LectureRequestData = this.pdfRequestForm.value;

    this.isUploadingPdfRequest = true;
    this.lectureRequestService.uploadLectureRequest(pdfRequestData, this.selectedPdfFile).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.pdfRequestForm.reset();
          Object.keys(this.pdfRequestForm.controls).forEach(key => {
            this.pdfRequestForm.get(key)?.setErrors(null);
            this.pdfRequestForm.get(key)?.markAsUntouched();
          });
          this.selectedPdfFile = null;
          this.showToast('success', 'profile.success', 'profile.pdfRequestSubmitted', 'uploadPdfRequest');
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.pdfRequestError', 'uploadPdfRequest');
        }
        this.isUploadingPdfRequest = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error uploading PDF request:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'uploadPdfRequest');
        this.isUploadingPdfRequest = false;
      }
    });
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
      this.errorCode = 'missing_fields';
      this.showToast('error', 'profile.error', 'profile.password_fields_required', 'changePassword');
      return;
    }
    if (this.currentPassword === this.newPassword) {
      this.errorCode = 'same_password';
      this.showToast('error', 'profile.error', 'profile.same_password', 'changePassword');
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorCode = 'password_too_short';
      this.showToast('error', 'profile.error', 'profile.validation.password.minlength', 'changePassword');
      return;
    }

    this.profileService.updatePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response: UpdatePasswordResponse) => {
        if (response.success) {
          this.showToast('success', 'profile.success', 'profile.passwordChanged', 'changePassword');
          this.closePasswordModal();
        } else {
          this.errorCode = response.message || 'profile.password_change_error';
          this.showToast('error', 'profile.error', this.errorCode, 'changePassword');
        }
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error changing password:', err);
        this.errorCode = this.getErrorMessage(err);
        this.showToast('error', 'profile.error', this.errorCode, 'changePassword');
        if (err.status === 401 || err.error === 'no_token' || err.error === 'invalid_headers') {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  navigateToForgotPassword(): void {
    this.closePasswordModal();
    this.router.navigate(['/forgot-password']);
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  openMeetingModal(date: string = ''): void {
    this.showMeetingModal = true;
    this.meetingForm.reset();
    if (date) {
      this.meetingForm.patchValue({ date });
    }
  }

  closeMeetingModal(): void {
    this.showMeetingModal = false;
    this.meetingForm.reset();
    this.isAddingMeeting = false;
  }

  addMeeting(): void {
    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched();
      this.showToast('error', 'profile.error', 'profile.formInvalid', 'addMeeting');
      return;
    }

    const { title, date, startTime, endTime } = this.meetingForm.value;

    this.isAddingMeeting = true;
    this.profileService.addMeeting(title, date, startTime, endTime).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showToast('success', 'profile.success', 'profile.meetingAdded', 'addMeeting');
          this.closeMeetingModal();
          this.loadProfile();
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.meetingAddError', 'addMeeting');
        }
        this.isAddingMeeting = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error adding meeting:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'addMeeting');
        this.isAddingMeeting = false;
      }
    });
  }

  deleteMeeting(meetingId: string): void {
    if (!meetingId) {
      this.showToast('error', 'profile.error', 'profile.invalidMeetingId', 'deleteMeeting');
      return;
    }

    this.isDeletingMeeting[meetingId] = true;
    this.profileService.deleteMeeting(meetingId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showToast('success', 'profile.success', 'profile.meetingDeleted', 'deleteMeeting');
          this.loadProfile();
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.meetingDeleteError', 'deleteMeeting');
        }
        this.isDeletingMeeting[meetingId] = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error deleting meeting:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'deleteMeeting');
        this.isDeletingMeeting[meetingId] = false;
      }
    });
  }

  handleEventClick(arg: EventClickArg): void {
    const meetingId = arg.event.id;
    const meeting = this.profile?.meetings.find(m => m.id === meetingId);
    if (meeting) {
      this.showToast('info', 'profile.meetingDetails',
        `${meeting.title}: ${meeting.date} ${meeting.startTime}-${meeting.endTime}`,
        'handleEventClick'
      );
    }
  }

  handleDateClick(arg: DateClickArg): void {
    const selectedDate = arg.date.toISOString().split('T')[0];
    this.openMeetingModal(selectedDate);
  }
}
