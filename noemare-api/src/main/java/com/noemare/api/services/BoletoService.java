package com.noemare.api.services;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.Boleto;
import com.noemare.api.domain.Funcionario;
import com.noemare.api.domain.enums.StatusBoleto;
import com.noemare.api.dtos.request.BoletoRequest;
import com.noemare.api.dtos.response.BoletoResponse;
import com.noemare.api.dtos.response.NotificacaoResponse;
import com.noemare.api.repositories.BoletoRepository;

@Service
public class BoletoService {

    private final BoletoRepository boletoRepository;
    private final LogService logService;

    public BoletoService(BoletoRepository boletoRepository, LogService logService) {
        this.boletoRepository = boletoRepository;
        this.logService = logService;
    }

    @Transactional
    public BoletoResponse salvar(BoletoRequest request, Funcionario usuarioLogado) {
        Boleto boleto = new Boleto();
        boleto.setDescricao(request.descricao());
        boleto.setNomeBanco(request.nomeBanco()); 
        boleto.setCodigoBarras(request.codigoBarras());
        boleto.setValor(request.valor());
        boleto.setDataVencimento(request.dataVencimento());
        boleto.setStatus(StatusBoleto.PENDENTE); 

        boletoRepository.save(boleto);

        logService.registrarLog(
            "CADASTRAR_BOLETO", 
            "Boleto", 
            boleto.getId(), 
            "Boleto do banco '" + boleto.getNomeBanco() + "' (" + boleto.getDescricao() + ") de R$ " + boleto.getValor() + " cadastrado por: " + usuarioLogado.getEmail()
        );

        return new BoletoResponse(boleto);
    }

    // 👉 ATUALIZADO: Lista os boletos filtrando pelo ano selecionado no frontend
    public List<BoletoResponse> listarTodos(Integer ano) {
        if (ano == null) {
            ano = Year.now().getValue();
        }
        
        return boletoRepository.findAllByAno(ano).stream()
                .map(BoletoResponse::new)
                .collect(Collectors.toList());
    }

    // Mantido igual (Alerta do widget lateral, baseado em HOJE)
    public List<BoletoResponse> buscarAlertasVencimento() {
        LocalDate hoje = LocalDate.now();
        LocalDate daquiATresDias = hoje.plusDays(3);

        return boletoRepository.findByStatusAndDataVencimentoBetweenOrderByDataVencimentoAsc(
            StatusBoleto.PENDENTE, hoje, daquiATresDias
        ).stream().map(BoletoResponse::new).collect(Collectors.toList());
    }

    @Transactional
    public void darBaixa(Long id, Funcionario usuarioLogado) {
        Boleto boleto = boletoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Boleto não encontrado com o ID: " + id));

        if (boleto.getStatus() == StatusBoleto.PAGO) {
            throw new IllegalStateException("Este boleto já consta como pago.");
        }

        boleto.setStatus(StatusBoleto.PAGO);
        boletoRepository.save(boleto);

        logService.registrarLog(
            "PAGAR_BOLETO", 
            "Boleto", 
            boleto.getId(), 
            "Boleto '" + boleto.getDescricao() + "' marcado como PAGO por: " + usuarioLogado.getEmail()
        );
    }

    @EventListener(ApplicationReadyEvent.class) 
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void varrerBoletosVencidos() {
        LocalDate hoje = LocalDate.now();
        
        List<Boleto> atrasados = boletoRepository.findByStatusAndDataVencimentoBefore(StatusBoleto.PENDENTE, hoje);
        
        if (!atrasados.isEmpty()) {
            atrasados.forEach(boleto -> boleto.setStatus(StatusBoleto.VENCIDO));
            boletoRepository.saveAll(atrasados);
            
            logService.registrarLog(
                "ATUALIZAR_VENCIDOS", 
                "Sistema", 
                null, 
                "Rotina automática (Boot/Cron) atualizou " + atrasados.size() + " boletos para VENCIDO."
            );
        }
    }

    @Transactional
    public void deletar(Long id, Funcionario usuarioLogado) {
        Boleto boleto = boletoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Boleto não encontrado com o ID: " + id));

        boletoRepository.delete(boleto);

        logService.registrarLog(
            "DELETAR_BOLETO", 
            "Boleto", 
            id, 
            "Boleto '" + boleto.getDescricao() + "' do banco " + boleto.getNomeBanco() + " foi excluído por: " + usuarioLogado.getEmail()
        );
    }

    
    public List<NotificacaoResponse> buscarNotificacoesBoletos(Integer ano) {
        if (ano == null) {
            ano = Year.now().getValue();
        }

        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(5);
        
        // Nova query que busca boletos não pagos, com data menor que o limite, E do ano selecionado
        List<Boleto> pendentes = boletoRepository.findNotificacoesPendentesPorAno(StatusBoleto.PAGO, limite, ano);
        
        List<NotificacaoResponse> notificacoes = new ArrayList<>();

        for (Boleto b : pendentes) {
            String titulo = "Boleto Pendente";
            String tipo = "AVISO";
            
            if (b.getDataVencimento() != null) {
                if (b.getDataVencimento().isBefore(hoje)) {
                    titulo = "Boleto Atrasado!";
                    tipo = "URGENTE";
                } else if (b.getDataVencimento().isEqual(hoje)) {
                    titulo = "Boleto Vence Hoje!";
                    tipo = "URGENTE";
                } else {
                    titulo = "Boleto Vence em Breve";
                    tipo = "AVISO";
                }
            }

            String banco = b.getNomeBanco() != null ? b.getNomeBanco() : "Banco não informado";
            String desc = b.getDescricao() != null ? b.getDescricao() : "Sem descrição";
            java.math.BigDecimal valor = b.getValor() != null ? b.getValor() : java.math.BigDecimal.ZERO;
            
            String msg = String.format("%s (%s) - R$ %.2f", banco, desc, valor.doubleValue());
            notificacoes.add(new NotificacaoResponse(titulo, msg, tipo, b.getId()));
        }

        return notificacoes;
    }
}