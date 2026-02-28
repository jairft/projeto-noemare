package com.noemare.api.services;

import java.time.LocalDateTime; // 👉 Importado para capturar a data/hora atual
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import org.springframework.beans.factory.annotation.Value; 
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.Funcionario;
import com.noemare.api.domain.enums.RoleFuncionario;
import com.noemare.api.domain.enums.StatusConta;
import com.noemare.api.dtos.request.FuncionarioRegistroRequest;
import com.noemare.api.dtos.request.LoginRequest; 
import com.noemare.api.dtos.request.AlterarSenhaRequest; 
import com.noemare.api.dtos.response.FuncionarioResponse;
import com.noemare.api.dtos.response.LoginResponse; 
import com.noemare.api.exceptions.RegraNegocioException;
import com.noemare.api.repositories.FuncionarioRepository;
import com.noemare.api.infra.security.TokenService; 

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;
    private final AuthenticationManager authenticationManager; 
    private final TokenService tokenService; 

    @Value("${api.security.master-code}")
    private String codigoMestreAdmin;

    public FuncionarioService(FuncionarioRepository funcionarioRepository, 
                              PasswordEncoder passwordEncoder,
                              LogService logService,
                              AuthenticationManager authenticationManager,
                              TokenService tokenService) {
        this.funcionarioRepository = funcionarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    public LoginResponse login(LoginRequest data) {
        try {
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.email(), data.senha());
            Authentication auth = this.authenticationManager.authenticate(usernamePassword);

            Funcionario funcionario = (Funcionario) auth.getPrincipal();

            if (funcionario.getStatusConta() == StatusConta.INATIVO) {
                throw new RegraNegocioException("Sua conta ainda não foi ativada por um administrador.");
            }

            // 1. Atualiza a data do último login
            funcionario.setUltimoLogin(LocalDateTime.now());
            funcionarioRepository.save(funcionario);

            // 👉 2. NOVO: Identifica o dispositivo e salva no log!
            String dispositivo = identificarDispositivo();
            logService.registrarLog(
                "LOGIN_EFETUADO", 
                "Funcionario", 
                funcionario.getId(), 
                "Login realizado com sucesso via: " + dispositivo
            );

            String token = tokenService.gerarToken(funcionario);

            return new LoginResponse(token);

        } catch (BadCredentialsException | InternalAuthenticationServiceException e) {
            throw new RegraNegocioException("E-mail ou senha incorretos.");
        }
    }

    @Transactional
    public FuncionarioResponse registrar(FuncionarioRegistroRequest request) {
        if (!request.senha().equals(request.confirmacaoSenha())) {
            throw new RegraNegocioException("A senha e a confirmação de senha não conferem.");
        }

        if (funcionarioRepository.existsByEmail(request.email())) {
            throw new RegraNegocioException("Este e-mail já está cadastrado no sistema.");
        }

        Funcionario funcionario = new Funcionario();
        funcionario.setNome(request.nome());
        funcionario.setSobrenome(request.sobrenome());
        funcionario.setEmail(request.email());
        funcionario.setSenha(passwordEncoder.encode(request.senha()));
        funcionario.setRole(request.role());

        if (request.role() == RoleFuncionario.ADMIN) {
            if (request.codigoMestre() == null || !request.codigoMestre().equals(this.codigoMestreAdmin)) {
                throw new RegraNegocioException("Código mestre inválido.");
            }
            funcionario.setStatusConta(StatusConta.ATIVO);
        } else {
            funcionario.setStatusConta(StatusConta.INATIVO);
        }

        // Importante: No cadastro não preenchemos o último login, ele só será preenchido no primeiro acesso.
        funcionarioRepository.save(funcionario);

        logService.registrarLog("CADASTRAR_FUNCIONARIO", "Funcionario", funcionario.getId(), 
                                "Novo cadastro: " + funcionario.getEmail());

        return new FuncionarioResponse(funcionario);
    }

    @Transactional
    public void alterarSenhaPropria(Long id, AlterarSenhaRequest request) {
        Funcionario funcionario = funcionarioRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Funcionário não encontrado."));

        if (!passwordEncoder.matches(request.senhaAtual(), funcionario.getSenha())) {
            throw new RegraNegocioException("A senha atual informada está incorreta.");
        }

        funcionario.setSenha(passwordEncoder.encode(request.novaSenha()));
        funcionarioRepository.save(funcionario);

        logService.registrarLog(
            "ALTERAR_SENHA_PROPRIA", 
            "Funcionario", 
            funcionario.getId(), 
            "O usuário " + funcionario.getEmail() + " alterou sua própria senha."
        );
    }

    @Transactional
    public FuncionarioResponse ativarContaComSenha(Long id, String senhaDigitada, Funcionario adminLogado) {
        if (!passwordEncoder.matches(senhaDigitada, adminLogado.getSenha())) {
            throw new RegraNegocioException("Senha de Administrador incorreta. Ativação cancelada.");
        }

        Funcionario funcionario = funcionarioRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Funcionário não encontrado."));

        if (funcionario.getStatusConta() == StatusConta.ATIVO) {
            throw new RegraNegocioException("Esta conta já se encontra ativa.");
        }

        funcionario.ativar();
        funcionarioRepository.save(funcionario);

        logService.registrarLog(
            "ATIVAR_FUNCIONARIO", 
            "Funcionario", 
            funcionario.getId(), 
            "Conta de " + funcionario.getEmail() + " ativada pelo Admin: " + adminLogado.getEmail()
        );

        return new FuncionarioResponse(funcionario);
    }

    public List<FuncionarioResponse> listarTodos() {
        return funcionarioRepository.findAll().stream()
                .map(FuncionarioResponse::new) 
                .toList();
    }

    @Transactional
    public void excluirComSenha(Long id, String senhaDigitada, Funcionario adminLogado) {
        if (!passwordEncoder.matches(senhaDigitada, adminLogado.getSenha())) {
            throw new RegraNegocioException("Senha de Administrador incorreta. Exclusão cancelada.");
        }

        Funcionario funcionario = funcionarioRepository.findById(id)
                .orElseThrow(() -> new RegraNegocioException("Funcionário não encontrado."));

        if (funcionario.getRole() == RoleFuncionario.ADMIN) {
            throw new RegraNegocioException("Não é permitido excluir um usuário Administrador.");
        }

        funcionarioRepository.delete(funcionario);

        logService.registrarLog(
            "EXCLUIR_FUNCIONARIO", 
            "Funcionario", 
            id, 
            "Usuário: " + funcionario.getEmail() + " | Excluído por Admin: " + adminLogado.getEmail()
        );
    }

    public void solicitarRecuperacaoSenha(String email) {
        Funcionario funcionario = funcionarioRepository.findByEmail(email)
                .orElseThrow(() -> new RegraNegocioException("E-mail não encontrado."));
        
        funcionario.setSolicitouRecuperacaoSenha(true); 
        funcionarioRepository.save(funcionario);
        
        logService.registrarLog("SOLICITACAO_SENHA", "Funcionario", funcionario.getId(), "Solicitação de redefinição de senha enviada.");
    }

    @Transactional
    public void redefinirSenhaUsuario(Long idUsuario, String senhaAdmin, String novaSenhaUsuario, Funcionario adminLogado) {
        if (!passwordEncoder.matches(senhaAdmin, adminLogado.getSenha())) {
            throw new RegraNegocioException("Senha de Administrador incorreta.");
        }

        Funcionario funcionario = funcionarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RegraNegocioException("Funcionário não encontrado."));

        funcionario.setSenha(passwordEncoder.encode(novaSenhaUsuario));
        funcionario.setSolicitouRecuperacaoSenha(false); 
        funcionarioRepository.save(funcionario);

        logService.registrarLog("REDEFINIR_SENHA", "Funcionario", funcionario.getId(), "Senha redefinida pelo Admin: " + adminLogado.getEmail());
    }

    private String identificarDispositivo() {
        try {
            // Captura a requisição HTTP atual
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String userAgent = request.getHeader("User-Agent");

            if (userAgent == null) return "Desconhecido";

            // Se o texto contiver indicativos de celular, é Mobile
            String uaLower = userAgent.toLowerCase();
            if (uaLower.contains("mobi") || uaLower.contains("android") || uaLower.contains("iphone")) {
                return "Mobile";
            }
            return "Web/Desktop";
        } catch (Exception e) {
            return "Desconhecido";
        }
    }
}