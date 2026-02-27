import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import QRCodeStyling from 'qr-code-styling';
import jsPDF from 'jspdf'; 

// 👉 1. Importe o environment (ajuste o caminho dos '../' conforme a pasta do seu componente)
import { environment } from '../../../environments/environment'; 

@Component({
  selector: 'app-qr-mobile-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './qr-mobile-dialog.component.html',
  styleUrl: './qr-mobile-dialog.component.scss'
})
export class QrMobileDialogComponent implements AfterViewInit {
  @ViewChild('qrContainer', { static: false }) qrContainer!: ElementRef;
  qrCode!: QRCodeStyling; 

  // 👉 2. Agora ele puxa o link dinamicamente do arquivo de configuração!
  urlMobile = environment.mobileUrl;

  constructor(private dialogRef: MatDialogRef<QrMobileDialogComponent>) {}

  ngAfterViewInit(): void {
    console.log("Link gerado para o QR Code:", this.urlMobile);
    this.qrCode = new QRCodeStyling({
      width: 240, 
      height: 240,
      data: this.urlMobile, // Usa a variável que veio do environment
      dotsOptions: {
        color: "#2563eb", 
        type: "dots"      
      },
      cornersSquareOptions: {
        color: "#0f172a", 
        type: "extra-rounded" 
      },
      cornersDotOptions: {
        color: "#2563eb",
        type: "dot" 
      },
      backgroundOptions: {
        color: "#ffffff", 
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 10
      }
    });

    this.qrCode.append(this.qrContainer.nativeElement);
  }

  fechar(): void {
    this.dialogRef.close();
  }

  downloadPdf(): void {
    const canvas = this.qrContainer.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      const qrSize = 100; 
      const xPos = (pageWidth - qrSize) / 2;
      
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42); 
      pdf.text('Acesso Mobile - Noé Maré', pageWidth / 2, 45, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Escaneie este código para aceder ao sistema pelo telemóvel.', pageWidth / 2, 54, { align: 'center' });

      pdf.addImage(imgData, 'PNG', xPos, 75, qrSize, qrSize);

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Certifique-se de que o dispositivo está conectado à rede Wi-Fi da empresa.', pageWidth / 2, 190, { align: 'center' });

      pdf.save('acesso-mobile-noemare.pdf');
    }
  }
}