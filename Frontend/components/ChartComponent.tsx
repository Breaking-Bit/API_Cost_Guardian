import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartComponentProps {
  data: any[];
  title: string;
}

const brightColors = [
  'rgba(255, 99, 132, 1)',    // Bright Pink
  'rgba(54, 162, 235, 1)',    // Bright Blue
  'rgba(255, 206, 86, 1)',    // Bright Yellow
  'rgba(75, 192, 192, 1)',    // Bright Teal
  'rgba(153, 102, 255, 1)',   // Bright Purple
  'rgba(255, 159, 64, 1)',    // Bright Orange
];

export default function ChartComponent({ data, title, type = 'bar' }: ChartComponentProps) {
  const last30Days = [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const serviceData = data.reduce((acc, item) => {
    const date = new Date(item.timestamp).toISOString().split('T')[0];
    if (!acc[item.service_name]) {
      acc[item.service_name] = {};
    }
    if (!acc[item.service_name][date]) {
      acc[item.service_name][date] = {
        cost: 0,
        usage_quantity: 0
      };
    }
    acc[item.service_name][date].cost += item.cost;
    acc[item.service_name][date].usage_quantity += item.usage_quantity;
    return acc;
  }, {});

  const datasets = Object.keys(serviceData).map((service, index) => ({
    label: service,
    data: last30Days.map(date => ({
      x: date,
      y: serviceData[service][date]?.cost || 0,
      usage: serviceData[service][date]?.usage_quantity || 0
    })),
    borderColor: brightColors[index % brightColors.length],
    backgroundColor: brightColors[index % brightColors.length].replace('1)', '0.2)'),
    tension: 0.4,
    fill: true,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: brightColors[index % brightColors.length],
  }));

  const chartData = {
    labels: last30Days.map(date => new Date(date).toLocaleDateString()),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: { bottom: 30 }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const dataPoint = context.raw;
            return [
              `${context.dataset.label}: $${dataPoint.y.toFixed(2)}`,
              `Usage: ${dataPoint.usage} units`
            ];
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        title: {
          display: true,
          text: 'Cost ($)',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: { top: 20, bottom: 10 }
        },
        ticks: {
          callback: (value: any) => `$${value}`
        }
      },
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: { top: 10 }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}