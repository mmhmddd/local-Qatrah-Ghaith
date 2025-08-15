import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { TestimonialsService, Testimonial } from '../../core/services/testimonials.service';
import { TranslationService } from '../../core/services/translation.service';
import Swiper from 'swiper';
import { Autoplay, Pagination } from 'swiper/modules';
import { TranslatePipe } from '../../pipes/translate.pipe';
Swiper.use([Autoplay, Pagination]);

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements AfterViewInit {
  testimonials: Testimonial[] = [];
  testimonialChunks: Testimonial[][] = [];
  error: string = '';

  constructor(
    private testimonialsService: TestimonialsService,
    public translationService: TranslationService, // Changed to public
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    this.loadTestimonials();
  }

  loadTestimonials(): void {
    this.testimonialsService.getTestimonials().subscribe({
      next: (testimonials) => {
        this.testimonials = testimonials;
        this.error = '';
        this.createTestimonialChunks();
        setTimeout(() => this.initializeSwiper(), 0);
      },
      error: (err) => {
        this.error = err.message || this.translationService.translate('testimonials.errorDefault');
        this.testimonials = [];
        this.testimonialChunks = [];
        setTimeout(() => this.initializeSwiper(), 0);
      }
    });
  }

  createTestimonialChunks(): void {
    this.testimonialChunks = [];
    for (let i = 0; i < this.testimonials.length; i += 2) {
      this.testimonialChunks.push(this.testimonials.slice(i, i + 2));
    }
  }

  initializeSwiper(): void {
    if (isPlatformBrowser(this.platformId)) {
      new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: this.testimonialChunks.length > 1,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        },
        effect: 'slide',
        speed: 600,
        observer: true,
        observeParents: true,
        breakpoints: {
          768: {
            slidesPerView: 1,
            spaceBetween: 0
          },
          480: {
            slidesPerView: 1,
            spaceBetween: 0
          }
        }
      });
    }
  }

  scrollToSwiper() {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById('swiper_container');
      if (element) {
        const offset = 100;
        const targetY = element.getBoundingClientRect().top + window.pageYOffset - offset;
        const duration = 1000;
        const startY = window.scrollY;
        const startTime = performance.now();

        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeInOutQuad = progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

          window.scrollTo(0, startY + (targetY - startY) * easeInOutQuad);

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };

        requestAnimationFrame(animateScroll);
      }
    }
  }

  getStarClass(rating: number, star: number): string {
    return rating >= star ? 'star filled' : 'star';
  }

  getImageUrl(imagePath: string): string {
    return this.testimonialsService.getImageUrl(imagePath);
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/testimonials/placeholder.jpg';
  }
}
