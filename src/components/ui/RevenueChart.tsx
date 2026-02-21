import { Bar } from 'react-chartjs-2'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'

interface RevenueChartProps {
  className?: string
  overrideMetrics?: {
    activeContracts: number
    leads: number
    subtitle?: string // e.g. "ESTIMATED SaaS REVENUE"
  }
}

export const RevenueChart = ({
  className,
  overrideMetrics,
}: RevenueChartProps) => {
  const { data: metrics } = useDashboardMetrics()

  // Use override if provided, otherwise fallback to hook
  const activeContracts = overrideMetrics
    ? overrideMetrics.activeContracts
    : metrics?.activeContracts || 0
  const leads = overrideMetrics ? overrideMetrics.leads : metrics?.leads || 0

  // Simulation:
  // Average Ticket = R$ 1500 (CRM) or R$ 59.90 (SaaS)
  // If override is present, we assume SaaS pricing (approx R$ 89.90 avg)
  const TICKET = overrideMetrics ? 89.9 : 1500

  const guaranteed = activeContracts * TICKET
  const potential = leads * TICKET

  const data = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: overrideMetrics ? 'RECURRING (MRR)' : 'GUARANTEED (ACTIVE)',
        data: [guaranteed, guaranteed * 1.05, guaranteed * 1.1],
        backgroundColor: 'black',
        barPercentage: 0.6,
      },
      {
        label: overrideMetrics ? 'PROJECTED' : 'POTENTIAL (LEADS)',
        data: [potential, potential * 0.9, potential * 1.2],
        backgroundColor: '#fbbf24',
        borderColor: 'black',
        borderWidth: 2,
        borderSkipped: false as const,
        barPercentage: 0.6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 10,
          },
          color: 'black',
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'black',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        padding: 12,
        cornerRadius: 0,
        callbacks: {
          label: function (context: { parsed: { y: number } }) {
            return (
              ' R$ ' +
              context.parsed.y.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })
            )
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter',
          },
          color: '#666',
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
          borderDash: [4, 4],
        },
        ticks: {
          callback: function (value: string | number) {
            const numValue =
              typeof value === 'string' ? parseFloat(value) : value
            if (numValue >= 1000) return 'k' + numValue / 1000
            return value
          },
          font: {
            family: 'Inter',
          },
          color: '#666',
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }

  return (
    <div className={className}>
      <Bar data={data} options={options} />
    </div>
  )
}
