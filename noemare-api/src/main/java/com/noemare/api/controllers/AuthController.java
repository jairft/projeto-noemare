package com.noemare.api.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.request.EmailRequest;
import com.noemare.api.dtos.request.LoginRequest;
import com.noemare.api.dtos.response.LoginResponse;
import com.noemare.api.services.FuncionarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final FuncionarioService funcionarioService;

    public AuthController(FuncionarioService funcionarioService) {
        this.funcionarioService = funcionarioService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody @Valid LoginRequest data) {
        return funcionarioService.login(data);
    }

    // --- ROTA MOVIDA PARA CÁ ---
    @PostMapping("/esqueci-senha")
    public ResponseEntity<Void> solicitarRecuperacaoSenha(@RequestBody @Valid EmailRequest request) {
        funcionarioService.solicitarRecuperacaoSenha(request.email());
        return ResponseEntity.noContent().build();
    }
}