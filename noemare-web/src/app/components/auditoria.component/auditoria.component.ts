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
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // 👉 Adicionado
import { MatButtonModule } from '@angular/material/button'; // 👉 Adicionado

// Service e Model
import { AuditoriaService } from '../../services/auditoria.service';
import { LogLancamento } from '../../models/log.model';
import { NotifyService } from '../../services/notify.service'; 
import { ConfiguracaoService } from '../../services/configuracao.service'; // 👉 Importe o serviço
import { ConfigLogsDialogComponent } from './modal-config-logs/config-logs-dialog.component';


@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatPaginatorModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule,
    MatDialogModule, MatButtonModule // 👉 Adicionados nos imports
  ],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss'
})
export class AuditoriaComponent implements OnInit, AfterViewInit {

  private readonly auditoriaService = inject(AuditoriaService);
  private readonly notify = inject(NotifyService); 
  private readonly dialog = inject(MatDialog); // 👉 Injetado
  private readonly configService = inject(ConfiguracaoService); // 👉 Injetado

  // Fonte de dados e colunas
  logs = new MatTableDataSource<LogLancamento>([]);
  // No seu auditoria.component.ts, altere para:
 colunasExibidas: string[] = ['id', 'dataHora', 'usuario', 'acao', 'entidade', 'detalhes']; // 👉 'id' adicionado no início

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
        this.logs.data = dados.sort((a, b) => {
          return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
        });
        
        if (this.paginator) {
          this.logs.paginator = this.paginator;
        }
        
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

  // 👉 NOVO: Método que abre a tela de configurações
  abrirConfiguracoes(): void {
    // 1. Busca os dados atuais no back-end
    this.configService.obterConfiguracao().subscribe({
      next: (configAtual) => {
        // 2. Abre o modal passando a configuração atual
        const dialogRef = this.dialog.open(ConfigLogsDialogComponent, {
          width: '450px',
          data: configAtual
        });

        // 3. Fica ouvindo o fechamento do modal
        dialogRef.afterClosed().subscribe(resultado => {
          if (resultado) {
            // Se o usuário clicou em salvar, envia para a API
            this.configService.atualizarConfiguracao(resultado).subscribe({
              next: () => this.notify.sucesso('Regras de limpeza automática atualizadas com sucesso!'),
              error: () => this.notify.erro('Erro ao tentar atualizar as configurações.')
            });
          }
        });
      },
      error: () => this.notify.erro('Não foi possível carregar as configurações atuais.')
    });
  }
  
  aplicarFiltro(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.logs.filter = valor.trim().toLowerCase();

    if (this.logs.paginator) {
      this.logs.paginator.firstPage();
    }
  }

  getCorTagAcao(acao: string): string {
    if (!acao) return 'tag-default';
    const acaoUpper = acao.toUpperCase();
    if (acaoUpper.includes('PAGAMENTO') || acaoUpper.includes('ABATIMENTO')) return 'tag-finance'; 
    if (acaoUpper.includes('CRIAR') || acaoUpper.includes('CADASTRAR') || acaoUpper.includes('ATIVAR') || acaoUpper.includes('GERAR')) return 'tag-success'; 
    if (acaoUpper.includes('ATUALIZAR') || acaoUpper.includes('EDITAR') || acaoUpper.includes('REDEFINIR') || acaoUpper.includes('ALTERAR')) return 'tag-warning'; 
    if (acaoUpper.includes('EXCLUIR') || acaoUpper.includes('REMOVER') || acaoUpper.includes('INATIVAR') || acaoUpper.includes('DELETAR')) return 'tag-danger';  
    return 'tag-default'; 
  }
}