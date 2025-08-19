import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface Meeting {
  id?: string;
  _id?: string;
  title: string;
  date: string | Date;
  startTime: string;
  endTime: string;
}

export interface JoinRequestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  email?: string;
  member?: JoinRequest;
  members?: JoinRequest[];
}

export interface JoinRequest {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  number?: string;
  academicSpecialization: string;
  address: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  volunteerHours: number;
  numberOfStudents: number;
  subjects: string[];
  subjectsCount: number;
  students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[];
  lectures: { _id: string; studentEmail: string; subject: string; date: string; duration: number; link: string; name: string }[];
  lectureCount: number;
  createdAt: string;
  messages: { createdAt: string; _id: string; content: string; displayUntil: string }[];
  meetings: Meeting[];
  profileImage?: string;
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
  students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[];
  subjects: string[];
  lectureCount: number;
}

interface AddStudentResponse {
  students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[];
  message: string;
  student: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] };
  numberOfStudents: number;
  subjects: string[];
}

interface RejectJoinRequestResponse {
  message: string;
}

interface DeleteMemberResponse {
  message: string;
}

interface SendMessageResponse {
  success: boolean;
  message: string;
  data?: { _id: string; content: string; displayUntil: string };
}

interface EditMessageResponse {
  message: string;
  displayUntil: string;
}

interface DeleteMessageResponse {
  message: string;
}

interface GetMessageResponse {
  success: boolean;
  message: { _id: string; content: string; displayUntil: string };
}

