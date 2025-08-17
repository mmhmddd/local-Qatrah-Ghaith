import { environment } from "../../../environments/environment";

const base = environment.apiBaseUrl;

export const ApiEndpoints = {
  auth: {
    login: `${base}/login`,
    forgotPassword: `${base}/forgot-password`,
    resetPassword: (token: string) => `${base}/reset-password/${token}`,
  },
  joinRequests: {
    create: `${base}/join-requests`,
    getAll: `${base}/join-requests`,
    approve: (id: string) => `${base}/join-requests/${id}/approve`,
    reject: (id: string) => `${base}/join-requests/${id}/reject`,
    getApproved: `${base}/approved-members`,
    getMember: (id: string) => `${base}/members/${id}`,
    updateMemberDetails: (id: string) => `${base}/members/${id}/update-details`,
    addStudent: (id: string) => `${base}/members/${id}/add-student`,
    deleteMember: (id: string) => `${base}/members/${id}`,
  },
  profile: {
    get: `${base}/profile`,
    getByEmail: `${base}/profile/email`,
    updatePassword: `${base}/profile/password`,
    uploadImage: `${base}/profile/image`,
    addMeeting: `${base}/profile/meetings`,
    updateMeeting: (meetingId: string) => `${base}/profile/meetings/${meetingId}`,
    deleteMeeting: (meetingId: string) => `${base}/profile/meetings/${meetingId}`,
  },
  lectures: {
    upload: `${base}/lectures`,
    update: (lectureId: string) => `${base}/lectures/${lectureId}`,
    delete: (lectureId: string) => `${base}/lectures/${lectureId}`,
    list: `${base}/lectures`,
    lowLectureMembers: `${base}/low-lecture-members`,
  },
  lectureRequests: {
    upload: `${base}/lecture-requests/upload`,
    pending: `${base}/lecture-requests/pending`,
    action: (id: string) => `${base}/lecture-requests/${id}/action`,
    file: (id: string) => `${base}/lecture-requests/${id}/file`,
  },
  pdf: {
    upload: `${base}/pdf/upload`,
    list: `${base}/pdf/list`,
    delete: (id: string) => `${base}/pdf/${id}`,
    view: (id: string) => `${base}/pdf/view/${id}`,
  },
  leaderboard: {
    add: `${base}/leaderboard/add`,
    get: `${base}/leaderboard`,
    edit: `${base}/leaderboard/edit`,
    remove: `${base}/leaderboard/remove`,
  },
  testimonials: {
    create: `${base}/testimonials/create`,
    list: `${base}/testimonials/list`,
    edit: (id: string) => `${base}/testimonials/edit/${id}`,
    delete: (id: string) => `${base}/testimonials/delete/${id}`,
  },
  gallery: {
    getAll: `${base}/gallery/images`,
    getById: (id: string) => `${base}/gallery/images/${id}`,
    add: `${base}/gallery/images`,
    edit: (id: string) => `${base}/gallery/images/${id}`,
    delete: (id: string) => `${base}/gallery/images/${id}`,
  },
  admin: {
    sendMessage: `${base}/admin/send-message`,
    editMessage: `${base}/admin/edit-message`,
    deleteMessage: `${base}/admin/delete-message`,
  },
  notifications: {
    get: '/api/notifications',
    markRead: '/api/notifications/mark-read',
    delete: '/api/notifications'
  }
};
