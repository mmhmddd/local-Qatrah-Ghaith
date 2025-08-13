import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Interface for social links only
interface SocialLink {
  id: string;
  href: string;
  icon: string;
  title: string;
}

@Component({
  selector: 'app-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss']
})
export class TreeComponent implements OnInit, OnDestroy {
  // Social links with Font Awesome icons
  socialLinks: SocialLink[] = [
    {
      id: 'x',
      href: 'https://x.com/QatrahGhaith',
      icon: 'fab fa-x-twitter',
      title: 'حساب X'
    },
{
  id: 'website',
  href: 'https://www.qatrah-ghaith.com',
  icon: 'fas fa-globe',
  title: 'صفحتنا الالكترونية'
}
,
    {
      id: 'youtube',
      href: 'https://youtube.com/@qatrahghaith?si=6fKPV0raILl1L0pN',
      icon: 'fab fa-youtube',
      title: 'قناة يوتيوب'
    },
    {
      id: 'facebook',
      href: 'https://www.facebook.com/share/g/1Ax7bwGL6E/?mibextid=wwXIfr',
      icon: 'fab fa-facebook-f',
      title: 'مجموعة فيسبوك'
    },
    {
      id: 'instagram',
      href: 'https://www.instagram.com/qatrah_ghaith?igsh=OGNvNDU1MGxpMWNs',
      icon: 'fab fa-instagram',
      title: 'حساب إنستغرام'
    },
    {
      id: 'linkedin',
      href: 'https://www.linkedin.com/company/qatrah-ghaith/',
      icon: 'fab fa-linkedin-in',
      title: 'حساب لينكدإن'
    },
    {
      id: 'whatsapp',
      href: 'https://wh.ms/962795686452',
      icon: 'fab fa-whatsapp',
      title: 'واتساب'
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Browser-specific initialization (e.g., analytics setup)
      this.initializeAnalytics();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Track user clicks for analytics
   */
  trackClick(id: string, type: string): void {
    if (isPlatformBrowser(this.platformId)) {
      // Implement analytics tracking
      console.log(`Clicked ${type}: ${id}`);

      // Example: Google Analytics tracking
      // gtag('event', 'click', {
      //   event_category: type,
      //   event_label: id,
      //   value: 1
      // });
    }
  }

  /**
   * Initialize analytics if needed
   */
  private initializeAnalytics(): void {
    // Add any analytics initialization code here
    console.log('Analytics initialized');
  }
}
