import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface NotificationResponse {
  success: boolean;
  message: string;
  notifications?: {
    _id: string;
    userId: { _id: string; email: string };
    message: string;
    type: string;
    createdAt: string;
    read: boolean;
    lectureDetails?: { link: string; name: string; subject: string };
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
    }
    return token ? this.headers.set('Authorization', `Bearer ${token}`) : this.headers;
  }

  getNotifications(): Observable<NotificationResponse> {
    const url = ApiEndpoints.notifications.get;
    console.log('Fetching notifications from:', url);
    return this.http.get<NotificationResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        console.log('Raw notification response:', response);
        return {
          success: response.success,
          message: response.message || 'تم جلب الإشعارات بنجاح',
          notifications: response.notifications || []
        };
      }),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في جلب الإشعارات',
          error: error.message
        }));
      })
    );
  }

  markNotificationsAsRead(): Observable<NotificationResponse> {
    const url = ApiEndpoints.notifications.markRead;
    console.log('Marking notifications as read at:', url);
    return this.http.post<NotificationResponse>(url, {}, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        console.log('Mark read response:', response);
        return {
          success: response.success,
          message: response.message || 'تم تحديد الإشعارات كمقروءة',
          notifications: response.notifications || []
        };
      }),
      catchError(error => {
        console.error('Error marking notifications as read:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في تحديد الإشعارات كمقروءة',
          error: error.message
        }));
      })
    );
  }
}
