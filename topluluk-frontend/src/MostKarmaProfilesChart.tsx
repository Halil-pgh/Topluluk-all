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

// Chart Options
const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    }
  },
};

interface Profile {
    url: string,
    user: string,
    karma: number,
}

function MostKarmaProfilesChart() {
    const [labels, setLabels] = useState<string[]>([])
    const [data, setData] = useState<number[]>([])

    useEffect(() => {
        const fetchData = async () => {
            // remove everyhing so that they dont add up
            setLabels([])
            setData([])

            const response = await apiClient.get('stats/most_karma_profiles/')
            response.data.map((profile: Profile) => {
                const raw = profile.url.split('/')
                const username = raw[raw.length - 2]
                setLabels(prewLabels => [...prewLabels, username])
                setData(prewData => [...prewData, profile.karma])
            })
        }
        fetchData()
    }, [])

    return (
        <Card sx={{ maxWidth: 600, margin: 'auto', mt: 10 }}>
            <CardContent>
                <Typography variant='h6' gutterBottom>
                    Profiles with Most Karma
                </Typography>
                <Bar data={{
                    labels: labels,
                    datasets: [
                        {
                            label: 'Karma',
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

export default MostKarmaProfilesChart