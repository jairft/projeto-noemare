import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// Scanner
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

import { BoletoService } from '../../services/boleto.service';
import { NotifyService } from '../../services/notify.service';
import { identificarBanco } from '../../data/bancos';

type MapaTiposConsumo = Record<string, string>;

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

  isConsumo = false;

  // 👉 VARIÁVEIS PARA EXIBIR NA TELA
  bancoExtraido: string = '';
  valorExtraido: number | null = null;
  vencimentoExtraido: string | null = null;

  // --- CONTROLE DO SCANNER ---
  isScannerAtivo = false;

  modoLeitura: 'BOLETO' | 'PIX' = 'BOLETO';
  formatsEnabled: BarcodeFormat[] = [BarcodeFormat.ITF];

  videoConstraints: MediaTrackConstraints = {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 }
  };

  currentDevice: MediaDeviceInfo | any | undefined;

  form: FormGroup = this.fb.group({
    descricao: ['', Validators.required],
    codigoBarras: ['', Validators.required],
    valor: ['', [Validators.required, Validators.min(0.01)]],
    dataVencimento: ['', Validators.required]
  });

  ngOnInit(): void {
    this.listarBoletos();

    // 👉 RESTAURADO: O vigia que o ChatGPT tinha apagado! 
    // Garante que colar o código extraia os dados na mesma hora.
    this.form.get('codigoBarras')?.valueChanges.subscribe(() => {
      this.processarLinhaDigitavel();
    });
  }

  // ===========================
  // SCANNER
  // ===========================

  setModoLeitura(modo: 'BOLETO' | 'PIX') {
    this.modoLeitura = modo;
    this.formatsEnabled = modo === 'PIX'
      ? [BarcodeFormat.QR_CODE]
      : [BarcodeFormat.ITF];
  }

  async abrirScanner(): Promise<void> {
    this.isScannerAtivo = true;

    this.notify.sucesso(
      this.modoLeitura === 'PIX'
        ? 'Câmera ativada! Aponte para o QR Code.'
        : 'Câmera ativada! Aponte para o código de barras.'
    );

    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape');
        }
      }
    } catch {
      console.warn('Fullscreen/rotação não suportado ou bloqueado.');
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
    } catch {}
  }

  onCamerasFound(devices: MediaDeviceInfo[] | any[]): void {
    if (!devices || devices.length === 0) return;
    const backCam = devices.find(d => /back|rear|environment/i.test(d?.label || ''));
    this.currentDevice = backCam || devices[0];
  }

  onCamerasNotFound(): void {
    this.notify.erro('Nenhuma câmera foi encontrada neste dispositivo.');
  }

  onPermissionResponse(ok: boolean): void {
    if (!ok) {
      this.notify.erro('Permissão de câmera negada. Verifique as permissões do navegador.');
      this.isScannerAtivo = false;
    }
  }

  handleScanSuccess(result: string): void {
    if (!result) return;

    if (this.modoLeitura === 'PIX') {
      this.form.get('codigoBarras')?.setValue(result);
      this.fecharScanner();
      this.notify.sucesso('QR Code capturado com sucesso!');
      return;
    }

    const limpo = String(result).replace(/[^0-9]/g, '');
    if (!limpo) return;

    if (limpo.length !== 44 && limpo.length !== 47 && limpo.length !== 48) {
      console.warn('Leitura ignorada (tamanho incorreto): ', limpo.length, limpo);
      return;
    }

    this.form.get('codigoBarras')?.setValue(limpo);
    this.fecharScanner();
    this.notify.sucesso('Código capturado com sucesso!');
  }

  handleScanError(_error: any): void { }

  // ===========================
  // PROCESSAMENTO DA LINHA DIGITÁVEL
  // ===========================

  processarLinhaDigitavel(): void {
    let linha = this.form.get('codigoBarras')?.value;

    if (!linha) {
      this.limparExtracao();
      this.isConsumo = false;
      return;
    }

    linha = String(linha).replace(/[^0-9]/g, '');

    // 👉 1. BOLETOS BANCÁRIOS (44 ou 47 dígitos)
    if ((linha.length === 44 || linha.length === 47) && !linha.startsWith('8')) {
      this.isConsumo = false;
      
      let valorFinal = 0;
      let fatorVencimento = 0;
      let codigoBanco = linha.substring(0, 3);

      if (linha.length === 44) {
        fatorVencimento = parseInt(linha.substring(5, 9), 10);
        valorFinal = parseFloat(linha.substring(9, 19)) / 100;
      } else {
        fatorVencimento = parseInt(linha.substring(33, 37), 10);
        valorFinal = parseFloat(linha.substring(37, 47)) / 100;
      }

      const nomeBancoFormatado = identificarBanco(codigoBanco);
      const dataVencimentoStr = this.calcularData(fatorVencimento);

      this.atualizarFormEVisores(valorFinal, dataVencimentoStr, `${codigoBanco} - ${nomeBancoFormatado}`);
      return;
    }

    // 👉 2. CONTAS DE CONSUMO (48 dígitos)
    if (linha.length === 48 && linha.startsWith('8')) {
      this.isConsumo = true; // 👉 Habilita edição manual

      const barras =
        linha.substring(0, 11) +
        linha.substring(12, 23) +
        linha.substring(24, 35) +
        linha.substring(36, 47);

      const valorFinal = parseFloat(barras.substring(4, 15)) / 100;
      const segmentoId = linha.substring(1, 2);

      const tipos: MapaTiposConsumo = {
        '1': 'Prefeitura / Taxas',
        '2': 'Saneamento / Água',
        '3': 'Energia Elétrica',
        '4': 'Telecomunicações',
        '5': 'Órgãos Governamentais',
        '6': 'Carnês / Assemelhados',
        '7': 'Multas de Trânsito',
        '9': 'Exclusivo do Banco'
      };

      const tipoConta = tipos[segmentoId] || 'Consumo';
      this.atualizarFormEVisores(valorFinal, '', `Conta de ${tipoConta}`);
      return;
    }

    this.limparExtracao();
    this.isConsumo = false;
  }

  // ===========================
  // AUXILIARES DE EXTRAÇÃO
  // ===========================

  calcularData(fatorVencimento: number): string {
    if (fatorVencimento > 0) {
      const dataBaseUTC = Date.UTC(1997, 9, 7);
      let msCalculado = dataBaseUTC + fatorVencimento * 24 * 60 * 60 * 1000;

      const dataCorteRollover = new Date(2025, 1, 22);
      if (new Date(msCalculado) < dataCorteRollover) {
        msCalculado += 9000 * 24 * 60 * 60 * 1000;
      }

      const dataFinal = new Date(msCalculado);
      const dataVenc = new Date(
        dataFinal.getUTCFullYear(),
        dataFinal.getUTCMonth(),
        dataFinal.getUTCDate(),
        12, 0, 0
      );

      return dataVenc.toISOString().split('T')[0];
    }
    return '';
  }

  atualizarFormEVisores(valor: number, data: string, descricao: string): void {
    this.bancoExtraido = descricao;
    this.valorExtraido = valor > 0 ? valor : null;
    this.vencimentoExtraido = data || null;

    // 👉 RESTAURADO: { emitEvent: false } previne o navegador de travar num loop infinito
    this.form.patchValue({
      valor: valor > 0 ? valor : this.form.get('valor')?.value,
      dataVencimento: data || this.form.get('dataVencimento')?.value,
      descricao: this.form.get('descricao')?.value || descricao
    }, { emitEvent: false }); 
  }

  limparExtracao(): void {
    this.bancoExtraido = '';
    this.valorExtraido = null;
    this.vencimentoExtraido = null;
  }

  // ===========================
  // LISTAGEM E PAGINAÇÃO
  // ===========================

  listarBoletos(): void {
    this.boletoService.listarTodos().subscribe({
      next: (dados) => {
        this.boletosSalvos = dados.map((b: any) => ({
          ...b,
          dataExibicao: this.parseDateSemFuso(b.dataVencimento),
          statusExibicao: this.calcularStatusExibicao(b.status || 'PENDENTE', b.dataVencimento)
        }));

        const ordemStatus: any = { VENCIDO: 1, PENDENTE: 2, PAGO: 3 };
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
    return new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, parseInt(dia, 10));
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