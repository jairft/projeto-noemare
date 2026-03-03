package com.noemare.api.services;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.NotaFornecedor;
import com.noemare.api.domain.NotaItem;
import com.noemare.api.domain.enums.StatusFornecedor;
import com.noemare.api.domain.enums.TipoEmprestimo;
import com.noemare.api.dtos.request.FornecedorRequest;
import com.noemare.api.dtos.response.FornecedorResponse;
import com.noemare.api.dtos.response.HistoricoGeralFornecedorResponse;
import com.noemare.api.dtos.response.ItemAgrupadoResponse;
import com.noemare.api.dtos.response.ItemNotaHistoricoResponse;
import com.noemare.api.dtos.response.NotaHistoricoResponse;
import com.noemare.api.dtos.response.SaldoFornecedorResponse;
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.FornecedorRepository;
import com.noemare.api.repositories.EmprestimoRepository; // Atualizado
import com.noemare.api.repositories.NotaFornecedorRepository;

@Service
public class FornecedorService {

    private final FornecedorRepository repository;
    private final EmprestimoRepository emprestimoRepository; // Atualizado
    private final NotaFornecedorRepository notaRepository;
    private final LogService logService;

    public FornecedorService(FornecedorRepository repository, 
                             NotaFornecedorRepository notaRepository, 
                             EmprestimoRepository emprestimoRepository, // Atualizado
                             LogService logService) {
        this.repository = repository;
        this.notaRepository = notaRepository;
        this.emprestimoRepository = emprestimoRepository; // Atualizado
        this.logService = logService;
    }

    @Transactional(readOnly = true)
    public List<FornecedorResponse> listarTodos(Integer ano) {
        if (ano == null) {
            ano = Year.now().getValue();
        }
        final Integer anoFiltro = ano;

        return repository.findAll().stream().map(f -> {
            BigDecimal saldoCredorAno = notaRepository.somarSaldoCredorPorFornecedorEAno(f.getId(), anoFiltro);
            
            // 👉 ATUALIZAÇÃO: Busca os dois saldos separados do EmprestimoRepository
           BigDecimal saldoEmprestimoAno = emprestimoRepository.somarSaldoRestantePorFornecedorETipoEAno(f.getId(), TipoEmprestimo.INVESTIMENTO, anoFiltro);
           BigDecimal saldoAdiantamentoAno = emprestimoRepository.somarSaldoRestantePorFornecedorETipoEAno(f.getId(), TipoEmprestimo.ADIANTAMENTO, anoFiltro);
            
            // Passa os 3 saldos para o construtor do Response
            return new FornecedorResponse(f, saldoEmprestimoAno, saldoAdiantamentoAno, saldoCredorAno);
        }).toList();
    }

    @Transactional
    public FornecedorResponse salvar(FornecedorRequest request) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(request.nome().toUpperCase());
        Fornecedor salvo = repository.save(fornecedor);

        // 👉 Auditoria: Cadastro de novo fornecedor
        logService.registrarLog("CADASTRAR_FORNECEDOR", "Fornecedor", salvo.getId(), 
            "Fornecedor cadastrado. Nome: " + salvo.getNome());

