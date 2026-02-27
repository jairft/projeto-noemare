package com.noemare.api.services;

import java.math.BigDecimal;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.NotaItem;
import com.noemare.api.domain.enums.StatusFornecedor;
import com.noemare.api.domain.enums.TipoEmprestimo;
import com.noemare.api.dtos.request.FornecedorRequest;
import com.noemare.api.dtos.response.FornecedorResponse;
import com.noemare.api.dtos.response.HistoricoGeralFornecedorResponse;
import com.noemare.api.dtos.response.ItemAgrupadoResponse;
import com.noemare.api.dtos.response.SaldoFornecedorResponse;
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.FornecedorRepository;
import com.noemare.api.repositories.EmprestimoRepository; // Atualizado
import com.noemare.api.repositories.NotaFornecedorRepository;

@Service
public class FornecedorService {

    private final FornecedorRepository repository;
    private final EmprestimoRepository emprestimoRepository; // Atualizado
    private final NotaFornecedorRepository notaRepository;
    private final LogService logService;

    public FornecedorService(FornecedorRepository repository, 
                             NotaFornecedorRepository notaRepository, 
                             EmprestimoRepository emprestimoRepository, // Atualizado
                             LogService logService) {
        this.repository = repository;
        this.notaRepository = notaRepository;
        this.emprestimoRepository = emprestimoRepository; // Atualizado
        this.logService = logService;
    }

    @Transactional(readOnly = true)
    public List<FornecedorResponse> listarTodos(Integer ano) {
        if (ano == null) {
            ano = Year.now().getValue();
        }
        final Integer anoFiltro = ano;

        return repository.findAll().stream().map(f -> {
            BigDecimal saldoCredorAno = notaRepository.somarSaldoCredorPorFornecedorEAno(f.getId(), anoFiltro);
            
            // 👉 ATUALIZAÇÃO: Busca os dois saldos separados do EmprestimoRepository
           BigDecimal saldoEmprestimoAno = emprestimoRepository.somarSaldoRestantePorFornecedorETipoEAno(f.getId(), TipoEmprestimo.INVESTIMENTO, anoFiltro);
           BigDecimal saldoAdiantamentoAno = emprestimoRepository.somarSaldoRestantePorFornecedorETipoEAno(f.getId(), TipoEmprestimo.ADIANTAMENTO, anoFiltro);
            
            // Passa os 3 saldos para o construtor do Response
            return new FornecedorResponse(f, saldoEmprestimoAno, saldoAdiantamentoAno, saldoCredorAno);
        }).toList();
    }

    @Transactional
    public FornecedorResponse salvar(FornecedorRequest request) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(request.nome().toUpperCase());
        Fornecedor salvo = repository.save(fornecedor);

        // 👉 Auditoria: Cadastro de novo fornecedor
        logService.registrarLog("CADASTRAR_FORNECEDOR", "Fornecedor", salvo.getId(), 
            "Fornecedor cadastrado. Nome: " + salvo.getNome());

        return new FornecedorResponse(salvo);
    }

    @Transactional
    public FornecedorResponse atualizarNome(Long id, String novoNome) {
        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado."));
        
        String nomeAntigo = fornecedor.getNome();
        fornecedor.setNome(novoNome);
        Fornecedor salvo = repository.save(fornecedor);

        // 👉 Auditoria: Alteração de nome
        logService.registrarLog("ATUALIZAR_NOME_FORNECEDOR", "Fornecedor", id, 
            "Nome atualizado. De: " + nomeAntigo + " Para: " + novoNome);

        return new FornecedorResponse(salvo);
    }

    @Transactional(readOnly = true)
    public FornecedorResponse buscarPorId(Long id) {
        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado com o ID: " + id));
        return new FornecedorResponse(fornecedor);
    }

    @Transactional
    public void alterarStatus(Long id, StatusFornecedor novoStatus) {
        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado."));
        
        if (fornecedor.getStatus() == novoStatus) {
            throw new RegraNegocioException("O fornecedor já possui o status " + novoStatus);
        }
        
        fornecedor.setStatus(novoStatus);
        repository.save(fornecedor);

        // 👉 Auditoria: Mudança de status (Ativo/Inativo)
        logService.registrarLog("ALTERAR_STATUS_FORNECEDOR", "Fornecedor", id, 
            "Status alterado para: " + novoStatus);
    }

    @Transactional(readOnly = true)
    public SaldoFornecedorResponse buscarSaldosDevedores(Long fornecedorId) {
        if (!repository.existsById(fornecedorId)) {
            throw new RegraNegocioException("Fornecedor não encontrado.");
        }
        BigDecimal totalEmprestimo = emprestimoRepository.somarSaldoRestantePorFornecedorETipo( // Atualizado
                fornecedorId, TipoEmprestimo.INVESTIMENTO);
        BigDecimal totalAdiantamento = emprestimoRepository.somarSaldoRestantePorFornecedorETipo( // Atualizado
                fornecedorId, TipoEmprestimo.ADIANTAMENTO);
        return new SaldoFornecedorResponse(totalEmprestimo, totalAdiantamento); // O construtor do DTO pode precisar de ajuste se os parâmetros internos dele ainda se chamarem investimento
    }

    @Transactional(readOnly = true)
    public HistoricoGeralFornecedorResponse obterHistoricoGeral(Long fornecedorId) {
        Fornecedor fornecedor = repository.findById(fornecedorId)
            .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));

        List<NotaItem> todosItens = fornecedor.getNotas().stream()
            .flatMap(nota -> nota.getItens().stream())
            .toList();

        Map<String, ItemAgrupadoResponse> agrupado = todosItens.stream()
            .collect(Collectors.groupingBy(
                item -> item.getProduto().getNome() + "-" + item.getProduto().getTipo() + "-" + item.getProduto().getTamanho(),
                Collectors.collectingAndThen(
                    Collectors.toList(),
                    list -> {
                        var primeiro = list.get(0).getProduto();
                        BigDecimal kg = list.stream().map(NotaItem::getQuantidadeKg).reduce(BigDecimal.ZERO, BigDecimal::add);
                        BigDecimal valor = list.stream().map(NotaItem::getValorTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                        return new ItemAgrupadoResponse(primeiro.getNome(), primeiro.getTipo(), primeiro.getTamanho(), kg, valor);
                    }
                )
            ));

        BigDecimal kgGeral = todosItens.stream()
            .map(item -> item.getQuantidadeKg()).reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal valorGeral = todosItens.stream()
            .map(item -> item.getValorTotal()).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new HistoricoGeralFornecedorResponse(kgGeral, valorGeral, new ArrayList<>(agrupado.values()));
    }

    @Transactional
    public void excluir(Long id) {
        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado"));

        boolean possuiNotas = notaRepository.existsByFornecedorId(id);
        boolean possuiDividas = emprestimoRepository.existsByFornecedorId(id); // Atualizado

        if (possuiNotas || possuiDividas) {
            throw new RegraNegocioException("Não é possível excluir um fornecedor com histórico financeiro. Altere o status para INATIVO.");
        }

        // 👉 Auditoria: Exclusão permanente
        logService.registrarLog("EXCLUIR_FORNECEDOR", "Fornecedor", id, 
            "Fornecedor removido permanentemente. Nome: " + fornecedor.getNome());

        repository.delete(fornecedor);
    }
}