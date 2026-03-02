package com.noemare.api.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Year;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.ClassificacaoProduto;
import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.NotaFornecedor;
import com.noemare.api.domain.NotaItem;
import com.noemare.api.domain.enums.StatusNota;
import com.noemare.api.dtos.request.NotaFornecedorRequest;
import com.noemare.api.dtos.request.NotaItemRequest;
import com.noemare.api.dtos.response.HistoricoNotaResponse;
import com.noemare.api.dtos.response.NotaFornecedorResponse;
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.ClassificacaoProdutoRepository;
import com.noemare.api.repositories.FornecedorRepository;
import com.noemare.api.repositories.NotaFornecedorRepository;

@Service
public class NotaFornecedorService {

    private final NotaFornecedorRepository notaRepository;
    private final FornecedorRepository fornecedorRepository;
    private final ClassificacaoProdutoRepository classificacaoRepository;
    private final LogService logService;

    public NotaFornecedorService(NotaFornecedorRepository notaRepository, 
                                 FornecedorRepository fornecedorRepository, 
                                 ClassificacaoProdutoRepository classificacaoRepository,
                                 LogService logService) {
        this.notaRepository = notaRepository;
        this.fornecedorRepository = fornecedorRepository;
        this.classificacaoRepository = classificacaoRepository;
        this.logService = logService;
    }

    @Transactional
    public NotaFornecedorResponse gerarNota(NotaFornecedorRequest request) {
        Fornecedor fornecedor = fornecedorRepository.findById(request.fornecedorId())
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado."));

        NotaFornecedor nota = new NotaFornecedor();
        nota.setFornecedor(fornecedor);
        nota.setDescricao(request.descricao());
        
        String numero = request.numeroNota() != null && !request.numeroNota().trim().isEmpty() 
            ? request.numeroNota().trim() 
            : "S/N";
        
        if(numero.length() > 50) numero = numero.substring(0, 50);

        // 👉 NOVA VALIDAÇÃO: Impede cadastro de número duplicado (ignorando "S/N")
        if (!numero.equals("S/N") && notaRepository.existsByNumeroNota(numero)) {
            throw new RegraNegocioException("Já existe uma nota cadastrada com o número " + numero + ".");
        }

        nota.setNumeroNota(numero);

        if (request.dataNota() != null) {
            nota.setDataNota(request.dataNota().atStartOfDay());
        }
        
        nota.setStatus(StatusNota.ABERTA);

        for (NotaItemRequest itemRequest : request.itens()) {
            ClassificacaoProduto produto = classificacaoRepository.findById(itemRequest.produtoId())
                    .orElseThrow(() -> new RegraNegocioException("Produto do cardápio não encontrado. ID: " + itemRequest.produtoId()));

            NotaItem item = new NotaItem();
            item.setProduto(produto);
            item.setQuantidadeKg(itemRequest.quantidadeKg());
            item.setValorUnitario(itemRequest.valorUnitario());
            
            nota.adicionarItem(item);
        }

        fornecedor.adicionarSaldoCredor(nota.getValorTotal());

        NotaFornecedor notaSalva = notaRepository.save(nota);

        logService.registrarLog(
            "GERAR_NOTA", 
            "NotaFornecedor", 
            notaSalva.getId(), 
            "Nota gerada (Nº: "+ notaSalva.getNumeroNota() +"). Fornecedor: " + fornecedor.getNome() + " | Valor: R$ " + notaSalva.getValorTotal()
        );

        return new NotaFornecedorResponse(notaSalva);
    }

    @Transactional
    public NotaFornecedorResponse editarNota(Long id, NotaFornecedorRequest request) {
        NotaFornecedor nota = notaRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Nota não encontrada com o ID: " + id));

        if (nota.getStatus() != StatusNota.ABERTA) {
            throw new RegraNegocioException("Só é possível editar notas com status ABERTA.");
        }

        Fornecedor fornecedor = nota.getFornecedor();
        fornecedor.subtrairSaldoCredor(nota.getValorTotal());

        String numero = request.numeroNota() != null && !request.numeroNota().trim().isEmpty() 
            ? request.numeroNota().trim() 
            : "S/N";
        if(numero.length() > 50) numero = numero.substring(0, 50);
        
        // 👉 NOVA VALIDAÇÃO: Impede edição para um número duplicado que pertença a outra nota
        if (!numero.equals("S/N") && notaRepository.existsByNumeroNotaAndIdNot(numero, id)) {
            throw new RegraNegocioException("Já existe outra nota cadastrada com o número " + numero + ".");
        }

        nota.setNumeroNota(numero);
        nota.setDescricao(request.descricao());
        
        if (request.dataNota() != null) {
            nota.setDataNota(request.dataNota().atStartOfDay());
        }

        nota.getItens().clear();
        nota.setValorTotal(BigDecimal.ZERO);

        for (NotaItemRequest itemRequest : request.itens()) {
            ClassificacaoProduto produto = classificacaoRepository.findById(itemRequest.produtoId())
                    .orElseThrow(() -> new RegraNegocioException("Produto do cardápio não encontrado. ID: " + itemRequest.produtoId()));

            NotaItem item = new NotaItem();
            item.setProduto(produto);
            item.setQuantidadeKg(itemRequest.quantidadeKg());
            item.setValorUnitario(itemRequest.valorUnitario());
            
            nota.adicionarItem(item); 
        }

        fornecedor.adicionarSaldoCredor(nota.getValorTotal());

        NotaFornecedor notaAtualizada = notaRepository.save(nota);

        logService.registrarLog(
            "EDITAR_NOTA", 
            "NotaFornecedor", 
            notaAtualizada.getId(), 
            "Nota editada. Fornecedor: " + fornecedor.getNome() + " | Novo Valor: R$ " + notaAtualizada.getValorTotal()
        );

        return new NotaFornecedorResponse(notaAtualizada);
    }

    @Transactional(readOnly = true)
    public List<NotaFornecedorResponse> listarTodas(Integer ano) {
        if (ano == null) {
            ano = Year.now().getValue();
        }
        
        return notaRepository.findAllByAno(ano).stream()
                .map(NotaFornecedorResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HistoricoNotaResponse> buscarHistoricoFiltrado(Integer ano, LocalDate dataInicio, LocalDate dataFim) {
        
        if (ano == null) {
            ano = Year.now().getValue();
        }

        LocalDateTime inicio = (dataInicio != null) ? dataInicio.atStartOfDay() : null;
        LocalDateTime fim = (dataFim != null) ? dataFim.atTime(LocalTime.MAX) : null;

        List<NotaFornecedor> notas = notaRepository.buscarHistoricoFiltrado(ano, inicio, fim);

        return notas.stream()
                .map(HistoricoNotaResponse::new)
                .toList();
    }

    @Transactional
    public void excluirNota(Long id) {
        NotaFornecedor nota = notaRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Nota não encontrada com o ID: " + id));

        if (nota.getStatus() != StatusNota.ABERTA) {
            throw new RegraNegocioException("Não é possível excluir uma nota que já possui pagamentos ou abatimentos registrados.");
        }

        Fornecedor fornecedor = nota.getFornecedor();

        fornecedor.subtrairSaldoCredor(nota.getValorTotal()); 

        logService.registrarLog(
            "EXCLUIR_NOTA", 
            "NotaFornecedor", 
            nota.getId(), 
            "Nota excluída (Nº: "+ nota.getNumeroNota() +"). Fornecedor: " + fornecedor.getNome() + " | Valor Estornado: R$ " + nota.getValorTotal()
        );

        notaRepository.delete(nota);
    }
}