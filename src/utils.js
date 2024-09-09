import { parse, differenceInMinutes, addDays } from 'date-fns'; // Importa funções da biblioteca date-fns

// Função para formatar a hora em formato HH:mm
export const formatarHora = (value) => {
  // Remove todos os caracteres não numéricos
  value = value.replace(/\D/g, '');
  
  // Limita o comprimento da string a 4 caracteres
  if (value.length > 4) value = value.slice(0, 4);
  
  // Adiciona dois pontos para formar o formato HH:mm
  if (value.length > 2) value = value.slice(0, 2) + ':' + value.slice(2);

  // Retorna a string formatada ou uma string vazia se não houver valor
  if (value === '') return value;

  // Separa horas e minutos e verifica se estão dentro do intervalo válido
  const [horas, minutos] = value.split(':').map(Number);
  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
    return '';
  }

  return value;
};

// Função para converter uma string de hora em minutos desde o início do dia
export const converterParaMinutos = (horaStr, referenciaDia = new Date()) => {
  if (horaStr === '') return 0; // Retorna 0 se a string estiver vazia

  // Converte a string para um objeto Date
  const data = parse(horaStr, 'HH:mm', referenciaDia);
  
  // Calcula a diferença em minutos desde o início do dia
  return differenceInMinutes(data, new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0));
};

// Função para ajustar as marcações de hora, lidando com a troca de dia
export const ajustarDiaMarcacoes = (marcacoes) => {
  let referenciaDia = new Date(); // Define a data de referência inicial
  let ajustadas = []; // Array para armazenar as marcações ajustadas

  for (let i = 0; i < marcacoes.length; i++) {
    if (marcacoes[i] === '') continue; // Ignora marcações vazias

    let minutosAtual = converterParaMinutos(marcacoes[i], referenciaDia);

    // Se a marcação atual é menor que a anterior, avança o dia
    if (i > 0 && minutosAtual < converterParaMinutos(marcacoes[i - 1], referenciaDia)) {
      referenciaDia = addDays(referenciaDia, 1);
      minutosAtual = converterParaMinutos(marcacoes[i], referenciaDia);
    }
    
    ajustadas.push(minutosAtual); // Adiciona a marcação ajustada ao array
  }

  return ajustadas; // Retorna o array com as marcações ajustadas
};
