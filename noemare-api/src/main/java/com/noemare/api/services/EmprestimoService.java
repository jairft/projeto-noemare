package com.noemare.api.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.Emprestimo; // Atualizado
import com.noemare.api.domain.enums.TipoEmprestimo; 
import com.noemare.api.dtos.request.EmprestimoRequest; // Atualizado
import com.noemare.api.dtos.response.EmprestimoResponse; // Atualizado
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.FornecedorRepository;
import com.noemare.api.repositories.EmprestimoRepository; // Atualizado

@Service
public class EmprestimoService { // Atualizado

    private final EmprestimoRepository emprestimoRepository; // Atualizado
    private final FornecedorRepository fornecedorRepository;
    private final LogService logService;

    public EmprestimoService(EmprestimoRepository emprestimoRepository, // Atualizado
                             FornecedorRepository fornecedorRepository,
                             LogService logService) {
        this.emprestimoRepository = emprestimoRepository;
        this.fornecedorRepository = fornecedorRepository;
        this.logService = logService;
    }

    @Transactional
    public EmprestimoResponse criar(EmprestimoRequest request) { // Atualizado
        // 1. Busca o fornecedor
        Fornecedor fornecedor = fornecedorRepository.findById(request.fornecedorId())
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado."));

        // 2. Cria o empréstimo
        Emprestimo emprestimo = new Emprestimo(); // Atualizado
        emprestimo.setFornecedor(fornecedor);
        emprestimo.setTipo(request.tipo());
        emprestimo.setValorTotal(request.valorTotal());
        emprestimo.setDescricao(request.descricao());
        
        // Atualizado para buscar do request (caso você já tenha alterado o request)
        emprestimo.setDataEmprestimo(request.dataEmprestimo()); 

        // 👉 3. Atualiza o saldo do fornecedor (Regra contábil SEPARADA)
        // Se você mudou 'INVESTIMENTO' para 'EMPRESTIMO' no Enum, altere aqui também.
        if (request.tipo() == TipoEmprestimo.INVESTIMENTO) { 
            fornecedor.adicionarSaldoDevedorInvestimento(request.valorTotal());
        } else if (request.tipo() == TipoEmprestimo.ADIANTAMENTO) {
            fornecedor.adicionarSaldoDevedorAdiantamento(request.valorTotal());
        }

        // 4. Salva o empréstimo
        Emprestimo emprestimoSalvo = emprestimoRepository.save(emprestimo); // Atualizado

        // 5. Registra no log
        String detalhesLog = String.format("Empréstimo (%s) de R$ %.2f liberado para %s", // Atualizado
                                            emprestimoSalvo.getTipo(), emprestimoSalvo.getValorTotal(), fornecedor.getNome());
        
        logService.registrarLog(
            "CRIAR_EMPRESTIMO", // Atualizado
            "Empréstimo", // Atualizado
            emprestimoSalvo.getId(), 
            detalhesLog
        );

        return new EmprestimoResponse(emprestimoSalvo); // Atualizado
    }

    @Transactional(readOnly = true)
    public List<EmprestimoResponse> listarTodos() { // Atualizado
        return emprestimoRepository.findAll().stream() // Atualizado
                .map(EmprestimoResponse::new) // Atualizado
                .toList();
    }
}