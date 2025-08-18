import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GalleryService, GalleryImage, GalleryResponse } from '../../core/services/gallery.service';
import { TranslationService } from '../../core/services/translation.service';
import { Observable } from 'rxjs';
import { register } from 'swiper/element/bundle';
import { NewSectionComponent } from '../../shared/new-section/new-section.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, NewSectionComponent, TranslatePipe],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GalleryComponent implements OnInit {
  images$: Observable<GalleryResponse> | undefined;
  latestImages: GalleryImage[] = [];
  popularImages: GalleryImage[] = [];
  allImages: GalleryImage[] = [];
  featuredImages: GalleryImage[] = [];
  errorMessage: string | null = null;
  showModal: boolean = false;
  currentImage: GalleryImage | null = null;
  currentIndex: number = 0;
  currentSection: string = '';

  constructor(
    private galleryService: GalleryService,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    // Register Swiper web components
    register();

    this.images$ = this.galleryService.getAllImages();
    this.images$.subscribe({
      next: (response) => {
        if (response.success) {
          const images = Array.isArray(response.data) ? response.data : [];
          console.log('Images loaded:', images); // Debug: Check if images are loaded
          this.latestImages = images
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);
          this.popularImages = images
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 6);
          this.allImages = images;
          this.featuredImages = images.slice(0, Math.max(5, images.length));
          console.log('All Images:', this.allImages); // Debug: Check allImages
          this.errorMessage = null;
        } else {
          this.errorMessage = response.message || this.translationService.translate('gallery.errorLoadingImages');
          console.error('Gallery response error:', this.errorMessage);
        }
      },
      error: (error) => {
        this.errorMessage = error.message || this.translationService.translate('gallery.errorLoadingImages');
        console.error('Error loading gallery images:', error);
      }
    });
  }

  getImageUrl(imagePath: string): string {
    const url = this.galleryService.getImageUrl(imagePath);
    console.log('Image URL:', url); // Debug: Check image URLs
    return url;
  }

  openModal(image: GalleryImage, section: string, index: number): void {
    console.log('Opening modal:', { image, section, index }); // Debug: Check if openModal is called
    this.currentImage = image;
    this.currentSection = section;
    this.currentIndex = index;
    this.showModal = true;
  }

  closeModal(event?: Event): void {
    console.log('Closing modal'); // Debug: Check if closeModal is called
    if (event && event.target instanceof HTMLElement && !event.target.closest('.modal-content')) {
      this.showModal = false;
      this.currentImage = null;
      this.currentIndex = 0;
      this.currentSection = '';
    } else if (!event) {
      this.showModal = false;
      this.currentImage = null;
      this.currentIndex = 0;
      this.currentSection = '';
    }
  }

  prevImage(): void {
    if (this.hasPrevImage()) {
      this.currentIndex--;
      this.updateCurrentImage();
      console.log('Previous image:', this.currentIndex); // Debug: Check navigation
    }
  }

  nextImage(): void {
    if (this.hasNextImage()) {
      this.currentIndex++;
      this.updateCurrentImage();
      console.log('Next image:', this.currentIndex); // Debug: Check navigation
    }
  }

  private updateCurrentImage(): void {
    const sectionImages = this.getSectionImages();
    this.currentImage = sectionImages[this.currentIndex] || null;
    console.log('Updated current image:', this.currentImage); // Debug: Check current image
  }

  hasPrevImage(): boolean {
    return this.currentIndex > 0;
  }

  hasNextImage(): boolean {
    const sectionImages = this.getSectionImages();
    return this.currentIndex < sectionImages.length - 1;
  }

  private getSectionImages(): GalleryImage[] {
    switch (this.currentSection) {
      case 'featured':
        return this.featuredImages;
      case 'latest':
        return this.latestImages;
      case 'popular':
        return this.popularImages;
      case 'all':
        return this.allImages;
      default:
        return [];
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.showModal) return;
    if (event.key === 'ArrowLeft' && this.hasPrevImage()) {
      this.prevImage();
    } else if (event.key === 'ArrowRight' && this.hasNextImage()) {
      this.nextImage();
    } else if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
