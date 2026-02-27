package com.noemare.api.services;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.Emprestimo; // Atualizado
import com.noemare.api.domain.NotaFornecedor;
import com.noemare.api.domain.PagamentoNota;
import com.noemare.api.domain.enums.StatusEmprestimo;
import com.noemare.api.domain.enums.StatusNota;
import com.noemare.api.domain.enums.TipoEmprestimo;
import com.noemare.api.dtos.request.PagamentoNotaRequest;
import com.noemare.api.dtos.response.HistoricoPagamentoResponse;
import com.noemare.api.dtos.response.PagamentoNotaResponse;
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.EmprestimoRepository; // Atualizado
import com.noemare.api.repositories.NotaFornecedorRepository;
import com.noemare.api.repositories.PagamentoNotaRepository;

@Service
public class PagamentoNotaService {

    private final PagamentoNotaRepository pagamentoRepository;
    private final NotaFornecedorRepository notaRepository;
    private final EmprestimoRepository emprestimoRepository; // Atualizado
    private final LogService logService; 

    public PagamentoNotaService(PagamentoNotaRepository pagamentoRepository, 
                                NotaFornecedorRepository notaRepository,
                                EmprestimoRepository emprestimoRepository, // Atualizado
                                LogService logService) {
        this.pagamentoRepository = pagamentoRepository;
        this.notaRepository = notaRepository;
        this.emprestimoRepository = emprestimoRepository; // Atualizado
        this.logService = logService;
    }

    @Transactional
    public PagamentoNotaResponse registrarPagamento(PagamentoNotaRequest request) {
        NotaFornecedor nota = notaRepository.findById(request.notaId())
                .orElseThrow(() -> new RegraNegocioException("Nota de fornecimento não encontrada."));

        if (nota.getStatus() == StatusNota.PAGA) {
            throw new RegraNegocioException("Esta nota já se encontra totalmente paga.");
        }

        Fornecedor fornecedor = nota.getFornecedor();

        BigDecimal valorDinheiro = request.valorPagoDinheiro() != null ? request.valorPagoDinheiro() : BigDecimal.ZERO;
        
        // Mantive o nome do método do request original. Se você refatorar o DTO, lembre-se de mudar aqui para request.valorAbatidoEmprestimo()
        BigDecimal valorAbateEmprestimo = request.valorAbatidoInvestimento() != null ? request.valorAbatidoInvestimento() : BigDecimal.ZERO; 
        BigDecimal valorAbateAdiant = request.valorAbatidoAdiantamento() != null ? request.valorAbatidoAdiantamento() : BigDecimal.ZERO;

        BigDecimal valorTotalBaixa = valorDinheiro.add(valorAbateEmprestimo).add(valorAbateAdiant); // Atualizado

        if (valorTotalBaixa.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RegraNegocioException("O valor total da baixa deve ser maior que zero.");
        }

        // 👉 TRAVA DE SEGURANÇA: Garantir que a baixa não exceda o valor pendente da nota
        BigDecimal saldoPendente = nota.getValorTotal().subtract(nota.getValorPago() != null ? nota.getValorPago() : BigDecimal.ZERO);
        if (valorTotalBaixa.compareTo(saldoPendente) > 0) {
            throw new RegraNegocioException("O valor da baixa (R$ " + valorTotalBaixa + ") não pode exceder o saldo pendente da nota (R$ " + saldoPendente + ").");
        }

        // Auditoria detalhada: Log de abatimento de Empréstimo
        if (valorAbateEmprestimo.compareTo(BigDecimal.ZERO) > 0) {
            processarAbatimentoDestaDivida(fornecedor.getId(), TipoEmprestimo.INVESTIMENTO, valorAbateEmprestimo, nota.getId());
        }

        // Auditoria detalhada: Log de abatimento de Adiantamento
        if (valorAbateAdiant.compareTo(BigDecimal.ZERO) > 0) {
            processarAbatimentoDestaDivida(fornecedor.getId(), TipoEmprestimo.ADIANTAMENTO, valorAbateAdiant, nota.getId());
        }

        PagamentoNota pagamento = new PagamentoNota();
        pagamento.setNota(nota);
        pagamento.setFornecedor(fornecedor);
        pagamento.setValorBruto(valorTotalBaixa);
        pagamento.setValorDesconto(valorAbateEmprestimo.add(valorAbateAdiant));
        
        // Se você refatorar a entidade PagamentoNota, mude aqui para setValorAbatidoEmprestimo()
        pagamento.setValorAbatidoInvestimento(valorAbateEmprestimo); 
        pagamento.setValorAbatidoAdiantamento(valorAbateAdiant);
        pagamento.setObservacao(request.observacao());
        
        // 👉 CORREÇÃO DA DATA: Salvando o dia escolhido no front-end em vez de "hoje"
        if (request.dataOperacao() != null) {
            pagamento.setDataPagamento(request.dataOperacao().atStartOfDay()); 
        }

        fornecedor.abaterSaldoCredor(valorTotalBaixa);
        nota.registrarPagamento(valorTotalBaixa);
        
        if (valorAbateEmprestimo.compareTo(BigDecimal.ZERO) > 0) {
            // Se você refatorar a entidade Fornecedor, mude aqui para abaterSaldoDevedorEmprestimo()
            fornecedor.abaterSaldoDevedorInvestimento(valorAbateEmprestimo); 
        }
        if (valorAbateAdiant.compareTo(BigDecimal.ZERO) > 0) {
            fornecedor.abaterSaldoDevedorAdiantamento(valorAbateAdiant);
        }

        PagamentoNota pagamentoSalvo = pagamentoRepository.save(pagamento);

        logService.registrarLog(
            "REGISTRAR_PAGAMENTO", 
            "PagamentoNota", 
            pagamentoSalvo.getId(), 
            "Pagamento registrado. Fornecedor: " + fornecedor.getNome() + 
            " | Valor Total Baixado: R$ " + valorTotalBaixa + 
            " | Dinheiro: R$ " + valorDinheiro + 
            " | Abatimentos: R$ " + pagamentoSalvo.getValorDesconto() + 
            " | Nota ID: " + nota.getId()
        );

        return new PagamentoNotaResponse(pagamentoSalvo);
    }

