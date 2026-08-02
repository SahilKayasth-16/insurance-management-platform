import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Standard options
const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom" as const,
            labels: {
                font: {
                    family: "Inter, system-ui, sans-serif",
                    size: 11,
                    weight: "bold" as any
                },
                color: "#475569" // slate-600
            }
        },
        tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-900 translucent
            titleFont: {
                family: "Inter, system-ui, sans-serif",
                weight: "bold"
            },
            bodyFont: {
                family: "Inter, system-ui, sans-serif"
            },
            padding: 10,
            cornerRadius: 8
        }
    },
    scales: {
        x: {
            grid: {
                color: "rgba(226, 232, 240, 0.4)" // slate-200 translucent
            },
            ticks: {
                color: "#64748b", // slate-500
                font: {
                    family: "Inter, system-ui, sans-serif",
                    size: 10,
                    weight: "bold" as any
                }
            }
        },
        y: {
            grid: {
                color: "rgba(226, 232, 240, 0.4)"
            },
            ticks: {
                color: "#64748b",
                font: {
                    family: "Inter, system-ui, sans-serif",
                    size: 10,
                    weight: "bold" as any
                }
            }
        }
    }
};

const circularOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom" as const,
            labels: {
                font: {
                    family: "Inter, system-ui, sans-serif",
                    size: 11,
                    weight: "bold" as any
                },
                color: "#475569"
            }
        },
        tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            padding: 10,
            cornerRadius: 8
        }
    }
};

interface ChartProps {
    labels: string[];
    datasets: {
        label?: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
        fill?: boolean;
    }[];
    options?: any;
}

export const LineChart: React.FC<ChartProps> = ({ labels, datasets, options = {} }) => {
    const data = { labels, datasets };
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        plugins: {
            ...defaultOptions.plugins,
            ...options.plugins
        },
        scales: {
            ...defaultOptions.scales,
            ...options.scales
        }
    };
    return <Line data={data} options={mergedOptions} />;
};

export const BarChart: React.FC<ChartProps> = ({ labels, datasets, options = {} }) => {
    const data = { labels, datasets };
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        plugins: {
            ...defaultOptions.plugins,
            ...options.plugins
        },
        scales: {
            ...defaultOptions.scales,
            ...options.scales
        }
    };
    return <Bar data={data} options={mergedOptions} />;
};

export const DoughnutChart: React.FC<ChartProps> = ({ labels, datasets, options = {} }) => {
    const data = { labels, datasets };
    const mergedOptions = {
        ...circularOptions,
        ...options,
        plugins: {
            ...circularOptions.plugins,
            ...options.plugins
        }
    };
    return <Doughnut data={data} options={mergedOptions} />;
};

export const PieChart: React.FC<ChartProps> = ({ labels, datasets, options = {} }) => {
    const data = { labels, datasets };
    const mergedOptions = {
        ...circularOptions,
        ...options,
        plugins: {
            ...circularOptions.plugins,
            ...options.plugins
        }
    };
    return <Pie data={data} options={mergedOptions} />;
};
