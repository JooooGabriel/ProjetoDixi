import React, { useState } from 'react';
import { format, parse, differenceInMinutes, addMinutes, isBefore, isAfter, addHours, isEqual } from 'date-fns';
import './App.css';
import addIcon from './add_icon.png'; // Import the image

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

  const handleInputChange = (index, value) => {
    const newMarcacoes = [...marcacoes];
    newMarcacoes[index] = formatarHora(value);
    setMarcacoes(newMarcacoes);
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
    const horaFimNoturno = addHours(converterParaData('05:00'), 24); // Ajuste para considerar 05:00 do próximo dia
  
    let minutosAdicional = 0;
  
    if (isBefore(fim, inicio)) {
      fim = addHours(fim, 24); // Ajuste para lidar com virada de dia
    }
  
    if (isBefore(inicio, horaInicioNoturno) && isAfter(fim, horaInicioNoturno)) {
      inicio = horaInicioNoturno; // Ajuste início para 22:00 se começar antes
    }
    if (isAfter(fim, horaFimNoturno) || isEqual(fim, horaFimNoturno)) {
      fim = horaFimNoturno; // Ajuste fim para 05:00 se terminar depois ou exatamente às 05:00
    }
  
    if ((isAfter(inicio, horaInicioNoturno) || isEqual(inicio, horaInicioNoturno)) &&
        (isBefore(fim, horaFimNoturno) || isEqual(fim, horaFimNoturno))) {
      minutosAdicional = differenceInMinutes(fim, inicio);
      minutosAdicional = (minutosAdicional * 60) / 52.5; // Ajuste para 52:30 minutos por hora
    }
  
    return Math.round(minutosAdicional);
  };

  const calcular = () => {
    const cargaHorariaMin = differenceInMinutes(converterParaData(cargaHoraria), converterParaData('00:00'));

    let [m1, m2, m3, m4] = marcacoes.map(hora => hora ? converterParaData(hora) : null);

    const ajustarHorario = (inicio, fim) => isBefore(fim, inicio) ? addMinutes(fim, 24 * 60) : fim;

    if (m2) m2 = ajustarHorario(m1, m2);
    if (m4) m4 = ajustarHorario(m3, m4);

    const horasTrabalhadasMin = (m2 && m1 ? differenceInMinutes(m2, m1) : 0) +
                               (m4 && m3 ? differenceInMinutes(m4, m3) : 0);

    const intervaloMin = m3 && m2 ? differenceInMinutes(m3, m2) : 0;

    const trabalhadaNormalMin = Math.min(horasTrabalhadasMin, cargaHorariaMin);

    const adicionalNoturnoMin = (m1 && m2 ? calcularAdicionalNoturno(m1, m2) : 0) +
                               (m3 && m4 ? calcularAdicionalNoturno(m3, m4) : 0);

    const debitoMin = cargaHorariaMin > horasTrabalhadasMin ? cargaHorariaMin - horasTrabalhadasMin : 0;
    const creditoMin = horasTrabalhadasMin > cargaHorariaMin ? horasTrabalhadasMin - cargaHorariaMin : 0;

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
        placeholder="Marcações"
        value={marcacao}
        onChange={(e) => handleInputChange(index, e.target.value)}
      />
    ))}
  </div>
  <img src={addIcon} alt="Add Icon" className="add-icon" />
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
