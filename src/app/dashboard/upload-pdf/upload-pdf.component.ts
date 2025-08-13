import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pdf, PdfService } from '../../core/services/pdf.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-upload-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './upload-pdf.component.html',
  styleUrls: ['./upload-pdf.component.scss']
})
export class UploadPdfComponent {
  // Form fields
  title = '';
  description = '';
  creatorName = '';
  subject = '';
  semester = '';
  country = '';
  academicLevel = '';
  selectedFile: File | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // PDF list
  pdfs: Pdf[] = [];

  // Subjects list for dropdown
  subjects = [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'الرياضيات',
    'العلوم',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'الجيولوجيا والبيئة',
    'الحاسوب',
    'التربية الإسلامية',
    'التربية الوطنية',
    'التاريخ',
    'الجغرافيا',
    'الثقافة المالية',
    'الثقافة العامة',
    'التربية الفنية',
    'التربية الرياضية',
    'اللغة الفرنسية',
    'العلوم الحياتية',
    'التكنولوجيا',
    'علوم الأرض',
    'علوم البيئة',
    'الاقتصاد المنزلي',
    'العلوم المهنية',
    'الإنتاج النباتي',
    'الإنتاج الحيواني',
    'العلوم الصناعية الخاصة',
    'الرسم الصناعي',
    'الرسم الهندسي',
    'الكهرباء',
    'الإلكترونيات',
    'الميكانيك',
    'النجارة',
    'الحدادة',
    'الفندقة',
    'السياحة',
    'التجميل',
    'الخياطة',
    'التمريض',
    'الصحة العامة',
    'التربية المهنية',
    'الأنشطة والمهارات الحياتية',
    'مهارات الاتصال',
    'دراسات اجتماعية',
    'القانون',
    'الفلسفة',
    'علم النفس',
    'علم الاجتماع',
    'التسويق',
    'المحاسبة',
    'الإدارة',
    'العلوم الشرعية',
    'التفسير',
    'الحديث',
    'الفقه',
    'التلاوة والتجويد',
    'العقيدة الإسلامية'
  ];

  // Academic levels with colors
  academicLevels = [
    { value: 'أول', color: '#FFE4E1' },
    { value: 'ثاني', color: '#E6E6FA' },
    { value: 'ثالث', color: '#F0FFF0' },
    { value: 'رابع', color: '#FFFACD' },
    { value: 'خامس', color: '#E0FFFF' },
    { value: 'سادس', color: '#F5F5DC' },
    { value: 'سابع', color: '#D3D3D3' },
    { value: 'ثامن', color: '#F0F8FF' },
    { value: 'تاسع', color: '#FFF5EE' },
    { value: 'عاشر', color: '#F5FFFA' },
    { value: 'أول ثانوي', color: '#FAFAD2' },
    { value: 'ثانوي (توجيهي)', color: '#EEDD82' }
  ];

  // Filtered subjects for search
  filteredSubjects = [...this.subjects];
  subjectSearch = '';

  constructor(private pdfService: PdfService) {
    this.loadPdfs();
  }

  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  // Filter subjects based on search input
  filterSubjects(): void {
    const searchTerm = this.subjectSearch.toLowerCase().trim();
    this.filteredSubjects = this.subjects.filter(subject =>
      subject.toLowerCase().includes(searchTerm)
    );
  }

  // Prevent dropdown from closing when clicking search input
  onSubjectDropdownClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT') {
      event.stopPropagation();
    }
  }

  // Upload PDF
  uploadPdf(): void {
    if (!this.selectedFile || !this.title || !this.description ||
        !this.creatorName || !this.subject || !this.semester ||
        !this.country || !this.academicLevel) {
      this.errorMessage = 'يرجى ملء جميع الحقول واختيار ملف PDF';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    this.pdfService.uploadPdf(
      this.selectedFile,
      this.title,
      this.description,
      this.creatorName,
      this.subject,
      this.semester,
      this.country,
      this.academicLevel
    ).subscribe({
      next: (pdf) => {
        this.successMessage = 'تم رفع ملف PDF بنجاح';
        this.resetForm();
        this.loadPdfs();
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }

  // Load all PDFs
  private loadPdfs(): void {
    this.pdfService.getPdfs().subscribe({
      next: (pdfs) => {
        this.pdfs = pdfs;
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }

  // Delete PDF
  deletePdf(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      this.pdfService.deletePdf(id).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadPdfs();
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
    }
  }

  // View PDF
  viewPdf(id: string): void {
    this.pdfService.getPdfDetails(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }

  // Track by function for better performance
  trackByPdfId(index: number, pdf: Pdf): string {
    return pdf.id;
  }

  // Reset form after successful upload
  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.creatorName = '';
    this.subject = '';
    this.semester = '';
    this.country = '';
    this.academicLevel = '';
    this.subjectSearch = '';
    this.filteredSubjects = [...this.subjects];
    this.selectedFile = null;
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
