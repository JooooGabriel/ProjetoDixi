import React, { useState } from 'react';
import { format, parse, differenceInMinutes, addMinutes, addDays, isBefore, isAfter } from 'date-fns';
import './App.css';
import addIcon from './add_icon.png';
import subtracaoIcon from './subtracao.png';
import dixiImage from './dixi.png';

function App() {
  const [cargaHoraria, setCargaHoraria] = useState('');
  const [marcacoes, setMarcacoes] = useState(['', '', '', '']);
  const [resultados, setResultados] = useState({
    horasTrabalhadas: '',
    debito: '',
    credito: '',
    trabalhadaNormal: '',
    adicionalNoturno: '',
    intervalo: ''
  });

  const TOLERANCIA_MINUTOS = 10;
  const ADICIONAL_NOTURNO_FATOR = 8 / 7; // Cada hora noturna vale 52:30 minutos
  const INICIO_NOTURNO = '22:00';
  const FIM_NOTURNO = '05:00';

  const handleInputChange = (index, value) => {
    const newMarcacoes = [...marcacoes];
    newMarcacoes[index] = formatarHora(value);
    setMarcacoes(newMarcacoes);
  };

  const adicionarMarcacao = () => {
    setMarcacoes([...marcacoes, '', '']);
  };

  const removerUltimaMarcacao = () => {
    if (marcacoes.length > 4) {
      setMarcacoes(marcacoes.slice(0, -2));
    }
  };

  const formatarHora = (value) => {
    value = value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) value = value.slice(0, 2) + ':' + value.slice(2);
    return value;
  };

  const converterParaMinutos = (horaStr, referenciaDia = new Date()) => {
    const data = parse(horaStr, 'HH:mm', referenciaDia);
    return differenceInMinutes(data, new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0));
  };

  const ajustarDiaMarcacoes = (marcacoes) => {
    let referenciaDia = new Date();
    let ajustadas = [];

    for (let i = 0; i < marcacoes.length; i++) {
      let minutosAtual = converterParaMinutos(marcacoes[i], referenciaDia);

      if (i > 0 && minutosAtual < converterParaMinutos(marcacoes[i - 1], referenciaDia)) {
        referenciaDia = addDays(referenciaDia, 1);
        minutosAtual = converterParaMinutos(marcacoes[i], referenciaDia);
      }
      ajustadas.push(minutosAtual);
    }

    return ajustadas;
  };

  const calcularAdicionalNoturno = (inicioMinutos, fimMinutos) => {
    const horaInicioNoturno = converterParaMinutos(INICIO_NOTURNO);
    const horaFimNoturno = converterParaMinutos(FIM_NOTURNO) + 24 * 60; // Ajuste para 05:00 do próximo dia

    let minutosAdicional = 0;

    // Se o período não estiver dentro do intervalo noturno, não calcula adicional
    if (fimMinutos <= horaInicioNoturno || inicioMinutos >= horaFimNoturno) {
      return 0;
    }

    // Ajusta o início e fim para o período noturno se necessário
    if (inicioMinutos < horaInicioNoturno) {
      inicioMinutos = horaInicioNoturno;
    }

    if (fimMinutos > horaFimNoturno) {
      fimMinutos = horaFimNoturno;
    }

    minutosAdicional = fimMinutos - inicioMinutos;
    minutosAdicional = minutosAdicional * ADICIONAL_NOTURNO_FATOR; // Ajuste para 52:30 minutos por hora

    return Math.round(minutosAdicional);
  };

  const calcular = () => {
    const cargaHorariaMin = converterParaMinutos(cargaHoraria);
    const marcacoesAjustadas = ajustarDiaMarcacoes(marcacoes);
  
    let horasTrabalhadasMin = 0;
    let intervaloMin = 0;
    let adicionalNoturnoMin = 0;
  
    // Calcula para todos os pares de marcações
    for (let i = 0; i < marcacoesAjustadas.length; i += 2) {
      let inicioMinutos = marcacoesAjustadas[i];
      let fimMinutos = marcacoesAjustadas[i + 1];
  
      if (inicioMinutos !== undefined && fimMinutos !== undefined) {
        if (fimMinutos < inicioMinutos) {
          fimMinutos += 24 * 60; // Corrige para a virada do dia
        }
        horasTrabalhadasMin += fimMinutos - inicioMinutos;
        adicionalNoturnoMin += calcularAdicionalNoturno(inicioMinutos, fimMinutos); // Calcula adicional noturno para cada par
      }
  
      // Calcula o intervalo entre pares de marcações
      if (i + 2 < marcacoesAjustadas.length) {
        let proximoInicioMinutos = marcacoesAjustadas[i + 2];
        if (fimMinutos !== undefined && proximoInicioMinutos !== undefined) {
          intervaloMin += proximoInicioMinutos - fimMinutos;
        }
      }
    }
  
    // Corrige o cálculo quando há apenas um par de marcações
    if (marcacoesAjustadas.length === 2) {
      const inicioMinutos = marcacoesAjustadas[0];
      const fimMinutos = marcacoesAjustadas[1];
      if (fimMinutos < inicioMinutos) {
        fimMinutos += 24 * 60; // Corrige para a virada do dia
      }
      horasTrabalhadasMin = fimMinutos - inicioMinutos;
      adicionalNoturnoMin = calcularAdicionalNoturno(inicioMinutos, fimMinutos); // Recalcula adicional noturno para o único par
    }
  
    let trabalhadaNormalMin = Math.min(horasTrabalhadasMin, cargaHorariaMin);
    const diferencaMinutos = horasTrabalhadasMin - cargaHorariaMin;
  
    let debitoMin = 0;
    let creditoMin = 0;
  
    if (diferencaMinutos > TOLERANCIA_MINUTOS) {
      creditoMin = diferencaMinutos;
    } else if (diferencaMinutos < -TOLERANCIA_MINUTOS) {
      debitoMin = Math.abs(diferencaMinutos);
    }
  
    setResultados({
      horasTrabalhadas: formatarResultado(horasTrabalhadasMin),
      debito: formatarResultado(debitoMin),
      credito: formatarResultado(creditoMin),
      trabalhadaNormal: formatarResultado(trabalhadaNormalMin),
      adicionalNoturno: formatarResultado(adicionalNoturnoMin),
      intervalo: formatarResultado(intervaloMin)
    });
  };

  const formatarResultado = (minutos) => {
    const horas = Math.floor(minutos / 60).toString().padStart(2, '0');
    const mins = (minutos % 60).toString().padStart(2, '0');
    return `${horas}:${mins}`;
  };

  return (
    <div className="App">
      <img src={dixiImage} alt="DIXI" className="dixi-image" />
      <link href="https://fonts.googleapis.com/css?family=Poppins" rel="stylesheet" />
      <p className="projet">Projeto Dixi</p>
      <div>
        <h2>Carga horária</h2>
        <input
          type="text"
          id="carga"
          placeholder="Carga horária"
          value={cargaHoraria}
          onChange={(e) => setCargaHoraria(formatarHora(e.target.value))}
        />
      </div>
      <h2>Marcações</h2>
      <div className="marcacoes-container">
        <div className="marcacoes">
          {marcacoes.map((marcacao, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Marcação ${index + 1}`}
              value={marcacao}
              onChange={(e) => handleInputChange(index, e.target.value)}
            />
          ))}
        </div>
        <div className="botoes">
          <img src={addIcon} alt="Add Icon" className="add-icon" onClick={adicionarMarcacao} />
          {marcacoes.length > 4 && (
            <img
              src={subtracaoIcon}
              alt="Subtraction Icon"
              className="subtracao-icon"
              onClick={removerUltimaMarcacao}
            />
          )}
        </div>
      </div>

      <input
        type="button"
        className="botao"
        id="calcular"
        value="Calcular"
        onClick={calcular}
      />

      <div className="resultado-box">
        <div className="resultado">
          <p className="info">HORAS TRABALHADAS: <span className="resultado-span">{resultados.horasTrabalhadas}</span></p>
          <p className="info">DÉBITO: <span className="resultado-span">{resultados.debito}</span></p>
          <p className="info">CRÉDITO: <span className="resultado-span">{resultados.credito}</span></p>
          <p className="info">HORAS TRABALHADAS NORMAIS: <span className="resultado-span">{resultados.trabalhadaNormal}</span></p>
          <p className="info">ADICIONAL NOTURNO: <span className="resultado-span">{resultados.adicionalNoturno}</span></p>
          <p className="info">INTERVALO: <span className="resultado-span">{resultados.intervalo}</span></p>
        </div>
      </div>
      <p>João Gabriel Oliveira de Almeida</p>
    </div>
  );
}

export default App;
