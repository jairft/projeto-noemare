package com.noemare.api.services;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.PagamentoEmprestimo;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.noemare.api.domain.Emprestimo; // Atualizado
import com.noemare.api.domain.enums.TipoEmprestimo; 
import com.noemare.api.dtos.request.EmprestimoRequest; // Atualizado
import com.noemare.api.dtos.response.EmprestimoResponse; // Atualizado
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.FornecedorRepository;
import com.noemare.api.repositories.EmprestimoRepository; // Atualizado

import com.lowagie.text.*;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

import java.text.NumberFormat;


@Service
public class EmprestimoService { // Atualizado

    private final EmprestimoRepository emprestimoRepository; // Atualizado
    private final FornecedorRepository fornecedorRepository;
    private final LogService logService;

    public EmprestimoService(EmprestimoRepository emprestimoRepository, // Atualizado
                             FornecedorRepository fornecedorRepository,
                             LogService logService) {
        this.emprestimoRepository = emprestimoRepository;
        this.fornecedorRepository = fornecedorRepository;
        this.logService = logService;
    }

    @Transactional
    public EmprestimoResponse criar(EmprestimoRequest request) { // Atualizado
        // 1. Busca o fornecedor
        Fornecedor fornecedor = fornecedorRepository.findById(request.fornecedorId())
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado."));

        // 2. Cria o empréstimo
        Emprestimo emprestimo = new Emprestimo(); // Atualizado
        emprestimo.setFornecedor(fornecedor);
        emprestimo.setTipo(request.tipo());
        emprestimo.setValorTotal(request.valorTotal());
        emprestimo.setDescricao(request.descricao());
        
        // Atualizado para buscar do request (caso você já tenha alterado o request)
        emprestimo.setDataEmprestimo(request.dataEmprestimo()); 

        // 👉 3. Atualiza o saldo do fornecedor (Regra contábil SEPARADA)
        // Se você mudou 'INVESTIMENTO' para 'EMPRESTIMO' no Enum, altere aqui também.
        if (request.tipo() == TipoEmprestimo.INVESTIMENTO) { 
            fornecedor.adicionarSaldoDevedorInvestimento(request.valorTotal());
        } else if (request.tipo() == TipoEmprestimo.ADIANTAMENTO) {
            fornecedor.adicionarSaldoDevedorAdiantamento(request.valorTotal());
        }

        // 4. Salva o empréstimo
        Emprestimo emprestimoSalvo = emprestimoRepository.save(emprestimo); // Atualizado

        // 5. Registra no log
        String detalhesLog = String.format("Empréstimo (%s) de R$ %.2f liberado para %s", // Atualizado
                                            emprestimoSalvo.getTipo(), emprestimoSalvo.getValorTotal(), fornecedor.getNome());
        
        logService.registrarLog(
            "CRIAR_EMPRESTIMO", // Atualizado
            "Empréstimo", // Atualizado
            emprestimoSalvo.getId(), 
            detalhesLog
        );

        return new EmprestimoResponse(emprestimoSalvo); // Atualizado
    }

    @Transactional(readOnly = true)
    public List<EmprestimoResponse> listarTodos() { // Atualizado
        return emprestimoRepository.findAll().stream() // Atualizado
                .map(EmprestimoResponse::new) // Atualizado
                .toList();
    }

   @Transactional(readOnly = true)
    public List<EmprestimoResponse> listarHistoricoInvestimentosPorFornecedor(Long fornecedorId) {
        
        if (!fornecedorRepository.existsById(fornecedorId)) {
            throw new RegraNegocioException("Fornecedor não encontrado.");
        }

        // Chama a nossa nova query otimizada que já faz o JOIN com os pagamentos
        List<Emprestimo> investimentos = emprestimoRepository
            .findHistoricoCompletoByFornecedorIdAndTipo(fornecedorId, TipoEmprestimo.INVESTIMENTO);

        // O seu EmprestimoResponse agora terá acesso automático à lista "emprestimo.getPagamentos()"
        return investimentos.stream()
                .map(EmprestimoResponse::new)
                .toList();
    }

