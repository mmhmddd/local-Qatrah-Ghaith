import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface UnderTargetSubject {
  name: string;
  minLectures: number;
  deliveredLectures: number;
}

export interface UnderTargetStudent {
  studentName: string;
  studentEmail: string;
  academicLevel: string;
  underTargetSubjects: UnderTargetSubject[];
}

export interface LectureSummary {
  _id: string;
  name: string;
  subject: string;
  studentEmail: string;
  link: string;
  createdAt: string;
}

export interface LowLectureMember {
  _id: string;
  name: string;
  email: string;
  lowLectureWeekCount: number;
  underTargetStudents: UnderTargetStudent[];
  lectures: LectureSummary[];
}

export interface LowLectureMembersResponse {
  success: boolean;
  message: string;
  members: LowLectureMember[];
  debug?: {
    totalUsersProcessed: number;
    weekStart: string;
    weekEnd: string;
    membersWithLowLectures: number;
  };
}

export interface DeleteMemberResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class LowLecturesService {
  constructor(private http: HttpClient) {}

  /**
   * Get list of members with low lecture counts
   * Requires admin authentication
   */
  getLowLectureMembers(): Observable<LowLectureMembersResponse> {
    const headers = this.getAuthHeaders();
    const url = ApiEndpoints.lectures.lowLectureMembers;

    console.log('Fetching low lecture members from:', url);

    return this.http.get<LowLectureMembersResponse>(url, { headers }).pipe(
      tap(response => {
        console.log('Low lecture members response:', {
          success: response.success,
          message: response.message,
          membersCount: response.members?.length || 0,
          debug: response.debug
        });
      }),
      catchError(this.handleError('fetch low lecture members'))
    );
  }

  /**
   * Remove a member from the current week's low lecture report
   * Requires admin authentication
   * @param memberId The ID of the member to remove
   */
  deleteMember(memberId: string): Observable<DeleteMemberResponse> {
    // Validate memberId
    if (!memberId || typeof memberId !== 'string' || memberId.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(memberId.trim())) {
      console.error('Invalid member ID provided:', memberId);
      return throwError(() => new Error('Invalid member ID: Must be a valid MongoDB ObjectId'));
    }

    const headers = this.getAuthHeaders();
    const url = ApiEndpoints.lectures.removeLowLectureMember(memberId.trim());

    console.log('Removing member from low lecture report:', { memberId, url });

    return this.http.delete<DeleteMemberResponse>(url, { headers }).pipe(
      tap(response => {
        console.log('Remove member response:', {
          success: response.success,
          message: response.message
        });
      }),
      catchError(this.handleError('remove low lecture member'))
    );
  }

  /**
   * Get authentication headers with Bearer token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('No valid authentication token found in localStorage');
      throw new Error('Authentication token not found. Please log in again.');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Handle HTTP errors with detailed error messages
   * @param operation The operation name for error context
   */
  private handleError = (operation: string) => (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';

    console.error(`Error in ${operation}:`, {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error,
      url: error.url
    });

    switch (error.status) {
      case 0:
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        break;
      case 400:
        errorMessage = error.error?.message || 'Invalid request. Please check the input data.';
        break;
      case 401:
        errorMessage = 'Unauthorized. Please log in again.';
        localStorage.removeItem('token');
        break;
      case 403:
        errorMessage = 'Access forbidden. Admin privileges required.';
        break;
      case 404:
        errorMessage = error.error?.message || 'Resource not found.';
        break;
      case 500:
        errorMessage = error.error?.message || 'Internal server error. Please try again later.';
        break;
      default:
        errorMessage = error.error?.message || `Server error (${error.status}): ${error.statusText}`;
    }

    return throwError(() => new Error(errorMessage));
  };
}
