import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Máscara e Efeitos
import { NgxCurrencyDirective } from 'ngx-currency';
import { MatRippleModule } from '@angular/material/core';

// Serviços e Models
import { EmprestimoService } from '../../services/emprestimo.service';
import { EmprestimoRequest } from '../../models/emprestimo.model';
import { FornecedorService } from '../../services/fornecedor.service';
import { NotifyService } from '../../services/notify.service';

import { PagamentoEmprestimoDialogComponent } from './pagamento-emprestimo-dialog/pagamento-emprestimo-dialog';

@Component({
  selector: 'app-adicionar-emprestimo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, NgxCurrencyDirective, MatRippleModule,
    MatDatepickerModule, MatNativeDateModule, MatTableModule,
    MatPaginatorModule, MatDialogModule
  ],
  templateUrl: './adicionar-emprestimo.component.html',
  styleUrl: './adicionar-emprestimo.component.scss'
})
export class AdicionarEmprestimoComponent implements OnInit, AfterViewInit {
  
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fornecedorService = inject(FornecedorService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);

  isLoading: boolean = true; 

  emprestimoForm: FormGroup;
  fornecedores: any[] = []; 
  dataSource = new MatTableDataSource<any>([]); 
  
  displayedColumns: string[] = ['data', 'fornecedor', 'tipo', 'valorTotal', 'valorPago', 'saldoRestante', 'acoes'];
  
  // 👉 SOLUÇÃO: Paginador interceptado pelo Setter
  private _paginator!: MatPaginator;
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    if (mp) {
      this._paginator = mp;
      this.dataSource.paginator = this._paginator;
    }
  }

  tiposEmprestimo = ['INVESTIMENTO', 'ADIANTAMENTO'];

  constructor() {
    this.emprestimoForm = this.fb.group({
      fornecedorId: [null, Validators.required],
      dataEmprestimo: [new Date(), Validators.required],
      tipo: [null, Validators.required],
      valorTotal: [0, [Validators.required, Validators.min(0.01)]],
      descricao: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.carregarFornecedores();
    this.carregarEmprestimos();
    
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const nomeFornecedor = (data.fornecedorNome || data.fornecedor?.nome || '').toLowerCase();
      return nomeFornecedor.includes(filter);
    };
  }

  // Como estamos usando o Setter, o ngAfterViewInit não precisa mais atribuir o paginador
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
  }

  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  carregarFornecedores(): void {
    this.fornecedorService.listarTodos().subscribe({
      next: (dados) => {
        this.fornecedores = dados;
      },
      error: (err) => {
        console.error(err);
        this.notify.erro('Erro ao carregar a lista de fornecedores.'); 
      }
    });
  }

  carregarEmprestimos(): void {
    this.isLoading = true; 

    this.emprestimoService.listarTodos().subscribe({
      next: (dados: any[]) => {
        const dadosOrdenados = dados.sort((a, b) => {
          const temSaldoA = a.saldoRestante > 0 ? 0 : 1;
          const temSaldoB = b.saldoRestante > 0 ? 0 : 1;

          if (temSaldoA !== temSaldoB) {
            return temSaldoA - temSaldoB;
          }

          return new Date(b.dataEmprestimo).getTime() - new Date(a.dataEmprestimo).getTime();
        });

        this.dataSource.data = dadosOrdenados;

        // O pageSize agora fica direto no HTML, mas podemos garantir aqui também
        if (this._paginator) {
          this._paginator.pageSize = 4;
        }

        this.isLoading = false; 
      },
      error: (err) => {
        console.error(err);
        this.notify.erro('Erro ao carregar o histórico de lançamentos.');
        this.isLoading = false; 
      }
    });
  }

  salvarEmprestimo(): void {
    if (this.emprestimoForm.valid) {
      const dadosForm = this.emprestimoForm.value;

      const payload: EmprestimoRequest = {
        ...dadosForm,
        dataEmprestimo: this.formatarParaISO(dadosForm.dataEmprestimo)
      };

      this.emprestimoForm.disable(); 

      this.emprestimoService.salvar(payload).subscribe({
        next: () => {
          this.notify.sucesso('Operação registrada com sucesso!'); 
          this.emprestimoForm.reset({
            dataEmprestimo: new Date(),
            valorTotal: 0 
          });
          this.carregarEmprestimos(); 
          this.emprestimoForm.enable(); 
        },
        error: (err) => {
          this.emprestimoForm.enable(); 
          const msg = err.error?.mensagem || 'Erro ao registrar operação.';
          this.notify.erro(msg); 
        }
      });
    } else {
      this.emprestimoForm.markAllAsTouched();
      this.notify.info('Por favor, preencha todos os campos obrigatórios.'); 
    }
  }

  private formatarParaISO(data: Date): string {
    if (!data) return new Date().toISOString();
    const offset = data.getTimezoneOffset();
    const dataAjustada = new Date(data.getTime() - (offset * 60 * 1000));
    return dataAjustada.toISOString();
  }

  abrirModalBaixa(emprestimo: any): void {
    const dialogRef = this.dialog.open(PagamentoEmprestimoDialogComponent, {
      width: '450px',
      data: emprestimo,
      autoFocus: false,
      panelClass: 'custom-dialog-container' 
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.carregarEmprestimos();
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard']); 
  }
}