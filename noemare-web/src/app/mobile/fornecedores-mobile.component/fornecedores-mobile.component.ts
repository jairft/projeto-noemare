import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // 👉 IMPORTAÇÃO DA PAGINAÇÃO

import { Fornecedor } from '../../models/fornecedor.model';
import { FornecedorService } from '../../services/fornecedor.service';
import { NotifyService } from '../../services/notify.service';
import { FornecedorFormDialogComponent } from '../../components/fornecedor/fornecedor-form-dialog/fornecedor-form-dialog.component';
import { HistoricoMobileComponent } from './historico-mobile.component/historico-mobile.component';


@Component({
  selector: 'app-fornecedores-mobile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatIconModule, 
    MatDialogModule,
    MatBottomSheetModule,
    MatPaginatorModule // 👉 NOVO: Adicionado aqui
  ],
  templateUrl: './fornecedores-mobile.component.html',
  styleUrls: ['./fornecedores-mobile.component.scss']
})
export class FornecedoresMobileComponent implements OnInit {
  private readonly service = inject(FornecedorService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);

  fornecedores: Fornecedor[] = [];
  fornecedoresFiltrados: Fornecedor[] = [];
  fornecedoresPaginados: Fornecedor[] = []; // 👉 NOVO: Array para a tela
  
  filtroBusca = new FormControl('');
  isLoading = false;

  // 👉 NOVO: Variáveis de paginação
  pageSize = 6;
  pageIndex = 0;
  totalItems = 0;

  ngOnInit(): void {
    this.carregarFornecedores();
    // A cada digitação, o filtro é aplicado e a paginação é re-fatiada automaticamente
    this.filtroBusca.valueChanges.subscribe(valor => this.aplicarFiltro(valor || ''));
  }

  get totalFornecedores(): number { return this.fornecedores.length; }
  get totalAtivos(): number { return this.fornecedores.filter(f => f.status === 'ATIVO').length; }
  get totalComSaldoCredor(): number { return this.fornecedores.filter(f => f.saldoCredor > 0).length; }

  carregarFornecedores(): void {
    this.isLoading = true;
    this.service.listarTodos().subscribe({
      next: (dados) => {
        this.fornecedores = dados;
        this.aplicarFiltro(this.filtroBusca.value || ''); // Aplica o filtro inicial e pagina
        this.isLoading = false;
      },
      error: () => {
        this.notify.erro('Erro ao carregar fornecedores');
        this.isLoading = false;
      }
    });
  }

  // 👉 ATUALIZADO: Filtra e reseta a paginação para a página 1
  aplicarFiltro(termo: string): void {
    const busca = termo.toLowerCase().trim();
    this.fornecedoresFiltrados = this.fornecedores.filter(f => 
      f.nome.toLowerCase().includes(busca)
    );
    
    this.totalItems = this.fornecedoresFiltrados.length;
    this.pageIndex = 0; // Volta pra primeira página ao buscar
    this.atualizarPaginacao();
  }

  // 👉 NOVO: Captura os cliques de avançar/voltar na paginação
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.atualizarPaginacao();
  }

  // 👉 NOVO: Corta o array principal para mostrar só os itens da página
  atualizarPaginacao(): void {
    const inicio = this.pageIndex * this.pageSize;
    const fim = inicio + this.pageSize;
    this.fornecedoresPaginados = this.fornecedoresFiltrados.slice(inicio, fim);
  }

  abrirModalNovo(): void {
    const dialogRef = this.dialog.open(FornecedorFormDialogComponent, { width: '90vw', maxWidth: '400px' });
    dialogRef.afterClosed().subscribe(res => res && this.cadastrar(res));
  }

  private cadastrar(dados: any) {
    this.service.salvar(dados).subscribe({
      next: () => { this.notify.sucesso('Cadastrado!'); this.carregarFornecedores(); },
      error: (err) => this.notify.erro(err.error?.mensagem || 'Erro ao cadastrar')
    });
  }

  abrirHistoricoGeral(fornecedor: Fornecedor): void {
    this.bottomSheet.open(HistoricoMobileComponent, {
      data: { id: fornecedor.id, nome: fornecedor.nome },
      panelClass: 'custom-bottom-sheet' 
    });
  }

  editarFornecedor(fornecedor: Fornecedor): void {
    const dialogRef = this.dialog.open(FornecedorFormDialogComponent, { 
      width: '90vw', 
      maxWidth: '400px',
      data: fornecedor 
    });
    
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.cadastrar(res); 
      }
    });
  }

  voltar(): void { this.router.navigate(['/home-mobile']); }
}