package com.noemare.api.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.Emprestimo; // Atualizado
import com.noemare.api.domain.PagamentoEmprestimo; // Atualizado
import com.noemare.api.domain.enums.StatusEmprestimo;
import com.noemare.api.domain.enums.TipoEmprestimo; 
import com.noemare.api.dtos.request.PagamentoEmprestimoRequest;
import com.noemare.api.dtos.response.PagamentoEmprestimoResponse;
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.EmprestimoRepository; // Atualizado
import com.noemare.api.repositories.PagamentoEmprestimoRepository; // Atualizado

@Service
public class PagamentoEmprestimoService { // Atualizado

    private final PagamentoEmprestimoRepository pagamentoRepository; // Atualizado
    private final EmprestimoRepository emprestimoRepository; // Atualizado
    private final LogService logService; 

    public PagamentoEmprestimoService(PagamentoEmprestimoRepository pagamentoRepository, // Atualizado
                                        EmprestimoRepository emprestimoRepository, // Atualizado
                                        LogService logService) {
        this.pagamentoRepository = pagamentoRepository;
        this.emprestimoRepository = emprestimoRepository; // Atualizado
        this.logService = logService;
    }

    @Transactional
    public PagamentoEmprestimoResponse registrarPagamento(PagamentoEmprestimoRequest request) {
        
        // Atualizado: Alterado de request.investimentoId() para request.emprestimoId()
        Emprestimo emprestimo = emprestimoRepository.findById(request.emprestimoId()) // Atualizado
                .orElseThrow(() -> new RegraNegocioException("Empréstimo não encontrado.")); // Atualizado

        if (emprestimo.getStatus() == StatusEmprestimo.QUITADO) { // Atualizado
            throw new RegraNegocioException("Este empréstimo já se encontra quitado."); // Atualizado
        }
        if (request.valor().compareTo(emprestimo.getSaldoRestante()) > 0) { // Atualizado
            throw new RegraNegocioException("O valor do pagamento não pode ser superior ao saldo restante do empréstimo."); // Atualizado
        }

        PagamentoEmprestimo pagamento = new PagamentoEmprestimo(); // Atualizado
        pagamento.setEmprestimo(emprestimo); // Atualizado
        pagamento.setValor(request.valor());
        pagamento.setDescricao(request.descricao());

        emprestimo.registrarPagamento(request.valor()); // Atualizado

        Fornecedor fornecedor = emprestimo.getFornecedor(); // Atualizado
        
        // 👉 ATUALIZAÇÃO: Verifica qual saldo deve ser abatido de acordo com o tipo da dívida
        if (emprestimo.getTipo() == TipoEmprestimo.INVESTIMENTO) { // Atualizado
            fornecedor.abaterSaldoDevedorInvestimento(request.valor());
        } else if (emprestimo.getTipo() == TipoEmprestimo.ADIANTAMENTO) { // Atualizado
            fornecedor.abaterSaldoDevedorAdiantamento(request.valor());
        }

        pagamentoRepository.save(pagamento);

        // --- REGISTRO DO LOG ---
        logService.registrarLog(
            "PAGAR_EMPRESTIMO", // Atualizado
            "PagamentoEmprestimo", // Atualizado
            pagamento.getId(), 
            "Pagamento de empréstimo no valor de " + pagamento.getValor() + " registrado para o empréstimo ID: " + emprestimo.getId() // Atualizado
        );

        return new PagamentoEmprestimoResponse(pagamento);
    }
}