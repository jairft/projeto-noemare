import { Component, ElementRef, ViewChild, ViewChildren, QueryList, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // 👉 Inclusão do Modal
import { NgxCurrencyDirective } from 'ngx-currency';

// @ts-ignore
import JsBarcode from 'jsbarcode';

import { BoletoService } from '../../services/boleto.service';
import { NotifyService } from '../../services/notify.service';
import { identificarBanco } from '../../data/bancos';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ConfirmDialogComponent } from '../confirm-dialogo/confirm-dialog.component';

@Component({
  selector: 'app-cadastro-boleto',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatInputModule,
    MatFormFieldModule, MatDatepickerModule, MatNativeDateModule,
    MatTooltipModule, MatDialogModule, MatPaginatorModule
  ],
  templateUrl: './cadastro-boleto.component.html',
  styleUrls: ['./cadastro-boleto.component.scss']
})
export class CadastroBoletoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly boletoService = inject(BoletoService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog); // 👉 Injeção do serviço de Modal

  @ViewChild('barcodeSvg') barcodeSvg!: ElementRef;
  @ViewChildren('barcodeItemList') barcodeItemList!: QueryList<ElementRef>;
  
  // 👉 Referências para o Modal de visualização ampliada
  @ViewChild('modalVisualizacao') modalVisualizacao!: any;
  @ViewChild('barcodeModal') barcodeModal!: ElementRef;

  codigoBarrasVisual = '';
  boletosSalvos: any[] = [];

  isConsumo = false;

  pageSize = 6;
  pageIndex = 0;
  boletosPaginados: any[] = [];

  form: FormGroup = this.fb.group({
    descricao: ['', Validators.required],
    nomeBanco: [''],
    codigoBarras: [''],
    valor: ['', [Validators.required, Validators.min(0.01)]],
    dataVencimento: ['', Validators.required]
  });

  ngOnInit(): void {
    this.listarBoletosDoBanco();
  }

  private parseDateSemFuso(valor: string | null): Date | null {
    if (!valor) return null;
    const match = valor.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const [, ano, mes, dia] = match;
    return new Date(+ano, +mes - 1, +dia, 12, 0, 0);
  }

