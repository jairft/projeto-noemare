import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importações de Serviços e Models
import { NotaFornecedorService } from '../../services/nota-fornecedor.service';
import { HistoricoNotaResponse, HistoricoNotaItemResponse } from '../../models/nota.model';
import { NotifyService } from '../../services/notify.service';
import { AnoContextoService } from '../../services/ano-contexto.service'; // 👉 Importado para sincronia

// Reutilizamos o componente do recibo que já existe no seu desktop
import { ReciboNotaComponent } from '../../components/historico-notas.component/recibo-nota.component/recibo-nota.component';

@Component({
  selector: 'app-historico-notas-mobile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatIconModule, 
    MatDialogModule
  ],
  templateUrl: './historico-notas-mobile.component.html',
  styleUrls: ['./historico-notas-mobile.component.scss']
})
export class HistoricoNotasMobileComponent implements OnInit {

  private readonly notaService = inject(NotaFornecedorService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly anoContexto = inject(AnoContextoService); // 👉 Injetado

  isLoading = false;
  mostrarFiltros = false;
  anoAtual: number = new Date().getFullYear(); // 👉 Controla o exercício atual

  // Listas de Dados
  notas: HistoricoNotaResponse[] = [];
  notasFiltradas: HistoricoNotaResponse[] = [];

  // Formulário baseado no desktop
  filtroForm: FormGroup = this.fb.group({
    dataInicio: [''],
    dataFim: [''],
    termoBusca: [''] 
  });

  ngOnInit(): void {
    // 👉 Ouve a mudança global de ano. Resolve o erro TS2345 convertendo para Number
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoAtual = Number(ano) || new Date().getFullYear(); 
      this.buscarHistorico();
    });

    // Filtro rápido por texto na lista carregada
    this.filtroForm.get('termoBusca')?.valueChanges.subscribe(termo => {
      this.aplicarFiltroTexto(termo);
    });
  }

  voltarHome(): void {
    this.router.navigate(['/home-mobile']);
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  buscarHistorico(): void {
    this.isLoading = true;
    const { dataInicio, dataFim } = this.filtroForm.value;
    
    // Converte as datas para o formato ISO esperado pelo Java
    const inicioStr = dataInicio ? this.formatarDataIso(new Date(dataInicio)) : undefined;
    const fimStr = dataFim ? this.formatarDataIso(new Date(dataFim)) : undefined;

    // 👉 Passa o anoAtual (number) como primeiro parâmetro
    this.notaService.buscarHistoricoFiltrado(this.anoAtual, inicioStr, fimStr).subscribe({
      next: (dados) => {
        this.isLoading = false;
        this.notas = dados;
        this.aplicarFiltroTexto(this.filtroForm.value.termoBusca); 
        
        if (dados.length === 0) {
          this.notify.info(`Nenhuma nota encontrada em ${this.anoAtual} para este filtro.`);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.notify.erro('Não foi possível carregar o histórico mobile.');
      }
    });
  }

  limparFiltro(): void {
    this.filtroForm.reset();
    this.buscarHistorico();
    this.mostrarFiltros = false;
    this.notify.info('Filtros removidos.');
  }

  aplicarFiltroTexto(termo: string): void {
    if (!termo) {
      this.notasFiltradas = [...this.notas];
      return;
    }
    const busca = termo.toLowerCase().trim();
    this.notasFiltradas = this.notas.filter(n => {
      // Suporta diferentes estruturas de nome de fornecedor no DTO
      const nomeFornecedor = (n as any).fornecedorNome || (n as any).fornecedor || '';
      return nomeFornecedor.toLowerCase().includes(busca);
    });
  }

  abrirModalRecibo(nota: HistoricoNotaResponse): void {
    this.dialog.open(ReciboNotaComponent, {
      width: '100vw', 
      maxWidth: '100vw',
      panelClass: 'mobile-dialog-container', // Estilização CSS específica para mobile
      data: nota
    });
  }

  resumirItens(itens: HistoricoNotaItemResponse[]): string {
    if (!itens || itens.length === 0) return 'Sem itens';
    const resumo = itens.map(i => `${i.produtoNome} ${i.tipo || ''} (${i.quantidadeKg}kg)`).join(', ');
    return resumo.length > 50 ? resumo.substring(0, 50) + '...' : resumo;
  }

  private formatarDataIso(data: Date): string {
    // Usa métodos UTC para evitar que o fuso horário mude a data selecionada no input
    const ano = data.getUTCFullYear();
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(data.getUTCDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}