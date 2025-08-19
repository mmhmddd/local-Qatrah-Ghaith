export interface Meeting {
  id?: string;
  _id?: string;
  title: string;
  date: string | Date;
  startTime: string;
  endTime: string;
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
  students: {
    name: string;
    email: string;
    phone: string;
    grade?: string;
    subjects: { name: string; minLectures: number }[];
  }[];
  lectures: {
    _id: string;
    studentEmail: string;
    subject: string;
    date: string;
    duration: number;
    link: string;
    name: string;
  }[];
  lectureCount: number;
  createdAt: string;
  messages: { createdAt: string; _id: string; content: string; displayUntil: string }[];
  meetings: Meeting[];
  profileImage?: string;
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

export interface CreateJoinRequestResponse {
  message: string;
  id: string;
}

export interface ApproveJoinRequestResponse {
  message: string;
  email: string;
}

export interface UpdateMemberDetailsResponse {
  message: string;
  volunteerHours: number;
  numberOfStudents: number;
  students: {
    name: string;
    email: string;
    phone: string;
    grade?: string;
    subjects: { name: string; minLectures: number }[];
  }[];
  subjects: string[];
  lectureCount: number;
}

export interface AddStudentResponse {
  students: {
    name: string;
    email: string;
    phone: string;
    grade?: string;
    subjects: { name: string; minLectures: number }[];
  }[];
  message: string;
  student: {
    name: string;
    email: string;
    phone: string;
    grade?: string;
    subjects: { name: string; minLectures: number }[];
  };
  numberOfStudents: number;
  subjects: string[];
}

export interface RejectJoinRequestResponse {
  message: string;
}

export interface DeleteMemberResponse {
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data?: { _id: string; content: string; displayUntil: string };
}

export interface EditMessageResponse {
  message: string;
  displayUntil: string;
}

export interface DeleteMessageResponse {
  message: string;
}

export interface GetMessageResponse {
  success: boolean;
  message: { _id: string; content: string; displayUntil: string };
}
