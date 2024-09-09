import { converterParaMinutos } from './utils';
import { addDays } from 'date-fns'; // Importa a função addDays da biblioteca date-fns para manipulação de datas

// Constantes para tolerância de minutos e fator do adicional noturno
const TOLERANCIA_MINUTOS = 10;
const ADICIONAL_NOTURNO_FATOR = 8 / 7; // Cada hora noturna vale 52:30 minutos
const INICIO_NOTURNO = '22:00'; // Início do período noturno
const FIM_NOTURNO = '05:00'; // Fim do período noturno

// Função principal para calcular resultados com base na carga horária e marcações
export const calcular = (cargaHoraria, marcacoes) => {
  const cargaHorariaMin = converterParaMinutos(cargaHoraria); // Converte carga horária para minutos
  const marcacoesAjustadas = ajustarDiaMarcacoes(marcacoes); // Ajusta as marcações para lidar com troca de dia

  let horasTrabalhadasMin = 0;
  let intervaloMin = 0;
  let adicionalNoturnoMin = 0;

  // Itera sobre as marcações ajustadas para calcular horas trabalhadas, intervalo e adicional noturno
  for (let i = 0; i < marcacoesAjustadas.length; i += 2) {
    const inicioMinutos = marcacoesAjustadas[i];
    const fimMinutos = marcacoesAjustadas[i + 1];

    if (inicioMinutos !== undefined && fimMinutos !== undefined) {
      // Corrige o fim se ele for menor que o início, considerando a troca de dia
      const fimCorrigido = fimMinutos < inicioMinutos ? fimMinutos + 24 * 60 : fimMinutos;
      horasTrabalhadasMin += fimCorrigido - inicioMinutos; // Calcula o total de horas trabalhadas
      adicionalNoturnoMin += calcularAdicionalNoturno(inicioMinutos, fimCorrigido); // Calcula o adicional noturno
    }

    // Calcula o intervalo entre marcações, se houver
    if (i + 2 < marcacoesAjustadas.length) {
      const proximoInicioMinutos = marcacoesAjustadas[i + 2];
      if (fimMinutos !== undefined && proximoInicioMinutos !== undefined) {
        intervaloMin += Math.max(0, proximoInicioMinutos - fimMinutos); // Adiciona o intervalo, se positivo
      }
    }
  }

  // Verifica se há apenas duas marcações e ajusta o cálculo
  if (marcacoesAjustadas.length === 2) {
    const inicioMinutos = marcacoesAjustadas[0];
    const fimMinutos = marcacoesAjustadas[1];
    const fimCorrigido = fimMinutos < inicioMinutos ? fimMinutos + 24 * 60 : fimMinutos;
    horasTrabalhadasMin = fimCorrigido - inicioMinutos;
    adicionalNoturnoMin = calcularAdicionalNoturno(inicioMinutos, fimCorrigido);
  }

  // Garante que horas negativas não sejam permitidas
  horasTrabalhadasMin = Math.max(0, horasTrabalhadasMin);
  adicionalNoturnoMin = Math.max(0, adicionalNoturnoMin);

  // Calcula o crédito e débito com base na carga horária e tolerância
  const trabalhadaNormalMin = Math.min(horasTrabalhadasMin, cargaHorariaMin);
  const diferencaMinutos = horasTrabalhadasMin - cargaHorariaMin;

  let debitoMin = 0;
  let creditoMin = 0;

  if (diferencaMinutos > TOLERANCIA_MINUTOS) {
    creditoMin = diferencaMinutos; // Adiciona ao crédito se a diferença for maior que a tolerância
  } else if (diferencaMinutos < -TOLERANCIA_MINUTOS) {
    debitoMin = Math.abs(diferencaMinutos); // Adiciona ao débito se a diferença for menor que a tolerância
  }

  // Retorna os resultados formatados
  return {
    horasTrabalhadas: formatarResultado(horasTrabalhadasMin),
    debito: formatarResultado(debitoMin),
    credito: formatarResultado(creditoMin),
    trabalhadaNormal: formatarResultado(trabalhadaNormalMin),
    adicionalNoturno: formatarResultado(adicionalNoturnoMin),
    intervalo: formatarResultado(intervaloMin)
  };
};

// Função para ajustar as marcações de hora para considerar a troca de dia
const ajustarDiaMarcacoes = (marcacoes) => {
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

// Função para calcular o adicional noturno com base no início e fim das marcações
const calcularAdicionalNoturno = (inicioMinutos, fimMinutos) => {
  const horaInicioNoturno = converterParaMinutos(INICIO_NOTURNO);
  const horaFimNoturno = converterParaMinutos(FIM_NOTURNO) + 24 * 60; // Ajusta para 05:00 do próximo dia

  // Se o período está totalmente fora do intervalo noturno, retorna 0
  if (fimMinutos <= horaInicioNoturno || inicioMinutos >= horaFimNoturno) {
    return 0;
  }

  // Ajusta o início e o fim para o período noturno se necessário
  const inicioNoturno = Math.max(inicioMinutos, horaInicioNoturno);
  const fimNoturno = Math.min(fimMinutos, horaFimNoturno);

  // Se o início ajustado for menor que o fim ajustado, calcula o adicional
  if (inicioNoturno < fimNoturno) {
    const minutosAdicional = fimNoturno - inicioNoturno;
    return Math.round(minutosAdicional * ADICIONAL_NOTURNO_FATOR); // Ajusta para 52:30 minutos por hora e arredonda
  }

  return 0; // Retorna 0 se não houver adicional noturno
};

// Função para formatar o resultado em horas e minutos
const formatarResultado = (minutos) => {
  const horas = Math.floor(minutos / 60).toString().padStart(2, '0'); // Calcula horas e formata com dois dígitos
  const mins = (minutos % 60).toString().padStart(2, '0'); // Calcula minutos e formata com dois dígitos
  return `${horas}:${mins}`; // Retorna a string formatada no formato HH:mm
};
