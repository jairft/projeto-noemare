package com.noemare.api.services;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.noemare.api.domain.NotaFornecedor;
import com.noemare.api.domain.NotaItem;
import com.noemare.api.domain.enums.TipoEmprestimo; // 👉 NOVO: Importe o seu Enum aqui
import com.noemare.api.dtos.response.FornecedorRelatorioResponse;
import com.noemare.api.dtos.response.ItemRelatorioResponse;
import com.noemare.api.dtos.response.RelatorioAnualResponse;
import com.noemare.api.repositories.FornecedorRepository;
import com.noemare.api.repositories.NotaFornecedorRepository;
import com.noemare.api.repositories.PagamentoNotaRepository;
import com.noemare.api.repositories.EmprestimoRepository;

@Service
public class RelatorioService {
    private final FornecedorRepository fornecedorRepository;
    private final NotaFornecedorRepository notaRepository;
    private final PagamentoNotaRepository pagamentoRepository;
    private final EmprestimoRepository emprestimoRepository;

    public RelatorioService(FornecedorRepository fornecedorRepository, 
                            NotaFornecedorRepository notaRepository,
                            PagamentoNotaRepository pagamentoRepository,
                            EmprestimoRepository emprestimoRepository) {
        this.fornecedorRepository = fornecedorRepository;
        this.notaRepository = notaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.emprestimoRepository = emprestimoRepository;
    }

    public RelatorioAnualResponse gerarResumoAnual(Integer ano) {
        // 1. Define o ano de filtro (ano atual se for nulo)
        final Integer anoFiltro = (ano == null) ? java.time.Year.now().getValue() : ano;

        // 2. Performance por Fornecedor (Com Separação de Adiantamento e Investimento)
        List<FornecedorRelatorioResponse> listaFornecedores = fornecedorRepository.findAll().stream().map(f -> {
            
            // A. Busca valores de compras e pagamentos de notas
            BigDecimal comprado = notaRepository.somarTotalCompradoPorFornecedorEAno(f.getId(), anoFiltro);
            BigDecimal pago = pagamentoRepository.somarTotalPagoPorFornecedorEAno(f.getId(), anoFiltro);
            
            // B. 👉 NOVO: Busca os saldos devedores SEPARADOS diretamente da tabela de empréstimos
            BigDecimal saldoAdiantamento = emprestimoRepository.somarSaldoRestantePorFornecedorETipo(f.getId(), TipoEmprestimo.ADIANTAMENTO);
            BigDecimal saldoInvestimento = emprestimoRepository.somarSaldoRestantePorFornecedorETipo(f.getId(), TipoEmprestimo.INVESTIMENTO);

            // Tratamento contra nulos
            BigDecimal vComprado = comprado != null ? comprado : BigDecimal.ZERO;
            BigDecimal vPago = pago != null ? pago : BigDecimal.ZERO;
            BigDecimal vAdiantamento = saldoAdiantamento != null ? saldoAdiantamento : BigDecimal.ZERO;
            BigDecimal vInvestimento = saldoInvestimento != null ? saldoInvestimento : BigDecimal.ZERO;

            return new FornecedorRelatorioResponse(
                f.getNome(),
                vComprado,
                vPago,
                vComprado.subtract(vPago), // Pendência (Notas): O que você deve pagar
                vAdiantamento,             // 👉 Saldo Devedor (Adiant.): O que ele deve te pagar
                vInvestimento              // 👉 NOVA COLUNA: Saldo Devedor (Invest.): O que ele deve te pagar de investimento
            );
        }).filter(f -> f.totalComprado().compareTo(BigDecimal.ZERO) > 0).toList();

        // 3. Busca todas as notas para consolidar volumes e itens
        List<NotaFornecedor> notasDoAno = notaRepository.findAllByAno(anoFiltro);

        // 3.1. Agrupamento Mensal (Gráficos)
        List<BigDecimal> volumeMensal = new ArrayList<>(Collections.nCopies(12, BigDecimal.ZERO));
        notasDoAno.forEach(nota -> {
            if (nota.getDataNota() != null) {
                int mesIndex = nota.getDataNota().getMonthValue() - 1;
                BigDecimal kgNaNota = nota.getItens().stream()
                        .map(NotaItem::getQuantidadeKg)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                BigDecimal somaAtual = volumeMensal.get(mesIndex);
                volumeMensal.set(mesIndex, somaAtual.add(kgNaNota));
            }
        });

        // 4. Consolidado por Pescado (Agrupamento Granular)
        Map<String, ItemRelatorioResponse> itensAgrupados = notasDoAno.stream()
            .flatMap(nota -> nota.getItens().stream())
            .collect(Collectors.groupingBy(
                item -> {
                    String nome = item.getProduto().getNome();
                    String tipo = item.getProduto().getTipo() != null ? item.getProduto().getTipo() : "";
                    String tam = item.getProduto().getTamanho() != null ? item.getProduto().getTamanho() : "";
                    return nome + " " + tipo + " (" + tam + ")";
                },
                Collectors.collectingAndThen(
                    Collectors.toList(),
                    list -> {
                        BigDecimal kg = list.stream().map(NotaItem::getQuantidadeKg).reduce(BigDecimal.ZERO, BigDecimal::add);
                        BigDecimal valor = list.stream().map(NotaItem::getValorTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                        
                        BigDecimal precoUnitario = (kg.compareTo(BigDecimal.ZERO) > 0) 
                            ? valor.divide(kg, 2, java.math.RoundingMode.HALF_UP) 
                            : BigDecimal.ZERO;

                        var p = list.get(0).getProduto();
                        String desc = p.getNome() + " " + (p.getTipo() != null ? p.getTipo() : "") + " (" + (p.getTamanho() != null ? p.getTamanho() : "") + ")";
                        
                        return new ItemRelatorioResponse(desc, kg, valor, precoUnitario);
                    }
                )
            ));

        // 5. Totais Gerais para os Cards do Topo
        BigDecimal totalCompradoGeral = notaRepository.somarTotalNotasPorAno(anoFiltro);
        BigDecimal totalPagoGeral = pagamentoRepository.somarPagamentosPorAno(anoFiltro);
        
        BigDecimal totalKgGeral = itensAgrupados.values().stream()
            .map(ItemRelatorioResponse::quantidadeKg)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        totalCompradoGeral = totalCompradoGeral != null ? totalCompradoGeral : BigDecimal.ZERO;
        totalPagoGeral = totalPagoGeral != null ? totalPagoGeral : BigDecimal.ZERO;

        return new RelatorioAnualResponse(
            totalCompradoGeral,
            totalPagoGeral,
            totalCompradoGeral.subtract(totalPagoGeral), // Saldo Pendente Geral
            totalKgGeral != null ? totalKgGeral : BigDecimal.ZERO,
            listaFornecedores,
            new ArrayList<>(itensAgrupados.values()),
            volumeMensal 
        );
    }
}