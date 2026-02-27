import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar'; 
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

// Models & Services
import { Fornecedor } from '../../models/fornecedor.model';
import { FornecedorService } from '../../services/fornecedor.service';
import { NotaFornecedorService } from '../../services/nota-fornecedor.service';
import { ClassificacaoProdutoService } from '../../services/classificacao-produto.service';
import { ClassificacaoProduto } from '../../models/classificacao-produto.model';
import { NotaItem, SalvarNotaRequest } from '../../models/nota.model';
import { NgxCurrencyDirective } from 'ngx-currency';
import { NotifyService } from '../../services/notify.service'; 

@Component({
  selector: 'app-notas-fornecedor',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, 
    MatButtonModule, MatIconModule, MatTableModule, 
    MatCardModule, MatSnackBarModule, MatTooltipModule, NgxCurrencyDirective,
    MatPaginatorModule
  ],
  templateUrl: './notas-fornecedor.component.html',
  styleUrl: './notas-fornecedor.component.scss'
})
export class NotasFornecedorComponent implements OnInit, AfterViewInit {

  private readonly fb = inject(FormBuilder);
  private readonly fornecedorService = inject(FornecedorService);
  private readonly classificacaoService = inject(ClassificacaoProdutoService);
  private readonly notaService = inject(NotaFornecedorService);
  private readonly notify = inject(NotifyService); 

  fornecedores: Fornecedor[] = [];
  cardapio: ClassificacaoProduto[] = [];
  itensDaNota: NotaItem[] = [];
  colunasItens: string[] = ['produto', 'tipo', 'tamanho', 'quantidadeKg', 'valorUnitario', 'valorTotal', 'acoes'];

  // 👉 NOVO: Controle de Edição
  notaIdEmEdicao: number | null = null;

  notaForm: FormGroup = this.fb.group({
    fornecedorId: [null, Validators.required],
    numeroNota: [''],
    dataNota: [new Date().toISOString().substring(0, 10), Validators.required], 
    descricao: ['']
  });

  notasRecentes = new MatTableDataSource<any>([]);
  colunasNotasRecentes: string[] = ['dataHora', 'fornecedor', 'status', 'valor', 'acoes'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  itemForm: FormGroup = this.fb.group({
    produtoId: [null, Validators.required],
    quantidadeKg: [null, [Validators.required, Validators.min(0.001)]],
    valorUnitario: [null, [Validators.required, Validators.min(0.01)]]
  });

  ngOnInit(): void {
    this.carregarFornecedores();
    this.carregarCardapio();
    this.carregarNotasRecentes();
    this.monitorarSelecaoProduto();
  }

  ngAfterViewInit(): void {
    this.notasRecentes.paginator = this.paginator;
  }

  carregarFornecedores(): void {
    this.fornecedorService.listarTodos().subscribe({
      next: (dados) => this.fornecedores = dados.filter(f => f.status === 'ATIVO'),
      error: () => this.notify.erro('Erro ao carregar os fornecedores.') 
    });
  }

  carregarCardapio(): void {
    this.classificacaoService.listarTodos().subscribe({
      next: (dados) => this.cardapio = dados,
      error: () => this.notify.erro('Erro ao carregar o cardápio de produtos.') 
    });
  }

  private monitorarSelecaoProduto(): void {
    this.itemForm.get('produtoId')?.valueChanges.subscribe(id => {
      if (id) {
        const produto = this.cardapio.find(p => p.id === id);
        if (produto) {
          this.itemForm.patchValue({ valorUnitario: produto.precoUnitario });
        }
      }
    });
  }

  adicionarItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const formValues = this.itemForm.value;
    const produtoSelecionado = this.cardapio.find(p => p.id === formValues.produtoId);

    if (!produtoSelecionado) return;

    const qtd = parseFloat(formValues.quantidadeKg);
    const vlrUnit = parseFloat(formValues.valorUnitario);
    const vlrTotal = qtd * vlrUnit;

    const novoItem: NotaItem = {
      produtoId: produtoSelecionado.id,
      nomeProduto: produtoSelecionado.nome,
      tipo: produtoSelecionado.tipo,
      tamanho: produtoSelecionado.tamanho,
      quantidadeKg: qtd,
      valorUnitario: vlrUnit,
      valorTotal: vlrTotal
    };

    this.itensDaNota = [...this.itensDaNota, novoItem];
    this.itemForm.reset();
  }

  removerItem(index: number): void {
    this.itensDaNota.splice(index, 1);
    this.itensDaNota = [...this.itensDaNota];
  }

  get valorTotalNota(): number {
    return this.itensDaNota.reduce((total, item) => total + item.valorTotal, 0);
  }

