import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { FornecedorService } from '../../services/fornecedor.service';
import { ClassificacaoProdutoService } from '../../services/classificacao-produto.service';
import { NotaFornecedorService } from '../../services/nota-fornecedor.service';
import { NotifyService } from '../../services/notify.service';

import { Fornecedor } from '../../models/fornecedor.model';
import { ClassificacaoProduto } from '../../models/classificacao-produto.model';
import { NotaItem, SalvarNotaRequest } from '../../models/nota.model';

@Component({
  selector: 'app-lancar-nota-mobile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './lancar-nota-mobile.component.html',
  styleUrls: ['./lancar-nota-mobile.component.scss']
})
export class LancarNotaMobileComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly fornecedorService = inject(FornecedorService);
  private readonly classificacaoService = inject(ClassificacaoProdutoService);
  private readonly notaService = inject(NotaFornecedorService);
  private readonly notify = inject(NotifyService);

  // Dados
  fornecedores: Fornecedor[] = [];
  cardapio: ClassificacaoProduto[] = [];
  itensDaNota: NotaItem[] = [];
  notasRecentes: any[] = []; // 👉 NOVO: Para exibir histórico mobile

  todasNotasRecentes: any[] = [];
  paginaAtual: number = 0;
  tamanhoPagina: number = 5;
  totalPaginas: number = 0;

  // Controle de Tela
  isLoading = false;
  etapaAtual: 'DADOS' | 'ITENS' | 'RESUMO' = 'DADOS';
  notaIdEmEdicao: number | null = null; // 👉 NOVO: Controle de edição

  notaForm: FormGroup = this.fb.group({
    fornecedorId: [null, Validators.required],
    numeroNota: [''],
    dataNota: [new Date().toISOString().substring(0, 10), Validators.required],
    descricao: ['']
  });

  itemForm: FormGroup = this.fb.group({
    produtoId: [null, Validators.required],
    quantidadeKg: [null, [Validators.required, Validators.min(0.001)]],
    valorUnitario: [null, [Validators.required, Validators.min(0.01)]]
  });

  ngOnInit(): void {
    this.carregarFornecedores();
    this.carregarCardapio();
    this.carregarNotasRecentes(); // 👉 Busca notas para a lista
    this.monitorarSelecaoProduto();
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
      error: () => this.notify.erro('Erro ao carregar o cardápio.')
    });
  }

  carregarNotasRecentes(): void {
    this.notaService.listarTodas().subscribe({
      next: (notas) => {
        const ordemStatus: { [key: string]: number } = {
          'ABERTA': 1,
          'PARCIAL': 2,
          'PAGA': 3
        };

        // Salva a lista completa ordenada
        this.todasNotasRecentes = notas.sort((a: any, b: any) => {
          const statusA = a.status || 'ABERTA';
          const statusB = b.status || 'ABERTA';

          if (ordemStatus[statusA] !== ordemStatus[statusB]) {
            return ordemStatus[statusA] - ordemStatus[statusB];
          }

          const dataA = new Date(a.dataHora || a.dataNota).getTime();
          const dataB = new Date(b.dataHora || b.dataNota).getTime();
          return dataB - dataA;
        });

        // Calcula total de páginas e exibe a primeira
        this.totalPaginas = Math.ceil(this.todasNotasRecentes.length / this.tamanhoPagina);
        this.atualizarPagina();
      },
      error: () => console.error('Erro ao carregar notas recentes.')
    });
  }

  // 👉 NOVO: Métodos de Controle da Paginação
  atualizarPagina(): void {
    const inicio = this.paginaAtual * this.tamanhoPagina;
    const fim = inicio + this.tamanhoPagina;
    this.notasRecentes = this.todasNotasRecentes.slice(inicio, fim);
  }

  proximaPagina(): void {
    if (this.paginaAtual < this.totalPaginas - 1) {
      this.paginaAtual++;
      this.atualizarPagina();
    }
  }

  paginaAnterior(): void {
    if (this.paginaAtual > 0) {
      this.paginaAtual--;
      this.atualizarPagina();
    }
  }

  private monitorarSelecaoProduto(): void {
    this.itemForm.get('produtoId')?.valueChanges.subscribe(id => {
      if (id) {
        const produtoIdNum = Number(id);
        const produto = this.cardapio.find(p => p.id === produtoIdNum);
        if (produto) {
          this.itemForm.patchValue({ valorUnitario: produto.precoUnitario });
        }
      }
    });
  }

  // --- NAVEGAÇÃO ENTRE ETAPAS ---
  voltarHome(): void {
    this.router.navigate(['/home-mobile']);
  }

  avancarParaItens(): void {
    if (this.notaForm.valid) {
      this.etapaAtual = 'ITENS';
    } else {
      this.notaForm.markAllAsTouched();
    }
  }

  voltarParaDados(): void {
    this.etapaAtual = 'DADOS';
  }

  avancarParaResumo(): void {
    if (this.itensDaNota.length > 0) {
      this.etapaAtual = 'RESUMO';
    } else {
      this.notify.erro('Adicione pelo menos um produto na nota.');
    }
  }

  voltarParaItens(): void {
    this.etapaAtual = 'ITENS';
  }

  // 👉 NOVO: Lógica de jogar a nota pro form mobile
  editarNota(nota: any): void {
    if (nota.status !== 'ABERTA') {
      this.notify.erro('Apenas notas ABERTA podem ser editadas.');
      return;
    }

    this.notaIdEmEdicao = nota.id;
    const dataFormatada = nota.dataNota ? nota.dataNota.substring(0, 10) : new Date().toISOString().substring(0, 10);

    this.notaForm.patchValue({
      fornecedorId: nota.fornecedorId || (nota.fornecedor ? nota.fornecedor.id : null),
      numeroNota: nota.numeroNota || '',
      dataNota: dataFormatada,
      descricao: nota.descricao || ''
    });

    if (nota.itens && nota.itens.length > 0) {
      this.itensDaNota = nota.itens.map((item: any) => {
        const pCardapio = this.cardapio.find(p => p.nome === (item.produtoNome || item.nomeProduto));
        return {
          produtoId: item.produtoId || (pCardapio ? pCardapio.id : 0),
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify.info('Editando nota. Continue para ajustar os produtos.');
  }

  cancelarEdicao(): void {
    this.notaIdEmEdicao = null;
    this.notaForm.reset({ dataNota: new Date().toISOString().substring(0, 10) });
    this.itensDaNota = [];
    this.itemForm.reset();
  }

  // --- LÓGICA DE ITENS ---
  adicionarItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const formValues = this.itemForm.value;
    const produtoSelecionado = this.cardapio.find(p => p.id === Number(formValues.produtoId));

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

    this.itensDaNota = [novoItem, ...this.itensDaNota];
    this.itemForm.reset();
    this.notify.sucesso(`${novoItem.nomeProduto} adicionado!`);
  }

  removerItem(index: number): void {
    this.itensDaNota.splice(index, 1);
  }

  get valorTotalNota(): number {
    return this.itensDaNota.reduce((total, item) => total + item.valorTotal, 0);
  }

  get nomeFornecedorSelecionado(): string {
    const id = this.notaForm.value.fornecedorId;
    const f = this.fornecedores.find(f => f.id === Number(id));
    return f ? f.nome : 'Desconhecido';
  }

  

  // --- SALVAR ---
  salvarNotaMobile(): void {
    if (this.notaForm.invalid || this.itensDaNota.length === 0) {
      this.notify.erro('Verifique os dados antes de salvar.');
      return;
    }

    this.isLoading = true;

    const payload: SalvarNotaRequest = {
      fornecedorId: Number(this.notaForm.value.fornecedorId),
      numeroNota: this.notaForm.value.numeroNota || undefined, 
      dataNota: this.notaForm.value.dataNota, 
      descricao: this.notaForm.value.descricao,
      itens: this.itensDaNota.map(item => ({
        produtoId: item.produtoId,
        quantidadeKg: item.quantidadeKg,
        valorUnitario: item.valorUnitario
      }))
    };

    // 👉 ATUALIZADO: Decide se Cria ou Edita
    if (this.notaIdEmEdicao) {
      this.notaService.editar(this.notaIdEmEdicao, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.notify.sucesso('Nota atualizada com sucesso!');
          this.router.navigate(['/home-mobile']);
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.erro(err.error?.mensagem || 'Erro ao editar a nota.');
        }
      });
    } else {
      this.notaService.salvar(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.notify.sucesso('Nota salva com sucesso!');
          this.router.navigate(['/home-mobile']);
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.erro(err.error?.mensagem || 'Erro ao salvar a nota.');
        }
      });
    }
  }
}