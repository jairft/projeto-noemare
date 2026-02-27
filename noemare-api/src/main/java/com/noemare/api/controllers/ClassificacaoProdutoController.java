package com.noemare.api.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.request.ClassificacaoProdutoRequest;
import com.noemare.api.dtos.response.ClassificacaoProdutoResponse;
import com.noemare.api.services.ClassificacaoProdutoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/classificao-produto")
public class ClassificacaoProdutoController {

    private final ClassificacaoProdutoService service;

    public ClassificacaoProdutoController(ClassificacaoProdutoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ClassificacaoProdutoResponse> cadastrar(@RequestBody @Valid ClassificacaoProdutoRequest request) {
        var response = service.cadastrar(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ClassificacaoProdutoResponse>> listar() {
        return ResponseEntity.ok(service.listarTodos());
    }

    // Caso precise excluir um item do cardápio
    // Localize o seu @DeleteMapping e atualize para isso:
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassificacaoProdutoResponse> atualizar(@PathVariable Long id, @RequestBody ClassificacaoProdutoRequest request) {
        var response = service.atualizar(id, request);
        return ResponseEntity.ok(response);
    }
}