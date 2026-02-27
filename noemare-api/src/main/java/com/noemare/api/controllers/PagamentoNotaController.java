package com.noemare.api.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.request.PagamentoNotaRequest;
import com.noemare.api.dtos.response.PagamentoNotaResponse;
import com.noemare.api.services.PagamentoNotaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pagamentos-nota")
public class PagamentoNotaController {

    private final PagamentoNotaService pagamentoService;

    public PagamentoNotaController(PagamentoNotaService pagamentoService) {
        this.pagamentoService = pagamentoService;
    }

    @PostMapping
    public ResponseEntity<PagamentoNotaResponse> registrar(@RequestBody @Valid PagamentoNotaRequest request) {
        PagamentoNotaResponse response = pagamentoService.registrarPagamento(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}