        return new FornecedorResponse(salvo);
    }

    @Transactional
    public FornecedorResponse atualizarNome(Long id, String novoNome) {
        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado."));
        
        String nomeAntigo = fornecedor.getNome();
        fornecedor.setNome(novoNome);
        Fornecedor salvo = repository.save(fornecedor);

        // 👉 Auditoria: Alteração de nome
        logService.registrarLog("ATUALIZAR_NOME_FORNECEDOR", "Fornecedor", id, 
            "Nome atualizado. De: " + nomeAntigo + " Para: " + novoNome);

        return new FornecedorResponse(salvo);
    }

    @Transactional(readOnly = true)
    public FornecedorResponse buscarPorId(Long id) {
        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado com o ID: " + id));
        return new FornecedorResponse(fornecedor);
    }

    @Transactional
    public void alterarStatus(Long id, StatusFornecedor novoStatus) {
        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado."));
        
        if (fornecedor.getStatus() == novoStatus) {
            throw new RegraNegocioException("O fornecedor já possui o status " + novoStatus);
        }
        
        fornecedor.setStatus(novoStatus);
        repository.save(fornecedor);

        // 👉 Auditoria: Mudança de status (Ativo/Inativo)
        logService.registrarLog("ALTERAR_STATUS_FORNECEDOR", "Fornecedor", id, 
            "Status alterado para: " + novoStatus);
    }

    @Transactional(readOnly = true)
    public SaldoFornecedorResponse buscarSaldosDevedores(Long fornecedorId) {
        if (!repository.existsById(fornecedorId)) {
            throw new RegraNegocioException("Fornecedor não encontrado.");
        }
        BigDecimal totalEmprestimo = emprestimoRepository.somarSaldoRestantePorFornecedorETipo( // Atualizado
                fornecedorId, TipoEmprestimo.INVESTIMENTO);
        BigDecimal totalAdiantamento = emprestimoRepository.somarSaldoRestantePorFornecedorETipo( // Atualizado
                fornecedorId, TipoEmprestimo.ADIANTAMENTO);
        return new SaldoFornecedorResponse(totalEmprestimo, totalAdiantamento); // O construtor do DTO pode precisar de ajuste se os parâmetros internos dele ainda se chamarem investimento
    }

    @Transactional(readOnly = true)
    public HistoricoGeralFornecedorResponse obterHistoricoGeral(Long fornecedorId) {
        
        // 1. Mantém a sua validação para garantir que o fornecedor existe
        if (!repository.existsById(fornecedorId)) {
            throw new RegraNegocioException("Fornecedor não encontrado.");
        }

        List<NotaFornecedor> notasDoFornecedor = notaRepository.findHistoricoCompletoByFornecedorId(fornecedorId);

        // 3. Pega todos os itens a partir da lista otimizada
        List<NotaItem> todosItens = notasDoFornecedor.stream()
            .flatMap(nota -> nota.getItens().stream())
            .toList();

        // 4. Agrupa os itens (Sua lógica original preservada)
        Map<String, ItemAgrupadoResponse> agrupado = todosItens.stream()
            .collect(Collectors.groupingBy(
                item -> item.getProduto().getNome() + "-" + item.getProduto().getTipo() + "-" + item.getProduto().getTamanho(),
                Collectors.collectingAndThen(
                    Collectors.toList(),
                    list -> {
                        var primeiro = list.get(0).getProduto();
                        BigDecimal kg = list.stream().map(NotaItem::getQuantidadeKg).reduce(BigDecimal.ZERO, BigDecimal::add);
                        BigDecimal valor = list.stream().map(NotaItem::getValorTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                        return new ItemAgrupadoResponse(primeiro.getNome(), primeiro.getTipo(), primeiro.getTamanho(), kg, valor);
                    }
                )
            ));

        // 5. Calcula os totais (Sua lógica original preservada)
        BigDecimal kgGeral = todosItens.stream()
            .map(NotaItem::getQuantidadeKg).reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal valorGeral = todosItens.stream()
            .map(NotaItem::getValorTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

        // 6. Mapeia as Notas e seus Itens a partir da lista otimizada
        List<NotaHistoricoResponse> notasDetalhas = notasDoFornecedor.stream()
            .sorted((n1, n2) -> n2.getDataNota().compareTo(n1.getDataNota())) 
            .map(nota -> {
                List<ItemNotaHistoricoResponse> itensDaNota = nota.getItens().stream()
                    .map(item -> new ItemNotaHistoricoResponse(
                        item.getProduto().getNome(),
                        item.getProduto().getTipo(),
                        item.getProduto().getTamanho(),
                        item.getQuantidadeKg(),
                        item.getValorTotal()
                    ))
                    .toList();

                return new NotaHistoricoResponse(
                    nota.getId(),
                    nota.getNumeroNota(), 
                    nota.getDataNota(), 
                    nota.getValorTotal(),
                    nota.getStatus().name(), 
                    itensDaNota
                );
            })
            .toList();

        // 7. Retorna o objeto completo para o Front-end
        return new HistoricoGeralFornecedorResponse(
            kgGeral, 
            valorGeral, 
            new ArrayList<>(agrupado.values()),
            notasDetalhas 
        );
    }

    @Transactional
    public void excluir(Long id) {
        Fornecedor fornecedor = repository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado"));

        boolean possuiNotas = notaRepository.existsByFornecedorId(id);
        boolean possuiDividas = emprestimoRepository.existsByFornecedorId(id); // Atualizado

        if (possuiNotas || possuiDividas) {
            throw new RegraNegocioException("Não é possível excluir um fornecedor com histórico financeiro. Altere o status para INATIVO.");
        }

        // 👉 Auditoria: Exclusão permanente
        logService.registrarLog("EXCLUIR_FORNECEDOR", "Fornecedor", id, 
            "Fornecedor removido permanentemente. Nome: " + fornecedor.getNome());

        repository.delete(fornecedor);
    }

    public byte[] gerarRelatorioPdf(Long fornecedorId) {
        Fornecedor fornecedor = repository.findById(fornecedorId)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado"));

        List<NotaFornecedor> notas = notaRepository.findHistoricoCompletoByFornecedorId(fornecedorId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 54); // Margens arejadas
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Definição de Cores Premium (Baseadas na sua UI)
            Color navyBlue = new Color(15, 23, 42);   // Cor do seu header escuro
            Color accentBlue = new Color(37, 99, 235); // Azul primário
            Color softGray = new Color(248, 250, 252); // Fundo de tabelas
            Color borderGray = new Color(228, 233, 242);

            // Fontes
            Font fontBrand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, navyBlue);
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, accentBlue);
            Font fontSub = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Font fontTableHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font fontNoteHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, navyBlue);
            Font fontCell = FontFactory.getFont(FontFactory.HELVETICA, 9, navyBlue);
            Font fontTotal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, accentBlue);

            NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
            
            // Dois formatadores: Um sem hora para a Nota, um com hora para o Relatório
            DateTimeFormatter dateNotaFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            // 2. Cabeçalho Estilizado
            PdfPTable headerLine = new PdfPTable(1);
            headerLine.setWidthPercentage(100);
            
            // Nome da Empresa Centralizado
            PdfPCell brandCell = new PdfPCell(new Phrase("NOÉ MARÉ", fontBrand));
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.setHorizontalAlignment(Element.ALIGN_CENTER); 
            headerLine.addCell(brandCell);

            // Subtítulo também centralizado
            PdfPCell titleCell = new PdfPCell(new Phrase("EXTRATO DE NOTAS", fontTitle));
            titleCell.setBorder(Rectangle.BOTTOM);
            titleCell.setBorderColor(accentBlue);
            titleCell.setBorderWidth(2f);
            titleCell.setPaddingBottom(10f);
            titleCell.setHorizontalAlignment(Element.ALIGN_CENTER); 
            headerLine.addCell(titleCell);
            
            document.add(headerLine);

            // Adiciona um espaçamento antes de começar os dados do fornecedor
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Fornecedor: " + fornecedor.getNome().toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            // Usa o formatador COM horário para o momento da geração
            document.add(new Paragraph("Gerado em: " + java.time.LocalDateTime.now().format(dateTimeFormatter), fontSub));
            document.add(new Paragraph(" "));

            BigDecimal pesoTotalGeral = BigDecimal.ZERO;
            BigDecimal valorTotalGeral = BigDecimal.ZERO;

            // 👉 Variável de controle para sabermos em qual nota estamos
            int indexNota = 0; 

            // 3. Listagem de Notas
            for (NotaFornecedor nota : notas) {
                // Header da Nota
                PdfPTable noteTable = new PdfPTable(3);
                noteTable.setWidthPercentage(100);
                noteTable.setWidths(new float[]{4, 3, 3});
                noteTable.setSpacingBefore(15f);

                PdfPCell cellNota = new PdfPCell(new Phrase("NOTA #" + (nota.getNumeroNota() != null ? nota.getNumeroNota() : nota.getId()), fontNoteHeader));
                cellNota.setBorder(Rectangle.NO_BORDER);
                noteTable.addCell(cellNota);

                // Usando `dateNotaFormatter` para mostrar apenas DD/MM/YYYY nas notas
                PdfPCell cellData = new PdfPCell(new Phrase("Data da Nota: " + nota.getDataNota().format(dateNotaFormatter), fontSub));
                cellData.setBorder(Rectangle.NO_BORDER);
                noteTable.addCell(cellData);

                PdfPCell cellStatus = new PdfPCell(new Phrase(nota.getStatus().name() + " - " + currencyFormatter.format(nota.getValorTotal()), fontNoteHeader));
                cellStatus.setBorder(Rectangle.NO_BORDER);
                cellStatus.setHorizontalAlignment(Element.ALIGN_RIGHT);
                noteTable.addCell(cellStatus);
                document.add(noteTable);

                // Tabela de Itens (Clean & Zebra)
                PdfPTable itemsTable = new PdfPTable(3);
                itemsTable.setWidthPercentage(100);
                itemsTable.setWidths(new float[]{5, 2, 3});
                itemsTable.setSpacingBefore(5f);

                // Headers da Tabela
                String[] headers = {"PESCADO", "PESO (KG)", "SUBTOTAL"};
                for (String h : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(h, fontTableHeader));
                    cell.setBackgroundColor(navyBlue);
                    cell.setBorderColor(navyBlue);
                    cell.setPadding(6f);
                    itemsTable.addCell(cell);
                }

                int count = 0;
                for (NotaItem item : nota.getItens()) {
                    Color rowColor = (count % 2 == 0) ? Color.WHITE : softGray;
                    
                    // Adicionando o Tamanho do produto na string
                    String nomeProdutoCompleto = item.getProduto().getNome() + " (" + item.getProduto().getTipo() + ") - " + item.getProduto().getTamanho();
                    
                    PdfPCell c1 = new PdfPCell(new Phrase(nomeProdutoCompleto, fontCell));
                    PdfPCell c2 = new PdfPCell(new Phrase(item.getQuantidadeKg().toString() + " Kg", fontCell));
                    PdfPCell c3 = new PdfPCell(new Phrase(currencyFormatter.format(item.getValorTotal()), fontCell));

                    for (PdfPCell c : new PdfPCell[]{c1, c2, c3}) {
                        c.setBackgroundColor(rowColor);
                        c.setBorderColor(borderGray);
                        c.setPadding(5f);
                        if (c != c1) c.setHorizontalAlignment(Element.ALIGN_RIGHT);
                        itemsTable.addCell(c);
                    }
                    count++;
                }
                document.add(itemsTable);

                // 👉 NOVO: Adiciona a linha separadora elegante (apenas se não for a última nota)
                if (indexNota < notas.size() - 1) {
                    PdfPTable separatorTable = new PdfPTable(1);
                    separatorTable.setWidthPercentage(100);
                    separatorTable.setSpacingBefore(10f); // Espaço acima da linha
                    
                    PdfPCell separatorCell = new PdfPCell(new Phrase(" "));
                    separatorCell.setBorder(Rectangle.BOTTOM);
                    separatorCell.setBorderColor(borderGray); // Usa aquele cinza claro que você já tem
                    separatorCell.setBorderWidth(1f);
                    
                    separatorTable.addCell(separatorCell);
                    document.add(separatorTable);
                }
                
                // Incrementa o índice
                indexNota++;

                pesoTotalGeral = pesoTotalGeral.add(nota.getItens().stream().map(NotaItem::getQuantidadeKg).reduce(BigDecimal.ZERO, BigDecimal::add));
                valorTotalGeral = valorTotalGeral.add(nota.getValorTotal());
            }

            // 4. Rodapé com Resumo Acumulado (KPIs)
            document.add(new Paragraph(" "));
            PdfPTable footerTable = new PdfPTable(2);
            footerTable.setWidthPercentage(100);
            footerTable.setSpacingBefore(20f);

            PdfPCell totalLabel = new PdfPCell(new Phrase("PESO TOTAL ACUMULADO: " + pesoTotalGeral + " Kg", fontTotal));
            totalLabel.setBorder(Rectangle.TOP);
            totalLabel.setBorderColor(accentBlue);
            totalLabel.setPaddingTop(10f);
            footerTable.addCell(totalLabel);

            PdfPCell totalVal = new PdfPCell(new Phrase("INVESTIMENTO TOTAL: " + currencyFormatter.format(valorTotalGeral), fontTotal));
            totalVal.setBorder(Rectangle.TOP);
            totalVal.setBorderColor(accentBlue);
            totalVal.setPaddingTop(10f);
            totalVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            footerTable.addCell(totalVal);

            document.add(footerTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF", e);
        }
    }
}