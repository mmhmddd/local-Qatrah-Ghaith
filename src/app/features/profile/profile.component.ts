// profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { Router } from '@angular/router';
import { JoinRequestService, JoinRequestResponse } from '../../core/services/join-request.service';
import { LectureService, LectureResponse, NotificationResponse } from '../../core/services/lecture.service';
import { LectureRequestService, LectureRequestData } from '../../core/services/lecture-request.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile: JoinRequestResponse['data'] | null = null;
  error: string | null = null;
  errorCode: string | null = null;
  successMessage: string | null = null;
  lectureForm: FormGroup;
  pdfRequestForm: FormGroup;
  isUploadingLecture: boolean = false;
  isUploadingPdfRequest: boolean = false;
  notifications: NotificationResponse['notifications'] = [];
  unreadNotificationsCount: number = 0;
  currentPassword: string = '';
  newPassword: string = '';
  showPasswordModal: boolean = false;
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
              subjects: student.subjects || [] // Keep subjects as array
            }))
          };
          this.showUploadField = !this.profile.profileImage;
          console.log('Students:', this.profile.students);
          console.log('Number of Students:', this.profile.numberOfStudents);
          if (this.profile.numberOfStudents > 0 && this.profile.students.length === 0) {
            this.error = 'يوجد تناقض في بيانات الطلاب. يرجى التواصل مع الإدارة.';
            console.warn(this.error);
          }
        } else {
          this.error = response.message || 'فشل في جلب بيانات الملف الشخصي';
        }
      },
      error: (err) => {
        this.error = err.message || 'حدث خطأ أثناء جلب بيانات الملف الشخصي';
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
        }
      },
      error: (err) => {
        this.error = err.message || 'فشل في جلب الإشعارات';
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
          this.successMessage = 'تم تحديد الإشعارات كمقروءة';
        }
      },
      error: (err) => {
        this.error = err.message || 'فشل في تحديد الإشعارات كمقروءة';
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
          this.successMessage = 'تم حذف الإشعار بنجاح';
        }
      },
      error: (err) => {
        this.error = err.message || 'فشل في حذف الإشعار';
        console.error('Delete notification error:', err);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      if (this.selectedFile.size > 10 * 1024 * 1024) {
        this.error = 'حجم الملف كبير جدًا. الحد الأقصى 10 ميغابايت';
        this.selectedFile = null;
        return;
      }
      this.uploadProfileImage();
    }
  }

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (file.type !== 'application/pdf') {
        this.error = 'الملفات المسموح بها هي: PDF فقط';
        input.value = '';
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.error = 'حجم الملف كبير جدًا. الحد الأقصى 10 ميغابايت';
        input.value = '';
        return;
      }

      this.selectedPdfFile = file;
      this.error = null;
    }
  }

  uploadProfileImage(): void {
    if (!this.selectedFile) {
      this.error = 'يرجى اختيار صورة أولاً';
      return;
    }
    this.isUploading = true;
    this.profileService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        console.log('Upload image response:', response);
        if (response.success && response.data && this.profile) {
          this.profile.profileImage = response.data.profileImage;
          this.showUploadField = false;
          this.selectedFile = null;
          this.error = null;
          this.successMessage = response.message || 'تم رفع الصورة بنجاح';
          const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.error = err.message || 'فشل في رفع الصورة';
        console.error('Upload image error:', err);
      },
      complete: () => {
        this.isUploading = false;
      }
    });
  }

  uploadPdfRequest(): void {
    if (this.pdfRequestForm.invalid) {
      this.error = 'يرجى ملء جميع الحقول بشكل صحيح';
      this.pdfRequestForm.markAllAsTouched();
      return;
    }

    if (!this.selectedPdfFile) {
      this.error = 'يرجى اختيار ملف PDF للرفع';
      return;
    }

    this.isUploadingPdfRequest = true;
    const lectureData: LectureRequestData = this.pdfRequestForm.value;

    this.lectureRequestService.uploadLectureRequest(lectureData, this.selectedPdfFile).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.error = null;
          this.pdfRequestForm.reset();
          this.selectedPdfFile = null;

          // Clear the file input
          const fileInput = document.getElementById('pdfFileInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';

          // Optionally fetch notifications to show any new ones
          this.fetchNotifications();
        }
      },
      error: (err) => {
        this.error = err.message || 'فشل في رفع طلب المحاضرة';
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
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.error = null;
    this.errorCode = null;
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.error = 'يرجى إدخال كلمة المرور الحالية والجديدة';
      return;
    }

    this.profileService.updatePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'تم تغيير كلمة المرور بنجاح';
        this.error = null;
        this.closePasswordModal();
      },
      error: (err) => {
        this.error = err.message || 'فشل في تغيير كلمة المرور';
        this.errorCode = err.error || 'unknown_error'; // Store error code for conditional rendering
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
            this.profile.meetings = response.data.meetings;
            this.successMessage = response.message || 'تم إضافة الموعد بنجاح';
            this.closeMeetingModal();
          }
        },
        error: (err) => {
          this.error = err.message || 'فشل في إضافة الموعد';
        }
      });
    } else {
      this.error = 'يرجى إدخال جميع تفاصيل الموعد';
    }
  }

  deleteMeeting(meetingId: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      this.profileService.deleteMeeting(meetingId).subscribe({
        next: (response) => {
          if (response.success && response.data && this.profile) {
            this.profile.meetings = response.data.meetings;
            this.successMessage = response.message || 'تم حذف الموعد بنجاح';
          }
        },
        error: (err) => {
          this.error = err.message || 'فشل في حذف الموعد';
        }
      });
    }
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  uploadLecture(): void {
    if (this.lectureForm.invalid) {
      this.error = 'يرجى ملء جميع الحقول بشكل صحيح';
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
          this.successMessage = response.message || 'تم رفع المحاضرة بنجاح';
          this.error = null;
          this.lectureForm.reset();
          this.fetchNotifications();
        }
      },
      error: (err) => {
        this.error = err.message || 'فشل في رفع المحاضرة';
        console.error('Upload lecture error:', err);
      },
      complete: () => {
        this.isUploadingLecture = false;
      }
    });
  }

  // Helper method to display subjects properly
  getStudentSubjects(student: any): string {
    if (!student.subjects || !Array.isArray(student.subjects)) {
      return 'غير محدد';
    }
    if (student.subjects.length === 0) {
      return 'غير محدد';
    }
    return student.subjects.join(', ');
  }
}
