import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface LectureResponse {
  success: boolean;
  message: string;
  lecture?: { link: string; name: string; subject: string; createdAt: string; _id?: string };
  lectures?: { link: string; name: string; subject: string; createdAt: string; _id: string }[];
  lectureCount?: number;
  volunteerHours?: number;
}

export interface PdfResponse {
  success: boolean;
  message: string;
  pdfs?: { _id: string; title: string; description: string; creatorName: string; subject: string; semester: string; country: string; academicLevel: string; fileName: string; createdAt: string }[];
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  notifications: {
    _id: string;
    userId: { _id: string; email: string };
    message: string;
    type: string;
    createdAt: string;
    read: boolean;
    lectureDetails?: { link: string; name: string; subject: string };
  }[];
}

export interface LowLectureMembersResponse {
  success: boolean;
  message: string;
  members: {
    _id: string;
    name: string;
    email: string;
    underTargetSubjects: string[];
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

  uploadLecture(link: string, name: string, subject: string): Observable<LectureResponse> {
    if (!link || !name || !subject) {
      return throwError(() => ({
        success: false,
        message: 'رابط المحاضرة، الاسم، والمادة مطلوبة',
      }));
    }
    return this.http.post<LectureResponse>(ApiEndpoints.lectures.upload, { link, name, subject }, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم إضافة المحاضرة بنجاح',
        lecture: response.lecture,
        lectureCount: response.lectureCount,
        volunteerHours: response.volunteerHours
      })),
      catchError(error => {
        console.error('Error uploading lecture:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في إضافة المحاضرة',
          error: error.message,
        }));
      })
    );
  }

  deleteLecture(lectureId: string): Observable<LectureResponse> {
    if (!lectureId) {
      return throwError(() => ({
        success: false,
        message: 'معرف المحاضرة مطلوب',
      }));
    }
    return this.http.delete<LectureResponse>(ApiEndpoints.lectures.delete(lectureId), { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم حذف المحاضرة بنجاح',
        lectureCount: response.lectureCount,
      })),
      catchError(error => {
        console.error('Error deleting lecture:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في حذف المحاضرة',
          error: error.message,
        }));
      })
    );
  }

  getLectures(): Observable<LectureResponse> {
    return this.http.get<LectureResponse>(ApiEndpoints.lectures.list, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب المحاضرات بنجاح',
        lectures: response.lectures,
      })),
      catchError(error => {
        console.error('Error fetching lectures:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في جلب المحاضرات',
          error: error.message,
        }));
      })
    );
  }

  getNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(ApiEndpoints.lectures.notifications, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب الإشعارات بنجاح',
        notifications: response.notifications
      })),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في جلب الإشعارات',
          error: error.message,
        }));
      })
    );
  }

  markNotificationsRead(): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(ApiEndpoints.lectures.markNotificationsRead, {}, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديد الإشعارات كمقروءة',
        notifications: response.notifications
      })),
      catchError(error => {
        console.error('Error marking notifications as read:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في تحديد الإشعارات كمقروءة',
          error: error.message,
        }));
      })
    );
  }

  getPdfs(): Observable<PdfResponse> {
    return this.http.get<PdfResponse>(ApiEndpoints.pdf.list, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب ملفات PDF بنجاح',
        pdfs: response.pdfs,
      })),
      catchError(error => {
        console.error('Error fetching PDFs:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في جلب ملفات PDF',
          error: error.message,
        }));
      })
    );
  }

  deleteNotification(notificationId: string): Observable<{ success: boolean; message?: string }> {
    if (!notificationId) {
      return throwError(() => ({
        success: false,
        message: 'معرف الإشعار مطلوب',
      }));
    }
    return this.http.delete<{ success: boolean; message?: string }>(
      ApiEndpoints.lectures.deleteNotification(notificationId),
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم حذف الإشعار بنجاح'
      })),
      catchError(error => {
        console.error('Error deleting notification:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في حذف الإشعار',
          error: error.message,
        }));
      })
    );
  }

  getLowLectureMembers(): Observable<LowLectureMembersResponse> {
    return this.http.get<LowLectureMembersResponse>(
      ApiEndpoints.lectures.lowLectureMembers,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log('Raw API response:', response); // Debug log
        return {
          success: response.success,
          message: response.members && response.members.length > 0
            ? 'تم جلب الأعضاء الذين لديهم أقل من محاضرتين بنجاح'
            : 'لا يوجد أعضاء لديهم أقل من محاضرتين حاليًا',
          members: response.members || []
        };
      }),
      catchError(error => {
        console.error('Error fetching low lecture members:', error);
        let errorMessage = 'خطأ في جلب الأعضاء الذين لديهم أقل من محاضرتين';
        if (error.status === 401) {
          errorMessage = 'غير مسموح بالوصول. يرجى تسجيل الدخول مرة أخرى';
        } else if (error.status === 403) {
          errorMessage = 'يجب أن تكون أدمن لعرض هذه المعلومات';
        } else if (error.status === 0) {
          errorMessage = 'خطأ في الاتصال بالخادم. تحقق من اتصالك بالإنترنت';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        return throwError(() => ({
          success: false,
          message: errorMessage,
          error: error.message,
        }));
      })
    );
  }
}
