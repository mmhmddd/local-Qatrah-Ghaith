import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { ApiEndpoints } from '../constants/api-endpoints';
import { Router } from '@angular/router';

export interface LectureRequestData {
  title: string;
  description: string;
  creatorName: string;
  subject: string;
  semester: string;
  country: string;
  academicLevel: string;
}

export interface LectureRequestResponse {
  success: boolean;
  message: string;
  lectureRequest?: {
    id: string;
    title: string;
    description: string;
    creatorName: string;
    subject: string;
    semester: string;
    country: string;
    academicLevel: string;
    fileName: string;
    status: string;
    uploadedBy: string;
    createdAt: string;
  };
}

export interface PendingLectureRequest {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  subject: string;
  semester: string;
  country: string;
  academicLevel: string;
  fileName: string;
  uploadedBy: string;
  createdAt: string;
}

export interface PendingLectureRequestsResponse {
  success: boolean;
  message: string;
  lectureRequests: PendingLectureRequest[];
}

@Injectable({
  providedIn: 'root',
})
export class LectureRequestService {
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

  uploadLectureRequest(lectureData: LectureRequestData, pdfFile: File): Observable<LectureRequestResponse> {
    if (!pdfFile) {
      return throwError(() => ({
        success: false,
        message: 'يرجى اختيار ملف PDF للرفع',
      }));
    }

    // Validate file type
    if (pdfFile.type !== 'application/pdf') {
      return throwError(() => ({
        success: false,
        message: 'الملفات المسموح بها هي: PDF فقط',
      }));
    }

    // Validate file size (10MB max)
    if (pdfFile.size > 10 * 1024 * 1024) {
      return throwError(() => ({
        success: false,
        message: 'حجم الملف كبير جدًا. الحد الأقصى 10 ميغابايت',
      }));
    }

    const formData = new FormData();
    formData.append('pdfFile', pdfFile);
    formData.append('title', lectureData.title);
    formData.append('description', lectureData.description);
    formData.append('creatorName', lectureData.creatorName);
    formData.append('subject', lectureData.subject);
    formData.append('semester', lectureData.semester);
    formData.append('country', lectureData.country);
    formData.append('academicLevel', lectureData.academicLevel);

    return this.http.post<any>(ApiEndpoints.lectureRequests.upload, formData, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تقديم طلب رفع المحاضرة بنجاح، بانتظار الموافقة',
        lectureRequest: response.lectureRequest
      })),
      catchError(error => {
        console.error('Error uploading lecture request:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || error.message || 'فشل في رفع طلب المحاضرة',
          error: error.message,
        }));
      })
    );
  }

  getPendingLectureRequests(): Observable<PendingLectureRequestsResponse> {
    return this.http.get<any>(ApiEndpoints.lectureRequests.pending, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب طلبات المحاضرات بانتظار الموافقة بنجاح',
        lectureRequests: response.lectureRequests || []
      })),
      catchError(error => {
        console.error('Error fetching pending lecture requests:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || error.message || 'فشل في جلب طلبات المحاضرات',
          error: error.message,
          lectureRequests: []
        }));
      })
    );
  }

  approveOrRejectLectureRequest(requestId: string, action: 'approve' | 'reject'): Observable<{success: boolean, message: string}> {
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب والإجراء مطلوبان',
      }));
    }

    return this.http.post<any>(ApiEndpoints.lectureRequests.action(requestId), { action }, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: true,
        message: response.message || (action === 'approve' ? 'تمت الموافقة على الطلب' : 'تم رفض الطلب')
      })),
      catchError(error => {
        console.error('Error processing lecture request:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || error.message || 'فشل في معالجة الطلب',
          error: error.message,
        }));
      })
    );
  }
}
