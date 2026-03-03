package com.noemare.api.services;

import java.math.BigDecimal;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.enums.TipoEmprestimo;
import com.noemare.api.dtos.response.DashboardFornecedorResponse;
import com.noemare.api.dtos.response.DashboardResumoResponse;
import com.noemare.api.dtos.response.HistoricoIndividualFornecedorResponse;
import com.noemare.api.dtos.response.ProducaoItemResumoResponse;
import com.noemare.api.repositories.FornecedorRepository;
import com.noemare.api.repositories.EmprestimoRepository; 
import com.noemare.api.repositories.NotaFornecedorRepository;
import com.noemare.api.repositories.PagamentoNotaRepository;

@Service
public class DashboardService {

    private final NotaFornecedorRepository notaRepository;
    private final PagamentoNotaRepository pagamentoRepository;
    private final FornecedorRepository fornecedorRepository; 
    private final EmprestimoRepository emprestimoRepository;

    public DashboardService(NotaFornecedorRepository notaRepository, 
                            PagamentoNotaRepository pagamentoRepository,
                            FornecedorRepository fornecedorRepository,
                            EmprestimoRepository emprestimoRepository) {
        this.notaRepository = notaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.fornecedorRepository = fornecedorRepository;
        this.emprestimoRepository = emprestimoRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResumoResponse obterResumo(Integer ano) {
        final Integer anoFiltro = (ano == null) ? Year.now().getValue() : ano;

        // 1. BUSCA DE MÉTRICAS 
        BigDecimal totalAPagar = notaRepository.somarTotalPendentePorAno(anoFiltro);
        BigDecimal totalAdiantado = fornecedorRepository.somarTodosSaldosDevedores();
        BigDecimal totalPagoAno = pagamentoRepository.somarPagamentosPorAno(anoFiltro);
        long notasPendentes = notaRepository.countPendentesPorAno(anoFiltro);

        // 2. PROCESSAMENTO DO VOLUME
        Map<Integer, Double> volumePorMes = new HashMap<>();
        for (int i = 1; i <= 12; i++) volumePorMes.put(i, 0.0);

        List<Object[]> dadosVolume = notaRepository.somarVolumePorMesNoAno(anoFiltro);
        
        // 👉 NOVO: Variável para acumular o volume total da safra
        BigDecimal volumeTotalAno = BigDecimal.ZERO; 

        if (dadosVolume != null) {
            for (Object[] obj : dadosVolume) {
                if (obj[0] != null) {
                    Integer mes = (Integer) obj[0];
                    BigDecimal volume = (BigDecimal) obj[1];
                    BigDecimal volTratado = volume != null ? volume : BigDecimal.ZERO;
                    
                    volumePorMes.put(mes, volTratado.doubleValue());
                    volumeTotalAno = volumeTotalAno.add(volTratado); // Acumula o valor para o DTO
                }
            }
        }

        return new DashboardResumoResponse(
            totalAPagar != null ? totalAPagar : BigDecimal.ZERO,
            totalAdiantado != null ? totalAdiantado : BigDecimal.ZERO,
            totalPagoAno != null ? totalPagoAno : BigDecimal.ZERO,
            notasPendentes,
            volumePorMes,
            volumeTotalAno // 👉 NOVO: Enviando o total somado para o Front-end
        );
    }

    @Transactional(readOnly = true)
    public DashboardFornecedorResponse obterRelatorioFornecedores(Integer ano) {
        final Integer anoFiltro = (ano == null) ? Year.now().getValue() : ano;

        List<Fornecedor> todosFornecedores = fornecedorRepository.findAll();
        
        BigDecimal totalAdiantadoGlobal = BigDecimal.ZERO;
        BigDecimal totalNotasGlobal = BigDecimal.ZERO;
        BigDecimal totalInvestimentoGlobal = BigDecimal.ZERO;
        BigDecimal totalPagoInvestimentoGlobal = BigDecimal.ZERO;
        BigDecimal totalLiquidoAPagar = BigDecimal.ZERO;
        BigDecimal totalLiquidoAReceber = BigDecimal.ZERO;
        
        List<HistoricoIndividualFornecedorResponse> listaFornecedores = new ArrayList<>();

        for (Fornecedor f : todosFornecedores) {
            BigDecimal adiantamento = emprestimoRepository.somarSaldoRestantePorFornecedorETipoEAno(f.getId(), TipoEmprestimo.ADIANTAMENTO, anoFiltro);
            BigDecimal investimento = emprestimoRepository.somarSaldoRestantePorFornecedorETipoEAno(f.getId(), TipoEmprestimo.INVESTIMENTO, anoFiltro);
            BigDecimal investimentoPago = emprestimoRepository.somarValorPagoPorFornecedorETipoEAno(f.getId(), TipoEmprestimo.INVESTIMENTO, anoFiltro);
            BigDecimal notas = notaRepository.somarTotalPendentePorFornecedorEAno(f.getId(), anoFiltro);

            adiantamento = (adiantamento != null) ? adiantamento : BigDecimal.ZERO;
            investimento = (investimento != null) ? investimento : BigDecimal.ZERO;
            investimentoPago = (investimentoPago != null) ? investimentoPago : BigDecimal.ZERO;
            notas = (notas != null) ? notas : BigDecimal.ZERO;

            BigDecimal saldoLiquido = notas.subtract(adiantamento);

            if (saldoLiquido.compareTo(BigDecimal.ZERO) > 0) {
                totalLiquidoAPagar = totalLiquidoAPagar.add(saldoLiquido);
            } else if (saldoLiquido.compareTo(BigDecimal.ZERO) < 0) {
                totalLiquidoAReceber = totalLiquidoAReceber.add(saldoLiquido.abs());
            }

            totalAdiantadoGlobal = totalAdiantadoGlobal.add(adiantamento);
            totalNotasGlobal = totalNotasGlobal.add(notas);
            totalInvestimentoGlobal = totalInvestimentoGlobal.add(investimento);
            totalPagoInvestimentoGlobal = totalPagoInvestimentoGlobal.add(investimentoPago);

            // 👉 OTIMIZAÇÃO: Busca produção apenas se houver movimentação financeira no ano
            List<ProducaoItemResumoResponse> producao = new ArrayList<>();
            if (notas.compareTo(BigDecimal.ZERO) > 0 || adiantamento.compareTo(BigDecimal.ZERO) > 0) {
                producao = notaRepository.buscarResumoProducaoPorFornecedorEAno(f.getId(), anoFiltro);
            }

            listaFornecedores.add(new HistoricoIndividualFornecedorResponse(
                f.getId(), f.getNome(), adiantamento, investimento,
                investimentoPago, notas, saldoLiquido, producao
            ));
        }

        return new DashboardFornecedorResponse(
            totalAdiantadoGlobal, totalNotasGlobal, totalInvestimentoGlobal,
            totalPagoInvestimentoGlobal, totalLiquidoAPagar, totalLiquidoAReceber, 
            listaFornecedores
        );
    }
}