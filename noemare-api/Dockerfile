# Estágio 1: Build do .jar (Maven + JDK 21)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Cache de dependências: agiliza os próximos builds se o pom.xml não mudar
COPY pom.xml .
RUN mvn dependency:go-offline

# Compilação ignorando os testes para ser mais rápido no deploy
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: Imagem de execução (Apenas o JRE 21 - muito mais leve e segura)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copia o .jar gerado no estágio anterior para a imagem final
COPY --from=build /app/target/*.jar app.jar

# O Render vai injetar a porta via variável de ambiente PORT. 
# O Spring já está preparado no seu yaml, mas o EXPOSE ajuda na documentação.
EXPOSE 8080

# Comando de inicialização forçando o profile de produção
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]