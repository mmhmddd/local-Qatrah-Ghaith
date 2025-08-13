import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { ApiEndpoints } from '../constants/api-endpoints';
import { Router } from '@angular/router';

export interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  imagePath: string;
  uploadedBy: string;
  createdAt: string;
  views: number;
}

export interface GalleryResponse {
  success: boolean;
  message: string;
  data: GalleryImage[] | GalleryImage;
}

export interface AddEditImageResponse {
  success: boolean;
  message: string;
  data: GalleryImage;
}

export interface DeleteImageResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
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

  getAllImages(): Observable<GalleryResponse> {
    return this.http.get<GalleryResponse>(ApiEndpoints.gallery.getAll).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب جميع الصور بنجاح',
        data: Array.isArray(response.data) ? response.data : [],
      })),
      catchError(error => {
        console.error('Error fetching gallery images:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'خطأ في جلب الصور',
          error: error.message,
        }));
      })
    );
  }

  getImageById(id: string): Observable<GalleryResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف الصورة مطلوب',
      }));
    }
    return this.http.get<GalleryResponse>(ApiEndpoints.gallery.getById(id)).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب الصورة بنجاح',
        data: response.data,
      })),
      catchError(error => {
        console.error('Error fetching image:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'خطأ في جلب الصورة',
          error: error.message,
        }));
      })
    );
  }

  addImage(title: string, description: string | null, file: File): Observable<AddEditImageResponse> {
    if (!title || !file) {
      return throwError(() => ({
        success: false,
        message: 'العنوان والصورة مطلوبان',
      }));
    }
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    if (description) formData.append('description', description);

    return this.http.post<AddEditImageResponse>(ApiEndpoints.gallery.add, formData, { headers: this.getHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم إضافة الصورة بنجاح',
        data: response.data,
      })),
      catchError(error => {
        console.error('Error adding image:', error);
        let errorMessage = 'فشل في إضافة الصورة';
        if (error.status === 413) {
          errorMessage = 'حجم الصورة أكبر من الحد الأقصى المسموح به';
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

  editImage(id: string, title: string | null, description: string | null, file: File | null): Observable<AddEditImageResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف الصورة مطلوب',
      }));
    }
    const formData = new FormData();
    if (title) formData.append('title', title);
    if (description !== null) formData.append('description', description);
    if (file) formData.append('image', file);

    return this.http.put<AddEditImageResponse>(ApiEndpoints.gallery.edit(id), formData, { headers: this.getHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث الصورة بنجاح',
        data: response.data,
      })),
      catchError(error => {
        console.error('Error editing image:', error);
        let errorMessage = 'فشل في تحديث الصورة';
        if (error.status === 413) {
          errorMessage = 'حجم الصورة أكبر من الحد الأقصى المسموح به';
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

  deleteImage(id: string): Observable<DeleteImageResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف الصورة مطلوب',
      }));
    }
    return this.http.delete<DeleteImageResponse>(ApiEndpoints.gallery.delete(id), { headers: this.getHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم حذف الصورة بنجاح',
      })),
      catchError(error => {
        console.error('Error deleting image:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'فشل في حذف الصورة',
          error: error.message,
        }));
      })
    );
  }

  getImageUrl(imagePath: string): string {
    return imagePath; 
  }
}
