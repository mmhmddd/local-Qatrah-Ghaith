import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface JoinRequestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  email?: string;
  member?: JoinRequest;
}

export interface JoinRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  academicSpecialization: string;
  address: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  volunteerHours: number;
  numberOfStudents: number;
  subjects: string[];
  subjectsCount: number; // Added subjectsCount
  students: { name: string; email: string; phone: string; grade?: string; subjects: string[] }[];
  lectures: { _id: string; link: string; name: string; subject: string; createdAt: string; hasNewLecture: boolean }[];
  lectureCount: number;
  createdAt: string;
  showLectureWarning?: boolean;
  hasNewLecture: boolean;
}

interface CreateJoinRequestResponse {
  message: string;
  id: string;
}

interface ApproveJoinRequestResponse {
  message: string;
  email: string;
}

interface UpdateMemberDetailsResponse {
  message: string;
  volunteerHours: number;
  numberOfStudents: number;
  students: { name: string; email: string; phone: string; grade?: string; subjects: string[] }[];
  subjects: string[];
  lectures?: { _id: string; link: string; name: string; subject: string; createdAt: string; hasNewLecture: boolean }[];
  lectureCount?: number;
}

interface AddStudentResponse {
  message: string;
  student: { name: string; email: string; phone: string; grade?: string; subjects: string[] };
  numberOfStudents: number;
  students: { name: string; email: string; phone: string; grade?: string; subjects: string[] }[];
  subjects: string[];
}

interface RejectJoinRequestResponse {
  message: string;
}

interface DeleteMemberResponse {
  message: string;
}

