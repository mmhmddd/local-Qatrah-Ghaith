import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

// Define the Notification interface
export interface AppNotification {
  _id: string;
  userId: { _id: string; email: string };
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
  lectureDetails?: {
    link?: string;
    name?: string;
    subject?: string;
    studentEmail?: string;
    minLectures?: number;
    currentLectures?: number;
  };
}

// Define the NotificationResponse interface
export interface NotificationResponse {
  success: boolean;
  message: string;
  notifications?: AppNotification[];
}

// Define the DeleteNotificationResponse interface
export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  // Helper method to add Authorization header with token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('لم يتم العثور على رمز التوثيق في localStorage');
      return this.headers;
    }
    return this.headers.set('Authorization', `Bearer ${token}`);
  }

  // Fetch notifications
  getNotifications(): Observable<NotificationResponse> {
    const url = ApiEndpoints.notifications.get;
    console.log('جلب الإشعارات من:', url);
    return this.http.get<NotificationResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: response.success,
        message: response.message || 'تم جلب الإشعارات بنجاح',
        notifications: response.notifications?.map(notification => ({
          _id: notification._id,
          userId: {
            _id: notification.userId._id,
            email: notification.userId.email
          },
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
          read: notification.read,
          lectureDetails: notification.lectureDetails
        })) || []
      })),
      catchError(error => {
        console.error('خطأ في جلب الإشعارات:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في جلب الإشعارات',
          error: error.message
        }));
      })
    );
  }

  // Mark notifications as read
  markNotificationsAsRead(): Observable<NotificationResponse> {
    const url = ApiEndpoints.notifications.markRead;
    console.log('تحديد الإشعارات كمقروءة على:', url);
    return this.http.post<NotificationResponse>(url, {}, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: response.success,
        message: response.message || 'تم تحديد الإشعارات كمقروءة بنجاح',
        notifications: response.notifications?.map(notification => ({
          _id: notification._id,
          userId: {
            _id: notification.userId._id,
            email: notification.userId.email
          },
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
          read: notification.read,
          lectureDetails: notification.lectureDetails
        })) || []
      })),
      catchError(error => {
        console.error('خطأ في تحديد الإشعارات كمقروءة:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في تحديد الإشعارات كمقروءة',
          error: error.message
        }));
      })
    );
  }

  // Delete a specific notification
  deleteNotification(notificationId: string): Observable<DeleteNotificationResponse> {
    const url = `${ApiEndpoints.notifications.delete}/${notificationId}`;
    console.log('حذف الإشعار من:', url);
    return this.http.delete<DeleteNotificationResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: response.success,
        message: response.message || 'تم حذف الإشعار بنجاح'
      })),
      catchError(error => {
        console.error('خطأ في حذف الإشعار:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في حذف الإشعار',
          error: error.message
        }));
      })
    );
  }
}
