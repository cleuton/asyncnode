
/*
 * Página default:
 */

var Worker = require('webworker-threads').Worker;
var redis = require("redis");
var uuid = require('node-uuid');
 
exports.index = function(req, res){
  res.render('index', { title: 'Operação assíncrona', botao: 'Iniciar' });
};

exports.iniciar = function(req, res) {
     //var client = redis.createClient();
     var identificador = uuid.v1();
     
     // Worker Thread:
     var worker = new Worker(function() {
          onmessage = function (event) {
            var fibonacci = function (n) {
              if (n < 2)
                return 1;
              else
                return fibonacci(n - 2) + fibonacci(n - 1);
            };
            var obj = event.data; 
console.log('worker vai iniciar: ' + JSON.stringify(obj));            
            obj.numero = fibonacci(obj.numero);         
            postMessage(obj);
          }
        });
        
     // Quando o Worker Thread concluir o cálculo:
     worker.onmessage = function (event) {
           var objeto = event.data;
console.log('worker terminou: ' + JSON.stringify(objeto));        
           var client = redis.createClient();
           client.on("error", function (err) {
               console.log('Erro 1: ' + err);
               res.send(500, 'Erro!');
           });  
           client.on("connect", function() {
              objeto.calculando = false;
              client.set(objeto.chave, JSON.stringify(objeto), function(err, res) {
                 if (err != null) {
                    console.log('Erro 2 ao gravar no redis a resposta! ' + err);
                 }
                 else {
                    client.expire(objeto.identificador, 120);
                 }
              });
           });          
      };
      
     var objeto = {numero : 45, chave : identificador, calculando : true};
     
     // Coloca o pedido no REDIS:   
     var client = redis.createClient();
     client.on("connect", function() {
        client.set(identificador, JSON.stringify(objeto), function(err, resposta) {
           if (err == null) {
              // Posta a mensagem para o Worker Thread:
              client.expire(identificador, 120); // Expira em 2 minutos
              worker.postMessage(objeto);
              res.header("Content-Type", "application/json; charset=utf-8");
              res.json({ 'chave' : identificador });
           }
           else {
              console.log('Erro 4: ' + err);
              res.send(500, 'Erro!');
           }
        });
     }); 
     
     client.quit; 
};

exports.verify = function(req, res) {
     var identificador = req.params.chave;
console.log('verificar: ' + identificador);        
     var client = redis.createClient();
     client.on("error", function (err) {
         console.log('Erro 5: ' + err);
         res.send(500, 'Erro!');
     });  
     client.on("connect", function() {
        client.get(identificador, function(err, dado) {
console.log('obtido do REDIS bruto: ' + dado);            
           var objeto = JSON.parse(dado);
           var resposta = { "status" : 0, "valor" : 0 };
           if (err == null) {
console.log('obtido do REDIS: ' + objeto.calculando);               
               if (dado == null) {
                  // Não existe o pedido!
                  resposta.status = 1;
               }
               else {               
                  if (objeto.calculando == true) {
                     // Ainda não terminou o cálculo
                     resposta.status = 2;
                  }
                  else {
                     resposta.status = 3;
                     resposta.valor = objeto.numero;
                  }
               }
               res.header("Content-Type", "application/json; charset=utf-8");
               res.json(resposta);
            }
           else {
              console.log('Erro 6: ' + err);
              res.send(500, 'Erro!');
           }
        });
     });  

};