package com.noemare.api.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.request.PagamentoEmprestimoRequest;
import com.noemare.api.dtos.response.PagamentoEmprestimoResponse;
import com.noemare.api.services.PagamentoEmprestimoService; // Atualizado

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pagamentos-emprestimo") // 👉 URL ATUALIZADA (Lembre de mudar no Angular)
public class PagamentoEmprestimoController {

    private final PagamentoEmprestimoService pagamentoService; // Atualizado

    public PagamentoEmprestimoController(PagamentoEmprestimoService pagamentoService) { // Atualizado
        this.pagamentoService = pagamentoService;
    }

    @PostMapping
    public ResponseEntity<PagamentoEmprestimoResponse> registrar(@RequestBody @Valid PagamentoEmprestimoRequest request) {
        PagamentoEmprestimoResponse response = pagamentoService.registrarPagamento(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}