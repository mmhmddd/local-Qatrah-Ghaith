// lecture.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface LectureResponse {
  success: boolean;
  message: string;
  lecture?: { _id: string; studentEmail: string; subject: string; date: string; duration: number; link: string; name: string };
  lectures?: { _id: string; studentEmail: string; subject: string; date: string; duration: number; link: string; name: string }[];
  lectureCount?: number;
  volunteerHours?: number;
}

export interface PdfResponse {
  success: boolean;
  message: string;
  pdfs?: { _id: string; title: string; description: string; creatorName: string; subject: string; semester: string; country: string; academicLevel: string; fileName: string; createdAt: string }[];
}

export interface LowLectureMembersResponse {
  success: boolean;
  message: string;
  members: {
    [x: string]: any;
    id: string | null;
    lowLectureStudents: any;
    _id: string;
    name: string;
    email: string;
    underTargetSubjects: {
      name: string;
      minLectures: number;
      deliveredLectures: number;
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

  uploadLecture(userId: string, studentEmail: string, subject: string, date: string, duration: number, link: string, name: string): Observable<LectureResponse> {
    if (!userId || !studentEmail || !subject || !date || !duration || !link || !name) {
      return throwError(() => ({
        success: false,
        message: 'All fields (userId, studentEmail, subject, date, duration, link, name) are required'
      }));
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      return throwError(() => ({
        success: false,
        message: 'Duration must be a positive integer'
      }));
    }
    if (!this.isValidUrl(link)) {
      return throwError(() => ({
        success: false,
        message: 'Lecture link must be a valid URL starting with http:// or https://'
      }));
    }
    return this.http.post<LectureResponse>(ApiEndpoints.lectures.upload, { userId, studentEmail, subject, date, duration, link, name }, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to upload lecture');
        }
        return {
          success: true,
          message: response.message || 'Lecture uploaded successfully',
          lecture: response.lecture || { _id: '', studentEmail, subject, date, duration, link, name },
          lectureCount: response.lectureCount || 0,
          volunteerHours: response.volunteerHours || 0
        };
      }),
      catchError(error => {
        console.error('Error uploading lecture:', error);
        let message = 'Failed to upload lecture. Please check your data or server connection.';
        if (error.status === 404) {
          message = 'Student email not found in the system';
        } else if (error.status === 400) {
          message = error.error?.message || 'Invalid lecture data';
        } else if (error.status === 401) {
          message = 'Unauthorized. Please log in again.';
        }
        return throwError(() => ({
          success: false,
          message,
          error: error.statusText || error.message
        }));
      })
    );
  }

  updateLecture(lectureId: string, userId: string, studentEmail: string, subject: string, date: string, duration: number, link: string, name: string): Observable<LectureResponse> {
    if (!lectureId || !userId || !studentEmail || !subject || !date || !duration || !link || !name) {
      return throwError(() => ({
        success: false,
        message: 'معرف المحاضرة، معرف المستخدم، بريد الطالب، المادة، التاريخ، المدة، رابط المحاضرة، والاسم مطلوبة'
      }));
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      return throwError(() => ({
        success: false,
        message: 'المدة يجب أن تكون عددًا صحيحًا موجبًا'
      }));
    }
    if (!this.isValidUrl(link)) {
      return throwError(() => ({
        success: false,
        message: 'رابط المحاضرة يجب أن يكون عنوان URL صالحًا'
      }));
    }
    return this.http.put<LectureResponse>(ApiEndpoints.lectures.update(lectureId), { userId, studentEmail, subject, date, duration, link, name }, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث المحاضرة بنجاح',
        lecture: response.lecture,
        lectureCount: response.lectureCount,
        volunteerHours: response.volunteerHours
      })),
      catchError(error => {
        console.error('خطأ في تحديث المحاضرة:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في تحديث المحاضرة، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  deleteLecture(lectureId: string): Observable<LectureResponse> {
    if (!lectureId) {
      return throwError(() => ({
        success: false,
        message: 'معرف المحاضرة مطلوب'
      }));
    }
    return this.http.delete<LectureResponse>(ApiEndpoints.lectures.delete(lectureId), { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم حذف المحاضرة بنجاح',
        lectureCount: response.lectureCount,
        volunteerHours: response.volunteerHours
      })),
      catchError(error => {
        console.error('خطأ في حذف المحاضرة:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في حذف المحاضرة، تحقق من المعرف أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  getLectures(): Observable<LectureResponse> {
    return this.http.get<LectureResponse>(ApiEndpoints.lectures.list, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب المحاضرات بنجاح',
        lectures: response.lectures || []
      })),
      catchError(error => {
        console.error('خطأ في جلب المحاضرات:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في جلب المحاضرات، تحقق من الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  getLowLectureMembers(): Observable<LowLectureMembersResponse> {
    return this.http.get<LowLectureMembersResponse>(ApiEndpoints.lectures.lowLectureMembers, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || (response.members?.length > 0
          ? 'تم جلب الأعضاء الذين لديهم أقل من الحد الأدنى من المحاضرات'
          : 'لا يوجد أعضاء لديهم أقل من الحد الأدنى من المحاضرات'),
        members: response.members || []
      })),
      catchError(error => {
        console.error('خطأ في جلب الأعضاء الذين لديهم أقل من الحد الأدنى من المحاضرات:', error);
        let errorMessage = 'فشل في جلب الأعضاء الذين لديهم أقل من الحد الأدنى من المحاضرات، تحقق من الاتصال بالخادم';
        if (error.status === 401) {
          errorMessage = 'غير مسموح بالوصول. يرجى تسجيل الدخول مرة أخرى';
        } else if (error.status === 403) {
          errorMessage = 'يجب أن تكون أدمن لعرض هذه المعلومات';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        return throwError(() => ({
          success: false,
          message: errorMessage,
          members: [],
          error: error.statusText || error.message
        }));
      })
    );
  }

  getPdfs(): Observable<PdfResponse> {
    return this.http.get<PdfResponse>(ApiEndpoints.pdf.list, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب ملفات PDF بنجاح',
        pdfs: response.pdfs || []
      })),
      catchError(error => {
        console.error('خطأ في جلب ملفات PDF:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في جلب ملفات PDF، تحقق من الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }
}
