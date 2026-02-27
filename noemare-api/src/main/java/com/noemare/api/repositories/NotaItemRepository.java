package com.noemare.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.noemare.api.domain.NotaItem;

public interface NotaItemRepository extends JpaRepository<NotaItem, Long> {
    // Verifica se existe algum item de nota vinculado ao ID do produto
    boolean existsByProdutoId(Long produtoId);
}