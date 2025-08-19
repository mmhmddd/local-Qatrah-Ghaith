import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'join-us',
    loadComponent: () => import('./features/join-us/join-us.component').then(m => m.JoinUsComponent)
  },
  {
    path: 'leaderboards',
    loadComponent: () => import('./features/leaderboards/leaderboards.component').then(m => m.LeaderboardsComponent)
  },
  {
    path: 'testimonials',
    loadComponent: () => import('./features/testimonials/testimonials.component').then(m => m.TestimonialsComponent)
  },
  {
    path: 'last-news',
    loadComponent: () => import('./features/gallery/gallery.component').then(m => m.GalleryComponent)
  },
  {
    path: 'library',
    loadComponent: () => import('./features/library/library.component').then(m => m.LibraryComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'all-join-request',
    loadComponent: () => import('./dashboard/all-join-request/all-join-request.component').then(m => m.AllJoinRequestComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'all-members',
    loadComponent: () => import('./dashboard/all-members/all-members.component').then(m => m.AllMembersComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'member/:id',
    loadComponent: () => import('./dashboard/show-member/show-member.component').then(m => m.ShowMemberComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'lectures-request',
    loadComponent: () => import('./dashboard/lectures-request/lectures-request.component').then(m => m.LecturesRequestComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'add-leaderboards',
    loadComponent: () => import('./dashboard/add-leaderboards/add-leaderboards.component').then(m => m.AddLeaderboardsComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'add-testimonials',
    loadComponent: () => import('./dashboard/add-testimonials/add-testimonials.component').then(m => m.AddTestimonialsComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'add-gallery',
    loadComponent: () => import('./dashboard/add-gallery/add-gallery.component').then(m => m.AddGalleryComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'upload-pdf',
    loadComponent: () => import('./dashboard/upload-pdf/upload-pdf.component').then(m => m.UploadPdfComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'low-lecture-members',
    loadComponent: () => import('./dashboard/low-lecture-members/low-lecture-members.component').then(m => m.LowLectureMembersComponent),
  },

  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./shared/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./shared/reset-password-component/reset-password-component.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'tree',
    loadComponent: () => import('./features/tree/tree.component').then(m => m.TreeComponent)
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
