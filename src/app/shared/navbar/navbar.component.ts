import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isNavbarExpanded = false;
  scrolled = false;
  currentLanguage = 'ar';
  isProfileRoute = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private translationService: TranslationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Subscribe to router events to detect route changes
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Check if the current route is /profile
        this.isProfileRoute = event.urlAfterRedirects === '/profile';
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });

    this.translationService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.setAttribute('dir', this.isRtl() ? 'rtl' : 'ltr');
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.scrolled = window.scrollY > 50;
    }
  }

  toggleNavbar() {
    this.isNavbarExpanded = !this.isNavbarExpanded;
  }

  closeNavbar() {
    this.isNavbarExpanded = false;
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  handleAuthAction() {
    if (this.isLoggedIn()) {
      this.authService.logout();
    } else {
      this.router.navigate(['/login']);
    }
    this.closeNavbar();
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
    this.closeNavbar();
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
    this.closeNavbar();
  }

  toggleLanguage() {
    const newLanguage = this.currentLanguage === 'ar' ? 'en' : 'ar';
    this.translationService.setLanguage(newLanguage);
    if (isPlatformBrowser(this.platformId)) {
      window.location.reload();
    }
  }

  getLanguageButtonText(): string {
    return this.currentLanguage === 'ar' ? 'English' : 'العربية';
  }

  isRtl(): boolean {
    return this.translationService.isRtl();
  }
}
