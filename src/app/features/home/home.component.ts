import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import AOS from 'aos';
import { NgForm } from '@angular/forms';
import { NewSectionComponent } from '../../shared/new-section/new-section.component';
import { ImageSectionComponent } from '../../shared/image-section/image-section.component';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Achievement {
  value: number;
  labelKey: string; // تغيير من label إلى labelKey لاستخدام مفاتيح الترجمة
  label?: string; // إبقاء label كخاصية اختيارية للعرض
  count: number;
  prefix?: string;
  suffix?: string;
  animationDuration?: number;
  ringOffset?: number;
}

interface ContactData {
  name: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NewSectionComponent, ImageSectionComponent, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('achievementsSection') achievementsSection!: ElementRef;
  @ViewChild('carouselElement') carouselElement!: ElementRef;

  readonly ringDasharray = 2 * Math.PI * 36;
  currentLanguage = 'ar';

  achievements: Achievement[] = [
    {
      value: 5,
      labelKey: 'home.yearsExperience',
      count: 0,
      prefix: '+',
      animationDuration: 2000,
      ringOffset: this.ringDasharray
    },
    {
      value: 40,
      labelKey: 'home.activities',
      count: 0,
      prefix: '+',
      animationDuration: 1800,
      ringOffset: this.ringDasharray
    },
    {
      value: 900,
      labelKey: 'home.volunteers',
      count: 0,
      prefix: '+',
      animationDuration: 2500,
      ringOffset: this.ringDasharray
    },
    {
      value: 20000,
      labelKey: 'home.volunteerHours',
      count: 0,
      prefix: '+',
      animationDuration: 2200,
      ringOffset: this.ringDasharray
    },
    {
      value: 700,
      labelKey: 'home.beneficiaries',
      count: 0,
      prefix: '+',
      animationDuration: 3000,
      ringOffset: this.ringDasharray
    }
  ];

  contactData: ContactData = {
    name: '',
    email: '',
    message: ''
  };

  private observer?: IntersectionObserver;
  private carousel?: any;
  private countingAnimationFrames: number[] = [];
  private hasAnimated = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private translationService: TranslationService
  ) {
    // الاشتراك في تغييرات اللغة
    this.translationService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      // تحديث النصوص المترجمة في achievements
      this.updateAchievementLabels();
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      console.log('Running in browser, initializing AOS and carousel');
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false,
        anchorPlacement: 'top-bottom'
      });
      this.initializeBrowserFeatures();
      // إعادة تحميل AOS عند تغيير حجم النافذة
      window.addEventListener('resize', () => {
        AOS.refresh();
      });
    } else {
      console.log('Running in SSR, skipping browser-specific initialization');
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.countingAnimationFrames.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    this.countingAnimationFrames = [];

    if (this.carousel && this.carouselElement?.nativeElement) {
      this.carousel.dispose();
    }

    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', () => {
        AOS.refresh();
      });
    }
  }

  // تحديث التسميات المترجمة للإنجازات
  private updateAchievementLabels() {
    this.achievements.forEach(achievement => {
      achievement.label = this.translationService.translate(achievement.labelKey);
    });
  }

  private async initializeBrowserFeatures() {
    try {
      console.log('Attempting to import Bootstrap dynamically');
      const bootstrap = await import('bootstrap');
      const Carousel = bootstrap.Carousel;
      console.log('Bootstrap imported successfully');

      const carouselElement = this.carouselElement?.nativeElement;
      if (carouselElement) {
        this.carousel = new Carousel(carouselElement, {
          interval: 3000,
          ride: 'carousel',
          pause: 'hover',
          wrap: true,
          keyboard: true,
          touch: true
        });
        console.log('Carousel initialized');
      }

      this.setupIntersectionObserver();
      this.addCarouselEnhancedFeatures();
    } catch (error) {
      console.error('Error initializing browser features:', error);
    }
  }

  private addCarouselEnhancedFeatures() {
    const carouselElement = this.carouselElement?.nativeElement;
    if (!carouselElement) return;

    const carouselItems = carouselElement.querySelectorAll('.carousel-item');

    carouselItems.forEach((item: HTMLElement) => {
      const img = item.querySelector('.carousel-img') as HTMLImageElement;
      if (img) {
        img.addEventListener('load', () => {
          item.classList.add('image-loaded');
        });
      }
    });

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    carouselElement.addEventListener('touchstart', (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });

    carouselElement.addEventListener('touchmove', (e: TouchEvent) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
    });

    carouselElement.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;

      const diffX = startX - currentX;
      const threshold = 50;

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.carousel?.next();
        } else {
          this.carousel?.prev();
        }
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (event.key === 'ArrowLeft') {
      this.carousel?.prev();
    } else if (event.key === 'ArrowRight') {
      this.carousel?.next();
    }
  }

  private setupIntersectionObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            this.startCountingAnimation();
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (this.achievementsSection?.nativeElement) {
      this.observer.observe(this.achievementsSection.nativeElement);
    }
  }

  private startCountingAnimation(): void {
    this.achievements.forEach((achievement, index) => {
      this.animateCounter(achievement, index);
    });
  }

  private animateCounter(achievement: Achievement, index: number): void {
    const duration = achievement.animationDuration || 2000;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = achievement.value;
    const delay = index * 200;
    const ringDasharray = this.ringDasharray;

    setTimeout(() => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

        achievement.count = currentValue;
        achievement.ringOffset = ringDasharray - (currentValue / endValue) * ringDasharray;

        if (isPlatformBrowser(this.platformId)) {
          const counterElement = document.querySelector(`#counter-${index}`) as HTMLElement;
          if (counterElement) {
            counterElement.style.transform = `scale(${1 + (Math.sin(progress * Math.PI) * 0.05)})`;

            if (progress === 1) {
              counterElement.style.transform = 'scale(1)';
            }
          }
        }

        if (progress < 1) {
          const frameId = requestAnimationFrame(animate);
          this.countingAnimationFrames.push(frameId);
        }
      };

      if (isPlatformBrowser(this.platformId)) {
        const frameId = requestAnimationFrame(animate);
        this.countingAnimationFrames.push(frameId);
      }
    }, delay);
  }

  formatNumber(num: number): string {
    if (this.currentLanguage === 'ar') {
      return num.toLocaleString('ar-EG', { useGrouping: true });
    } else {
      return num.toLocaleString('en-US', { useGrouping: true });
    }
  }

  formatPhoneNumber(phone: string): string {
    return phone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
  }

  navigateToJoinUs(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/join-us']);
  }

  navigateToDonate(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/contact']);
  }

  submitContactForm(form: NgForm): void {
    if (isPlatformBrowser(this.platformId) && form.valid) {
      const nameLabel = this.translationService.translate('home.name');
      const emailLabel = this.translationService.translate('home.email');
      const messageLabel = this.translationService.translate('home.message');

      const message = `${nameLabel}: ${this.contactData.name}\n${emailLabel}: ${this.contactData.email}\n${messageLabel}: ${this.contactData.message}`;
      const whatsappUrl = `https://wa.me/+962795686452?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      this.contactData = { name: '', email: '', message: '' };
      form.resetForm();
    }
  }

  // التحقق من اتجاه النص
  isRtl(): boolean {
    return this.translationService.isRtl();
  }
}