interface MarkNotificationResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class JoinRequestService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? this.headers.set('Authorization', `Bearer ${token}`) : this.headers;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  create(data: { name: string; email: string; number: string; academicSpecialization: string; address: string; subjects?: string[] }): Observable<JoinRequestResponse> {
    if (!data.name || !data.email || !data.number || !data.academicSpecialization || !data.address) {
      return throwError(() => ({
        success: false,
        message: 'الاسم، البريد الإلكتروني، الرقم، التخصص الجامعي، والعنوان مطلوبة'
      }));
    }
    if (!this.isValidEmail(data.email)) {
      return throwError(() => ({
        success: false,
        message: 'البريد الإلكتروني غير صالح'
      }));
    }
    console.log('إرسال البيانات إلى الخادم:', data);
    return this.http.post<CreateJoinRequestResponse>(ApiEndpoints.joinRequests.create, data, { headers: this.headers }).pipe(
      map(response => {
        console.log('استجابة الخادم:', response);
        return {
          success: true,
          message: response.message || 'تم تسجيل طلب الانضمام بنجاح',
          data: { id: response.id }
        };
      }),
      catchError(error => {
        console.error('خطأ في إرسال طلب الانضمام:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في تسجيل طلب الانضمام، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  getAll(): Observable<JoinRequest[]> {
    return this.http.get<JoinRequest[]>(ApiEndpoints.joinRequests.getAll).pipe(
      catchError(error => {
        console.error('خطأ في جلب طلبات الانضمام:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في جلب طلبات الانضمام، تحقق من الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  getApprovedMembers(): Observable<JoinRequest[]> {
    return this.http.get<JoinRequest[]>(ApiEndpoints.joinRequests.getApproved).pipe(
      map(members => members.map(member => ({
        ...member,
        subjectsCount: member.subjects?.length || 0
      }))),
      catchError(error => {
        console.error('خطأ في جلب الأعضاء المعتمدين:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في جلب الأعضاء المعتمدين، تحقق من الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  getMember(id: string): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف العضو مطلوب'
      }));
    }
    return this.http.get<JoinRequest>(ApiEndpoints.joinRequests.getMember(id)).pipe(
      map(response => ({
        success: true,
        message: 'تم جلب بيانات العضو بنجاح',
        member: {
          id: response.id,
          name: response.name,
          email: response.email,
          phone: response.phone,
          academicSpecialization: response.academicSpecialization,
          address: response.address,
          status: response.status,
          volunteerHours: response.volunteerHours || 0,
          numberOfStudents: response.numberOfStudents || 0,
          subjects: response.subjects || [],
          subjectsCount: response.subjects?.length || 0, // Add subjectsCount
          students: response.students || [],
          lectures: (response.lectures || []).map(lecture => ({
            ...lecture,
            hasNewLecture: lecture.hasNewLecture ?? false
          })),
          lectureCount: response.lectureCount || 0,
          createdAt: response.createdAt,
          hasNewLecture: response.hasNewLecture ?? false
        }
      })),
      catchError(error => {
        console.error('خطأ في جلب بيانات العضو:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في جلب بيانات العضو، تحقق من المعرف أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  updateMemberDetails(id: string, volunteerHours: number, numberOfStudents: number, students: { name: string; email: string; phone: string; grade?: string; subjects: string[] }[], subjects: string[]): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف العضو مطلوب'
      }));
    }
    if (!Number.isInteger(volunteerHours) || volunteerHours < 0 || !Number.isInteger(numberOfStudents) || numberOfStudents < 0) {
      return throwError(() => ({
        success: false,
        message: 'ساعات التطوع وعدد الطلاب يجب أن تكون أرقامًا صحيحة غير سالبة'
      }));
    }
    if (students.some(student => !student.name || !student.email || !student.phone || !this.isValidEmail(student.email))) {
      return throwError(() => ({
        success: false,
        message: 'بيانات الطلاب يجب أن تحتوي على الاسم، البريد الإلكتروني الصحيح، والهاتف'
      }));
    }
    if (students.some(student => student.grade && (student.grade.length < 1 || student.grade.length > 50))) {
      return throwError(() => ({
        success: false,
        message: 'الصف يجب أن يكون بين 1 و50 حرفًا إذا تم توفيره'
      }));
    }
    if (students.some(student => student.subjects && student.subjects.some(subject => subject.length < 1 || subject.length > 100))) {
      return throwError(() => ({
        success: false,
        message: 'كل مادة يجب أن تكون بين 1 و100 حرف إذا تم توفيرها'
      }));
    }
    return this.http.put<UpdateMemberDetailsResponse>(ApiEndpoints.joinRequests.updateMemberDetails(id), { volunteerHours, numberOfStudents, students, subjects }, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث تفاصيل العضو بنجاح',
        data: {
          volunteerHours: response.volunteerHours,
          numberOfStudents: response.numberOfStudents,
          students: response.students.map(student => ({
            ...student,
            subjects: student.subjects || []
          })),
          subjects: response.subjects || [],
          subjectsCount: response.subjects?.length || 0,
          lectures: (response.lectures || []).map(lecture => ({
            ...lecture,
            hasNewLecture: lecture.hasNewLecture ?? false
          })),
          lectureCount: response.lectureCount || 0
        }
      })),
      catchError(error => {
        console.error('خطأ في تحديث تفاصيل العضو:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في تحديث تفاصيل العضو، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  addStudent(id: string, name: string, email: string, phone: string, grade?: string, subjects: string[] = []): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف العضو مطلوب'
      }));
    }
    if (!name || !email || !phone) {
      return throwError(() => ({
        success: false,
        message: 'الاسم، البريد الإلكتروني، والهاتف مطلوبة للطالب'
      }));
    }
    if (!this.isValidEmail(email)) {
      return throwError(() => ({
        success: false,
        message: 'البريد الإلكتروني للطالب غير صالح'
      }));
    }
    if (grade && (grade.length < 1 || grade.length > 50)) {
      return throwError(() => ({
        success: false,
        message: 'الصف يجب أن يكون بين 1 و50 حرفًا إذا تم توفيره'
      }));
    }
    if (subjects.some(subject => subject.length < 1 || subject.length > 100)) {
      return throwError(() => ({
        success: false,
        message: 'كل مادة يجب أن تكون بين 1 و100 حرف إذا تم توفيرها'
      }));
    }
    return this.http.post<AddStudentResponse>(ApiEndpoints.joinRequests.addStudent(id), { name, email, phone, grade, subjects }, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم إضافة الطالب بنجاح',
        data: {
          student: {
            ...response.student,
            subjects: response.student.subjects || []
          },
          numberOfStudents: response.numberOfStudents,
          students: response.students.map(student => ({
            ...student,
            subjects: student.subjects || []
          })),
          subjects: response.subjects || [],
          subjectsCount: response.subjects?.length || 0 // Add subjectsCount
        }
      })),
      catchError(error => {
        console.error('خطأ في إضافة الطالب:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في إضافة الطالب، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  approve(id: string): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب مطلوب'
      }));
    }
    return this.http.post<ApproveJoinRequestResponse>(ApiEndpoints.joinRequests.approve(id), {}, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم الموافقة على الطلب وإنشاء الحساب',
        email: response.email
      })),
      catchError(error => {
        console.error('خطأ في الموافقة على الطلب:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في الموافقة على الطلب، تحقق من المعرف أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  reject(id: string): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب مطلوب'
      }));
    }
    return this.http.post<RejectJoinRequestResponse>(ApiEndpoints.joinRequests.reject(id), {}, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم رفض الطلب'
      })),
      catchError(error => {
        console.error('خطأ في رفض الطلب:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في رفض الطلب، تحقق من المعرف أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  deleteMember(id: string): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف العضو مطلوب'
      }));
    }
    return this.http.delete<DeleteMemberResponse>(ApiEndpoints.joinRequests.deleteMember(id), { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم حذف العضو بنجاح'
      })),
      catchError(error => {
        console.error('خطأ في حذف العضو:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في حذف العضو، تحقق من المعرف أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  markNotificationAsRead(memberId: string): Observable<MarkNotificationResponse> {
    return this.http.post<MarkNotificationResponse>(ApiEndpoints.joinRequests.markNotificationRead(memberId), { memberId }, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث حالة الإشعار بنجاح'
      })),
      catchError(error => {
        console.error('خطأ في تحديث حالة الإشعار:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في تحديث حالة الإشعار، تحقق من الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }
}
