import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { ApiEndpoints } from '../constants/api-endpoints';
import { JoinRequestResponse, JoinRequest } from './join-request.service';
import { Router } from '@angular/router';

export interface UserProfile {
  id: string;
  email: string;
  profileImage: string | null;
  numberOfStudents: number;
  subjects: string[];
  students: { name: string; email: string; phone: string; grade?: string; subject?: string }[];
  meetings: { _id?: string; id?: string; title: string; date: string | Date; startTime: string; endTime: string }[];
  lectures: { _id: string; link: string; createdAt: string }[];
  lectureCount: number;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
    joinRequest: JoinRequest | null;
  };
}

interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}

interface UploadImageResponse {
  success: boolean;
  message: string;
  data: {
    profileImage: string;
  };
}

interface MeetingResponse {
  message: string;
  meetings: { _id: string; title: string; date: string | Date; startTime: string; endTime: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  private getHeaders(): HttpHeaders {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }
    if (!token) {
      this.router.navigate(['/login']);
      throw new Error('No token found. Redirecting to login.');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getProfile(): Observable<JoinRequestResponse> {
    return this.http.get<ProfileResponse>(ApiEndpoints.profile.get, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('Server response:', response);
        if (!response.success || !response.data || !response.data.user) {
          throw new Error(response.message || 'Invalid profile data');
        }
        return {
          success: true,
          message: response.message || 'تم جلب بيانات الملف الشخصي بنجاح',
          data: {
            id: response.data.user.id,
            email: response.data.user.email,
            profileImage: response.data.user.profileImage,
            numberOfStudents: response.data.user.numberOfStudents,
            subjects: response.data.user.subjects,
            students: response.data.user.students,
            meetings: response.data.user.meetings.map(meeting => ({
              id: meeting._id || meeting.id || '',
              title: meeting.title,
              date: typeof meeting.date === 'string' ? meeting.date : new Date(meeting.date).toISOString().split('T')[0],
              startTime: meeting.startTime,
              endTime: meeting.endTime,
            })),
            lectures: response.data.user.lectures || [],
            lectureCount: response.data.user.lectureCount || 0,
            name: response.data.joinRequest?.name || '',
            phone: response.data.joinRequest?.phone || '',
            address: response.data.joinRequest?.address || '',
            academicSpecialization: response.data.joinRequest?.academicSpecialization || '',
            volunteerHours: response.data.joinRequest?.volunteerHours || 0,
            status: response.data.joinRequest?.status || 'Pending',
          },
        };
      }),
      catchError(error => {
        console.error('Error fetching profile:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'خطأ في جلب بيانات الملف الشخصي',
          error: error.message,
        }));
      })
    );
  }

  uploadProfileImage(file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('profileImage', file);
    return this.http.post<UploadImageResponse>(ApiEndpoints.profile.uploadImage, formData, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error uploading profile image:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'فشل في رفع الصورة',
          error: error.message,
        }));
      })
    );
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<UpdatePasswordResponse> {
    if (!currentPassword || !newPassword) {
      return throwError(() => ({
        success: false,
        message: 'كلمة المرور الحالية والجديدة مطلوبة',
      }));
    }
    return this.http.put<UpdatePasswordResponse>(ApiEndpoints.profile.updatePassword, { currentPassword, newPassword }, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error updating password:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'فشل في تغيير كلمة المرور',
          error: error.message,
        }));
      })
    );
  }

  addMeeting(title: string, date: string, startTime: string, endTime: string): Observable<{ success: boolean; data: { meetings: any }; message?: string }> {
    if (!title || !date || !startTime || !endTime) {
      return throwError(() => ({
        success: false,
        message: 'جميع تفاصيل الموعد مطلوبة',
      }));
    }
    return this.http.post<MeetingResponse>(ApiEndpoints.profile.addMeeting, { title, date, startTime, endTime }, { headers: this.getHeaders() }).pipe(
      map(response => ({
        success: true,
        data: { meetings: response.meetings },
        message: response.message || 'تم إضافة الموعد بنجاح',
      })),
      catchError(error => {
        console.error('Error adding meeting:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'فشل في إضافة الموعد',
          error: error.message,
        }));
      })
    );
  }

  deleteMeeting(meetingId: string): Observable<{ success: boolean; data: { meetings: any }; message?: string }> {
    if (!meetingId) {
      return throwError(() => ({
        success: false,
        message: 'معرف الموعد مطلوب',
      }));
    }
    return this.http.delete<MeetingResponse>(ApiEndpoints.profile.deleteMeeting(meetingId), { headers: this.getHeaders() }).pipe(
      map(response => ({
        success: true,
        data: { meetings: response.meetings },
        message: response.message || 'تم حذف الموعد بنجاح',
      })),
      catchError(error => {
        console.error('Error deleting meeting:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'فشل في حذف الموعد',
          error: error.message,
        }));
      })
    );
  }
}
