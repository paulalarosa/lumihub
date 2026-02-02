import { Bar } from 'react-chartjs-2';
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics';

interface RevenueChartProps {
    className?: string;
    overrideMetrics?: {
        activeContracts: number;
        leads: number;
        subtitle?: string; // e.g. "ESTIMATED SaaS REVENUE"
    };
}

export const RevenueChart = ({ className, overrideMetrics }: RevenueChartProps) => {
    const { data: metrics } = useDashboardMetrics();

    // Use override if provided, otherwise fallback to hook
    const activeContracts = overrideMetrics ? overrideMetrics.activeContracts : (metrics?.activeContracts || 0);
    const leads = overrideMetrics ? overrideMetrics.leads : (metrics?.leads || 0);

    // Simulation: 
    // Average Ticket = R$ 1500 (CRM) or R$ 59.90 (SaaS)
    // If override is present, we assume SaaS pricing (approx R$ 89.90 avg)
    const TICKET = overrideMetrics ? 89.90 : 1500;

    const guaranteed = activeContracts * TICKET;
    const potential = leads * TICKET;

    const data = {
        labels: ['Jan', 'Feb', 'Mar'], // Simulating Q1
        datasets: [
            {
                label: overrideMetrics ? 'RECURRING (MRR)' : 'GUARANTEED (ACTIVE)',
                data: [guaranteed, guaranteed * 1.05, guaranteed * 1.1], // Mock trend
                backgroundColor: 'black',
                barPercentage: 0.6,
            },
            {
                label: overrideMetrics ? 'PROJECTED' : 'POTENTIAL (LEADS)',
                data: [potential, potential * 0.9, potential * 1.2], // Mock trend
                backgroundColor: '#fbbf24', // Amber-400 / Yellow
                borderColor: 'black',
                borderWidth: 2,
                borderSkipped: false, // Full border
                barPercentage: 0.6,
            },
        ],
    };

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        family: 'JetBrains Mono, monospace', // Industrial font
                        size: 10,
                    },
                    color: 'black',
                    usePointStyle: true,
                    boxWidth: 8,
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'black',
                titleFont: { family: 'JetBrains Mono' },
                bodyFont: { family: 'JetBrains Mono' },
                padding: 12,
                cornerRadius: 0, // Brutalist
                callbacks: {
                    label: function (context: any) {
                        return ' R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        family: 'JetBrains Mono',
                    },
                    color: '#666'
                }
            },
            y: {
                grid: {
                    color: '#e5e7eb', // gray-200
                    borderDash: [4, 4],
                },
                ticks: {
                    callback: function (value: any) {
                        if (value >= 1000) return 'k' + (value / 1000);
                        return value;
                    },
                    font: {
                        family: 'JetBrains Mono',
                    },
                    color: '#666'
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    return (
        <div className={className}>
            <Bar data={data} options={options} />
        </div>
    );
};
