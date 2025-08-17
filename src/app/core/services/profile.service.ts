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
      console.log('Not in browser, no token available');
      return of(new HttpHeaders());
    }

    const token = this.authService.getToken();
    if (!token) {
      console.log('No token found, redirecting to login');
      this.router.navigate(['/login']);
      return throwError(() => ({ success: false, message: 'No token found' }));
    }

  

    return of(new HttpHeaders({
      Authorization: `Bearer ${token}`
    }));
  }

  getProfile(): Observable<JoinRequestResponse> {
    return this.getHeaders().pipe(
      switchMap(headers => {
        if (!headers.has('Authorization')) {
          return throwError(() => ({ success: false, message: 'Invalid headers' }));
        }
        return this.http.get<ProfileResponse>(ApiEndpoints.profile.get, { headers }).pipe(
          map(response => {
            console.log('Profile API response:', response);
            if (!response.success || !response.data || !response.data.user) {
              throw new Error(response.message || 'Invalid profile data');
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
              message: response.message || 'Profile data fetched successfully',
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
            console.error('Error fetching profile:', error);
            return throwError(() => ({
              success: false,
              message: error.message || 'Error fetching profile data',
              error: error.message
            }));
          })
        );
      }),
      catchError(error => {
        console.error('Header error:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'Authentication error',
          error: error.message
        }));
      })
    );
  }

  uploadProfileImage(file: File): Observable<UploadImageResponse> {
    return this.getHeaders().pipe(
      switchMap(headers => {
        if (!headers.has('Authorization')) {
          return throwError(() => ({ success: false, message: 'Invalid headers' }));
        }
        const formData = new FormData();
        formData.append('profileImage', file);
        return this.http.post<UploadImageResponse>(
          ApiEndpoints.profile.uploadImage,
          formData,
          { headers }
        ).pipe(
          catchError(error => {
            console.error('Error uploading profile image:', error);
            return throwError(() => ({
              success: false,
              message: error.message || 'Failed to upload image',
              error: error.message
            }));
          })
        );
      })
    );
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<UpdatePasswordResponse> {
    if (!currentPassword || !newPassword) {
      return throwError(() => ({
        success: false,
        message: 'Current and new password are required',
        error: 'missing_fields'
      }));
    }

    if (currentPassword === newPassword) {
      return throwError(() => ({
        success: false,
        message: 'New password cannot be the same as current password',
        error: 'same_password'
      }));
    }

    return this.getHeaders().pipe(
      switchMap(headers => {
        if (!headers.has('Authorization')) {
          return throwError(() => ({ success: false, message: 'Invalid headers' }));
        }
        return this.http.put<UpdatePasswordResponse>(
          ApiEndpoints.profile.updatePassword,
          { currentPassword, newPassword },
          { headers }
        ).pipe(
          catchError(error => {
            console.error('Error updating password:', error);
            let errorMessage = 'Failed to change password';
            let errorCode = 'unknown_error';

            if (error.status === 401) {
              errorMessage = 'Current password is incorrect';
              errorCode = 'incorrect_password';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
              errorCode = error.error.code || 'unknown_error';
            }

            return throwError(() => ({
              success: false,
              message: errorMessage,
              error: errorCode
            }));
          })
        );
      })
    );
  }

  addMeeting(title: string, date: string, startTime: string, endTime: string): Observable<{ success: boolean; data: { meetings: any }; message?: string }> {
    if (!title || !date || !startTime || !endTime) {
      return throwError(() => ({
        success: false,
        message: 'All meeting details are required'
      }));
    }

    return this.getHeaders().pipe(
      switchMap(headers => {
        if (!headers.has('Authorization')) {
          return throwError(() => ({ success: false, message: 'Invalid headers' }));
        }
        return this.http.post<MeetingResponse>(
          ApiEndpoints.profile.addMeeting,
          { title, date, startTime, endTime },
          { headers }
        ).pipe(
          map(response => ({
            success: true,
            data: { meetings: response.meetings },
            message: response.message || 'Meeting added successfully'
          })),
          catchError(error => {
            console.error('Error adding meeting:', error);
            return throwError(() => ({
              success: false,
              message: error.message || 'Failed to add meeting',
              error: error.message
            }));
          })
        );
      })
    );
  }

  deleteMeeting(meetingId: string): Observable<{ success: boolean; data: { meetings: any }; message?: string }> {
    if (!meetingId || meetingId.trim() === '') {
      console.error('Invalid meetingId:', meetingId);
      return throwError(() => ({
        success: false,
        message: 'Meeting ID is required and must be valid'
      }));
    }

    return this.getHeaders().pipe(
      switchMap(headers => {
        if (!headers.has('Authorization')) {
          return throwError(() => ({ success: false, message: 'Invalid headers' }));
        }
        return this.http.delete<MeetingResponse>(
          ApiEndpoints.profile.deleteMeeting(meetingId),
          { headers }
        ).pipe(
          map(response => ({
            success: true,
            data: { meetings: response.meetings },
            message: response.message || 'Meeting deleted successfully'
          })),
          catchError(error => {
            console.error('Error deleting meeting:', error);
            return throwError(() => ({
              success: false,
              message: error.message || 'Failed to delete meeting',
              error: error.message
            }));
          })
        );
      })
    );
  }
}
