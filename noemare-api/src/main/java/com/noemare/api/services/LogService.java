package com.noemare.api.services;

import java.time.Year; // 👉 Importante
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.LogLancamento;
import com.noemare.api.repositories.LogLancamentoRepository;

@Service
public class LogService {

    private final LogLancamentoRepository logRepository;

    public LogService(LogLancamentoRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Transactional
    public void registrarLog(String acao, String entidade, Long entidadeId, String detalhes) {
        String emailUsuario = "SISTEMA";
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && 
            !"anonymousUser".equals(authentication.getPrincipal())) {
            emailUsuario = authentication.getName();
        }

        LogLancamento log = new LogLancamento(acao, entidade, entidadeId, detalhes, emailUsuario);
        logRepository.save(log);
    }

    // 👉 ATUALIZADO: Filtra os logs pelo exercício fiscal
    public List<LogLancamento> listarTodos(Integer ano) {
        if (ano == null) {
            ano = Year.now().getValue();
        }
        return logRepository.findAllByAno(ano);
    }
}