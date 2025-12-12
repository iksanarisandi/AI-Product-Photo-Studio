import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';

type AspectRatio = '1:1' | '9:16' | '3:4';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  uploadedFile = signal<File | null>(null);
  uploadedImagePreview = signal<string | null>(null);
  selectedAspectRatio = signal<AspectRatio>('1:1');
  generatedImages = signal<string[]>([]);
  isLoading = signal<boolean>(false);
  statusMessage = signal<string>('');
  error = signal<string | null>(null);

  aspectRatios: { key: AspectRatio, label: string }[] = [
    { key: '1:1', label: 'Square' },
    { key: '3:4', label: 'Portrait' },
    { key: '9:16', label: 'Story' },
  ];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadedFile.set(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImagePreview.set(e.target.result);
      };
      reader.readAsDataURL(file);
      this.generatedImages.set([]);
      this.error.set(null);
    }
  }

  setAspectRatio(ratio: AspectRatio): void {
    this.selectedAspectRatio.set(ratio);
  }

  async generateImages(): Promise<void> {
    const file = this.uploadedFile();
    if (!file) {
      this.error.set('Please upload a product photo first.');
      return;
    }

    this.isLoading.set(true);
    this.generatedImages.set([]);
    this.error.set(null);

    try {
      this.statusMessage.set('Analyzing your product...');
      const description = await this.geminiService.describeImage(file);
      
      this.statusMessage.set('Creating professional photos...');
      const images = await this.geminiService.generateImagesFromDescription(description, this.selectedAspectRatio());
      
      this.generatedImages.set(images);
    } catch (err) {
      console.error(err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
      this.error.set(`Failed to generate images. Please try again. Error: ${errorMessage}`);
    } finally {
      this.isLoading.set(false);
      this.statusMessage.set('');
    }
  }

  triggerFileUpload(): void {
    document.getElementById('file-upload')?.click();
  }
}