# Avaliação técnica do sistema Noemare

Data: 2026-02-27

## Escopo avaliado
- Backend: `noemare-api` (Spring Boot + PostgreSQL + Flyway).
- Frontend: `noemare-web` (Angular 21).
- Execução de validações locais de build/teste.

## Verificações executadas
1. `mvn test -q` em `noemare-api`.
2. `npm install` em `noemare-web`.
3. `npm run build` em `noemare-web`.

## Resultado executivo
O sistema parece bem avançado em estrutura (separação por camadas, segurança JWT, DTOs, migração com Flyway), porém **não está pronto para validação completa de CI local neste ambiente** devido a bloqueios de dependências no backend e conflito de versões no frontend.

## Pontos fortes observados
- Arquitetura backend organizada em `controllers`, `services`, `repositories`, `dtos`, `infra/security`.
- Segurança com `BCryptPasswordEncoder` e política stateless JWT.
- Uso de Flyway para versionamento de banco.
- Frontend com serviços e componentes separados, incluindo fluxo mobile.

## Achados principais

### 1) Backend não resolve dependências Maven (bloqueio externo)
- O comando `mvn test -q` falhou ao baixar `org.springframework.boot:spring-boot-starter-parent:3.4.2` com retorno HTTP 403 de `repo.maven.apache.org`.
- Impacto: impossível compilar/testar backend até normalizar acesso ao repositório Maven (proxy, mirror corporativo ou política de rede).

### 2) Frontend com conflito de peer dependencies
- `npm install` falha por conflito entre Angular 21 e `ngx-currency@19.0.0` (espera Angular 19).
- Impacto: instalação bloqueada sem uso de `--legacy-peer-deps`/`--force` ou atualização do pacote incompatível.

### 3) Frontend sem dependências instaladas não compila
- `npm run build` falha com `ng: not found`, consequência direta de `npm install` não concluído.

## Riscos técnicos em configuração
- `application.yaml` contém defaults sensíveis para ambiente local:
  - senha padrão de banco;
  - `JWT_SECRET` com fallback estático;
  - `jpa.hibernate.ddl-auto: update` e `show-sql: true`.
- Recomendação: endurecer perfil de produção (`prod`) removendo defaults inseguros e desabilitando opções de desenvolvimento.

## Recomendações priorizadas

### Prioridade alta (imediata)
1. Resolver acesso de dependências do backend (Maven Central/proxy).
2. Ajustar dependência `ngx-currency` para versão compatível com Angular 21 **ou** alinhar versão Angular para compatibilidade.
3. Configurar pipeline CI mínima:
   - backend: `mvn -B -DskipTests compile` + `mvn test`;
   - frontend: `npm ci` + `npm run build`.

### Prioridade média
1. Criar perfis `application-dev.yaml` e `application-prod.yaml` com segredos obrigatórios via variáveis de ambiente.
2. Adicionar quality gates:
   - backend: testes de integração e cobertura;
   - frontend: testes unitários básicos por módulo crítico.

### Prioridade baixa
1. Documentar "como subir" local (pré-requisitos, versões de Java/Node, comandos).
2. Padronizar checklist de release (migrations, variáveis, smoke tests).

## Conclusão
Seu sistema está em estágio avançado e com boa base arquitetural. O principal agora é resolver os gargalos de dependência/ambiente para destravar build e validação automatizada. Depois disso, você já terá uma base sólida para entrar em fase de estabilização final e entrega.
