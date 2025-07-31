import { useEffect, useState } from 'react';
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
import { Line } from 'react-chartjs-2';
import { Card, CardContent, Typography } from '@mui/material';
import apiClient from './api';
import type { AxiosResponse } from 'axios';

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

interface ActivityResponse {
  activity_count: number;
}

interface WebsiteActivityChartProps {
  message?: string;
  days: number;
}

function WebsiteActivityChart({ message, days }: WebsiteActivityChartProps) {
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateLabels = () => {
    const dates: string[] = [];
    for (let i = days-1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Format as "Mon, Dec 25" or similar
      dates.push(date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }));
    }
    return dates;
  };

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const activityData: number[] = [];
      
      // Fetch data for last 5 {days} (24h intervals)
      let oldActivity = 0;
      for (let i = 1; i <= days; i++) {
        const hoursAgo = i * 24;
        const response: AxiosResponse<ActivityResponse> = await apiClient.get(
          `stats/activity_of_website/?time=${hoursAgo}`
        );
        activityData.push(response.data.activity_count - oldActivity);
        oldActivity = response.data.activity_count;
      }

      setLabels(getDateLabels());
      setData(activityData.reverse());
    } catch (error) {
      console.error('Error fetching website activity:', error);
      setLabels([]);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, []);

  // Enhanced chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#4CAF50',
        borderWidth: 1,
        callbacks: {
          title: function(context: any) {
            return `${context[0].label}`;
          },
          label: function(context: any) {
            return `Activity: ${context.parsed.y.toLocaleString()} interactions`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        }
      }
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 2,
      },
      line: {
        tension: 0.4, // Smooth curves
        borderWidth: 3,
      }
    }
  };

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Website Activity',
        data: data,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        pointBackgroundColor: '#4CAF50',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#4CAF50',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
      },
    ],
  };

  if (loading) {
    return (
      <Card sx={{ 
        maxWidth: 800, 
        margin: 'auto', 
        mt: 10,
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        border: '1px solid #404040',
        height: 400
      }}>
        <CardContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%'
        }}>
          <Typography variant='h6' sx={{ color: '#fff' }}>
            Loading activity data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      margin: 'auto', 
      mt: 10,
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      border: '1px solid #404040'
    }}>
      <CardContent>
        <Typography variant='h6' gutterBottom sx={{ 
          color: '#fff', 
          textAlign: 'center',
          mb: 3
        }}>
          {message || '📊 Website Activity - Last 5 Days'}
        </Typography>
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={options} />
        </div>
        <Typography variant='body2' sx={{ 
          color: 'rgba(255, 255, 255, 0.6)', 
          textAlign: 'center',
          mt: 2,
          fontSize: '0.875rem'
        }}>
          Total interactions including topic, comment, community creation; clicks and votes
        </Typography>
      </CardContent>
    </Card>
  );
}

export default WebsiteActivityChart;
