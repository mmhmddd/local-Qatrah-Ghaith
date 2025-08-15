import { Component, OnInit } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { GalleryService, GalleryImage, GalleryResponse } from '../../core/services/gallery.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-image-section',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './image-section.component.html',
  styleUrls: ['./image-section.component.scss']
})
export class ImageSectionComponent implements OnInit {
  displayedImages: GalleryImage[] = [];

  constructor(
    private galleryService: GalleryService,
    private router: Router,
    private viewportScroller: ViewportScroller,
    public translationService: TranslationService
  ) {}

  ngOnInit() {
    this.galleryService.getAllImages().subscribe({
      next: (response: GalleryResponse) => {
        if (response.success && Array.isArray(response.data)) {
          this.displayedImages = response.data.slice(0, 4);
        } else {
          console.warn('No images found or invalid response');
        }
      },
      error: (error: any) => {
        console.error('Failed to load images:', error);
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return this.galleryService.getImageUrl(imagePath);
  }

  goToGallery() {
    const currentUrl = this.router.url.split('#')[0];
    if (currentUrl === '/gallery') {
      this.viewportScroller.scrollToAnchor('gallery');
    } else {
      this.router.navigate(['/gallery'], { fragment: 'gallerysection' });
    }
  }
}
