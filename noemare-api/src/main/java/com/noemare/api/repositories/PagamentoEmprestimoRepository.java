package com.noemare.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.noemare.api.domain.PagamentoEmprestimo; // Atualizado

@Repository
public interface PagamentoEmprestimoRepository extends JpaRepository<PagamentoEmprestimo, Long> { // Atualizado
}