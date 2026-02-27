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
        
        // 👉 NOVO: Salvando o número e a data informados no front-end
        nota.setNumeroNota(request.numeroNota());
        if (request.dataNota() != null) {
            nota.setDataNota(request.dataNota().atStartOfDay()); // Converte LocalDate para LocalDateTime
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
            "Nota gerada. Fornecedor: " + fornecedor.getNome() + " | Valor: R$ " + notaSalva.getValorTotal()
        );

        return new NotaFornecedorResponse(notaSalva);
    }

    // 👉 NOVO: Método de Editar Nota
    @Transactional
    public NotaFornecedorResponse editarNota(Long id, NotaFornecedorRequest request) {
        NotaFornecedor nota = notaRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Nota não encontrada com o ID: " + id));

        // Regra de segurança: não editar nota que já tem pagamentos
        if (nota.getStatus() != StatusNota.ABERTA) {
            throw new RegraNegocioException("Só é possível editar notas com status ABERTA.");
        }

        Fornecedor fornecedor = nota.getFornecedor();

        // 1. Estorna o valor total antigo do saldo do fornecedor
        fornecedor.subtrairSaldoCredor(nota.getValorTotal());

        // 2. Atualiza os dados de cabeçalho
        nota.setNumeroNota(request.numeroNota());
        nota.setDescricao(request.descricao());
        if (request.dataNota() != null) {
            nota.setDataNota(request.dataNota().atStartOfDay());
        }

        // 3. Limpa os itens antigos e zera o valor total
        // O JPA cuidará de deletar os itens velhos por conta do orphanRemoval = true na entidade
        nota.getItens().clear();
        nota.setValorTotal(BigDecimal.ZERO);

        // 4. Adiciona os novos itens e recalcula tudo
        for (NotaItemRequest itemRequest : request.itens()) {
            ClassificacaoProduto produto = classificacaoRepository.findById(itemRequest.produtoId())
                    .orElseThrow(() -> new RegraNegocioException("Produto do cardápio não encontrado. ID: " + itemRequest.produtoId()));

            NotaItem item = new NotaItem();
            item.setProduto(produto);
            item.setQuantidadeKg(itemRequest.quantidadeKg());
            item.setValorUnitario(itemRequest.valorUnitario());
            
            nota.adicionarItem(item); // O método adicionarItem soma automaticamente no valorTotal
        }

        // 5. Adiciona o novo valor total ao saldo do fornecedor
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
        
        // Se o ano vier nulo, usamos o ano atual como trava de segurança
        if (ano == null) {
            ano = Year.now().getValue();
        }

        // Converte as datas apenas se existirem; caso contrário, passam nulas para a Query Custom
        LocalDateTime inicio = (dataInicio != null) ? dataInicio.atStartOfDay() : null;
        LocalDateTime fim = (dataFim != null) ? dataFim.atTime(LocalTime.MAX) : null;

        // Chama o novo método do repositório que criamos
        List<NotaFornecedor> notas = notaRepository.buscarHistoricoFiltrado(ano, inicio, fim);

        return notas.stream()
                .map(HistoricoNotaResponse::new)
                .toList();
    }

    @Transactional
    public void excluirNota(Long id) {
        // 1. Busca a nota ou lança erro se não existir
        NotaFornecedor nota = notaRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Nota não encontrada com o ID: " + id));

        // 2. TRAVA DE SEGURANÇA: Não permite excluir se o status não for ABERTA
        if (nota.getStatus() != StatusNota.ABERTA) {
            throw new RegraNegocioException("Não é possível excluir uma nota que já possui pagamentos ou abatimentos registrados.");
        }

        Fornecedor fornecedor = nota.getFornecedor();

        // 3. Estorno do Saldo Credor: Subtraímos o valor da nota que seria paga ao fornecedor
        fornecedor.subtrairSaldoCredor(nota.getValorTotal()); 

        // 4. Registro de Log para auditoria
        logService.registrarLog(
            "EXCLUIR_NOTA", 
            "NotaFornecedor", 
            nota.getId(), 
            "Nota excluída. Fornecedor: " + fornecedor.getNome() + " | Valor EstEstornado: R$ " + nota.getValorTotal()
        );

        // 5. Deleta a nota (o JPA cuidará de remover os itens da nota via Cascade)
        notaRepository.delete(nota);
    }
}