    public byte[] gerarRelatorioPdfInvestimentos(Long fornecedorId) {
        Fornecedor fornecedor = fornecedorRepository.findById(fornecedorId)
                .orElseThrow(() -> new RegraNegocioException("Fornecedor não encontrado"));

        // Busca os investimentos e os pagamentos usando a query otimizada
        List<Emprestimo> investimentos = emprestimoRepository
            .findHistoricoCompletoByFornecedorIdAndTipo(fornecedorId, TipoEmprestimo.INVESTIMENTO);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 54);
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Definição de Cores Premium
            Color navyBlue = new Color(15, 23, 42);   
            Color accentBlue = new Color(37, 99, 235); 
            Color softGray = new Color(248, 250, 252); 
            Color borderGray = new Color(228, 233, 242);
            Color dangerRed = new Color(220, 38, 38);
            Color successGreen = new Color(5, 150, 105);

            // Fontes
            Font fontBrand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, navyBlue);
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, accentBlue);
            Font fontSub = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Font fontTableHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font fontNoteHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, navyBlue);
            Font fontCell = FontFactory.getFont(FontFactory.HELVETICA, 9, navyBlue);
            Font fontTotal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, accentBlue);
            
            // 👉 NOVA FONTE: Para a descrição do investimento (itálico)
            Font fontDescInvestimento = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, Color.DARK_GRAY);
            
            // Fontes especiais para o saldo restante
            Font fontSaldo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, dangerRed);
            Font fontSaldoZerado = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, successGreen);

            NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
            DateTimeFormatter dateOnlyFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            // 2. Cabeçalho Centralizado
            PdfPTable headerLine = new PdfPTable(1);
            headerLine.setWidthPercentage(100);
            
            PdfPCell brandCell = new PdfPCell(new Phrase("NOÉ MARÉ", fontBrand));
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            headerLine.addCell(brandCell);

            PdfPCell titleCell = new PdfPCell(new Phrase("EXTRATO DE INVESTIMENTOS", fontTitle));
            titleCell.setBorder(Rectangle.BOTTOM);
            titleCell.setBorderColor(accentBlue);
            titleCell.setBorderWidth(2f);
            titleCell.setPaddingBottom(10f);
            titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            headerLine.addCell(titleCell);
            
            document.add(headerLine);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Fornecedor: " + fornecedor.getNome().toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            document.add(new Paragraph("Gerado em: " + java.time.LocalDateTime.now().format(dateTimeFormatter), fontSub));
            document.add(new Paragraph(" "));

            BigDecimal totalInvestido = BigDecimal.ZERO;
            BigDecimal totalSaldoRestante = BigDecimal.ZERO;

            // 3. Listagem de Investimentos
            for (Emprestimo inv : investimentos) {
                // Header do Investimento
                PdfPTable invTable = new PdfPTable(3);
                invTable.setWidthPercentage(100);
                invTable.setWidths(new float[]{4, 3, 3});
                invTable.setSpacingBefore(15f);

                PdfPCell cellId = new PdfPCell(new Phrase("INVESTIMENTO #" + inv.getId(), fontNoteHeader));
                cellId.setBorder(Rectangle.NO_BORDER);
                invTable.addCell(cellId);

                PdfPCell cellData = new PdfPCell(new Phrase("Data: " + inv.getDataEmprestimo().format(dateOnlyFormatter), fontSub));
                cellData.setBorder(Rectangle.NO_BORDER);
                invTable.addCell(cellData);

                PdfPCell cellStatus = new PdfPCell(new Phrase(inv.getStatus().name() + " - " + currencyFormatter.format(inv.getValorTotal()), fontNoteHeader));
                cellStatus.setBorder(Rectangle.NO_BORDER);
                cellStatus.setHorizontalAlignment(Element.ALIGN_RIGHT);
                invTable.addCell(cellStatus);

                // 👉 NOVO: Adicionando a linha com a Descrição do Investimento
                String textoDescricao = (inv.getDescricao() != null && !inv.getDescricao().trim().isEmpty()) 
                                        ? "Motivo/Descrição: " + inv.getDescricao() 
                                        : "Motivo/Descrição: Não informada";
                                        
                PdfPCell cellDescInv = new PdfPCell(new Phrase(textoDescricao, fontDescInvestimento));
                cellDescInv.setColspan(3); // Faz a célula ocupar a linha toda (as 3 colunas)
                cellDescInv.setBorder(Rectangle.NO_BORDER);
                cellDescInv.setPaddingTop(2f);
                cellDescInv.setPaddingBottom(6f); // Espaçamento antes de começar a tabela preta
                invTable.addCell(cellDescInv);

                document.add(invTable);

                // Tabela de Pagamentos/Abatimentos
                PdfPTable pagTable = new PdfPTable(3);
                pagTable.setWidthPercentage(100);
                pagTable.setWidths(new float[]{3, 5, 3});
                pagTable.setSpacingBefore(0f); // Reduzi o spacing aqui porque a descrição já dá o espaçamento

                String[] headers = {"DATA ABATIMENTO", "DESCRIÇÃO", "VALOR PAGO"};
                for (String h : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(h, fontTableHeader));
                    cell.setBackgroundColor(navyBlue);
                    cell.setBorderColor(navyBlue);
                    cell.setPadding(6f);
                    pagTable.addCell(cell);
                }

                // Se não houver pagamentos, mostra a mensagem de Empty State
                if (inv.getPagamentos() == null || inv.getPagamentos().isEmpty()) {
                    PdfPCell emptyCell = new PdfPCell(new Phrase("Nenhum abatimento registrado.", fontSub));
                    emptyCell.setColspan(3);
                    emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    emptyCell.setPadding(10f);
                    emptyCell.setBackgroundColor(Color.WHITE);
                    emptyCell.setBorderColor(borderGray);
                    pagTable.addCell(emptyCell);
                } else {
                    int count = 0;
                    for (PagamentoEmprestimo pag : inv.getPagamentos()) {
                        Color rowColor = (count % 2 == 0) ? Color.WHITE : softGray;
                        
                        PdfPCell c1 = new PdfPCell(new Phrase(pag.getDataPagamento().format(dateTimeFormatter), fontCell));
                        PdfPCell c2 = new PdfPCell(new Phrase(pag.getDescricao() != null ? pag.getDescricao() : "Abatimento no sistema", fontCell));
                        PdfPCell c3 = new PdfPCell(new Phrase(currencyFormatter.format(pag.getValor()), fontCell));

                        for (PdfPCell c : new PdfPCell[]{c1, c2, c3}) {
                            c.setBackgroundColor(rowColor);
                            c.setBorderColor(borderGray);
                            c.setPadding(5f);
                            if (c == c3) c.setHorizontalAlignment(Element.ALIGN_RIGHT);
                            pagTable.addCell(c);
                        }
                        count++;
                    }
                }
                document.add(pagTable);

                // Rodapé com o Saldo Restante daquele Investimento
                PdfPTable saldoTable = new PdfPTable(1);
                saldoTable.setWidthPercentage(100);
                Font currentSaldoFont = inv.getSaldoRestante().compareTo(BigDecimal.ZERO) == 0 ? fontSaldoZerado : fontSaldo;
                
                PdfPCell saldoCell = new PdfPCell(new Phrase("SALDO RESTANTE: " + currencyFormatter.format(inv.getSaldoRestante()), currentSaldoFont));
                saldoCell.setBorder(Rectangle.BOTTOM);
                saldoCell.setBorderColor(borderGray);
                saldoCell.setPaddingTop(5f);
                saldoCell.setPaddingBottom(10f);
                saldoCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                saldoTable.addCell(saldoCell);
                
                document.add(saldoTable);

                // Soma os totais gerais (KPIs)
                totalInvestido = totalInvestido.add(inv.getValorTotal());
                totalSaldoRestante = totalSaldoRestante.add(inv.getSaldoRestante());
            }

            // 4. KPIs Finais (Rodapé do Documento)
            document.add(new Paragraph(" "));
            PdfPTable footerTable = new PdfPTable(2);
            footerTable.setWidthPercentage(100);
            footerTable.setSpacingBefore(20f);

            PdfPCell totalLabel = new PdfPCell(new Phrase("TOTAL INVESTIMENTOS: " + currencyFormatter.format(totalInvestido), fontTotal));
            totalLabel.setBorder(Rectangle.TOP);
            totalLabel.setBorderColor(accentBlue);
            totalLabel.setPaddingTop(10f);
            footerTable.addCell(totalLabel);

            PdfPCell totalVal = new PdfPCell(new Phrase("SALDO A PAGAR: " +currencyFormatter.format(totalSaldoRestante), fontTotal));
            totalVal.setBorder(Rectangle.TOP);
            totalVal.setBorderColor(accentBlue);
            totalVal.setPaddingTop(10f);
            totalVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            footerTable.addCell(totalVal);

            document.add(footerTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF de investimentos", e);
        }
    }
}