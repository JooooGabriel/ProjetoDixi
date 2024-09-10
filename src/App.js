import React, { useState } from 'react';
import { format, parse, differenceInMinutes, addDays } from 'date-fns';
import './App.css';
import addIcon from './add_icon.png';
import subtracaoIcon from './subtracao.png';
import dixiImage from './dixi.png';
import { calcular } from './calculos';
import { formatarHora, ajustarDiaMarcacoes, converterParaMinutos } from './utils';


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

  // Define constantes para tolerância e fator de adicional noturno
  const TOLERANCIA_MINUTOS = 10;
  const ADICIONAL_NOTURNO_FATOR = 8 / 7; // Cada hora noturna vale 52:30 minutos
  const INICIO_NOTURNO = '22:00';
  const FIM_NOTURNO = '05:00';

  // Função para atualizar o valor de uma marcação específica
  const handleInputChange = (index, value) => {
    const formattedValue = formatarHora(value); // Formata o valor da marcação
    const newMarcacoes = [...marcacoes];
    newMarcacoes[index] = formattedValue;
    setMarcacoes(newMarcacoes);
  };

  const isDiasDiferente = (marcacoes) => {
    let diaAtual = 1;
    let diasMarcacoes = [1]; // Começa no Dia 01
  
    for (let i = 1; i < marcacoes.length; i++) {
      const marcacaoAnterior = parse(marcacoes[i - 1], 'HH:mm', new Date());
      const marcacaoAtual = parse(marcacoes[i], 'HH:mm', new Date());
  
      if (marcacaoAtual < marcacaoAnterior) {
        // Se a marcação atual for menor que a anterior, considera que passou da meia-noite
        diaAtual += 1;
      }
      diasMarcacoes.push(diaAtual);
    }
  
    return diasMarcacoes;
  };
  

  // Função para adicionar novas marcações
  const adicionarMarcacao = () => {
    setMarcacoes([...marcacoes, '', '']);
  };

  // Função para remover a última marcação (caso haja mais de 4 marcações)
  const removerUltimaMarcacao = () => {
    if (marcacoes.length > 4) {
      setMarcacoes(marcacoes.slice(0, -2)); // Remove as duas últimas marcações
    }
  };

  const calcularResultados = () => {
    const diasMarcacoes = isDiasDiferente(marcacoes); // Calcula os dias internamente
    const resultadosCalculados = calcular(cargaHoraria, marcacoes, diasMarcacoes); // Passa os dias para o cálculo
    setResultados(resultadosCalculados); // Atualiza o estado com os resultados
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
      <input
        type="button"
        className="botao"
        id="calcular"
        value="Calcular"
        onClick={calcularResultados}
      />
      <div className="resultado-box">
  <p className="resultado">Horas Trabalhadas: {resultados.horasTrabalhadas}</p>
  <p className="info">Débito: <span>{resultados.debito}</span></p>
  <p className="info">Crédito: <span>{resultados.credito}</span></p>
  <p className="info">Horas Normais: <span>{resultados.trabalhadaNormal}</span></p>
  <p className="info">Adicional Noturno: <span>{resultados.adicionalNoturno}</span></p>
  <p className="info">Intervalo: <span>{resultados.intervalo}</span></p>
</div>

    </div>
  );
}

export default App;