  // 👉 ATUALIZADO: Decide se vai criar (POST) ou editar (PUT)
  salvarNota(): void {
    if (this.notaForm.invalid || this.itensDaNota.length === 0) {
      this.notify.erro('Verifique os dados e adicione pelo menos um item.'); 
      return;
    }

    const payload: SalvarNotaRequest = {
      fornecedorId: this.notaForm.value.fornecedorId,
      numeroNota: this.notaForm.value.numeroNota || undefined,
      dataNota: this.notaForm.value.dataNota,
      descricao: this.notaForm.value.descricao,
      itens: this.itensDaNota.map(item => ({
        produtoId: item.produtoId,
        quantidadeKg: item.quantidadeKg,
        valorUnitario: item.valorUnitario
      }))
    };

    if (this.notaIdEmEdicao) {
      // MODO EDIÇÃO
      this.notaService.editar(this.notaIdEmEdicao, payload).subscribe({
        next: () => {
          this.notify.sucesso('Nota atualizada com sucesso!'); 
          this.limparTela();
          this.carregarNotasRecentes();
        },
        error: (err) => {
          this.notify.erro(err.error?.mensagem || 'Erro ao editar a nota.'); 
        }
      });
    } else {
      // MODO CRIAÇÃO
      this.notaService.salvar(payload).subscribe({
        next: () => {
          this.notify.sucesso('Nota salva com sucesso!'); 
          this.limparTela();
          this.carregarNotasRecentes();
        },
        error: (err) => {
          this.notify.erro(err.error?.mensagem || 'Erro ao salvar a nota.'); 
        }
      });
    }
  }

  // 👉 ATUALIZADO: Joga os dados da nota selecionada de volta para o form
  editarNota(nota: any): void {
    if (nota.status !== 'ABERTA') {
      this.notify.erro('Apenas notas com status ABERTA podem ser editadas.');
      return;
    }

    this.notaIdEmEdicao = nota.id;

    // Formata a data com segurança para YYYY-MM-DD
    const dataFormatada = nota.dataNota ? nota.dataNota.substring(0, 10) : new Date().toISOString().substring(0, 10);

    // Preenche os Dados da Nota
    this.notaForm.patchValue({
      fornecedorId: nota.fornecedorId || (nota.fornecedor ? nota.fornecedor.id : null), // Fallback se o ID vier aninhado
      numeroNota: nota.numeroNota || '',
      dataNota: dataFormatada,
      descricao: nota.descricao || ''
    });

    // Preenche os Itens
    if (nota.itens && nota.itens.length > 0) {
      this.itensDaNota = nota.itens.map((item: any) => {
        // Usa o cardápio para recuperar o ID correto do produto caso o DTO não traga o produtoId
        const produtoNoCardapio = this.cardapio.find(p => p.nome === (item.produtoNome || item.nomeProduto));
        
        return {
          produtoId: item.produtoId || (produtoNoCardapio ? produtoNoCardapio.id : 0),
          nomeProduto: item.produtoNome || item.nomeProduto, 
          tipo: item.tipo || '',
          tamanho: item.tamanho || '',
          quantidadeKg: item.quantidadeKg,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal || (item.quantidadeKg * item.valorUnitario)
        };
      });
    } else {
      this.itensDaNota = [];
    }

    // Rola a tela para cima de forma elegante
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify.info('Modo de edição ativado. Altere os dados e clique em Salvar.');
  }

 // 👉 ATUALIZADO: Ordenação blindada (Status > Data > ID)
  carregarNotasRecentes(): void {
    this.notaService.listarTodas().subscribe({
      next: (notas) => {
        
        // Define a ordem de prioridade (menor número aparece primeiro)
        const ordemStatus: { [key: string]: number } = {
          'ABERTA': 1,
          'PARCIAL': 2,
          'PAGA': 3
        };

        this.notasRecentes.data = notas.sort((a, b) => {
          const statusA = a.status || 'ABERTA';
          const statusB = b.status || 'ABERTA';

          // 1º Critério: Ordem de Status (Aberta -> Parcial -> Paga)
          if (ordemStatus[statusA] !== ordemStatus[statusB]) {
            return ordemStatus[statusA] - ordemStatus[statusB];
          }

          // Função segura para converter a data do Java (YYYY-MM-DD HH:mm:ss) para o Javascript
          const getTempoSeguro = (dataString: string) => {
            if (!dataString) return 0;
            // Troca o espaço por 'T' para navegadores como Safari/Firefox não quebrarem a data
            const dataSegura = dataString.replace(' ', 'T');
            return new Date(dataSegura).getTime();
          };

          const dataA = getTempoSeguro(a.dataHora || a.dataNota);
          const dataB = getTempoSeguro(b.dataHora || b.dataNota);

          // 2º Critério: Data mais recente primeiro (decrescente)
          if (dataB !== dataA) {
            return dataB - dataA; 
          }
          
          // 3º Critério (Desempate): Se for o exato mesmo dia, mostra a última que foi lançada no sistema
          return b.id - a.id;
        });
      },
      error: (err) => {
        console.error(err);
        this.notify.erro('Erro ao carregar o histórico de notas recentes.');
      }
    });
  }

  // 👉 ATUALIZADO: Reseta o controle de edição ao limpar
  limparTela(): void {
    this.notaIdEmEdicao = null;
    this.notaForm.reset({
      dataNota: new Date().toISOString().substring(0, 10) 
    });
    this.itemForm.reset();
    this.itensDaNota = [];
  }
} 