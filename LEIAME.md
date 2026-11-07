# Cardápio Brasô

Estrutura:

    braso/
      index.html      (página)
      css/style.css   (visual)
      js/app.js       (pizzas, preços e envio para o WhatsApp)
      img/logo.jpg    (logo)

## O que trocar

Abra `js/app.js`. No começo está o bloco `DADOS DA PIZZARIA`:

- `whatsapp`: troque `5535999999999` pelo número da pizzaria (55 + DDD + número, só dígitos).
- `horario`: se quiser mostrar o horário, escreva aqui. Vazio não mostra nada.
- `PIZZAS` e `CATS`: sabores, ingredientes e preços.

## Testar

Dê dois cliques em `index.html` (abre no navegador) ou use a extensão Live Server do VS Code.
Precisa de internet para carregar as fontes.

## Colocar no ar

1. Entre em app.netlify.com/drop
2. Arraste a pasta `braso` inteira.
3. Use o link gerado (dá para renomear nas configurações do site).

Para aparecer no Google: crie o Perfil da Empresa no Google com o link do site e cadastre o site no Google Search Console.
