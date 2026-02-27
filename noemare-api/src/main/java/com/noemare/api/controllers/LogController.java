package com.noemare.api.controllers; // Ajuste para o seu pacote de controllers

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.domain.LogLancamento;
import com.noemare.api.services.LogService;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping
    public ResponseEntity<List<LogLancamento>> listarTodos(
            @RequestParam(name = "ano", required = false) Integer ano
    ) {
        return ResponseEntity.ok(logService.listarTodos(ano));
    }
}