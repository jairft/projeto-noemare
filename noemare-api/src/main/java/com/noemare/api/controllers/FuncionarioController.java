package com.noemare.api.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.domain.Funcionario;
import com.noemare.api.dtos.request.AlterarSenhaRequest;
import com.noemare.api.dtos.request.ConfirmarSenhaRequest;
import com.noemare.api.dtos.request.FuncionarioRegistroRequest;
import com.noemare.api.dtos.request.RedefinirSenhaRequest;
import com.noemare.api.dtos.response.FuncionarioResponse;
import com.noemare.api.services.FuncionarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/funcionarios")
public class FuncionarioController {

    private final FuncionarioService funcionarioService;

    public FuncionarioController(FuncionarioService funcionarioService) {
        this.funcionarioService = funcionarioService;
    }

    @PostMapping("/registrar")
    public ResponseEntity<FuncionarioResponse> registrar(@RequestBody @Valid FuncionarioRegistroRequest request) {
        FuncionarioResponse response = funcionarioService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<FuncionarioResponse>> listarTodos() {
        List<FuncionarioResponse> lista = funcionarioService.listarTodos();
        return ResponseEntity.ok(lista);
    }

    @PutMapping("/{id}/ativar") 
    public ResponseEntity<FuncionarioResponse> ativarConta(
            @PathVariable Long id,
            @RequestBody @Valid ConfirmarSenhaRequest request,
            @AuthenticationPrincipal Funcionario adminLogado) {
        
        return ResponseEntity.ok(funcionarioService.ativarContaComSenha(id, request.senha(), adminLogado));
    }

    @PostMapping("/{id}/excluir")
    public ResponseEntity<Void> excluirComSenha(
            @PathVariable Long id, 
            @RequestBody @Valid ConfirmarSenhaRequest request, 
            @AuthenticationPrincipal Funcionario adminLogado) { 
        
        funcionarioService.excluirComSenha(id, request.senha(), adminLogado);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/redefinir-senha")
    public ResponseEntity<Void> redefinirSenha(
            @PathVariable Long id, 
            @RequestBody @Valid RedefinirSenhaRequest request, 
            @AuthenticationPrincipal Funcionario adminLogado) {
        
        funcionarioService.redefinirSenhaUsuario(id, request.senhaAdmin(), request.novaSenhaUsuario(), adminLogado);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/alterar-senha")
    public ResponseEntity<Void> alterarSenhaPropria(@RequestBody AlterarSenhaRequest request) {
        // Em produção, o ID viria do SecurityContextHolder.getContext().getAuthentication()
        Long idUsuarioLogado = 1L; 
        
        funcionarioService.alterarSenhaPropria(idUsuarioLogado, request);
        return ResponseEntity.noContent().build();
    }
}