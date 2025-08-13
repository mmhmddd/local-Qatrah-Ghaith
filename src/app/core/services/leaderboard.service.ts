import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

// Interface for leaderboard user data
export interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  type: 'متطوع' | 'قاده';
  rank: string | null;
  image: string | null;
  volunteerHours: number;
  numberOfStudents: number;
  subjects: string[];
  score: number;
}

// Interface for API responses
interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('لم يتم العثور على توكن. يرجى تسجيل الدخول.');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  addUserToLeaderboard(
    email: string,
    type: 'متطوع' | 'قاده',
    name?: string,
    rank?: string,
    image?: File | null
  ): Observable<LeaderboardUser> {
    if (!email.trim() || !type) {
      return throwError(() => new Error('البريد الإلكتروني والدور مطلوبان'));
    }
    if (type === 'قاده' && (!name?.trim() || !rank || !image)) {
      return throwError(() => new Error('الاسم والرتبة والصورة مطلوبة للقادة'));
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('type', type);
    if (name) formData.append('name', name);
    if (rank) formData.append('rank', rank);
    if (image) formData.append('image', image);

    return this.http
      .post<ApiResponse<LeaderboardUser>>(
        ApiEndpoints.leaderboard.add,
        formData,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => response.data),
        catchError(error => {
          const errorMsg = error.error?.message || 'خطأ في إضافة المستخدم إلى لوحة الصدارة';
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  getLeaderboard(): Observable<LeaderboardUser[]> {
    return this.http
      .get<ApiResponse<LeaderboardUser[]>>(ApiEndpoints.leaderboard.get)
      .pipe(
        map(response => response.data),
        catchError(error => {
          const errorMsg = error.error?.message || 'خطأ في جلب لوحة الصدارة';
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  editUserInLeaderboard(
    email: string,
    name?: string,
    rank?: string,
    volunteerHours?: number,
    numberOfStudents?: number,
    subjects?: string[],
    image?: File | null
  ): Observable<LeaderboardUser> {
    if (!email.trim()) {
      return throwError(() => new Error('البريد الإلكتروني مطلوب'));
    }
    if (volunteerHours !== undefined && volunteerHours < 0) {
      return throwError(() => new Error('ساعات التطوع يجب أن تكون صفر أو أكثر'));
    }
    if (numberOfStudents !== undefined && numberOfStudents < 0) {
      return throwError(() => new Error('عدد الطلاب يجب أن يكون صفر أو أكثر'));
    }

    const formData = new FormData();
    formData.append('email', email);
    if (name) formData.append('name', name);
    if (rank) formData.append('rank', rank);
    if (volunteerHours !== undefined) formData.append('volunteerHours', volunteerHours.toString());
    if (numberOfStudents !== undefined) formData.append('numberOfStudents', numberOfStudents.toString());
    if (subjects) formData.append('subjects', JSON.stringify(subjects));
    if (image) formData.append('image', image);

    return this.http
      .put<ApiResponse<LeaderboardUser>>(
        ApiEndpoints.leaderboard.edit,
        formData,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => response.data),
        catchError(error => {
          const errorMsg = error.error?.message || 'خطأ في تحديث المستخدم';
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  removeUserFromLeaderboard(email: string): Observable<{ message: string; email: string }> {
    if (!email.trim()) {
      return throwError(() => new Error('البريد الإلكتروني مطلوب'));
    }
    const body = { email };
    return this.http
      .delete<ApiResponse<{ email: string }>>(
        ApiEndpoints.leaderboard.remove,
        { headers: this.getAuthHeaders(), body }
      )
      .pipe(
        map(response => ({ message: response.message, email: response.data.email })),
        catchError(error => {
          const errorMsg = error.error?.message || 'خطأ في حذف المستخدم';
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  getImageUrl(imagePath: string | null): string {
    return imagePath ? imagePath : '/assets/images/leaderboard/placeholder.jpg';
  }
}
