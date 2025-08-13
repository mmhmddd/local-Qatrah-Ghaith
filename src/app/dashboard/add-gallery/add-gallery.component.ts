import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { GalleryService, GalleryImage, GalleryResponse, AddEditImageResponse, DeleteImageResponse } from '../../core/services/gallery.service';
import { Router } from '@angular/router';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-add-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, SidebarComponent],
  templateUrl: './add-gallery.component.html',
  styleUrls: ['./add-gallery.component.scss']
})
export class AddGalleryComponent {
  @ViewChild('addForm') addForm!: ElementRef;

  images: GalleryImage[] = [];
  isLoggedIn = false;
  newImage: { title: string; description: string | null; file: File | null; previewUrl: string | null; id?: string } = { title: '', description: '', file: null, previewUrl: null };
  message: string | null = null;
  isSuccess = true;
  isLoading = false;
  private maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(private galleryService: GalleryService, private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loadImages();
  }

  checkLoginStatus() {
    if (typeof localStorage !== 'undefined') {
      this.isLoggedIn = !!localStorage.getItem('token');
    }
  }

  loadImages() {
    this.galleryService.getAllImages().subscribe({
      next: (response: GalleryResponse) => {
        if (response.success) {
          this.images = response.data as GalleryImage[];
          this.message = null;
        } else {
          this.message = response.message;
          this.isSuccess = false;
        }
      },
      error: (error: any) => {
        this.message = error.message || 'فشل في تحميل الصور';
        this.isSuccess = false;
        if (error.message.includes('Redirecting to login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > this.maxFileSize) {
        this.message = 'حجم الصورة أكبر من الحد الأقصى المسموح به (5MB)';
        this.isSuccess = false;
        this.newImage.file = null;
        this.newImage.previewUrl = null;
        input.value = '';
        return;
      }
      this.newImage.file = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.newImage.previewUrl = e.target?.result as string || null;
      };
      reader.readAsDataURL(file);
    }
  }

  addImage() {
    if (!this.newImage.title || !this.newImage.file) {
      this.message = 'العنوان والصورة مطلوبان';
      this.isSuccess = false;
      return;
    }
    this.isLoading = true;
    this.message = null;
    this.galleryService.addImage(this.newImage.title, this.newImage.description, this.newImage.file).subscribe({
      next: (response: AddEditImageResponse) => {
        this.isLoading = false;
        if (response.success) {
          this.images.push(response.data);
          this.resetForm();
          this.message = response.message;
          this.isSuccess = true;
        } else {
          this.message = response.message;
          this.isSuccess = false;
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.message = error.message || 'فشل في إضافة الصورة';
        this.isSuccess = false;
        if (error.message.includes('Redirecting to login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  openEditForm(image: GalleryImage) {
    this.newImage = {
      id: image.id,
      title: image.title,
      description: image.description || '',
      file: null,
      previewUrl: this.galleryService.getImageUrl(image.imagePath)
    };
    this.message = null;
    this.isSuccess = true;
    this.scrollToForm();
  }

  updateImage() {
    if (!this.newImage.id) {
      this.message = 'معرف الصورة مطلوب';
      this.isSuccess = false;
      return;
    }
    if (this.newImage.file && this.newImage.file.size > this.maxFileSize) {
      this.message = 'حجم الصورة أكبر من الحد الأقصى المسموح به (5MB)';
      this.isSuccess = false;
      return;
    }
    this.isLoading = true;
    this.message = null;
    this.galleryService.editImage(this.newImage.id, this.newImage.title, this.newImage.description, this.newImage.file).subscribe({
      next: (response: AddEditImageResponse) => {
        this.isLoading = false;
        if (response.success) {
          const index = this.images.findIndex(img => img.id === response.data.id);
          if (index !== -1) {
            this.images[index] = response.data;
          }
          this.resetForm();
          this.message = response.message;
          this.isSuccess = true;
        } else {
          this.message = response.message;
          this.isSuccess = false;
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.message = error.message || 'فشل في تحديث الصورة';
        this.isSuccess = false;
        if (error.message.includes('Redirecting to login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  cancelEdit() {
    this.resetForm();
    this.message = null;
    this.isSuccess = true;
  }

  deleteImage(id: string) {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      this.isLoading = true;
      this.message = null;
      this.galleryService.deleteImage(id).subscribe({
        next: (response: DeleteImageResponse) => {
          this.isLoading = false;
          if (response.success) {
            this.images = this.images.filter(img => img.id !== id);
            this.message = response.message;
            this.isSuccess = true;
          } else {
            this.message = response.message;
            this.isSuccess = false;
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.message = error.message || 'فشل في حذف الصورة';
          this.isSuccess = false;
          if (error.message.includes('Redirecting to login')) {
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  private resetForm() {
    this.newImage = { title: '', description: '', file: null, previewUrl: null, id: undefined };
  }

  private scrollToForm() {
    if (this.addForm && this.addForm.nativeElement) {
      this.addForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getImageUrl(imagePath: string): string {
    return this.galleryService.getImageUrl(imagePath);
  }
}
