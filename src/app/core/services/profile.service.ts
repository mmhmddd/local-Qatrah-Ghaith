import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { ApiEndpoints } from '../constants/api-endpoints';
import { JoinRequestResponse, JoinRequest } from './join-request.service';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export interface UserProfile {
  id: string;
  email: string;
  profileImage: string | null;
  numberOfStudents: number;
  subjects: string[];
  students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[];
  meetings: { _id?: string; id?: string; title: string; date: string | Date; startTime: string; endTime: string }[];
  lectures: { _id: string; studentEmail: string; subject: string; date: string; duration: number; link: string; name: string }[];
  lectureCount: number;
  messages: { _id: string; content: string; createdAt: string; displayUntil: string }[];
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
    joinRequest: JoinRequest | null;
  };
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}

export interface UploadImageResponse {
  success: boolean;
  message: string;
  data: {
    profileImage: string;
  };
}

export interface MeetingResponse {
  message: string;
  meetings: { _id: string; title: string; date: string; startTime: string; endTime: string; reminded: boolean }[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: AuthService
  ) {}

  private getHeaders(): Observable<HttpHeaders> {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('ProfileService: Not in browser, no token available.');
      return of(new HttpHeaders());
    }

    const token = this.authService.getToken();
    if (!token) {
      console.log('ProfileService: No token found, redirecting to login.');
      this.router.navigate(['/login']);
      return throwError(() => ({
        success: false,
        message: 'profile.no_token',
        error: 'no_token'
      }));
    }

