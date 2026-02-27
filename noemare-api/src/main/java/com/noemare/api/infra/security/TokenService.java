package com.noemare.api.infra.security;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.noemare.api.domain.Funcionario;

@Service
public class TokenService {

    @Value("${api.security.token.secret}")
    private String secret;

    // 👉 INJETA O VALOR DO YAML (60000 = 1 minuto)
    @Value("${api.security.token.expiration}")
    private Long expiration;

    public String gerarToken(Funcionario funcionario) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer("noemare-api")
                    .withSubject(funcionario.getEmail())
                    .withClaim("nome", funcionario.getNome())
                    .withClaim("sobrenome", funcionario.getSobrenome())
                    .withClaim("role", funcionario.getRole().name())
                    .withExpiresAt(genExpirationDate())
                    .sign(algorithm);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token jwt", exception);
        }
    }

    public String validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.require(algorithm)
                    .withIssuer("noemare-api")
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            return "";
        }
    }

    
    private Instant genExpirationDate() {
        // Instant.now() trabalha em UTC, ideal para cálculos de tempo de expiração
        return Instant.now().plusMillis(expiration);
    }
}