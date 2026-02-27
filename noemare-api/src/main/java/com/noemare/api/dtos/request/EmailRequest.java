package com.noemare.api.dtos.request;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailRequest(
    @NotBlank(message = "O e-mail é obrigatório.") 
    @Email(message = "Formato de e-mail inválido.") 
    String email
) {}