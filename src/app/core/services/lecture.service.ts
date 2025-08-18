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

  uploadLecture(
    userId: string,
    studentEmail: string,
    subject: string,
    date: string,
    duration: number,
    link: string,
    name: string
  ): Observable<LectureResponse> {
    console.log('Sending lecture data:', { userId, studentEmail, subject, date, duration, link, name });
    if (!userId || !studentEmail || !subject || !date || !duration || !link || !name) {
      return throwError(() => ({
        success: false,
        message: 'All fields (userId, studentEmail, subject, date, duration, link, name) are required'
      }));
    }
    const parsedDuration = parseInt(duration.toString(), 10);
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
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
    return this.http
      .post<LectureResponse>(
        ApiEndpoints.lectures.upload,
        { userId, studentEmail, subject, date, duration: parsedDuration, link, name },
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
            lecture: response.lecture || {
              _id: '',
              studentEmail,
              subject,
              date,
              duration: parsedDuration,
              link,
              name
            },
            lectureCount: response.lectureCount || 0,
            volunteerHours: response.volunteerHours || 0
          };
        }),
        catchError(error => {
          console.error('Upload lecture error:', error);
          let message = 'Failed to upload lecture';
          if (error.status === 404) {
            message = 'Student email not found';
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
    userId: string,
    studentEmail: string,
    subject: string,
    date: string,
    duration: number,
    link: string,
    name: string
  ): Observable<LectureResponse> {
    console.log('Updating lecture data:', { lectureId, userId, studentEmail, subject, date, duration, link, name });
    if (!lectureId || !userId || !studentEmail || !subject || !date || !duration || !link || !name) {
      return throwError(() => ({
        success: false,
        message: 'All fields (lectureId, userId, studentEmail, subject, date, duration, link, name) are required'
      }));
    }
    const parsedDuration = parseInt(duration.toString(), 10);
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
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
    return this.http
      .put<LectureResponse>(
        ApiEndpoints.lectures.update(lectureId),
        { userId, studentEmail, subject, date, duration: parsedDuration, link, name },
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
            lecture: response.lecture || {
              _id: lectureId,
              studentEmail,
              subject,
              date,
              duration: parsedDuration,
              link,
              name
            },
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
