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
import com.noemare.api.repositories.EmprestimoRepository; // Atualizado
import com.noemare.api.repositories.NotaFornecedorRepository;
import com.noemare.api.repositories.PagamentoNotaRepository;

@Service
public class DashboardService {

    private final NotaFornecedorRepository notaRepository;
    private final PagamentoNotaRepository pagamentoRepository;
    private final FornecedorRepository fornecedorRepository; 
    private final EmprestimoRepository emprestimoRepository; // Atualizado

    public DashboardService(NotaFornecedorRepository notaRepository, 
                            PagamentoNotaRepository pagamentoRepository,
                            FornecedorRepository fornecedorRepository,
                            EmprestimoRepository emprestimoRepository) { // Atualizado
        this.notaRepository = notaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.fornecedorRepository = fornecedorRepository;
        this.emprestimoRepository = emprestimoRepository; // Atualizado
    }

    @Transactional(readOnly = true)
    public DashboardResumoResponse obterResumo(Integer ano) {
        // 1. Garantia de ano de exercício
        if (ano == null) {
            ano = Year.now().getValue();
        }

        // 2. BUSCA DE MÉTRICAS (Tratamento para evitar Erro 500 se o banco retornar null)
        BigDecimal totalAPagar = notaRepository.somarTotalPendentePorAno(ano);
        BigDecimal totalAdiantado = fornecedorRepository.somarTodosSaldosDevedores();
        BigDecimal totalPagoAno = pagamentoRepository.somarPagamentosPorAno(ano);
        long notasPendentes = notaRepository.countPendentesPorAno(ano);

        // 3. PROCESSAMENTO DOS DADOS PARA O GRÁFICO (Evolução da Safra)
        // Criamos um mapa com todos os 12 meses zerados para garantir a integridade do gráfico
        Map<Integer, Double> volumePorMes = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            volumePorMes.put(i, 0.0);
        }

        // Busca os dados reais do banco
        List<Object[]> dadosVolume = notaRepository.somarVolumePorMesNoAno(ano);
        
        // Preenche o mapa com os dados reais onde existirem
        if (dadosVolume != null) {
            dadosVolume.forEach(obj -> {
                if (obj[0] != null) {
                    Integer mes = (Integer) obj[0];
                    BigDecimal volume = (BigDecimal) obj[1];
                    volumePorMes.put(mes, volume != null ? volume.doubleValue() : 0.0);
                }
            });
        }

        // 4. RETORNO COMPLETO (Cards + Mapa de 12 meses para o Gráfico)
        return new DashboardResumoResponse(
            totalAPagar != null ? totalAPagar : BigDecimal.ZERO,
            totalAdiantado != null ? totalAdiantado : BigDecimal.ZERO,
            totalPagoAno != null ? totalPagoAno : BigDecimal.ZERO,
            notasPendentes,
            volumePorMes // 👉 Agora o gráfico sempre recebe 12 meses
        );
    }

   @Transactional(readOnly = true)
    public DashboardFornecedorResponse obterRelatorioFornecedores(Integer ano) { // 👉 Recebe o ano do Controller
        // 1. Define o ano de exercício (ano atual se for nulo)
        final Integer anoFiltro = (ano == null) ? java.time.Year.now().getValue() : ano;

        List<Fornecedor> todosFornecedores = fornecedorRepository.findAll();
        
        BigDecimal totalAdiantadoGlobal = BigDecimal.ZERO;
        BigDecimal totalNotasGlobal = BigDecimal.ZERO;
        BigDecimal totalInvestimentoGlobal = BigDecimal.ZERO;
        BigDecimal totalPagoInvestimentoGlobal = BigDecimal.ZERO;
        BigDecimal totalLiquidoAPagar = BigDecimal.ZERO;
        BigDecimal totalLiquidoAReceber = BigDecimal.ZERO;
        
        List<HistoricoIndividualFornecedorResponse> listaFornecedores = new ArrayList<>();

        for (Fornecedor f : todosFornecedores) {
            // 2. 👉 BUSCA VALORES FILTRADOS POR ANO
            // Repositório de Empréstimos agora filtra por Fornecedor, Tipo e Ano da Safra
            BigDecimal adiantamento = emprestimoRepository.somarSaldoRestantePorFornecedorETipoEAno(f.getId(), TipoEmprestimo.ADIANTAMENTO, anoFiltro);
            BigDecimal investimento = emprestimoRepository.somarSaldoRestantePorFornecedorETipoEAno(f.getId(), TipoEmprestimo.INVESTIMENTO, anoFiltro);
            BigDecimal investimentoPago = emprestimoRepository.somarValorPagoPorFornecedorETipoEAno(f.getId(), TipoEmprestimo.INVESTIMENTO, anoFiltro);
            
            // Repositório de Notas agora busca o total pendente apenas do ano selecionado
            BigDecimal notas = notaRepository.somarTotalPendentePorFornecedorEAno(f.getId(), anoFiltro);

            // Tratamento de nulos para garantir a integridade dos cálculos
            adiantamento = (adiantamento != null) ? adiantamento : BigDecimal.ZERO;
            investimento = (investimento != null) ? investimento : BigDecimal.ZERO;
            investimentoPago = (investimentoPago != null) ? investimentoPago : BigDecimal.ZERO;
            notas = (notas != null) ? notas : BigDecimal.ZERO;

            // 3. Saldo Líquido Corrigido (Notas do Ano - Adiantamentos do Ano)
            BigDecimal saldoLiquido = notas.subtract(adiantamento);

            // 4. Acumula Totais Líquidos para os cards principais de destaque
            if (saldoLiquido.compareTo(BigDecimal.ZERO) > 0) {
                totalLiquidoAPagar = totalLiquidoAPagar.add(saldoLiquido);
            } else if (saldoLiquido.compareTo(BigDecimal.ZERO) < 0) {
                totalLiquidoAReceber = totalLiquidoAReceber.add(saldoLiquido.abs());
            }

            // 5. Acumulação para os Cards Brutos Globais
            totalAdiantadoGlobal = totalAdiantadoGlobal.add(adiantamento);
            totalNotasGlobal = totalNotasGlobal.add(notas);
            totalInvestimentoGlobal = totalInvestimentoGlobal.add(investimento);
            totalPagoInvestimentoGlobal = totalPagoInvestimentoGlobal.add(investimentoPago);

            listaFornecedores.add(new HistoricoIndividualFornecedorResponse(
                f.getId(), 
                f.getNome(), 
                adiantamento, 
                investimento,
                investimentoPago, 
                notas, 
                saldoLiquido, 
                // 👉 A produção também deve ser filtrada pelo ano da safra
                notaRepository.buscarResumoProducaoPorFornecedorEAno(f.getId(), anoFiltro)
            ));
        }

        return new DashboardFornecedorResponse(
            totalAdiantadoGlobal, 
            totalNotasGlobal, 
            totalInvestimentoGlobal,
            totalPagoInvestimentoGlobal,
            totalLiquidoAPagar, 
            totalLiquidoAReceber, 
            listaFornecedores
        );
    }
}