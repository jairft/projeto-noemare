import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// Imports para o Scanner
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

  // 👉 VARIÁVEIS PARA EXIBIR NA TELA (MOCK DO DESKTOP)
  bancoExtraido: string = '';
  valorExtraido: number | null = null;
  vencimentoExtraido: string | null = null;

  // --- CONTROLE DO SCANNER ---
  isScannerAtivo = false;
  formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.ITF,
    BarcodeFormat.EAN_13, 
    BarcodeFormat.CODE_128, 
    BarcodeFormat.QR_CODE 
  ];

  videoConstraints: MediaTrackConstraints = {
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
    facingMode: 'environment'
  };

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
  async abrirScanner(): Promise<void> {
    this.isScannerAtivo = true;
    this.notify.sucesso('Câmera ativada! Deite o celular para focar melhor.');

    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape');
        }
      }
    } catch (err) {
      console.warn('O navegador não suporta rotação automática.');
    }
  }

  async fecharScanner(): Promise<void> {
    this.isScannerAtivo = false;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
    } catch (err) {}
  }

  handleScanSuccess(result: string): void {
    if (result) {
      // 👉 Filtro Anti-Leitura Parcial (Aceita apenas linha inteira de boleto)
      if (result.length !== 44 && result.length !== 47 && result.length !== 48) {
        console.warn('Leitura parcial ignorada: ', result);
        return; 
      }

      this.form.get('codigoBarras')?.setValue(result);
      this.processarLinhaDigitavel(); 
      this.fecharScanner(); 
      this.notify.sucesso('Código capturado com sucesso!');
    }
  }

  handleScanError(error: any): void {
    // Silencia erros contínuos de foco para não travar a tela
  }

  // --- PROCESSAMENTO DA LINHA DIGITÁVEL ---
  processarLinhaDigitavel(): void {
    let linha = this.form.get('codigoBarras')?.value;
    if (!linha) {
      this.limparExtracao();
      return;
    }

    linha = linha.replace(/[^0-9]/g, '');

    // 👉 TRATAMENTO 44 DÍGITOS (CÂMERA)
    if (linha.length === 44) {
      const fatorVencimento = parseInt(linha.substring(5, 9), 10);
      const valorFinal = parseFloat(linha.substring(9, 19)) / 100;
      const codigoBanco = linha.substring(0, 3);
      const nomeBancoFormatado = identificarBanco(codigoBanco);

      let dataVencimentoStr = this.calcularData(fatorVencimento);

      this.atualizarFormEVisores(valorFinal, dataVencimentoStr, `${codigoBanco} - ${nomeBancoFormatado}`);
    }
    // 👉 TRATAMENTO 47 DÍGITOS (DIGITADO/COLADO)
    else if (linha.length === 47) {
      const valorFinal = parseFloat(linha.substring(37, 47)) / 100;
      const fatorVencimento = parseInt(linha.substring(33, 37), 10);
      const codigoBanco = linha.substring(0, 3);
      const nomeBancoFormatado = identificarBanco(codigoBanco);

      let dataVencimentoStr = this.calcularData(fatorVencimento);

      this.atualizarFormEVisores(valorFinal, dataVencimentoStr, `${codigoBanco} - ${nomeBancoFormatado}`);
    }
    // 👉 TRATAMENTO 48 DÍGITOS (CONTAS CONSUMO: ÁGUA/LUZ)
    else if (linha.length === 48 && linha.startsWith('8')) {
      const barras = linha.substring(0,11) + linha.substring(12,23) + linha.substring(24,35) + linha.substring(36,47);
      const valorFinal = parseFloat(barras.substring(4, 15)) / 100;
      const segmentoId = linha.substring(1, 2);
      
      const tipos: any = { '1': 'Prefeitura', '2': 'Saneamento', '3': 'Energia Elétrica', '4': 'Telecomunicações' };
      const tipoConta = tipos[segmentoId] || 'Consumo';

      this.atualizarFormEVisores(valorFinal, '', `Conta de ${tipoConta}`);
    } else {
      this.limparExtracao();
    }
  }

  // Métodos Auxiliares de Extração
  calcularData(fatorVencimento: number): string {
    if (fatorVencimento > 0) {
      const dataBaseUTC = Date.UTC(1997, 9, 7);
      let msCalculado = dataBaseUTC + (fatorVencimento * 24 * 60 * 60 * 1000);
      
      const dataCorteRollover = new Date(2025, 1, 22);
      if (new Date(msCalculado) < dataCorteRollover) {
        msCalculado += (9000 * 24 * 60 * 60 * 1000);
      }
      
      const dataFinal = new Date(msCalculado);
      const dataVenc = new Date(dataFinal.getUTCFullYear(), dataFinal.getUTCMonth(), dataFinal.getUTCDate(), 12, 0, 0);
      return dataVenc.toISOString().split('T')[0];
    }
    return '';
  }

  atualizarFormEVisores(valor: number, data: string, descricao: string) {
    this.bancoExtraido = descricao;
    this.valorExtraido = valor > 0 ? valor : null;
    this.vencimentoExtraido = data || null;

    this.form.patchValue({
      valor: valor > 0 ? valor : this.form.get('valor')?.value,
      dataVencimento: data || this.form.get('dataVencimento')?.value,
      descricao: this.form.get('descricao')?.value || descricao
    });
  }

  limparExtracao() {
    this.bancoExtraido = '';
    this.valorExtraido = null;
    this.vencimentoExtraido = null;
  }

  // --- LISTAGEM E PAGINAÇÃO (MANTIDOS) ---
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
      }
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

  darBaixa(id: number): void {
    if (confirm('Confirmar o pagamento deste boleto?')) {
      this.boletoService.darBaixa(id).subscribe({
        next: () => {
          this.notify.sucesso('Boleto pago!');
          this.listarBoletos();
        }
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
          this.limparExtracao();
          this.listarBoletos();
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.erro(err.error?.mensagem || 'Erro ao cadastrar.');
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}