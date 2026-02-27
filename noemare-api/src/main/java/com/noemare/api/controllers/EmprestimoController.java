package com.noemare.api.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.request.EmprestimoRequest;
import com.noemare.api.dtos.response.EmprestimoResponse; // Atualizado
import com.noemare.api.services.EmprestimoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/emprestimos") // 👉 URL ATUALIZADA (Lembre de mudar no front-end do Angular)
public class EmprestimoController {

    private final EmprestimoService emprestimoService; // Atualizado

    public EmprestimoController(EmprestimoService emprestimoService) { // Atualizado
        this.emprestimoService = emprestimoService; // Atualizado
    }

    @PostMapping
    public ResponseEntity<EmprestimoResponse> criar(@RequestBody @Valid EmprestimoRequest request) { // Atualizado
        EmprestimoResponse response = emprestimoService.criar(request); // Atualizado
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 👉 NOVO: Método GET para buscar a lista de empréstimos e preencher a tabela
    @GetMapping
    public ResponseEntity<List<EmprestimoResponse>> listarTodos( // Atualizado
            @RequestParam(required = false) Integer ano) {
        
        // Chama o service que nós já tínhamos criado e devolve a lista
        List<EmprestimoResponse> response = emprestimoService.listarTodos(); // Atualizado
        
        return ResponseEntity.ok(response);
    }
}