@Injectable({
  providedIn: 'root'
})
export class JoinRequestService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
    }
    return token ? this.headers.set('Authorization', `Bearer ${token}`) : this.headers;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private filterActiveMessages(messages: { createdAt: string; _id: string; content: string; displayUntil: string }[]): { createdAt: string; _id: string; content: string; displayUntil: string }[] {
    const now = new Date();
    return (messages || []).filter(msg => {
      const displayUntil = new Date(msg.displayUntil);
      return !isNaN(displayUntil.getTime()) && displayUntil > now;
    });
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
    return this.http.post<CreateJoinRequestResponse>(ApiEndpoints.joinRequests.create, data, { headers: this.headers }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تسجيل طلب الانضمام بنجاح',
        data: { id: response.id }
      })),
      catchError(error => {
        console.error('Error creating join request:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في تسجيل طلب الانضمام، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  getAll(): Observable<JoinRequestResponse> {
    return this.http.get<JoinRequest[]>(ApiEndpoints.joinRequests.getAll, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Raw getAll response:', response)),
      map(members => ({
        success: true,
        message: 'تم جلب طلبات الانضمام بنجاح',
        members: members.map(member => ({
          id: member._id || member.id || '',
          _id: member._id,
          name: member.name || '',
          email: member.email || '',
          phone: member.number || member.phone || '',
          number: member.number,
          academicSpecialization: member.academicSpecialization || '',
          address: member.address || '',
          status: member.status || 'Pending',
          volunteerHours: member.volunteerHours || 0,
          numberOfStudents: member.numberOfStudents || 0,
          subjects: member.subjects || [],
          subjectsCount: member.subjects?.length || 0,
          students: member.students || [],
          lectures: member.lectures || [],
          lectureCount: member.lectureCount || 0,
          createdAt: member.createdAt || '',
          messages: this.filterActiveMessages(member.messages || []),
          meetings: member.meetings || [],
          profileImage: member.profileImage || ''
        }))
      })),
      catchError(error => {
        console.error('Error fetching join requests:', error);
        if (error.status === 401) {
          return throwError(() => ({
            success: false,
            message: 'غير مسموح بالوصول. يرجى تسجيل الدخول مرة أخرى',
            error: 'Unauthorized'
          }));
        }
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في جلب طلبات الانضمام، تحقق من الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  getApprovedMembers(): Observable<JoinRequestResponse> {
    return this.http.get<JoinRequest[]>(ApiEndpoints.joinRequests.getApproved, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Raw getApprovedMembers response:', response)),
      map(members => ({
        success: true,
        message: 'تم جلب الأعضاء المعتمدين بنجاح',
        members: members.map(member => ({
          id: member._id || member.id || '',
          _id: member._id,
          name: member.name || '',
          email: member.email || '',
          phone: member.number || member.phone || '',
          number: member.number,
          academicSpecialization: member.academicSpecialization || '',
          address: member.address || '',
          status: member.status || 'Approved',
          volunteerHours: member.volunteerHours || 0,
          numberOfStudents: member.numberOfStudents || 0,
          subjects: member.subjects || [],
          subjectsCount: member.subjects?.length || 0,
          students: member.students || [],
          lectures: member.lectures || [],
          lectureCount: member.lectureCount || 0,
          createdAt: member.createdAt || '',
          messages: this.filterActiveMessages(member.messages || []),
          meetings: member.meetings || [],
          profileImage: member.profileImage || ''
        }))
      })),
      catchError(error => {
        console.error('Error fetching approved members:', error);
        if (error.status === 401) {
          return throwError(() => ({
            success: false,
            message: 'غير مسموح بالوصول. يرجى تسجيل الدخول مرة أخرى',
            error: 'Unauthorized'
          }));
        }
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
    console.log('Fetching member with ID:', id); // تسجيل الـ ID للتحقق
    return this.http.get<any>(ApiEndpoints.joinRequests.getMember(id), { headers: this.getAuthHeaders() }).pipe( // غيرت إلى <any> لتجنب افتراضات صارمة
      tap(response => console.log('Raw getMember response:', response)), // تسجيل الاستجابة الكاملة
      map(response => {
        if (response.success && response.member) {
          const member = response.member;
          return {
            success: true,
            message: 'تم جلب بيانات العضو بنجاح',
            member: {
              id: member._id || member.id || '',
              _id: member._id,
              name: member.name || '',
              email: member.email || '',
              phone: member.number || member.phone || '',
              number: member.number,
              academicSpecialization: member.academicSpecialization || '',
              address: member.address || '',
              status: member.status || 'Pending',
              volunteerHours: member.volunteerHours || 0,
              numberOfStudents: member.numberOfStudents || 0,
              subjects: member.subjects || [],
              subjectsCount: member.subjects?.length || 0,
              students: (member.students || []).map((student: { name: any; email: any; phone: any; grade: any; subjects: any; }) => ({
                name: student.name || '',
                email: student.email || '',
                phone: student.phone || '',
                grade: student.grade || '',
                subjects: (student.subjects || []).map((subject: { name: any; minLectures: any; }) => ({
                  name: subject.name || '',
                  minLectures: subject.minLectures ?? 0
                }))
              })),
              lectures: (member.lectures || []).map((lecture: { _id: any; studentEmail: any; subject: any; date: any; duration: any; link: any; name: any; }) => ({
                _id: lecture._id || '',
                studentEmail: lecture.studentEmail || '',
                subject: lecture.subject || '',
                date: lecture.date || '',
                duration: lecture.duration || 0,
                link: lecture.link || '',
                name: lecture.name || ''
              })),
              lectureCount: member.lectureCount || 0,
              createdAt: member.createdAt || '',
              messages: this.filterActiveMessages(member.messages || []),
              meetings: (member.meetings || []).map((meeting: { id: any; _id: any; title: any; date: any; startTime: any; endTime: any; }) => ({
                id: meeting.id || meeting._id || '',
                _id: meeting._id,
                title: meeting.title || '',
                date: meeting.date || '',
                startTime: meeting.startTime || '',
                endTime: meeting.endTime || ''
              })),
              profileImage: member.profileImage || ''
            }
          };
        } else {
          // معالجة حالة success: false بدون إلقاء خطأ فوري
          return {
            success: false,
            message: response.message || 'العضو غير موجود أو بيانات غير كاملة',
            error: 'Response without member data'
          };
        }
      }),
      catchError(error => {
        console.error('Error fetching member details:', error);
        let errorMessage = 'فشل في جلب بيانات العضو، تحقق من المعرف أو الاتصال بالخادم';
        if (error.status === 401) {
          errorMessage = 'غير مصرح - يرجى تسجيل الدخول مرة أخرى';
        } else if (error.status === 404) {
          errorMessage = 'العضو غير موجود';
        } else if (error.status === 0) {
          errorMessage = 'مشكلة في الاتصال بالخادم - تحقق من الإنترنت';
        }
        return throwError(() => ({
          success: false,
          message: errorMessage,
          error: error.statusText || error.message,
          status: error.status
        }));
      })
    );
  }

  updateMemberDetails(
    id: string,
    volunteerHours: number,
    numberOfStudents: number,
    students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[],
    subjects: string[]
  ): Observable<JoinRequestResponse> {
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
    if (students.some(student => student.subjects && student.subjects.some(subject => !subject.name || subject.name.length < 1 || subject.name.length > 100))) {
      return throwError(() => ({
        success: false,
        message: 'كل مادة يجب أن تكون بين 1 و100 حرف'
      }));
    }
    if (students.some(student => student.subjects && student.subjects.some(subject => !Number.isInteger(subject.minLectures) || subject.minLectures < 0))) {
      return throwError(() => ({
        success: false,
        message: 'الحد الأدنى للمحاضرات يجب أن يكون رقمًا صحيحًا غير سالب'
      }));
    }
    return this.http.put<UpdateMemberDetailsResponse>(ApiEndpoints.joinRequests.updateMemberDetails(id), { volunteerHours, numberOfStudents, students, subjects }, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث تفاصيل العضو بنجاح',
        data: {
          volunteerHours: response.volunteerHours,
          numberOfStudents: response.numberOfStudents,
          students: response.students,
          subjects: response.subjects,
          subjectsCount: response.subjects?.length || 0,
          lectureCount: response.lectureCount
        }
      })),
      catchError(error => {
        console.error('Error updating member details:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في تحديث تفاصيل العضو، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  addStudent(
    id: string,
    name: string,
    email: string,
    phone: string,
    grade?: string,
    subjects: { name: string; minLectures: number }[] = []
  ): Observable<JoinRequestResponse> {
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
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return throwError(() => ({
        success: false,
        message: 'رقم الهاتف غير صالح'
      }));
    }
    if (grade && (grade.length < 1 || grade.length > 50)) {
      return throwError(() => ({
        success: false,
        message: 'الصف يجب أن يكون بين 1 و50 حرفًا إذا تم توفيره'
      }));
    }
    if (subjects.some(subject => !subject.name || subject.name.length < 1 || subject.name.length > 100)) {
      return throwError(() => ({
        success: false,
        message: 'كل مادة يجب أن تكون بين 1 و100 حرف'
      }));
    }
    if (subjects.some(subject => !Number.isInteger(subject.minLectures) || subject.minLectures < 0)) {
      return throwError(() => ({
        success: false,
        message: 'الحد الأدنى للمحاضرات يجب أن يكون رقمًا صحيحًا غير سالب'
      }));
    }
    const payload = { name, email, phone, grade, subjects };
    console.log('Sending addStudent request:', { url: ApiEndpoints.joinRequests.addStudent(id), payload });
    return this.http.post<AddStudentResponse>(ApiEndpoints.joinRequests.addStudent(id), payload, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Raw addStudent response:', response)),
      map(response => ({
        success: true,
        message: response.message || 'تم إضافة الطالب بنجاح',
        data: {
          students: response.student ? [...(response.students || []), response.student] : response.students || [],
          numberOfStudents: response.numberOfStudents || 0,
          subjects: response.subjects || []
        }
      })),
      catchError(error => {
        console.error('Error adding student:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في إضافة الطالب، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message,
          status: error.status,
          errorDetails: error.error
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
        console.error('Error approving join request:', error);
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
        console.error('Error rejecting join request:', error);
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
        console.error('Error deleting member:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في حذف العضو، تحقق من المعرف أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  sendMessage(userId: string, content: string, displayDays: number): Observable<JoinRequestResponse> {
    if (!userId || !content || !displayDays) {
      return throwError(() => ({
        success: false,
        message: 'معرف المستخدم، الرسالة، وعدد الأيام للعرض مطلوبة'
      }));
    }
    if (content.length < 1 || content.length > 1000) {
      return throwError(() => ({
        success: false,
        message: 'الرسالة يجب أن تكون بين 1 و1000 حرف'
      }));
    }
    if (!Number.isInteger(displayDays) || displayDays < 1 || displayDays > 30) {
      return throwError(() => ({
        success: false,
        message: 'عدد الأيام يجب أن يكون عددًا صحيحًا بين 1 و30'
      }));
    }
    return this.http.post<SendMessageResponse>(ApiEndpoints.admin.sendMessage, { userId, content, displayDays }, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Raw sendMessage response:', response)),
      map(response => ({
        success: response.success,
        message: response.message || 'تم إرسال الرسالة بنجاح',
        data: response.data ? {
          _id: response.data._id,
          content: response.data.content,
          displayUntil: response.data.displayUntil
        } : undefined
      })),
      catchError(error => {
        console.error('Error sending message:', error);
        if (error.status === 400 && error.error?.activeMessage) {
          return throwError(() => ({
            success: false,
            message: error.error.message || 'يوجد رسالة نشطة بالفعل، يرجى تعديلها أو حذفها أولاً',
            data: {
              _id: error.error.activeMessage?._id,
              content: error.error.activeMessage?.content,
              displayUntil: error.error.activeMessage?.displayUntil
            }
          }));
        }
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في إرسال الرسالة، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  editMessage(userId: string, messageId: string, content: string, displayDays: number): Observable<JoinRequestResponse> {
    if (!userId || !messageId || !content || !displayDays) {
      return throwError(() => ({
        success: false,
        message: 'معرف المستخدم، معرف الرسالة، الرسالة، وعدد الأيام للعرض مطلوبة'
      }));
    }
    if (content.length < 1 || content.length > 1000) {
      return throwError(() => ({
        success: false,
        message: 'الرسالة يجب أن تكون بين 1 و1000 حرف'
      }));
    }
    if (!Number.isInteger(displayDays) || displayDays < 1 || displayDays > 30) {
      return throwError(() => ({
        success: false,
        message: 'عدد الأيام يجب أن يكون عددًا صحيحًا بين 1 و30'
      }));
    }
    return this.http.put<EditMessageResponse>(ApiEndpoints.admin.editMessage, { userId, messageId, content, displayDays }, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تعديل الرسالة بنجاح',
        data: {
          displayUntil: response.displayUntil
        }
      })),
      catchError(error => {
        console.error('Error editing message:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في تعديل الرسالة، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  deleteMessage(userId: string, messageId: string): Observable<JoinRequestResponse> {
    if (!userId || !messageId) {
      return throwError(() => ({
        success: false,
        message: 'معرف المستخدم ومعرف الرسالة مطلوبان'
      }));
    }
    return this.http.delete<DeleteMessageResponse>(ApiEndpoints.admin.deleteMessage, { headers: this.getAuthHeaders(), body: { userId, messageId } }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم حذف الرسالة بنجاح'
      })),
      catchError(error => {
        console.error('Error deleting message:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في حذف الرسالة، تحقق من البيانات أو الاتصال بالخادم',
          error: error.statusText || error.message
        }));
      })
    );
  }

  getMessage(userId: string, messageId: string): Observable<JoinRequestResponse> {
    if (!userId || !messageId) {
      return throwError(() => ({
        success: false,
        message: 'معرف المستخدم ومعرف الرسالة مطلوبان'
      }));
    }
    return this.http.get<GetMessageResponse>(ApiEndpoints.admin.getMessage(userId, messageId), { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Raw getMessage response:', response)),
      map(response => ({
        success: response.success,
        message: response.message?.content || 'تم جلب الرسالة بنجاح',
        data: response.message ? {
          _id: response.message._id,
          content: response.message.content,
          displayUntil: response.message.displayUntil
        } : undefined
      })),
      catchError(error => {
        console.error('Error fetching message:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'فشل في جلب الرسالة، تحقق من المعرفات أو الاتصال بالخادم',
          error: error.statusText || error.message,
          status: error.status
        }));
      })
    );
  }
}
