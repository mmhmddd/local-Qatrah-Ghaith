import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface Testimonial {
  id: string;
  image: string;
  rating: number;
  name: string;
  major: string;
  reviewText: string;
  uploadedBy: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success?: boolean;
  message: string;
  testimonial?: T;
  testimonials?: T[];
}

@Injectable({
  providedIn: 'root'
})
export class TestimonialsService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('لم يتم العثور على توكن. يرجى تسجيل الدخول.');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  createTestimonial(testimonialData: {
    rating: number;
    name: string;
    major: string;
    reviewText: string;
    image: File;
  }): Observable<Testimonial> {
    if (!testimonialData.rating || !testimonialData.name || !testimonialData.major || !testimonialData.reviewText || !testimonialData.image) {
      return throwError(() => new Error('جميع الحقول مطلوبة'));
    }
    if (testimonialData.rating < 1 || testimonialData.rating > 5) {
      return throwError(() => new Error('التقييم يجب أن يكون بين 1 و5 نجوم'));
    }

    const formData = new FormData();
    formData.append('rating', testimonialData.rating.toString());
    formData.append('name', testimonialData.name);
    formData.append('major', testimonialData.major);
    formData.append('reviewText', testimonialData.reviewText);
    formData.append('image', testimonialData.image);

    return this.http.post<ApiResponse<Testimonial>>(
      ApiEndpoints.testimonials.create,
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (!response.testimonial) {
          throw new Error(response.message || 'فشل في إنشاء الشهادة');
        }
        return response.testimonial;
      }),
      catchError(error => {
        const errorMsg = error.error?.message || error.message || 'خطأ في إنشاء الشهادة';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getTestimonials(): Observable<Testimonial[]> {
    return this.http.get<ApiResponse<Testimonial>>(
      ApiEndpoints.testimonials.list
    ).pipe(
      map(response => {
        if (!response.testimonials) {
          throw new Error(response.message || 'فشل في جلب الشهادات');
        }
        return response.testimonials;
      }),
      catchError(error => {
        const errorMsg = error.error?.message || error.message || 'خطأ في جلب الشهادات';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  updateTestimonial(id: string, testimonialData: {
    rating: number;
    name: string;
    major: string;
    reviewText: string;
    image?: File;
  }): Observable<Testimonial> {
    if (!id) {
      return throwError(() => new Error('معرف الشهادة مطلوب'));
    }
    if (!testimonialData.rating || !testimonialData.name || !testimonialData.major || !testimonialData.reviewText) {
      return throwError(() => new Error('جميع الحقول مطلوبة باستثناء الصورة'));
    }
    if (testimonialData.rating < 1 || testimonialData.rating > 5) {
      return throwError(() => new Error('التقييم يجب أن يكون بين 1 و5 نجوم'));
    }

    const formData = new FormData();
    formData.append('rating', testimonialData.rating.toString());
    formData.append('name', testimonialData.name);
    formData.append('major', testimonialData.major);
    formData.append('reviewText', testimonialData.reviewText);
    if (testimonialData.image) {
      formData.append('image', testimonialData.image);
    }

    return this.http.put<ApiResponse<Testimonial>>(
      ApiEndpoints.testimonials.edit(id),
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (!response.testimonial) {
          throw new Error(response.message || 'فشل في تحديث الشهادة');
        }
        return response.testimonial;
      }),
      catchError(error => {
        const errorMsg = error.error?.message || error.message || 'خطأ في تحديث الشهادة';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  deleteTestimonial(id: string): Observable<{ message: string }> {
    if (!id) {
      return throwError(() => new Error('معرف الشهادة مطلوب'));
    }
    return this.http.delete<ApiResponse<null>>(
      ApiEndpoints.testimonials.delete(id),
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => ({ message: response.message })),
      catchError(error => {
        const errorMsg = error.error?.message || error.message || 'خطأ في حذف الشهادة';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getImageUrl(imagePath: string): string {
    return imagePath;
  }
}
