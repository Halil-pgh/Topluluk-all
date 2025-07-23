import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, Typography } from '@mui/material';
import apiClient from './api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    }
  },
};

interface Community {
    url: string,
    name: string,
    subscriber_count: number,
}

function MostSubedCommunityChart() {
    const [labels, setLabels] = useState<string[]>([])
    const [data, setData] = useState<number[]>([])

    useEffect(() => {
        const fetchData = async () => {
            // remove everyhing so that they dont add up
            setLabels([])
            setData([])

            const response = await apiClient.get('stats/most_subscribed_communities/')
            response.data.map((community: Community) => {
                setLabels(prewLabels => [...prewLabels, community.name])
                setData(prewData => [...prewData, community.subscriber_count])
            })
        }
        fetchData()
    }, [])

    return (
        <Card sx={{ maxWidth: 600, margin: 'auto', mt: 10 }}>
            <CardContent>
                <Typography variant='h6' gutterBottom>
                    Most Subscribed Communities
                </Typography>
                <Bar data={{
                    labels: labels,
                    datasets: [
                        {
                            label: 'SubscriberCount',
                            indexAxis: 'y',
                            data: data,
                            backgroundColor: 'rgba(63, 81, 181, 0.6)',
                        },
                    ]
                }} options={options}></Bar>
            </CardContent>
        </Card>
    )
}

export default MostSubedCommunityChart