import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TestimonialsService, Testimonial } from '../../core/services/testimonials.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-add-testimonials',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './add-testimonials.component.html',
  styleUrls: ['./add-testimonials.component.scss']
})
export class AddTestimonialsComponent implements OnInit {
  @ViewChild('addTestimonialForm') addTestimonialForm!: NgForm;

  testimonials: Testimonial[] = [];
  newTestimonial: { name: string; major: string; rating: number; reviewText: string; image: File | null; imagePreview: string | null } = {
    name: '',
    major: '',
    rating: 1,
    reviewText: '',
    image: null,
    imagePreview: null
  };
  editingTestimonial: Testimonial | null = null;
  editName: string = '';
  editMajor: string = '';
  editRating: number = 1;
  editReviewText: string = '';
  editImage: File | null = null;
  editImagePreview: string | null = null;
  error: string = '';
  success: string = '';

  constructor(private testimonialsService: TestimonialsService) {}

  ngOnInit(): void {
    this.loadTestimonials();
  }

  loadTestimonials(): void {
    this.testimonialsService.getTestimonials().subscribe({
      next: (testimonials) => {
        this.testimonials = testimonials;
        this.error = '';
      },
      error: (err) => {
        this.error = err.message;
        this.testimonials = [];
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newTestimonial.image = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.newTestimonial.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.newTestimonial.image);
    }
  }

  onEditImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.editImage = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.editImagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.editImage);
    }
  }

  addTestimonial(): void {
    if (!this.newTestimonial.name.trim() || !this.newTestimonial.major.trim() || !this.newTestimonial.reviewText.trim() || !this.newTestimonial.image) {
      this.error = 'الاسم، التخصص، نص التعليق، والصورة مطلوبة';
      return;
    }
    if (this.newTestimonial.rating < 1 || this.newTestimonial.rating > 5) {
      this.error = 'التقييم يجب أن يكون بين 1 و5 نجوم';
      return;
    }

    this.testimonialsService.createTestimonial({
      name: this.newTestimonial.name,
      major: this.newTestimonial.major,
      rating: this.newTestimonial.rating,
      reviewText: this.newTestimonial.reviewText,
      image: this.newTestimonial.image
    }).subscribe({
      next: (testimonial) => {
        this.success = `تم إضافة ${testimonial.name} بنجاح`;
        this.error = '';
        this.resetForm();
        this.loadTestimonials();
      },
      error: (err) => {
        this.error = err.message;
        this.success = '';
      }
    });
  }

  startEdit(testimonial: Testimonial): void {
    this.editingTestimonial = { ...testimonial };
    this.editName = testimonial.name;
    this.editMajor = testimonial.major;
    this.editRating = testimonial.rating;
    this.editReviewText = testimonial.reviewText;
    this.editImage = null;
    this.editImagePreview = this.getImageUrl(testimonial.image);
    this.error = '';
    this.success = '';
  }

  cancelEdit(): void {
    this.editingTestimonial = null;
    this.editName = '';
    this.editMajor = '';
    this.editRating = 1;
    this.editReviewText = '';
    this.editImage = null;
    this.editImagePreview = null;
  }

  saveEdit(): void {
    if (!this.editingTestimonial) return;

    if (!this.editName.trim() || !this.editMajor.trim() || !this.editReviewText.trim()) {
      this.error = 'الاسم، التخصص، ونص التعليق مطلوبة';
      return;
    }
    if (this.editRating < 1 || this.editRating > 5) {
      this.error = 'التقييم يجب أن يكون بين 1 و5 نجوم';
      return;
    }

    this.testimonialsService.updateTestimonial(this.editingTestimonial.id, {
      name: this.editName,
      major: this.editMajor,
      rating: this.editRating,
      reviewText: this.editReviewText,
      image: this.editImage ?? undefined
    }).subscribe({
      next: (testimonial) => {
        this.success = `تم تحديث ${testimonial.name} بنجاح`;
        this.error = '';
        this.cancelEdit();
        this.loadTestimonials();
      },
      error: (err) => {
        this.error = err.message;
        this.success = '';
      }
    });
  }

  deleteTestimonial(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذه الشهادة؟')) {
      this.testimonialsService.deleteTestimonial(id).subscribe({
        next: (response) => {
          this.success = response.message;
          this.error = '';
          this.loadTestimonials();
        },
        error: (err) => {
          this.error = err.message;
          this.success = '';
        }
      });
    }
  }

  getImageUrl(imagePath: string): string {
    return this.testimonialsService.getImageUrl(imagePath);
  }

  private resetForm(): void {
    this.newTestimonial = { name: '', major: '', rating: 1, reviewText: '', image: null, imagePreview: null };
    if (this.addTestimonialForm) {
      this.addTestimonialForm.resetForm();
    }
  }
}
