import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// 👉 Imports para o Scanner de Boleto
import { ZXingScannerModule } from '@zxing/ngx-scanner'; 
import { BarcodeFormat } from '@zxing/library';

import { BoletoService } from '../../services/boleto.service';
import { NotifyService } from '../../services/notify.service';
import { identificarBanco } from '../../data/bancos';

@Component({
  selector: 'app-boleto-mobile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatIconModule,
    MatPaginatorModule,
    ZXingScannerModule
  ],
  templateUrl: './boleto-mobile.component.html',
  styleUrls: ['./boleto-mobile.component.scss']
})
export class BoletoMobileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly boletoService = inject(BoletoService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);

  isLoading = false;
  boletosSalvos: any[] = []; 

  pageSize = 4;
  pageIndex = 0;
  boletosPaginados: any[] = [];

  // --- CONTROLO DO SCANNER ---
  isScannerAtivo = false;
  formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.EAN_13, 
    BarcodeFormat.CODE_128, 
    BarcodeFormat.ITF, 
    BarcodeFormat.QR_CODE 
  ];

  form: FormGroup = this.fb.group({
    descricao: ['', Validators.required],
    codigoBarras: ['', Validators.required],
    valor: ['', [Validators.required, Validators.min(0.01)]],
    dataVencimento: ['', Validators.required]
  });

  ngOnInit(): void {
    this.listarBoletos();
  }

  // --- MÉTODOS DO SCANNER ---
  abrirScanner(): void {
    this.isScannerAtivo = true;
    this.notify.sucesso('Câmera ativada!');
  }

  fecharScanner(): void {
    this.isScannerAtivo = false;
  }

  handleScanSuccess(result: string): void {
    if (result) {
      this.form.get('codigoBarras')?.setValue(result);
      this.processarLinhaDigitavel(); 
      this.fecharScanner();
      this.notify.sucesso('Código capturado com sucesso!');
    }
  }

  handleScanError(error: any): void {
    this.notify.erro('Erro ao acessar a câmera. Verifique as permissões.');
    this.fecharScanner();
  }

  // --- BUSCA E ORDENAÇÃO ---
  listarBoletos(): void {
    this.boletoService.listarTodos().subscribe({
      next: (dados) => {
        this.boletosSalvos = dados.map(b => ({
          ...b,
          dataExibicao: this.parseDateSemFuso(b.dataVencimento),
          statusExibicao: this.calcularStatusExibicao(b.status || 'PENDENTE', b.dataVencimento)
        }));

        const ordemStatus: any = { 'VENCIDO': 1, 'PENDENTE': 2, 'PAGO': 3 };
        this.boletosSalvos.sort((a, b) => {
          const pesoA = ordemStatus[a.statusExibicao] || 99;
          const pesoB = ordemStatus[b.statusExibicao] || 99;
          if (pesoA !== pesoB) return pesoA - pesoB;
          return new Date(a.dataExibicao).getTime() - new Date(b.dataExibicao).getTime();
        });

        this.atualizarPagina();
      },
      error: () => this.notify.erro('Erro ao carregar boletos.')
    });
  }

  atualizarPagina(event?: PageEvent): void {
    if (event) {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
    } else {
      this.pageIndex = 0; 
    }
    const inicio = this.pageIndex * this.pageSize;
    this.boletosPaginados = this.boletosSalvos.slice(inicio, inicio + this.pageSize);
  }

  parseDateSemFuso(dataStr: string): Date | null {
    if (!dataStr) return null;
    const [ano, mes, dia] = dataStr.split('-');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  }

  calcularStatusExibicao(statusAtual: string, dataVencimentoStr: string): string {
    if (statusAtual === 'PAGO') return 'PAGO';
    if (dataVencimentoStr) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataVenc = this.parseDateSemFuso(dataVencimentoStr);
      if (dataVenc && dataVenc < hoje) return 'VENCIDO';
    }
    return 'PENDENTE';
  }

  processarLinhaDigitavel(): void {
    let linha = this.form.get('codigoBarras')?.value;
    if (!linha) return;

    linha = linha.replace(/[^0-9]/g, '');

    // 👉 TRATAMENTO PARA CÓDIGO DE BARRAS (44 DÍGITOS) - CAPTURADO PELA CÂMERA
    if (linha.length === 44) {
      const fatorVencimento = parseInt(linha.substring(5, 9), 10);
      const valorFinal = parseFloat(linha.substring(9, 19)) / 100;
      const codigoBanco = linha.substring(0, 3);
      const nomeBancoFormatado = identificarBanco(codigoBanco);

      let dataVencimentoStr = '';
      if (fatorVencimento > 0) {
        const dataBaseUTC = Date.UTC(1997, 9, 7);
        let msCalculado = dataBaseUTC + (fatorVencimento * 24 * 60 * 60 * 1000);
        
        // Correção de Rollover (mesmo critério da linha digitável)
        const dataCorteRollover = new Date(2025, 1, 22);
        if (new Date(msCalculado) < dataCorteRollover) {
          msCalculado += (9000 * 24 * 60 * 60 * 1000);
        }
        
        const dataFinal = new Date(msCalculado);
        const dataVenc = new Date(dataFinal.getUTCFullYear(), dataFinal.getUTCMonth(), dataFinal.getUTCDate(), 12, 0, 0);
        dataVencimentoStr = dataVenc.toISOString().split('T')[0];
      }

      this.form.patchValue({
        valor: valorFinal > 0 ? valorFinal : this.form.get('valor')?.value,
        dataVencimento: dataVencimentoStr || this.form.get('dataVencimento')?.value,
        descricao: this.form.get('descricao')?.value || `Boleto ${nomeBancoFormatado}`
      });
    }
    // 👉 TRATAMENTO PARA LINHA DIGITÁVEL (47 DÍGITOS) - COLADO MANUALMENTE
    else if (linha.length === 47) {
      const valorFinal = parseFloat(linha.substring(37, 47)) / 100;
      const fatorVencimento = parseInt(linha.substring(33, 37), 10);
      
      let dataVencimentoStr = '';
      if (fatorVencimento > 0) {
        const dataBaseUTC = Date.UTC(1997, 9, 7);
        let msCalculado = dataBaseUTC + (fatorVencimento * 24 * 60 * 60 * 1000);
        
        const dataCorteRollover = new Date(2025, 1, 22);
        if (new Date(msCalculado) < dataCorteRollover) {
          msCalculado += (9000 * 24 * 60 * 60 * 1000); 
        }

        const dataFinal = new Date(msCalculado);
        const dataVenc = new Date(dataFinal.getUTCFullYear(), dataFinal.getUTCMonth(), dataFinal.getUTCDate(), 12, 0, 0);
        dataVencimentoStr = dataVenc.toISOString().split('T')[0];
      }

      const codigoBanco = linha.substring(0, 3);
      const nomeBancoFormatado = identificarBanco(codigoBanco);

      this.form.patchValue({
        valor: valorFinal > 0 ? valorFinal : this.form.get('valor')?.value,
        dataVencimento: dataVencimentoStr || this.form.get('dataVencimento')?.value,
        descricao: this.form.get('descricao')?.value || `Boleto ${nomeBancoFormatado}`
      });
    }
    // 👉 TRATAMENTO PARA CONTAS DE CONSUMO (48 DÍGITOS)
    else if (linha.length === 48 && linha.startsWith('8')) {
      const barras = linha.substring(0,11) + linha.substring(12,23) + linha.substring(24,35) + linha.substring(36,47);
      const valorFinal = parseFloat(barras.substring(4, 15)) / 100;
      const segmentoId = linha.substring(1, 2);
      
      const tipos: any = { '1': 'Imposto', '2': 'Saneamento', '3': 'Energia', '4': 'Telecom' };
      const tipoConta = tipos[segmentoId] || 'Consumo';

      this.form.patchValue({
        valor: valorFinal > 0 ? valorFinal : this.form.get('valor')?.value,
        descricao: this.form.get('descricao')?.value || `Conta de ${tipoConta}`
      });
    }
  }

  darBaixa(id: number): void {
    if (confirm('Confirmar o pagamento deste boleto?')) {
      this.boletoService.darBaixa(id).subscribe({
        next: () => {
          this.notify.sucesso('Boleto marcado como pago!');
          this.listarBoletos();
        },
        error: (err) => this.notify.erro(err.error?.mensagem || 'Erro ao processar o pagamento.')
      });
    }
  }

  voltar(): void {
    this.router.navigate(['/home-mobile']);
  }

  salvar(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.boletoService.cadastrar(this.form.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.notify.sucesso('Boleto cadastrado!');
          this.form.reset();
          this.listarBoletos();
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.erro(err.error?.mensagem || 'Erro ao cadastrar o boleto.');
        }
      });
    } else {
      this.form.markAllAsTouched();
      this.notify.erro('Verifique se o código de barras é válido e contém valor e data.');
    }
  }
}