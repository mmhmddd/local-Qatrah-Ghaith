import { Component, OnInit } from '@angular/core';
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
          // Sort by createdAt for latest images
          this.latestImages = images
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);
          // Sort by views for popular images
          this.popularImages = images
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 6);
          // All images
          this.allImages = images;
          // Featured images for hero slider
          this.featuredImages = images.slice(0, Math.max(5, images.length));
          this.errorMessage = null;
        } else {
          this.errorMessage = response.message || this.translationService.translate('gallery.errorLoadingImages');
        }
      },
      error: (error) => {
        this.errorMessage = error.message || this.translationService.translate('gallery.errorLoadingImages');
        console.error('Error loading gallery images:', error);
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return this.galleryService.getImageUrl(imagePath);
  }
}