    return of(new HttpHeaders({
      Authorization: `Bearer ${token}`
    }));
  }

  getProfile(): Observable<JoinRequestResponse> {
    return this.getHeaders().pipe(
      switchMap((headers: HttpHeaders) => {
        if (!headers.has('Authorization')) {
          console.error('ProfileService: No Authorization header, returning error.');
          return throwError(() => ({
            success: false,
            message: 'profile.invalid_headers',
            error: 'invalid_headers'
          }));
        }
        return this.http.get<ProfileResponse>(ApiEndpoints.profile.get, { headers }).pipe(
          map(response => {
            console.log('ProfileService: Profile API response:', JSON.stringify(response, null, 2));
            if (!response.success || !response.data || !response.data.user) {
              console.error('ProfileService: Invalid profile data:', response.message);
              throw new Error(response.message || 'profile.invalid_profile_data');
            }

            const validMeetings = response.data.user.meetings
              .filter(meeting => meeting._id || meeting.id)
              .map(meeting => ({
                id: meeting._id || meeting.id,
                title: meeting.title,
                date: typeof meeting.date === 'string' ? meeting.date : new Date(meeting.date).toISOString().split('T')[0],
                startTime: meeting.startTime,
                endTime: meeting.endTime
              }));

            return {
              success: true,
              message: response.message || 'profile.profile_fetch_success',
              data: {
                id: response.data.user.id,
                email: response.data.user.email,
                profileImage: response.data.user.profileImage,
                numberOfStudents: response.data.user.numberOfStudents,
                subjects: response.data.user.subjects,
                students: response.data.user.students.map(student => ({
                  ...student,
                  subjects: student.subjects || []
                })),
                meetings: validMeetings,
                lectures: response.data.user.lectures || [],
                lectureCount: response.data.user.lectureCount || 0,
                messages: response.data.user.messages || [],
                name: response.data.joinRequest?.name || '',
                phone: response.data.joinRequest?.phone || '',
                address: response.data.joinRequest?.address || '',
                academicSpecialization: response.data.joinRequest?.academicSpecialization || '',
                volunteerHours: response.data.joinRequest?.volunteerHours || 0,
                status: response.data.joinRequest?.status || 'Pending'
              }
            };
          }),
          catchError(error => {
            console.error('ProfileService: Error fetching profile:', error);
            let messageKey = 'profile.fetch_error';
            let errorCode = error.message || 'unknown_error';

            if (error.status === 401) {
              messageKey = 'profile.unauthorized_error';
              errorCode = 'unauthorized';
            } else if (error.status === 404) {
              messageKey = 'profile.profile_not_found';
              errorCode = 'not_found';
            } else if (error.status === 0) {
              messageKey = 'profile.network_error';
              errorCode = 'network_error';
            } else if (error.message) {
              messageKey = error.message;
            }

            return throwError(() => ({
              success: false,
              message: messageKey,
              error: errorCode
            }));
          })
        );
      }),
      catchError(error => {
        console.error('ProfileService: Error in request headers:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'profile.auth_error',
          error: error.error || 'auth_error'
        }));
      })
    );
  }

  uploadProfileImage(file: File): Observable<UploadImageResponse> {
    return this.getHeaders().pipe(
      switchMap((headers: HttpHeaders) => {
        if (!headers.has('Authorization')) {
          return throwError(() => ({ success: false, message: 'profile.invalid_headers', error: 'invalid_headers' }));
        }
        const formData = new FormData();
        formData.append('profileImage', file);
        return this.http.post<UploadImageResponse>(
          ApiEndpoints.profile.uploadImage,
          formData,
          { headers }
        ).pipe(
          catchError(error => {
            console.error('ProfileService: Error uploading profile image:', error);
            return throwError(() => ({
              success: false,
              message: error.message || 'profile.image_upload_error',
              error: error.message || 'image_upload_error'
            }));
          })
        );
      })
    );
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<UpdatePasswordResponse> {
    if (!currentPassword || !newPassword) {
      console.error('ProfileService: Missing password fields');
      return throwError(() => ({
        success: false,
        message: 'profile.password_fields_required',
        error: 'missing_fields'
      }));
    }

    if (currentPassword === newPassword) {
      console.error('ProfileService: New password is the same as current password');
      return throwError(() => ({
        success: false,
        message: 'profile.same_password',
        error: 'same_password'
      }));
    }

    if (newPassword.length < 6) {
      console.error('ProfileService: New password is too short');
      return throwError(() => ({
        success: false,
        message: 'profile.validation.password.minlength',
        error: 'password_too_short'
      }));
    }

    return this.getHeaders().pipe(
      switchMap((headers: HttpHeaders) => {
        if (!headers.has('Authorization')) {
          console.error('ProfileService: No Authorization header for password update');
          return throwError(() => ({
            success: false,
            message: 'profile.invalid_headers',
            error: 'invalid_headers'
          }));
        }
        console.log('ProfileService: Sending update password request');
        return this.http.put<UpdatePasswordResponse>(
          ApiEndpoints.profile.updatePassword,
          { currentPassword, newPassword },
          { headers }
        ).pipe(
          map(response => {
            console.log('ProfileService: Password update response:', response);
            if (!response.success) {
              throw new Error(response.message || 'profile.password_change_error');
            }
            return {
              success: true,
              message: response.message || 'profile.password_change_success'
            };
          }),
          catchError(error => {
            console.error('ProfileService: Error updating password:', error);
            let errorMessage = 'profile.password_change_error';
            let errorCode = error.message || 'unknown_error';

            if (error.status === 400) {
              if (error.error?.message?.includes('كلمة المرور الحالية غير صحيحة')) {
                errorMessage = 'profile.incorrect_password';
                errorCode = 'incorrect_password';
              } else if (error.error?.message?.includes('كلمة المرور الجديدة يجب أن تكون مختلفة')) {
                errorMessage = 'profile.same_password';
                errorCode = 'same_password';
              } else if (error.error?.message?.includes('يجب أن تكون كلمة المرور 6 أحرف على الأقل')) {
                errorMessage = 'profile.validation.password.minlength';
                errorCode = 'password_too_short';
              } else {
                errorMessage = 'profile.invalid_password_input';
                errorCode = 'invalid_input';
              }
            } else if (error.status === 401) {
              errorMessage = 'profile.unauthorized_error';
              errorCode = 'unauthorized';
            } else if (error.status === 404) {
              errorMessage = 'profile.profile_not_found';
              errorCode = 'not_found';
            } else if (error.status === 0) {
              errorMessage = 'profile.network_error';
              errorCode = 'network_error';
            }

            return throwError(() => ({
              success: false,
              message: errorMessage,
              error: errorCode
            }));
          })
        );
      }),
      catchError(error => {
        console.error('ProfileService: Error getting headers for password update:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'profile.auth_error',
          error: error.error || 'auth_error'
        }));
      })
    );
  }

  addMeeting(title: string, date: string, startTime: string, endTime: string): Observable<{ success: boolean; data: { meetings: any }; message?: string }> {
    // التحقق من الحقول المطلوبة
    if (!title || !date || !startTime || !endTime) {
      console.error('ProfileService: الحقول المطلوبة مفقودة:', { title, date, startTime, endTime });
      return throwError(() => ({
        success: false,
        message: 'يجب إدخال العنوان، التاريخ، وقت البدء، ووقت الانتهاء',
        error: 'missing_fields'
      }));
    }

    // التحقق من صيغة التاريخ (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error('ProfileService: صيغة التاريخ غير صالحة:', date);
      return throwError(() => ({
        success: false,
        message: 'صيغة التاريخ غير صالحة، يجب أن تكون YYYY-MM-DD',
        error: 'invalid_date_format'
      }));
    }

    // التحقق من أن التاريخ صالح
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.error('ProfileService: التاريخ غير صالح:', date);
      return throwError(() => ({
        success: false,
        message: 'التاريخ غير صالح',
        error: 'invalid_date'
      }));
    }

    // التحقق من صيغة الوقت (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      console.error('ProfileService: صيغة الوقت غير صالحة:', { startTime, endTime });
      return throwError(() => ({
        success: false,
        message: 'صيغة الوقت غير صالحة، يجب أن تكون HH:mm',
        error: 'invalid_time_format'
      }));
    }

    // التحقق من أن وقت الانتهاء بعد وقت البدء
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    if (endMinutes <= startMinutes) {
      console.error('ProfileService: وقت الانتهاء يجب أن يكون بعد وقت البدء:', { startTime, endTime });
      return throwError(() => ({
        success: false,
        message: 'وقت الانتهاء يجب أن يكون بعد وقت البدء',
        error: 'invalid_time_range'
      }));
    }

    return this.getHeaders().pipe(
      switchMap((headers: HttpHeaders) => {
        if (!headers.has('Authorization')) {
          console.error('ProfileService: لا يوجد رأس Authorization');
          return throwError(() => ({
            success: false,
            message: 'فشل في التحقق من الهوية',
            error: 'invalid_headers'
          }));
        }
        console.log('ProfileService: إرسال طلب إضافة موعد:', { title, date, startTime, endTime });
        return this.http.post<MeetingResponse>(
          ApiEndpoints.profile.addMeeting,
          { title, date, startTime, endTime },
          { headers }
        ).pipe(
          map(response => {
            console.log('ProfileService: تم إضافة الموعد بنجاح:', response);
            return {
              success: true,
              data: { meetings: response.meetings },
              message: response.message || 'تم إضافة الموعد بنجاح'
            };
          }),
          catchError(error => {
            console.error('ProfileService: خطأ في إضافة الموعد:', error);
            let messageKey = 'خطأ في إضافة الموعد';
            let errorCode = error.message || 'meeting_add_error';

            if (error.status === 400) {
              if (error.error?.message?.includes('العنوان، التاريخ، وقت البدء، ووقت الانتهاء مطلوبة')) {
                messageKey = 'يجب إدخال العنوان، التاريخ، وقت البدء، ووقت الانتهاء';
                errorCode = 'missing_fields';
              } else if (error.error?.message?.includes('صيغة التاريخ غير صالحة')) {
                messageKey = 'صيغة التاريخ غير صالحة، يجب أن تكون YYYY-MM-DD';
                errorCode = 'invalid_date_format';
              }
            } else if (error.status === 401) {
              messageKey = 'غير مصرح، يرجى تسجيل الدخول';
              errorCode = 'unauthorized';
            } else if (error.status === 404) {
              messageKey = 'المستخدم غير موجود';
              errorCode = 'not_found';
            } else if (error.status === 0) {
              messageKey = 'فشل في الاتصال بالخادم';
              errorCode = 'network_error';
            }

            return throwError(() => ({
              success: false,
              message: messageKey,
              error: errorCode
            }));
          })
        );
      }),
      catchError(error => {
        console.error('ProfileService: خطأ في الحصول على رأس الطلب:', error);
        return throwError(() => ({
          success: false,
          message: 'فشل في التحقق من الهوية',
          error: 'auth_error'
        }));
      })
    );
  }

  deleteMeeting(meetingId: string): Observable<{ success: boolean; data: { meetings: any }; message?: string }> {
    if (!meetingId || meetingId.trim() === '') {
      console.error('ProfileService: Invalid meeting ID:', meetingId);
      return throwError(() => ({
        success: false,
        message: 'profile.invalid_meeting_id',
        error: 'invalid_meeting_id'
      }));
    }

    return this.getHeaders().pipe(
      switchMap((headers: HttpHeaders) => {
        if (!headers.has('Authorization')) {
          return throwError(() => ({ success: false, message: 'profile.invalid_headers', error: 'invalid_headers' }));
        }
        return this.http.delete<MeetingResponse>(
          ApiEndpoints.profile.deleteMeeting(meetingId),
          { headers }
        ).pipe(
          map((response: MeetingResponse) => ({
            success: true,
            data: { meetings: response.meetings },
            message: response.message || 'profile.meeting_delete_success'
          })),
          catchError(error => {
            console.error('ProfileService: Error deleting meeting:', error);
            let messageKey = 'profile.meeting_delete_error';
            let errorCode = error.message || 'meeting_delete_error';

            if (error.status === 400) {
              messageKey = 'profile.invalid_meeting_id';
              errorCode = 'invalid_meeting_id';
            } else if (error.status === 404) {
              messageKey = 'profile.profile_not_found';
              errorCode = 'not_found';
            } else if (error.status === 401) {
              messageKey = 'profile.unauthorized_error';
              errorCode = 'unauthorized';
            }

            return throwError(() => ({
              success: false,
              message: messageKey,
              error: errorCode
            }));
          })
        );
      })
    );
  }
}
