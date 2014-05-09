/*
 * Script de eventos da página index.html
 */

var chave = null;
var calculando = false;
var original = '';
$(document).ready(function(){
	  $("#btn").click(function(){
		    if (!calculando) {
   		    $.get("/operacao",
		    				function(response,statusTxt,xhr) {
		    					if (xhr.status == 200) {
		    						chave = response.chave;
		    						original = $("#btn").val();
		    						$("#btn").val('Verificar');
		    						calculando = true;
		    					}
		    					else {
		    						alert("Erro: " + statusTxt);
		    					}
		    				}
		    				);
		    }
		    else {
   		    $("#saida").text('Verificando...');
   		    $.get("/operacao/" + chave,
		    				function(response,statusTxt,xhr) {
		    					if (xhr.status == 200) {
   		    					if (response.status == 3) {
      		    					$("#saida").text(response.valor);
		    						   chave = null;
		    						   $("#btn").val(original);
		    						   calculando = false;
   		    					}
   		    					else if (response.status == 2) {
      		    					$("#saida").text('Ainda não está pronto... Tente mais tarde.');
		    						   calculando = true;
   		    					}
   		    					else if (response.status == 1) {
      		    					$("#saida").text('Não tem pedido de cálculo no servidor. Pode ter expirado.');
      		    					$("#btn").val(original);
		    						   calculando = false;
   		    					}
		    					}
		    					else {
		    						alert("Erro: " + statusTxt);
		    					}
		    				}
		    				);
		    }
	    });
    });
   		    
