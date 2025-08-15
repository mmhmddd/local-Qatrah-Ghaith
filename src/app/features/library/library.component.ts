import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pdf, PdfService } from '../../core/services/pdf.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {
  pdfs: Pdf[] = [];
  filteredPdfs: Pdf[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  searchTerm: string = '';
  subjects: string[] = [];
  creators: string[] = [];
  academicLevels: string[] = [];
  countries: string[] = [];
  filters = {
    subject: '',
    creatorName: '',
    academicLevel: '',
    country: ''
  };

  // Academic level-to-class mapping for CSS
  private academicLevelClassMap: { [key: string]: string } = {
    'أول': 'level-أول',
    'ثاني': 'level-ثاني',
    'ثالث': 'level-ثالث',
    'رابع': 'level-رابع',
    'خامس': 'level-خامس',
    'سادس': 'level-سادس',
    'سابع': 'level-سابع',
    'ثامن': 'level-ثامن',
    'تاسع': 'level-تاسع',
    'عاشر': 'level-عاشر',
    'أول ثانوي': 'level-أول-ثانوي',
    'ثانوي (توجيهي)': 'level-ثانوي-توجيهي',
    'First': 'level-first',
    'Second': 'level-second',
    'Third': 'level-third',
    'Fourth': 'level-fourth',
    'Fifth': 'level-fifth',
    'Sixth': 'level-sixth',
    'Seventh': 'level-seventh',
    'Eighth': 'level-eighth',
    'Ninth': 'level-ninth',
    'Tenth': 'level-tenth',
    'First Secondary': 'level-first-secondary',
    'Secondary (Tawjihi)': 'level-secondary-tawjihi'
  };

  constructor(
    private pdfService: PdfService,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadPdfs();
  }

  /**
   * Load PDFs from service and initialize filters
   */
  private loadPdfs(): void {
    this.pdfService.getPdfs()
      .subscribe({
        next: (pdfs) => {
          this.pdfs = pdfs;
          this.filteredPdfs = pdfs;
          this.errorMessage = pdfs.length === 0 ? this.translationService.translate('library.noPdfs') : null;
          this.initializeFilters(pdfs);
        },
        error: (err) => {
          this.errorMessage = err.message || this.translationService.translate('library.errorLoadingPdfs');
          this.clearMessages();
        }
      });
  }

  /**
   * Initialize filter options from PDF data
   */
  private initializeFilters(pdfs: Pdf[]): void {
    this.subjects = [...new Set(pdfs.map(pdf => pdf.subject).filter(subject => subject))].sort();
    this.creators = [...new Set(pdfs.map(pdf => pdf.creatorName).filter(creator => creator))].sort();
    this.academicLevels = [...new Set(pdfs.map(pdf => pdf.academicLevel).filter(level => level))].sort();
    this.countries = [...new Set(pdfs.map(pdf => pdf.country).filter(country => country))].sort();
  }

  /**
   * Search PDFs by title and description
   */
  searchPdfs(): void {
    this.filterPdfs();
  }

  /**
   * Filter PDFs based on search term and selected filters
   */
  filterPdfs(): void {
    let tempPdfs = [...this.pdfs];

    // Filter by title and description search
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      tempPdfs = tempPdfs.filter(pdf =>
        pdf.title.toLowerCase().includes(searchLower) ||
        pdf.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by subject
    if (this.filters.subject) {
      tempPdfs = tempPdfs.filter(pdf => pdf.subject === this.filters.subject);
    }

    // Filter by creator
    if (this.filters.creatorName) {
      tempPdfs = tempPdfs.filter(pdf => pdf.creatorName === this.filters.creatorName);
    }

    // Filter by academic level
    if (this.filters.academicLevel) {
      tempPdfs = tempPdfs.filter(pdf => pdf.academicLevel === this.filters.academicLevel);
    }

    // Filter by country
    if (this.filters.country) {
      tempPdfs = tempPdfs.filter(pdf => pdf.country === this.filters.country);
    }

    this.filteredPdfs = tempPdfs;

    // Show message if no results found
    if (tempPdfs.length === 0 && this.pdfs.length > 0) {
      this.errorMessage = this.translationService.translate('library.noResults');
    } else if (tempPdfs.length > 0) {
      this.errorMessage = null;
    }
  }

  /**
   * Clear all search and filter criteria
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.filters = {
      subject: '',
      creatorName: '',
      academicLevel: '',
      country: ''
    };
    this.filteredPdfs = [...this.pdfs];
    this.errorMessage = this.pdfs.length === 0 ? this.translationService.translate('library.noPdfs') : null;
  }

  /**
   * Open PDF file in new tab
   */
  openPdf(id: string): void {
    if (!id) {
      this.showErrorMessage(this.translationService.translate('library.invalidId'));
      return;
    }

    this.pdfService.getPdfDetails(id)
      .subscribe({
        next: (blob) => {
          try {
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');

            if (!newWindow) {
              this.showErrorMessage(this.translationService.translate('library.popupBlocked'));
            } else {
              this.showSuccessMessage(this.translationService.translate('library.fileOpened'));
            }

            setTimeout(() => {
              URL.revokeObjectURL(url);
            }, 1000);
          } catch (error) {
            this.showErrorMessage(this.translationService.translate('library.errorOpeningFile'));
          }
        },
        error: (err) => {
          this.showErrorMessage(err.message || this.translationService.translate('library.errorLoadingFile'));
        }
      });
  }

  /**
   * Share PDF link
   */
  sharePdf(id: string): void {
    if (!id) {
      this.showErrorMessage(this.translationService.translate('library.invalidId'));
      return;
    }

    const shareUrl = `${window.location.origin}/api/pdf/view/${id}`;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          this.showSuccessMessage(this.translationService.translate('library.linkCopied'));
        })
        .catch(() => {
          this.fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
      this.fallbackCopyTextToClipboard(shareUrl);
    }
  }

  /**
   * Fallback method for copying text to clipboard
   */
  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showSuccessMessage(this.translationService.translate('library.linkCopied'));
    } catch (err) {
      this.showErrorMessage(this.translationService.translate('library.copyFailed'));
    } finally {
      document.body.removeChild(textArea);
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
    this.clearMessages();
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    this.clearMessages();
  }

  /**
   * Clear messages after a delay
   */
  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
    }, 4000);
  }

  /**
   * Get CSS class for academic level
   */
  getAcademicLevelClass(level: string): string {
    return this.academicLevelClassMap[level] || 'level-default';
  }

  /**
   * Track PDFs by ID for better performance
   */
  trackByPdfId(index: number, pdf: Pdf): string {
    return pdf.id;
  }
}