    private void processarAbatimentoDestaDivida(Long fornecedorId, TipoEmprestimo tipo, BigDecimal valorParaAbater, Long notaId) {
        BigDecimal saldoTotal = emprestimoRepository.somarSaldoRestantePorFornecedorETipo(fornecedorId, tipo); // Atualizado
        if (valorParaAbater.compareTo(saldoTotal) > 0) {
            throw new RegraNegocioException("O valor de abatimento excede a dívida atual de " + tipo + " do fornecedor.");
        }

        // Atualizado para buscar Emprestimo e o método foi corrigido para DataEmprestimoAsc
        List<Emprestimo> dividasAbertas = emprestimoRepository
                .findByFornecedorIdAndTipoAndStatusOrderByDataEmprestimoAsc(fornecedorId, tipo, StatusEmprestimo.ABERTO);

        BigDecimal restanteParaAbater = valorParaAbater;

        for (Emprestimo divida : dividasAbertas) { // Atualizado
            if (restanteParaAbater.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal valorDescontarDestaDivida = divida.getSaldoRestante().min(restanteParaAbater);
            divida.registrarPagamento(valorDescontarDestaDivida);
            emprestimoRepository.save(divida); // Atualizado

            logService.registrarLog(
                "ABATIMENTO_DIVIDA_AUTOMATICO",
                "Empréstimo", // Atualizado
                divida.getId(),
                "Abatimento de R$ " + valorDescontarDestaDivida + " (" + tipo + ") realizado via baixa na Nota ID: " + notaId
            );

            restanteParaAbater = restanteParaAbater.subtract(valorDescontarDestaDivida);
        }
    }

    @Transactional(readOnly = true)
    public List<HistoricoPagamentoResponse> buscarHistoricoPorNotaId(Long notaId) {
        if (!notaRepository.existsById(notaId)) {
            throw new RegraNegocioException("Nota de fornecimento não encontrada.");
        }
        return pagamentoRepository.findByNotaId(notaId)
                .stream()
                .map(HistoricoPagamentoResponse::new)
                .toList();
    }
}