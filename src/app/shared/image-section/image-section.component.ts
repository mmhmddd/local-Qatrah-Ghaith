import { Component, OnInit } from '@angular/core';
import { GalleryService, GalleryImage, GalleryResponse } from '../../core/services/gallery.service';
import { Router } from '@angular/router';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-image-section',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './image-section.component.html',
  styleUrls: ['./image-section.component.scss']
})
export class ImageSectionComponent implements OnInit {
  displayedImages: GalleryImage[] = [];

  constructor(
    private galleryService: GalleryService,
    private router: Router,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnInit() {
    this.galleryService.getAllImages().subscribe({
      next: (response: GalleryResponse) => {
        if (response.success && Array.isArray(response.data)) {
          this.displayedImages = response.data.slice(0, 4);
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
      // Navigate to gallery page with fragment
      this.router.navigate(['/last-news'], { fragment: 'gallerysection' });
    }
  }
}
