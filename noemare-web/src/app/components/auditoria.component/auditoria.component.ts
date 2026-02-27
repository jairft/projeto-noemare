import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

// Service e Model
import { AuditoriaService } from '../../services/auditoria.service';
import { LogLancamento } from '../../models/log.model';
import { NotifyService } from '../../services/notify.service'; 

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatPaginatorModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule
  ],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss'
})
export class AuditoriaComponent implements OnInit, AfterViewInit {

  private readonly auditoriaService = inject(AuditoriaService);
  private readonly notify = inject(NotifyService); 

  // Fonte de dados e colunas
  logs = new MatTableDataSource<LogLancamento>([]);
  colunasExibidas: string[] = ['dataHora', 'usuario', 'acao', 'entidade', 'detalhes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.carregarLogs();
  }

  ngAfterViewInit(): void {
    this.logs.paginator = this.paginator;
  }

 carregarLogs(): void {
    this.auditoriaService.listarTodos().subscribe({
      next: (dados) => {
    
        // 1. Recebe e ordena os dados
        this.logs.data = dados.sort((a, b) => {
          return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
        });
        
        // 👉 O SEGREDO: Reconecta o paginador no DataSource APÓS a chegada dos dados
        if (this.paginator) {
          this.logs.paginator = this.paginator;
        }
        
        // Feedback informativo caso não existam logs
        if (dados.length === 0) {
          this.notify.info('Nenhum registro de atividade encontrado.');
        }
      },
      error: (err) => {
        console.error(err);
        this.notify.erro('Não foi possível buscar os registros de auditoria.');
      }
    });
  }
  
  aplicarFiltro(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.logs.filter = valor.trim().toLowerCase();

    if (this.logs.paginator) {
      this.logs.paginator.firstPage();
    }
  }

  // 👉 NOVO MÉTODO: Define a cor da tag baseado na palavra-chave da ação
  getCorTagAcao(acao: string): string {
    if (!acao) return 'tag-default';
    
    const acaoUpper = acao.toUpperCase();
  
    // 1. Financeiro / Movimentação de Dinheiro (Roxo)
    if (acaoUpper.includes('PAGAMENTO') || acaoUpper.includes('ABATIMENTO')) {
      return 'tag-finance'; 
    }
  
    // 2. Criação e Geração (Verde)
    if (acaoUpper.includes('CRIAR') || acaoUpper.includes('CADASTRAR') || acaoUpper.includes('ATIVAR') || acaoUpper.includes('GERAR')) {
      return 'tag-success'; 
    }
  
    // 3. Edição e Alteração (Laranja/Amarelo)
    if (acaoUpper.includes('ATUALIZAR') || acaoUpper.includes('EDITAR') || acaoUpper.includes('REDEFINIR') || acaoUpper.includes('ALTERAR')) {
      return 'tag-warning'; 
    }
  
    // 4. Exclusão e Remoção (Vermelho)
    if (acaoUpper.includes('EXCLUIR') || acaoUpper.includes('REMOVER') || acaoUpper.includes('INATIVAR') || acaoUpper.includes('DELETAR')) {
      return 'tag-danger';  
    }
    
    // 5. Padrão (Azul/Cinza)
    return 'tag-default'; 
  }
}