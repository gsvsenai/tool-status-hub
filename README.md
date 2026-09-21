# Tool Status Hub

preciso de uma interface web para exibir o nome da ferramenta, status, ultimo q alterou e horário de alteração.

meu database:
CREATE TABLE IF NOT EXISTS public."Ferramentas" (id bigint NOT NULL, status boolean, last_update timestamp with time zone DEFAULT now(), last_user bigint, nome character varying NOT NULL);

codigo do esp32:
//BIBLIOTECAS WIFI

#include <WiFi.h>

#include <DNSServer.h>

#include <WebServer.h>

#include <WiFiManager.h>

//BIBLIOTECA FUNÇÕES SINCRONAS

#include <Ticker.h>

//BIBLIOTECA METODOS JSON

#include <HTTPClient.h>

#define LED_DESCONECTADO 33

#define LED_CONECTADO 25

#define LED_ERRO_SUPABASE 32

#define BUTTON_CLEAN_CONNECT 14

#define INPUT_UPDATE_TOOL 13

#define BUTTON_RECONNECT 12

WiFiManager wifiManager;

Ticker ledTicker;

bool statusConnect = false;

bool statusFerramenta = false; 

//FUNÇÃO PISCAR LED

void piscarLED() {

  digitalWrite(LED_CONECTADO, !digitalRead(LED_CONECTADO));

}

//FUNÇÃO ABRIR PONTO DE ACESSO(SEM INTERROMPER)

void configModeCallback(WiFiManager *myWiFiManager) {

  ledTicker.detach();                 

  digitalWrite(LED_CONECTADO, LOW);  

  digitalWrite(LED_DESCONECTADO, HIGH); 

  Serial.println("Portal AP aberto. Aguardando credenciais...");

}

//FUNÇÃO INICIAR CONEXÃO

void saveConfigCallback() {

  digitalWrite(LED_DESCONECTADO, LOW);    

  ledTicker.attach(0.25, piscarLED);  

  Serial.println("Credenciais enviadas! Tentando conectar na nova rede...");

}

//CONFIGURAÇÕES SUPABASE

const char* SUPABASE_BASE_URL = "https://ogfkwgrholtagdqvpykj.supabase.co/rest/v1/"; 

const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZmt3Z3Job2x0YWdkcXZweWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjQ4NTMsImV4cCI6MjEwNDY0MDg1M30.gnq60ev67wgkLpwg1oVJH-HisMI8uJXNqxHKp8wQkW4";

// FUNÇÃO PARA ENVIAR DADOS EM FORMATO JSON

// tabela: nome da tabela (ex: "kanban" ou "kanban?id=eq.10")

// payloadJson: dados em formato JSON (ex: "{\"status\":\"CONCLUIDO\"}")

// metodo: "POST" (para INSERT) ou "PATCH" (para UPDATE)

bool atualizaFerramenta(String tabelaComFiltro, String payloadJson) {

  HTTPClient http;

  String url = String(SUPABASE_BASE_URL) + tabelaComFiltro;

  

  http.begin(url);

  http.addHeader("Content-Type", "application/json");

  http.addHeader("apikey", SUPABASE_KEY);

  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  http.addHeader("Prefer", "return=minimal"); 

  http.setTimeout(4000); 

  int httpCode = http.PATCH(payloadJson);

  http.end();

  if (httpCode >= 200 && httpCode < 300) {

    digitalWrite(LED_ERRO_SUPABASE, LOW);

    Serial.println("[SUPABASE] Ferramenta atualizada!");

    return true;

  } else {

    digitalWrite(LED_ERRO_SUPABASE, HIGH); 

    Serial.print("[SUPABASE] Erro HTTP: ");

    Serial.println(httpCode);

    return false;

  }

}

void setup() {

  Serial.begin(115200);

  pinMode(LED_CONECTADO, OUTPUT); 

  pinMode(LED_DESCONECTADO, OUTPUT);

  pinMode(LED_ERRO_SUPABASE, OUTPUT);    

  pinMode(BUTTON_CLEAN_CONNECT, INPUT_PULLDOWN);

  pinMode(BUTTON_RECONNECT, INPUT_PULLDOWN);

  pinMode(INPUT_UPDATE_TOOL, INPUT_PULLDOWN);

  digitalWrite(LED_CONECTADO, LOW);  

  digitalWrite(LED_DESCONECTADO, LOW);     

  //INICIAR INDICAÇÃO DE CONECTANDO

  ledTicker.attach(0.25, piscarLED);

  //DFININDO TEMPO DE TENTATIVA DE CONEXÃO

  wifiManager.setConnectTimeout(3);

  //DEFININDO TEMPO DE PORTAL ABERTO COMO NULO

  wifiManager.setConfigPortalTimeout(0);

  //DEFININDO PORTAL ABERTO COMO NÃO INTERRUPTOR

  wifiManager.setConfigPortalBlocking(false);

  //CHAMANDO FUNÇÕES DEFINIDAS DE CONEXÃO E PONTO DE ACESSO

  wifiManager.setAPCallback(configModeCallback);

  wifiManager.setSaveConfigCallback(saveConfigCallback);

  //DEFININDO CREDENCIAIS DE PONTO DE ACESSO

  wifiManager.autoConnect("Smart-Kanban", ".sk3000.");

}

void loop() {

  //MANTENDO PROCESSO DE CONEXÕES ATIVOS

  wifiManager.process();

  //BOTÃO PARA LIMPAR CONEXÃO SALVA E REINICIAR

  if (digitalRead(BUTTON_CLEAN_CONNECT) == HIGH) {

    wifiManager.resetSettings(); 

    delay(500);

    ESP.restart();               

  }

  //BOTÃO PARA REINICIAR(REPETINDO CONEXÕES SALVAS)

  if (digitalRead(BUTTON_RECONNECT) == HIGH) {

    delay(500);

    ESP.restart();

  }

  //VERIFICAÇÃO CONSTANTE DE CONEXÕES ENQUANTO CONECTADO

  if (WiFi.status() == WL_CONNECTED) {

    if (!statusConnect) {

      ledTicker.detach();                 

      digitalWrite(LED_DESCONECTADO, LOW);   

      digitalWrite(LED_CONECTADO, HIGH);   

      statusConnect = true;

    }

  } else {

    if (statusConnect) {

      digitalWrite(LED_CONECTADO, LOW);

      digitalWrite(LED_DESCONECTADO, HIGH);

      statusConnect = false;

    }

  }

  //INPUT ATUALIZANDO BANCO(FERRAMENTA EXEMPLO)

  if (digitalRead(INPUT_UPDATE_TOOL) == HIGH && !statusFerramenta) {

    atualizaFerramenta(

      "Ferramentas?id=eq.1", 

      "{\"status\":true, \"last_user\":1}"

    );

    statusFerramenta = true;

  }

  

  if (digitalRead(INPUT_UPDATE_TOOL) == LOW && statusFerramenta) {

    atualizaFerramenta(

      "Ferramentas?id=eq.1", 

      "{\"status\":false, \"last_user\":1}"

    );

    statusFerramenta=false;              

  }  

}

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25d8dd51-607e-484a-8992-9d8a00f8832e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
