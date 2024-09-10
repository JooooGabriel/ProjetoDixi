import { converterParaMinutos } from './utils';
import { addDays } from 'date-fns';

// Constantes para tolerância de minutos e fator do adicional noturno
const TOLERANCIA_MINUTOS = 10;
const ADICIONAL_NOTURNO_FATOR = 8 / 7; // Cada hora noturna vale 52:30 minutos
const INICIO_NOTURNO = '22:00'; // Início do período noturno
const FIM_NOTURNO = '05:00'; // Fim do período noturno

// Função principal para calcular resultados com base na carga horária e marcações
export const calcular = (cargaHoraria, marcacoes) => {
  const cargaHorariaMin = converterParaMinutos(cargaHoraria);
  const { marcacoesAjustadas, diasMarcacoes } = ajustarDiaMarcacoes(marcacoes);

  let horasTrabalhadasMin = 0;
  let intervaloMin = 0;
  let adicionalNoturnoMin = 0;

  for (let i = 0; i < marcacoesAjustadas.length; i += 2) {
    const inicioMinutos = marcacoesAjustadas[i];
    const fimMinutos = marcacoesAjustadas[i + 1];

    if (inicioMinutos !== undefined && fimMinutos !== undefined) {
      // Corrige o fim se ele for menor que o início, considerando a troca de dia
      const fimCorrigido = fimMinutos < inicioMinutos ? fimMinutos + 24 * 60 : fimMinutos;
      horasTrabalhadasMin += fimCorrigido - inicioMinutos;
      adicionalNoturnoMin += calcularAdicionalNoturno(inicioMinutos, fimCorrigido, diasMarcacoes[i], diasMarcacoes[i + 1]);
    }

    // Calcula o intervalo entre marcações, se houver
    if (i + 2 < marcacoesAjustadas.length) {
      const proximoInicioMinutos = marcacoesAjustadas[i + 2];
      if (fimMinutos !== undefined && proximoInicioMinutos !== undefined) {
        intervaloMin += Math.max(0, proximoInicioMinutos - fimMinutos);
      }
    }
  }

  if (marcacoesAjustadas.length === 2) {
    const inicioMinutos = marcacoesAjustadas[0];
    const fimMinutos = marcacoesAjustadas[1];
    const fimCorrigido = fimMinutos < inicioMinutos ? fimMinutos + 24 * 60 : fimMinutos;
    horasTrabalhadasMin = fimCorrigido - inicioMinutos;
    adicionalNoturnoMin = calcularAdicionalNoturno(inicioMinutos, fimCorrigido, diasMarcacoes[0], diasMarcacoes[1]);
  }

  horasTrabalhadasMin = Math.max(0, horasTrabalhadasMin);
  adicionalNoturnoMin = Math.max(0, adicionalNoturnoMin);

  const trabalhadaNormalMin = Math.min(horasTrabalhadasMin, cargaHorariaMin);
  const diferencaMinutos = horasTrabalhadasMin - cargaHorariaMin;

  let debitoMin = 0;
  let creditoMin = 0;

  if (diferencaMinutos > TOLERANCIA_MINUTOS) {
    creditoMin = diferencaMinutos;
  } else if (diferencaMinutos < -TOLERANCIA_MINUTOS) {
    debitoMin = Math.abs(diferencaMinutos);
  }

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
  let ajustadas = [];
  let diasMarcacoes = [];

  for (let i = 0; i < marcacoes.length; i++) {
    if (marcacoes[i] === '') continue;

    let minutosAtual = converterParaMinutos(marcacoes[i], referenciaDia);

    if (i > 0 && minutosAtual < converterParaMinutos(marcacoes[i - 1], referenciaDia)) {
      referenciaDia = addDays(referenciaDia, 1);
      minutosAtual = converterParaMinutos(marcacoes[i], referenciaDia);
    }
    ajustadas.push(minutosAtual);
    diasMarcacoes.push(referenciaDia.getDate()); // Adiciona o dia correspondente ao array
  }

  return { marcacoesAjustadas: ajustadas, diasMarcacoes };
};

// Função para verificar se o dia mudou
const isDiaDiferente = (diaAtual, diaAnterior) => diaAtual !== diaAnterior;

// Função para calcular o adicional noturno com base no início e fim das marcações
const calcularAdicionalNoturno = (inicioMinutos, fimMinutos, diaInicio, diaFim) => {
  const horaInicioNoturno = converterParaMinutos(INICIO_NOTURNO);
  const horaFimNoturno = converterParaMinutos(FIM_NOTURNO) + 24 * 60;

  // Ajusta o início e o fim para o horário noturno, considerando a troca de dia
  let inicioNoturno = Math.max(inicioMinutos, horaInicioNoturno);
  let fimNoturno = Math.min(fimMinutos, horaFimNoturno);

  // Verifica se a marcação atravessa a meia-noite e ajusta os limites
  if (isDiaDiferente(diaInicio, diaFim)) {
    fimNoturno += 24 * 60;
  }

  if (inicioMinutos < horaInicioNoturno && fimMinutos > horaInicioNoturno) {
    inicioNoturno = horaInicioNoturno;
  }
  if (fimMinutos > horaFimNoturno && inicioMinutos < horaFimNoturno) {
    fimNoturno = horaFimNoturno;
  }

  // Calcula o período noturno efetivo
  if (inicioNoturno < fimNoturno) {
    const minutosAdicional = fimNoturno - inicioNoturno;
    return Math.round(minutosAdicional * ADICIONAL_NOTURNO_FATOR);
  }

  return 0;
};

// Função para formatar o resultado em horas e minutos
const formatarResultado = (minutos) => {
  const horas = Math.floor(minutos / 60).toString().padStart(2, '0');
  const mins = (minutos % 60).toString().padStart(2, '0');
  return `${horas}:${mins}`;
};
