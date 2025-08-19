import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface LectureResponse {
  success: boolean;
  message: string;
  lecture?: {
    _id?: string;
    studentEmail: string;
    subject: string;
    link: string;
    name: string;
    createdAt?: string;
  };
  lectures?: {
    _id?: string;
    studentEmail: string;
    subject: string;
    link: string;
    name: string;
    createdAt?: string;
  }[];
  lectureCount?: number;
  volunteerHours?: number;
}

export interface LowLectureMembersResponse {
  success: boolean;
  message: string;
  members: {
    id: string | null;
    _id: string;
    name: string;
    email: string;
    lowLectureWeekCount: number;
    underTargetStudents: {
      studentName: string;
      studentEmail: string;
      academicLevel: string;
      underTargetSubjects: {
        name: string;
        minLectures: number;
        deliveredLectures: number;
      }[];
    }[];
    lectures: {
      _id: string;
      studentEmail: string;
      subject: string;
      createdAt: string;
      link: string;
      name: string;
    }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class LectureService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      throw new Error('No authentication token found');
    }
    return this.headers.set('Authorization', `Bearer ${token}`);
  }

  private isValidUrl(url: string): boolean {
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    return urlRegex.test(url);
  }

  uploadLecture(
    studentEmail: string,
    subject: string,
    link: string,
    name: string
  ): Observable<LectureResponse> {
    console.log('Sending lecture data:', { studentEmail, subject, link, name });
    if (!studentEmail || !subject || !link || !name) {
      return throwError(() => ({
        success: false,
        message: 'All fields (studentEmail, subject, link, name) are required'
      }));
    }
    if (!this.isValidUrl(link)) {
      return throwError(() => ({
        success: false,
        message: 'Lecture link must be a valid URL starting with http:// or https://'
      }));
    }
    if (name.length < 1 || name.length > 100) {
      return throwError(() => ({
        success: false,
        message: 'Lecture name must be between 1 and 100 characters'
      }));
    }
    if (subject.length < 1 || subject.length > 100) {
      return throwError(() => ({
        success: false,
        message: 'Subject name must be between 1 and 100 characters'
      }));
    }
    return this.http
      .post<LectureResponse>(
        ApiEndpoints.lectures.upload,
        { studentEmail, subject, link, name },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => {
          console.log('Lecture upload response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to upload lecture');
          }
          return {
            success: true,
            message: response.message || 'Lecture uploaded successfully',
            lecture: response.lecture,
            lectureCount: response.lectureCount || 0,
            volunteerHours: response.volunteerHours || 0
          };
        }),
        catchError(error => {
          console.error('Upload lecture error:', error);
          let message = 'Failed to upload lecture';
          if (error.status === 404) {
            message = 'Student email or join request not found';
          } else if (error.status === 400) {
            message = error.error?.message || 'Invalid lecture data';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  updateLecture(
    lectureId: string,
    studentEmail: string,
    subject: string,
    link: string,
    name: string
  ): Observable<LectureResponse> {
    console.log('Updating lecture data:', { lectureId, studentEmail, subject, link, name });
    if (!lectureId || !studentEmail || !subject || !link || !name) {
      return throwError(() => ({
        success: false,
        message: 'All fields (lectureId, studentEmail, subject, link, name) are required'
      }));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(lectureId.trim())) {
      return throwError(() => ({
        success: false,
        message: 'Invalid lecture ID: Must be a valid MongoDB ObjectId'
      }));
    }
    if (!this.isValidUrl(link)) {
      return throwError(() => ({
        success: false,
        message: 'Lecture link must be a valid URL starting with http:// or https://'
      }));
    }
    if (name.length < 1 || name.length > 100) {
      return throwError(() => ({
        success: false,
        message: 'Lecture name must be between 1 and 100 characters'
      }));
    }
    if (subject.length < 1 || subject.length > 100) {
      return throwError(() => ({
        success: false,
        message: 'Subject name must be between 1 and 100 characters'
      }));
    }
    return this.http
      .put<LectureResponse>(
        ApiEndpoints.lectures.update(lectureId),
        { studentEmail, subject, link, name },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => {
          console.log('Lecture update response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to update lecture');
          }
          return {
            success: true,
            message: response.message || 'Lecture updated successfully',
            lecture: response.lecture,
            lectureCount: response.lectureCount || 0,
            volunteerHours: response.volunteerHours || 0
          };
        }),
        catchError(error => {
          console.error('Update lecture error:', error);
          let message = 'Failed to update lecture';
          if (error.status === 404) {
            message = 'Lecture or student email not found';
          } else if (error.status === 400) {
            message = error.error?.message || 'Invalid lecture data';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  deleteLecture(lectureId: string): Observable<LectureResponse> {
    console.log('Deleting lecture:', { lectureId });
    if (!lectureId) {
      return throwError(() => ({
        success: false,
        message: 'Lecture ID is required'
      }));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(lectureId.trim())) {
      return throwError(() => ({
        success: false,
        message: 'Invalid lecture ID: Must be a valid MongoDB ObjectId'
      }));
    }
    return this.http
      .delete<LectureResponse>(ApiEndpoints.lectures.delete(lectureId), { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Lecture delete response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete lecture');
          }
          return {
            success: true,
            message: response.message || 'Lecture deleted successfully',
            lectureCount: response.lectureCount || 0,
            volunteerHours: response.volunteerHours || 0
          };
        }),
        catchError(error => {
          console.error('Delete lecture error:', error);
          let message = 'Failed to delete lecture';
          if (error.status === 404) {
            message = 'Lecture not found';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 403) {
            message = 'Admin access required.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  getLectures(): Observable<LectureResponse> {
    console.log('Fetching lectures');
    return this.http
      .get<LectureResponse>(ApiEndpoints.lectures.list, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Get lectures response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch lectures');
          }
          return {
            success: true,
            message: response.message || 'Lectures fetched successfully',
            lectures: response.lectures || [],
            lectureCount: response.lectureCount || 0,
            volunteerHours: response.volunteerHours || 0
          };
        }),
        catchError(error => {
          console.error('Get lectures error:', error);
          let message = 'Failed to fetch lectures';
          if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  getLowLectureMembers(): Observable<LowLectureMembersResponse> {
    console.log('Fetching low lecture members');
    return this.http
      .get<LowLectureMembersResponse>(ApiEndpoints.lectures.lowLectureMembers, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Low lecture members response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch low lecture members');
          }
          return {
            success: true,
            message: response.message || 'Low lecture members fetched successfully',
            members: response.members || []
          };
        }),
        catchError(error => {
          console.error('Get low lecture members error:', error);
          let message = 'Failed to fetch low lecture members';
          if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 403) {
            message = 'Admin access required.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  getNotifications(): Observable<any> {
    console.log('Fetching notifications');
    return this.http
      .get<any>(ApiEndpoints.lectures.notifications, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Notifications response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch notifications');
          }
          return {
            success: true,
            message: response.message || 'Notifications fetched successfully',
            notifications: response.notifications || []
          };
        }),
        catchError(error => {
          console.error('Get notifications error:', error);
          let message = 'Failed to fetch notifications';
          if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  markNotificationsRead(): Observable<any> {
    console.log('Marking notifications as read');
    return this.http
      .post<any>(ApiEndpoints.lectures.markNotificationsRead, {}, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Mark notifications read response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to mark notifications as read');
          }
          return {
            success: true,
            message: response.message || 'Notifications marked as read',
            notifications: response.notifications || []
          };
        }),
        catchError(error => {
          console.error('Mark notifications read error:', error);
          let message = 'Failed to mark notifications as read';
          if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  deleteNotification(notificationId: string): Observable<any> {
    console.log('Deleting notification:', { notificationId });
    if (!notificationId) {
      return throwError(() => ({
        success: false,
        message: 'Notification ID is required'
      }));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(notificationId.trim())) {
      return throwError(() => ({
        success: false,
        message: 'Invalid notification ID: Must be a valid MongoDB ObjectId'
      }));
    }
    return this.http
      .delete<any>(ApiEndpoints.lectures.deleteNotification(notificationId), { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Delete notification response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete notification');
          }
          return {
            success: true,
            message: response.message || 'Notification deleted successfully'
          };
        }),
        catchError(error => {
          console.error('Delete notification error:', error);
          let message = 'Failed to delete notification';
          if (error.status === 404) {
            message = 'Notification not found';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }
}
