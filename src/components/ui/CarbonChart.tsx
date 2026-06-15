'use client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { NasaDataPoint } from '@/context/FarmContext';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

interface CarbonChartProps {
  nasaData: NasaDataPoint[];
  title?: string;
}

export default function CarbonChart({ nasaData, title = '7-Day Climate Telemetry' }: CarbonChartProps) {
  const labels = nasaData.map((d) => {
    const s = d.date.toString();
    return `${s.slice(6, 8)}/${s.slice(4, 6)}`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Max Temp (°C)',
        data: nasaData.map((d) => d.t2m_max),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#f59e0b',
        pointRadius: 4,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Topsoil Wetness (0–1)',
        data: nasaData.map((d) => d.gwettop),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#0ea5e9',
        pointRadius: 4,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
      {
        label: 'Precipitation (mm)',
        data: nasaData.map((d) => d.prectot),
        borderColor: '#059669',
        backgroundColor: 'rgba(5,150,105,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#059669',
        pointRadius: 4,
        tension: 0.4,
        fill: false,
        yAxisID: 'y',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12, family: 'Inter' },
          color: '#374151',
        },
      },
      title: {
        display: true,
        text: title,
        font: { size: 14, weight: 'bold' as const, family: 'Inter' },
        color: '#1f2937',
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        bodyFont: { family: 'Inter' },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
      y: {
        position: 'left' as const,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
        title: { display: true, text: '°C / mm', color: '#9ca3af', font: { size: 11 } },
      },
      y1: {
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#0ea5e9', font: { size: 11 } },
        min: 0,
        max: 1,
        title: { display: true, text: 'Wetness (0–1)', color: '#0ea5e9', font: { size: 11 } },
      },
    },
  };

  if (nasaData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-gray-400 text-sm">Waiting for NASA POWER data...</p>
      </div>
    );
  }

  return (
    <div className="h-72">
      <Line data={data} options={options} />
    </div>
  );
}
