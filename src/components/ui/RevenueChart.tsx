import { Bar } from 'react-chartjs-2';
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics';

interface RevenueChartProps {
    className?: string;
}

export const RevenueChart = ({ className }: RevenueChartProps) => {
    const { data: metrics } = useDashboardMetrics();
    const { totalClients = 0, activeContracts = 0, leads = 0 } = metrics || {};

    // Simulation: 
    // Average Ticket = R$ 1500
    // Guaranteed = Active * 1500
    // Potential = Leads * 1500
    const TICKET = 1500;
    const guaranteed = activeContracts * TICKET;
    const potential = leads * TICKET;

    const data = {
        labels: ['Jan', 'Feb', 'Mar'], // Simulating Q1
        datasets: [
            {
                label: 'GUARANTEED (ACTIVE)',
                data: [guaranteed, guaranteed * 1.1, guaranteed * 1.2], // Mock trend
                backgroundColor: 'black',
                barPercentage: 0.6,
            },
            {
                label: 'POTENTIAL (LEADS)',
                data: [potential, potential * 0.8, potential * 1.5], // Mock trend
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
                        return ' R$ ' + context.parsed.y.toLocaleString('pt-BR');
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
                        return 'k' + (value / 1000);
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
