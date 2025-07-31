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
import type { AxiosResponse } from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Community {
  url: string;
  name: string;
  total_view_count: number;
  view_count_after: number;
}

interface CommunityChartProps {
  message?: string;
  time?: number;
}

function CommunityChart({ message, time }: CommunityChartProps) {
  const [labels, setLabels] = useState<string[]>([]);
  const [viewCounts, setViewCounts] = useState<number[]>([]);

  function setDataFromResponse(response: AxiosResponse<Community[]>) {
    const newLabels: string[] = []
    const newViewCounts: number[] = []

    response.data.forEach((community: Community) => {
      newLabels.push(community.name)
      if (community.view_count_after !== null) {
        newViewCounts.push(community.view_count_after)
      } else {
        newViewCounts.push(community.total_view_count)
      }
    })

    setLabels(newLabels)
    setViewCounts(newViewCounts)
  }

  // Enhanced colors with better gradients
  const getDynamicColors = () => {
    if (viewCounts.length === 0) return []
    
    const maxViews = Math.max(...viewCounts)
    const minViews = Math.min(...viewCounts)
    
    return viewCounts.map((views, index) => {
      // Normalize views to 0-1 range
      const normalized = (views - minViews) / (maxViews - minViews) || 0
      
      // Base hue shifts for each segment
      const baseHue = (index * 60) % 360
      
      // Adjust saturation and lightness based on view count
      const saturation = 60 + (normalized * 40) // 60-100%
      const lightness = 45 + (normalized * 20)  // 45-65%
      
      return `hsla(${baseHue}, ${saturation}%, ${lightness}%, 0.8)`
    })
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const position = context[0].dataIndex + 1
            const ranks = ['🥇 1st', '🥈 2nd', '🥉 3rd', '4th', '5th']
            return `${ranks[context[0].dataIndex] || `${position}th`} Most Viewed: ${context[0].label}`
          },
          label: function(context: any) {
            const total = viewCounts.reduce((sum, count) => sum + count, 0)
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0
            return `Views: ${context.raw.toLocaleString()} (${percentage}%)`
          }
        }
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response: AxiosResponse<Community[]>
        
        if (time === undefined) {
          response = await apiClient.get('stats/most_viewed_communities/');
        } else {
          response = await apiClient.get(`stats/most_viewed_communities?time=${time}`);
        }
        
        setDataFromResponse(response)
      } catch (error) {
        console.error('Failed to fetch community view stats:', error);
        setLabels([])
        setViewCounts([])
      }
    };

    fetchData();
  }, [time]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Views',
        data: viewCounts,
        backgroundColor: getDynamicColors(),
        borderColor: getDynamicColors().map(color => color.replace('0.8)', '1)')),
        borderWidth: 2,
      },
    ],
  };

  return (
    <Card sx={{ 
      maxWidth: 800, 
      margin: 'auto', 
      mt: 10,
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      border: '1px solid #404040'
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff', textAlign: 'center' }}>
          {message || 'Most Viewed Communities'}
        </Typography>
        <Doughnut data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}

export default CommunityChart;
