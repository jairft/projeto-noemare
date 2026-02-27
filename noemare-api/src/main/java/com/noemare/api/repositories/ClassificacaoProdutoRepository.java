package com.noemare.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.noemare.api.domain.ClassificacaoProduto;

@Repository
public interface ClassificacaoProdutoRepository extends JpaRepository<ClassificacaoProduto, Long> {

    boolean existsByNomeIgnoreCaseAndTipoIgnoreCaseAndTamanhoIgnoreCase(String nome, String tipo, String tamanho);

    boolean existsByNomeIgnoreCaseAndTipoIgnoreCaseAndTamanhoIgnoreCaseAndIdNot(
        String nome, String tipo, String tamanho, Long id
    );
}
