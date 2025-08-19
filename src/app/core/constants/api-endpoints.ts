import { environment } from '../../../environments/environment';

const base = environment.apiBaseUrl;

export const ApiEndpoints = {
  auth: {
    login: `${base}/login`,
    forgotPassword: `${base}/forgot-password`,
    resetPassword: (token: string) => `${base}/reset-password/${token.trim()}`,
  },
  joinRequests: {
    create: `${base}/join-requests`,
    getAll: `${base}/join-requests`,
    approve: (id: string) => `${base}/join-requests/${id.trim()}/approve`,
    reject: (id: string) => `${base}/join-requests/${id.trim()}/reject`,
    getApproved: `${base}/approved-members`,
    getMember: (id: string) => `${base}/members/${id.trim()}`,
    updateMemberDetails: (id: string) => `${base}/members/${id.trim()}/update-details`,
    addStudent: (id: string) => `${base}/members/${id.trim()}/add-student`,
    deleteMember: (id: string) => `${base}/members/${id.trim()}`,
  },
  profile: {
    get: `${base}/profile`,
    getByEmail: `${base}/profile/email`,
    updatePassword: `${base}/profile/password`,
    uploadImage: `${base}/profile/image`,
    addMeeting: `${base}/profile/meetings`,
    updateMeeting: (meetingId: string) => `${base}/profile/meetings/${meetingId.trim()}`,
    deleteMeeting: (meetingId: string) => `${base}/profile/meetings/${meetingId.trim()}`,
  },
  lectures: {
    upload: `${base}/lectures`,
    update: (lectureId: string) => {
      if (!lectureId || typeof lectureId !== 'string' || lectureId.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(lectureId.trim())) {
        throw new Error('Invalid lecture ID: Must be a valid MongoDB ObjectId');
      }
      return `${base}/lectures/${lectureId.trim()}`;
    },
    delete: (lectureId: string) => {
      if (!lectureId || typeof lectureId !== 'string' || lectureId.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(lectureId.trim())) {
        throw new Error('Invalid lecture ID: Must be a valid MongoDB ObjectId');
      }
      return `${base}/lectures/${lectureId.trim()}`;
    },
    list: `${base}/lectures`,
    lowLectureMembers: `${base}/lectures/low-lecture-members`,
    removeLowLectureMember: (memberId: string) => {
      if (!memberId || typeof memberId !== 'string' || memberId.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(memberId.trim())) {
        throw new Error('Invalid member ID: Must be a valid MongoDB ObjectId');
      }
      return `${base}/lectures/low-lecture-members/${memberId.trim()}`;
    },
    notifications: `${base}/lectures/notifications`,
    markNotificationsRead: `${base}/lectures/notifications/mark-read`,
    deleteNotification: (id: string) => {
      if (!id || typeof id !== 'string' || id.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
        throw new Error('Invalid notification ID: Must be a valid MongoDB ObjectId');
      }
      return `${base}/lectures/notifications/${id.trim()}`;
    },
  },
  lectureRequests: {
    upload: `${base}/lecture-requests/upload`,
    pending: `${base}/lecture-requests/pending`,
    action: (id: string) => `${base}/lecture-requests/${id.trim()}/action`,
    file: (id: string) => `${base}/lecture-requests/${id.trim()}/file`,
  },
  pdf: {
    upload: `${base}/pdf/upload`,
    list: `${base}/pdf/list`,
    delete: (id: string) => `${base}/pdf/${id.trim()}`,
    view: (id: string) => `${base}/pdf/view/${id.trim()}`,
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
    edit: (id: string) => `${base}/testimonials/edit/${id.trim()}`,
    delete: (id: string) => `${base}/testimonials/delete/${id.trim()}`,
  },
  gallery: {
    getAll: `${base}/gallery/images`,
    getById: (id: string) => `${base}/gallery/images/${id.trim()}`,
    add: `${base}/gallery/images`,
    edit: (id: string) => `${base}/gallery/images/${id.trim()}`,
    delete: (id: string) => `${base}/gallery/images/${id.trim()}`,
  },
  admin: {
    sendMessage: `${base}/admin/send-message`,
    editMessage: `${base}/admin/edit-message`,
    deleteMessage: `${base}/admin/delete-message`,
    getMessage: (userId: string, messageId: string) => {
      if (!userId || !messageId || !/^[0-9a-fA-F]{24}$/.test(userId.trim()) || !/^[0-9a-fA-F]{24}$/.test(messageId.trim())) {
        throw new Error('Invalid userId or messageId: Must be valid MongoDB ObjectIds');
      }
      return `${base}/admin/get-message/${userId.trim()}/${messageId.trim()}`;
    },
  },
  notifications: {
    get: `${base}/lectures/notifications`,
    markRead: `${base}/lectures/notifications/mark-read`,
    delete: (id: string) => {
      if (!id || typeof id !== 'string' || id.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
        throw new Error('Invalid notification ID: Must be a valid MongoDB ObjectId');
      }
      return `${base}/lectures/notifications/${id.trim()}`;
    },
  },
};
