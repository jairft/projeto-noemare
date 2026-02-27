package com.noemare.api.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.ClassificacaoProduto;
import com.noemare.api.dtos.request.ClassificacaoProdutoRequest;
import com.noemare.api.dtos.response.ClassificacaoProdutoResponse;
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.ClassificacaoProdutoRepository;
import com.noemare.api.repositories.NotaItemRepository;

@Service
public class ClassificacaoProdutoService {
private final ClassificacaoProdutoRepository classificacaoRepository;
    private final NotaItemRepository notaItemRepository; 
    private final LogService logService;

    public ClassificacaoProdutoService(ClassificacaoProdutoRepository classificacaoRepository, 
                                       NotaItemRepository notaItemRepository,
                                       LogService logService) {
        this.classificacaoRepository = classificacaoRepository;
        this.notaItemRepository = notaItemRepository;
        this.logService = logService;
    }

    @Transactional
    public ClassificacaoProdutoResponse cadastrar(ClassificacaoProdutoRequest request) {
        
        // 1. Normalização dos dados: Trim para remover espaços e ToUpperCase para padronizar
        String nomeNormalizado = request.nome().trim().toUpperCase();
        String tipoNormalizado = request.tipo().trim().toUpperCase();
        
        // Tratamento para o Tamanho (Padrão: UNICO se vier nulo ou vazio)
        String tamanhoNormalizado = (request.tamanho() == null || request.tamanho().isBlank()) 
                                    ? "UNICO" : request.tamanho().trim().toUpperCase();

        // 2. Validação de Duplicidade 100% segura (Ignora Case no Banco)
        // Importante: Certifique-se de ter adicionado este método ao seu Repository
        boolean jaExiste = classificacaoRepository.existsByNomeIgnoreCaseAndTipoIgnoreCaseAndTamanhoIgnoreCase(
            nomeNormalizado, 
            tipoNormalizado, 
            tamanhoNormalizado
        );

        if (jaExiste) {
            throw new RegraNegocioException(
                "Já existe um produto cadastrado com este nome, tipo e tamanho: " + 
                nomeNormalizado + " - " + tipoNormalizado + " (" + tamanhoNormalizado + ")"
            );
        }

        // 3. Cria a nova entidade com os dados padronizados
        ClassificacaoProduto produto = new ClassificacaoProduto();
        produto.setNome(nomeNormalizado);
        produto.setTipo(tipoNormalizado);
        produto.setTamanho(tamanhoNormalizado);
        produto.setPrecoUnitario(request.precoUnitario());

        classificacaoRepository.save(produto);

        // --- REGISTRO DO LOG PARA AUDITORIA ---
        logService.registrarLog(
            "CADASTRAR_PRODUTO", 
            "ClassificacaoProduto", 
            produto.getId(), 
            "Produto cadastrado no catálogo: " + produto.getNome() + " " + produto.getTipo() + 
            " (" + produto.getTamanho() + ") - Preço Base: R$ " + produto.getPrecoUnitario()
        );

        return new ClassificacaoProdutoResponse(produto);
    }

    @Transactional
    public ClassificacaoProdutoResponse atualizar(Long id, ClassificacaoProdutoRequest request) {
        
        // 1. Busca o produto existente
        ClassificacaoProduto produto = classificacaoRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Produto não encontrado para atualização."));

        // 2. Normalização dos novos dados
        String nomeNorm = request.nome().trim().toUpperCase();
        String tipoNorm = request.tipo().trim().toUpperCase();
        String tamanhoNorm = (request.tamanho() == null || request.tamanho().isBlank()) 
                            ? "UNICO" : request.tamanho().trim().toUpperCase();

        // 3. Validação de Duplicidade (Ignorando o ID atual)
        boolean jaExiste = classificacaoRepository.existsByNomeIgnoreCaseAndTipoIgnoreCaseAndTamanhoIgnoreCaseAndIdNot(
            nomeNorm, tipoNorm, tamanhoNorm, id
        );

        if (jaExiste) {
            throw new RegraNegocioException("Já existe outro produto cadastrado com este nome, tipo e tamanho.");
        }

        // 4. Atualiza os campos da entidade buscada (O hibernate fará o UPDATE)
        produto.setNome(nomeNorm);
        produto.setTipo(tipoNorm);
        produto.setTamanho(tamanhoNorm);
        produto.setPrecoUnitario(request.precoUnitario());

        // classificacaoRepository.save(produto) -> Opcional em @Transactional, mas boa prática
        classificacaoRepository.save(produto);

        // 5. Log de Auditoria
        logService.registrarLog("ATUALIZAR_PRODUTO", "ClassificacaoProduto", id, 
                                "Produto atualizado: " + produto.getNome());

        return new ClassificacaoProdutoResponse(produto);
    }

    // Adicione este método lá no seu ClassificacaoProdutoService
    public List<ClassificacaoProdutoResponse> listarTodos() {
        return classificacaoRepository.findAll()
                .stream()
                .map(ClassificacaoProdutoResponse::new)
                .toList();
    }

    @Transactional
    public void excluir(Long id) {
        // 1. Verifica se o produto existe
        var produto = classificacaoRepository.findById(id)
            .orElseThrow(() -> new RegraNegocioException("Produto não encontrado"));

        // 2. Validação de Integridade: Verifica se o produto está em alguma nota
        boolean vinculadoANota = notaItemRepository.existsByProdutoId(id);
        
        if (vinculadoANota) {
            // Esta mensagem será capturada pelo seu Notify no Angular
            throw new RegraNegocioException("Não é possível excluir este pescado pois ele já possui movimentações (notas) vinculadas.");
        }

        // 3. Se não houver vínculo, realiza a exclusão
        classificacaoRepository.delete(produto);

        logService.registrarLog("EXCLUIR_PRODUTO", "ClassificacaoProduto", id, 
            "Produto removido do catálogo: " + produto.getNome());
    }
}