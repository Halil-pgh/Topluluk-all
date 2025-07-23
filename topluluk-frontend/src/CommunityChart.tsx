import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardContent, Typography } from '@mui/material';
import apiClient from './api';

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    }
  },
};

interface Community {
  url: string;
  name: string;
  total_view_count: number;
}

function CommunityChart() {
  const [labels, setLabels] = useState<string[]>([]);
  const [viewCounts, setViewCounts] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('stats/most_viewed_communities/');
        const data: Community[] = response.data;

        setLabels(data.map(community => community.name));
        setViewCounts(data.map(community => community.total_view_count));
      } catch (error) {
        console.error('Failed to fetch community stats:', error);
      }
    };

    fetchData();
  }, []);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Views',
        data: viewCounts,
        backgroundColor: [
          'rgba(63, 81, 181, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
      },
    ],
  };

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 10 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Most Viewed Communities
        </Typography>
        <Doughnut data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}

export default CommunityChart;
