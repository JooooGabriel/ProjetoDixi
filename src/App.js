import React, { useState } from 'react';
import { format, parse, differenceInMinutes, addMinutes, isBefore, isAfter, addHours, isEqual } from 'date-fns';
import './App.css';
import addIcon from './add_icon.png';
import subtracaoIcon from './subtracao.png';

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

  const converterParaData = (horaStr) => {
    const today = new Date();
    return parse(horaStr, 'HH:mm', today);
  };

  const calcularAdicionalNoturno = (inicio, fim) => {
    const horaInicioNoturno = converterParaData('22:00');
    const horaFimNoturno = addHours(converterParaData('05:00'), 24);
  
    let minutosAdicional = 0;
  
    if (isBefore(fim, inicio)) {
      fim = addHours(fim, 24); // Corrige para a virada do dia
    }
  
    // Ajustar início para 22:00 se começar antes
    if (isBefore(inicio, horaInicioNoturno) && isAfter(fim, horaInicioNoturno)) {
      inicio = horaInicioNoturno;
    }
  
    // Ajustar fim para 05:00 se terminar depois
    if (isAfter(fim, horaFimNoturno) || isEqual(fim, horaFimNoturno)) {
      fim = horaFimNoturno;
    }
  
    // Verifica se o período está dentro da janela noturna
    if ((isAfter(inicio, horaInicioNoturno) || isEqual(inicio, horaInicioNoturno)) &&
        (isBefore(fim, horaFimNoturno) || isEqual(fim, horaFimNoturno))) {
      
      // Calcula a quantidade de minutos reais trabalhados no período noturno
      minutosAdicional = differenceInMinutes(fim, inicio);
  
      // Multiplica por 8/7 para ajustar o tempo, conforme a regra do adicional noturno
      const fatorAdicional = 8 / 7;
      const minutosAdicionalAjustado = Math.round(minutosAdicional * fatorAdicional);
  
      return minutosAdicionalAjustado;
    }
  
    return 0; // Se não estiver dentro do período noturno, retorna 0
  };
  

  const calcular = () => {
    const cargaHorariaMin = differenceInMinutes(converterParaData(cargaHoraria), converterParaData('00:00'));
  
    let horasTrabalhadasMin = 0;
    let intervaloMin = 0;
    let adicionalNoturnoMin = 0;
  
    for (let i = 0; i < marcacoes.length; i += 2) {
      let inicio = marcacoes[i] ? converterParaData(marcacoes[i]) : null;
      let fim = marcacoes[i + 1] ? converterParaData(marcacoes[i + 1]) : null;
  
      if (inicio && fim) {
        if (isBefore(fim, inicio)) {
          fim = addMinutes(fim, 24 * 60); // Corrige para a virada do dia
        }
        horasTrabalhadasMin += differenceInMinutes(fim, inicio);
        adicionalNoturnoMin += calcularAdicionalNoturno(inicio, fim); // Calcula adicional noturno para cada par
      }
  
      if (i + 2 < marcacoes.length) {
        let proximoInicio = marcacoes[i + 2] ? converterParaData(marcacoes[i + 2]) : null;
        if (fim && proximoInicio) {
          if (isBefore(proximoInicio, fim)) {
            proximoInicio = addMinutes(proximoInicio, 24 * 60); // Ajuste para a virada do dia no intervalo
          }
          intervaloMin += differenceInMinutes(proximoInicio, fim);
        }
      }
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
      <h1>DIXI</h1>
      <link href='https://fonts.googleapis.com/css?family=Poppins' rel='stylesheet'></link>

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
