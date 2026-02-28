package com.noemare.api.services;

import java.time.LocalDateTime; 
import java.time.LocalTime; // 👉 Importado para checar a hora atual
import java.time.Year; 
import java.util.List;

import org.slf4j.Logger; 
import org.slf4j.LoggerFactory; 
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled; 
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.ConfiguracaoSistema;
import com.noemare.api.domain.LogLancamento;
import com.noemare.api.repositories.LogLancamentoRepository;

@Service
public class LogService {

    private static final Logger log = LoggerFactory.getLogger(LogService.class);

    private final LogLancamentoRepository logRepository;
    private final ConfiguracaoSistemaService configuracaoService; // 👉 Novo serviço injetado

    // 👉 Construtor atualizado
    public LogService(LogLancamentoRepository logRepository, ConfiguracaoSistemaService configuracaoService) {
        this.logRepository = logRepository;
        this.configuracaoService = configuracaoService;
    }

    @Transactional
    public void registrarLog(String acao, String entidade, Long entidadeId, String detalhes) {
        String emailUsuario = "SISTEMA";
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && 
            !"anonymousUser".equals(authentication.getPrincipal())) {
            emailUsuario = authentication.getName();
        }

        LogLancamento logLancamento = new LogLancamento(acao, entidade, entidadeId, detalhes, emailUsuario);
        logRepository.save(logLancamento);
    }

    public List<LogLancamento> listarTodos(Integer ano) {
        if (ano == null) {
            ano = Year.now().getValue();
        }
        return logRepository.findAllByAno(ano);
    }

    // 👉 1. Checa de hora em hora se é o momento configurado pelo usuário
    @Scheduled(cron = "0 0 * * * ?") 
    @Transactional
    public void limparLogsAgendado() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        
        // Verifica se a hora atual é igual à hora configurada no banco
        if (LocalTime.now().getHour() == config.getHorarioLimpezaLogs().getHour()) {
            executarLimpeza(config.getDiasRetencaoLogs());
        }
    }

    // 👉 2. Continua rodando por segurança sempre que o sistema ligar ou acordar
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void limparLogsAoIniciar() {
        ConfiguracaoSistema config = configuracaoService.obterConfiguracao();
        executarLimpeza(config.getDiasRetencaoLogs());
    }

    // 👉 3. Método auxiliar que faz a conta e deleta no banco
    private void executarLimpeza(int diasRetencao) {
        LocalDateTime dataLimite = LocalDateTime.now().minusDays(diasRetencao);
        
        logRepository.deletarLogsAntigos(dataLimite);
        
        log.info("Limpeza automática de logs executada. Registros anteriores a {} dias ({}) foram apagados do banco.", diasRetencao, dataLimite);
    }
}