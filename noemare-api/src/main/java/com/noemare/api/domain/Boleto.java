package com.noemare.api.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.noemare.api.domain.enums.StatusBoleto;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "boletos")
public class Boleto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String descricao;
    
    private String nomeBanco;// Ex: "Conta de Luz", "Fornecedor de Gelo"
    
    private String codigoBarras; // Opcional, para facilitar o pagamento
    
    private BigDecimal valor;
    
    private LocalDate dataVencimento;
    
    @Enumerated(EnumType.STRING)
    private StatusBoleto status = StatusBoleto.PENDENTE;

    private LocalDate dataPagamento;
}