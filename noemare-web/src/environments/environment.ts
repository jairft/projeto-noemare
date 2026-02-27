export const environment = {
  production: false,
  
  // Link da API (que já estava aí)
  apiUrl: `http://${window.location.hostname}:8080/api`, 
 

  // Fica muito mais fácil de achar e mudar o IP no futuro.
  mobileUrl: 'http://10.0.0.128:4200/login-mobile' 
};