import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';

// Máscara
import { NgxCurrencyDirective } from 'ngx-currency';

// Serviços e Models
import { EmprestimoService } from '../../services/emprestimo.service';
import { EmprestimoRequest } from '../../models/emprestimo.model';
import { FornecedorService } from '../../services/fornecedor.service';
import { NotifyService } from '../../services/notify.service';
import { PagamentoEmprestimoDialogComponent } from '../../components/adicionar-emprestimo.component/pagamento-emprestimo-dialog/pagamento-emprestimo-dialog';


@Component({
  selector: 'app-adicionar-emprestimo-mobile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule,
    NgxCurrencyDirective, MatRippleModule,
    MatDatepickerModule, MatNativeDateModule,
    MatPaginatorModule, MatDialogModule
  ],
  templateUrl: './adicionar-emprestimo-mobile.component.html',
  styleUrls: ['./adicionar-emprestimo-mobile.component.scss']
})
export class AdicionarEmprestimoMobileComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fornecedorService = inject(FornecedorService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);

  emprestimoForm: FormGroup;
  fornecedores: any[] = []; 
  
  // Fonte de dados e Observable para os Cards no HTML
  dataSource = new MatTableDataSource<any>([]); 
  obs$!: Observable<any>;
  isLoading = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

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
    
    // Configuração do filtro para o campo de busca
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const nomeFornecedor = (data.fornecedorNome || data.fornecedor?.nome || '').toLowerCase();
      return nomeFornecedor.includes(filter);
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.obs$ = this.dataSource.connect(); // Conecta os dados paginados ao HTML
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
  }

  ngOnDestroy() {
    if (this.dataSource) {
      this.dataSource.disconnect();
    }
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
      next: (dados) => this.fornecedores = dados,
      error: () => this.notify.erro('Erro ao carregar a lista de fornecedores.') 
    });
  }

  carregarEmprestimos(): void {
    this.emprestimoService.listarTodos().subscribe({
      next: (dados: any[]) => {
        const dadosOrdenados = dados.sort((a, b) => {
          const temSaldoA = a.saldoRestante > 0 ? 0 : 1;
          const temSaldoB = b.saldoRestante > 0 ? 0 : 1;
          if (temSaldoA !== temSaldoB) return temSaldoA - temSaldoB;
          return new Date(b.dataEmprestimo).getTime() - new Date(a.dataEmprestimo).getTime();
        });

        this.dataSource.data = dadosOrdenados;
        if (this.paginator) {
          this.paginator.pageSize = 5; // Em mobile, listas menores são melhores
        }
      },
      error: () => this.notify.erro('Erro ao carregar o histórico de lançamentos.')
    });
  }

  salvarEmprestimo(): void {
    if (this.emprestimoForm.valid) {
      this.isLoading = true;
      const dadosForm = this.emprestimoForm.value;

      const payload: EmprestimoRequest = {
        ...dadosForm,
        dataEmprestimo: this.formatarParaISO(dadosForm.dataEmprestimo)
      };

      this.emprestimoForm.disable(); 

      this.emprestimoService.salvar(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.notify.sucesso('Operação registrada com sucesso!'); 
          this.emprestimoForm.reset({ dataEmprestimo: new Date(), valorTotal: 0 });
          this.carregarEmprestimos();
          this.emprestimoForm.enable(); 
        },
        error: (err) => {
          this.isLoading = false;
          this.emprestimoForm.enable(); 
          this.notify.erro(err.error?.mensagem || 'Erro ao registrar operação.'); 
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
      width: '95%', // Modal mais largo no mobile
      maxWidth: '400px',
      data: emprestimo,
      autoFocus: false,
      panelClass: 'custom-dialog-container' 
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) this.carregarEmprestimos();
    });
  }

  voltar(): void {
    this.router.navigate(['/home-mobile']); 
  }
}