listarBoletosDoBanco(): void {
    this.boletoService.listarTodos().subscribe({
      next: (dados) => {
        this.boletosSalvos = dados.map(b => ({
          ...b,
          codigoBarrasFull: this.gerarDadosCodigoBarras(b.codigoBarras),
          dataExibicao: this.parseDateSemFuso(b.dataVencimento),
          statusExibicao: this.calcularStatusExibicao(b.status || 'PENDENTE', b.dataVencimento)
        }));

        // 👉 1. ORDENAÇÃO PODEROSA: Vencido -> Pendente -> Pago
        const ordemStatus: any = { 'VENCIDO': 1, 'PENDENTE': 2, 'PAGO': 3 };
        
        this.boletosSalvos.sort((a, b) => {
          const pesoA = ordemStatus[a.statusExibicao] || 99;
          const pesoB = ordemStatus[b.statusExibicao] || 99;
          
          if (pesoA !== pesoB) {
            return pesoA - pesoB; // Ordena por status
          }
          // Critério de desempate: Data de vencimento mais próxima primeiro
          return new Date(a.dataExibicao).getTime() - new Date(b.dataExibicao).getTime();
        });

        // 👉 2. APLICA PAGINAÇÃO APÓS ORDENAR
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
      this.pageIndex = 0; // Volta pra primeira página ao recarregar a lista
    }

    const inicio = this.pageIndex * this.pageSize;
    this.boletosPaginados = this.boletosSalvos.slice(inicio, inicio + this.pageSize);
    
    // O setTimeout garante que o HTML desenhe os novos itens antes de tentar injetar os Códigos de Barras
    setTimeout(() => {
      this.renderizarBarrasLista();
    }, 50);
  }

  private gerarDadosCodigoBarras(linha: string): string {
    if (!linha) return '';
    const limpa = linha.replace(/[^0-9]/g, '');

    if (limpa.length === 47) {
      return limpa.substring(0, 4) + limpa.substring(32, 33) +
             limpa.substring(33, 37) + limpa.substring(37, 47) +
             limpa.substring(4, 9) + limpa.substring(10, 20) + limpa.substring(21, 31);
    } else if (limpa.length === 48 && limpa.startsWith('8')) {
      return limpa.substring(0,11) + limpa.substring(12,23) + limpa.substring(24,35) + limpa.substring(36,47);
    }
    return '';
  }

  private calcularDataVencimento(fator: number): Date | null {
    if (!fator || fator <= 0) return null;
    const dataBaseUTC = Date.UTC(1997, 9, 7);
    let msCalculado = dataBaseUTC + fator * 24 * 60 * 60 * 1000;
    let dataFinal = new Date(msCalculado);

    const dataCorteRollover = new Date(2025, 1, 22);
    if (dataFinal < dataCorteRollover) {
      msCalculado += (9000 * 24 * 60 * 60 * 1000);
      dataFinal = new Date(msCalculado);
    }

    return new Date(
      dataFinal.getUTCFullYear(), 
      dataFinal.getUTCMonth(), 
      dataFinal.getUTCDate(), 
      12, 0, 0
    );
  }


  processarLinhaDigitavel(): void {
    let linha = this.form.get('codigoBarras')?.value;

    if (!linha) {
      this.codigoBarrasVisual = '';
      this.isConsumo = false;
      this.form.patchValue({ nomeBanco: '', valor: '', dataVencimento: '' });
      return;
    }

    // Remove caracteres não numéricos
    linha = String(linha).replace(/[^0-9]/g, '');
    this.codigoBarrasVisual = this.gerarDadosCodigoBarras(linha);

    // 👉 1. BOLETOS BANCÁRIOS COMUNS (47 dígitos)
    if (linha.length === 47 && !linha.startsWith('8')) {
      this.isConsumo = false;
      const valorFinal = parseFloat(linha.substring(37, 47)) / 100;
      const fatorVencimento = parseInt(linha.substring(33, 37), 10);
      const dataVencimentoObj = this.calcularDataVencimento(fatorVencimento);

      this.form.patchValue({
        valor: valorFinal > 0 ? valorFinal : this.form.get('valor')?.value,
        dataVencimento: dataVencimentoObj || this.form.get('dataVencimento')?.value,
        nomeBanco: this.identificarBanco(linha.substring(0, 3))
      });
      this.gerarImagemCodigoBarras();
      return;
    }

    // 👉 2. CONTAS DE CONSUMO / CONVÊNIOS (48 dígitos)
    if (linha.length === 48 && linha.startsWith('8')) {
      this.isConsumo = true; // Ativa a edição manual da data no HTML

      // Reorganiza para extrair o valor correto de contas de consumo
      const barras =
        linha.substring(0, 11) +
        linha.substring(12, 23) +
        linha.substring(24, 35) +
        linha.substring(36, 47);

      const valorFinal = parseFloat(barras.substring(4, 15)) / 100;
      const segmentoId = linha.substring(1, 2);

      // Mapeamento dos tipos de convênio
      const tipos: any = {
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

      this.form.patchValue({
        valor: valorFinal > 0 ? valorFinal : this.form.get('valor')?.value,
        nomeBanco: `Conta de ${tipoConta}`,
        dataVencimento: '' // Limpa para preenchimento manual obrigatório
      });

      this.gerarImagemCodigoBarras();
      return;
    }

    // Se não atingir os critérios, limpa a extração automática
    this.isConsumo = false;
    this.form.patchValue({ nomeBanco: '', valor: '', dataVencimento: '' });
  }

  gerarImagemCodigoBarras(): void {
    setTimeout(() => {
      if (this.codigoBarrasVisual && this.barcodeSvg) {
        JsBarcode(this.barcodeSvg.nativeElement, this.codigoBarrasVisual, {
          format: 'ITF', displayValue: true, lineColor: '#0f172a', width: 2, height: 60, margin: 10
        });
      }
    }, 50);
  }

  renderizarBarrasLista(): void {
    setTimeout(() => {
      if (this.barcodeItemList && this.barcodeItemList.length > 0) {
        this.barcodeItemList.forEach((element, index) => {
          const dadosBoleto = this.boletosSalvos[index];
          if (dadosBoleto && dadosBoleto.codigoBarrasFull) {
            JsBarcode(element.nativeElement, dadosBoleto.codigoBarrasFull, {
              format: 'ITF', displayValue: false, height: 35, width: 1.2, margin: 0, background: 'transparent', lineColor: '#1e293b'
            });
          }
        });
      }
    }, 400);
  }

  // 👉 NOVO: Função para abrir o modal com o código de barras gigante
  visualizarBoleto(boleto: any): void {
    const dialogRef = this.dialog.open(this.modalVisualizacao, {
      width: '850px', // 👉 Aumentado para ficar mais largo
      maxWidth: '95vw',
      data: boleto,
      panelClass: 'modal-barcode-container'
    });

    dialogRef.afterOpened().subscribe(() => {
      setTimeout(() => {
        const svgElement = document.querySelector('.barcode-container-large svg');
        if (svgElement && boleto.codigoBarrasFull) {
          JsBarcode(svgElement, boleto.codigoBarrasFull, {
            format: 'ITF',
            displayValue: true,
            fontSize: 16,
            height: 100, // 👉 Altura levemente reduzida para o modal ficar mais baixo
            width: 2.8,  // 👉 Barras um pouco mais grossas para compensar a largura
            margin: 10,
            lineColor: '#000'
          });
        }
      }, 100);
    });
  }

  identificarBanco(codigo: string): string {
    return identificarBanco(codigo);
  }

  deletarBoleto(id: number): void {
  // 1. Abre o seu novo modal de confirmação
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: {
      titulo: 'Excluir Boleto',
      mensagem: 'Tem certeza que deseja apagar este boleto?<br><b>Esta ação não pode ser desfeita.</b>',
      tipo: 'perigo', // Ativa o cabeçalho vermelho no seu componente
      icone: 'delete_sweep',
      textoConfirmar: 'Apagar'
    }
  });

  // 2. Escuta a resposta do usuário
  dialogRef.afterClosed().subscribe(confirmado => {
    // Se o usuário clicou em 'Confirmar' (retorna true)
      if (confirmado) {
        this.boletoService.deletar(id).subscribe({
          next: () => {
            this.notify.sucesso('Boleto removido com sucesso!');
            this.listarBoletosDoBanco();
          },
          error: (err) => {
            // Utiliza a mensagem do erro vinda do servidor ou uma padrão
            const msg = err.error?.mensagem || 'Erro ao deletar o boleto.';
            this.notify.erro(msg);
          }
        });
      }
    });
  }

  salvar(): void {
    if (this.form.valid) {
      const formValue = { ...this.form.value };
      if (formValue.dataVencimento) {
        const d = new Date(formValue.dataVencimento);
        formValue.dataVencimento = d.toISOString().split('T')[0];
      }

      this.boletoService.cadastrar(formValue).subscribe({
        next: () => {
          this.notify.sucesso('Boleto cadastrado com sucesso!');
          this.form.reset();
          this.codigoBarrasVisual = '';
          this.listarBoletosDoBanco();
        },
        error: (err) => {
          this.notify.erro(err.error?.mensagem || 'Erro ao cadastrar.');
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  // 👉 NOVO: Adicione esta função para calcular o status em tempo real
  calcularStatusExibicao(statusAtual: string, dataVencimentoStr: string): string {
    if (statusAtual === 'PAGO') return 'PAGO';
    
    // Se não está pago, verifica se já passou de hoje
    if (dataVencimentoStr) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar só o dia
      
      const dataVenc = this.parseDateSemFuso(dataVencimentoStr);
      if (dataVenc && dataVenc < hoje) {
        return 'VENCIDO';
      }
    }
    
    return 'PENDENTE'; // Status padrão ao nascer
  }

 darBaixa(id: number): void {
    // 1. Configura o dialog para uma confirmação de pagamento
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar Pagamento',
        mensagem: 'Deseja realmente marcar este boleto como <b>PAGO</b>?<br>Esta ação atualizará o status financeiro do título.',
        tipo: 'aviso', // Aplica o estilo visual de atenção/processamento
        icone: 'payments',
        textoConfirmar: 'Confirmar Baixa'
      }
    });

    // 2. Processa o fechamento do modal
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.boletoService.darBaixa(id).subscribe({
          next: () => {
            this.notify.sucesso('Boleto marcado como pago!'); // Feedback visual de sucesso
            this.listarBoletosDoBanco(); // Atualiza a tabela
            this.dialog.closeAll(); // Garante que modais sobrepostos sejam fechados
          },
          error: (err) => {
            // Captura erros de validação do servidor
            this.notify.erro(err.error?.mensagem || 'Erro ao processar o pagamento.');
          }
        });
      }
    });
  }
}