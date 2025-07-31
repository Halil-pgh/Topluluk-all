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
import type { AxiosResponse } from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Community {
    url: string,
    name: string,
    subscriber_count: number,
    subscriber_count_after: number,
}

interface MostSubedCommunityChartProps {
    message?: string,
    time?: number
}

function MostSubedCommunityChart({ message, time }: MostSubedCommunityChartProps) {
    const [labels, setLabels] = useState<string[]>([])
    const [data, setData] = useState<number[]>([])

    // Fixed function - no longer async since it doesn't need to be
    function setDataFromResponse(response: AxiosResponse<Community[]>) {
        const newLabels: string[] = []
        const newData: number[] = []

        response.data.forEach((community: Community) => {
            newLabels.push(community.name)
            if (community.subscriber_count_after !== null) {
                newData.push(community.subscriber_count_after)
            } else {
                newData.push(community.subscriber_count)
            }
        })

        setLabels(newLabels)
        setData(newData)
    }

    // Smooth gradient colors based on subscriber count levels
    const getSubscriberBasedColors = () => {
        const colors = {
            background: [] as string[],
            border: [] as string[]
        }

        if (data.length === 0) return colors
        
        const maxSubs = Math.max(...data)
        const minSubs = Math.min(...data)
        
        data.forEach((subs) => {
            // Normalize subscriber count to 0-1 range
            const normalized = (subs - minSubs) / (maxSubs - minSubs) || 0
            
            // Create smooth gradient from purple (high) to teal (low)
            // Using HSL for smoother transitions
            const hue = 180 + (normalized * 100) // 180 = cyan, 280 = purple
            const saturation = 70 + (normalized * 30) // 70-100% saturation
            const lightness = 45 + (normalized * 15) // 45-60% lightness
            
            colors.background.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`)
            colors.border.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 1)`)
        })
        
        return colors
    }

    // Enhanced chart options with better tooltips
    const options = {
        responsive: true,
        indexAxis: 'y' as const,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    title: function(context: any) {
                        const position = context[0].dataIndex + 1
                        const ranks = ['🏆 1st', '🥈 2nd', '🥉 3rd', '4th', '5th']
                        return `${ranks[context[0].dataIndex] || `${position}th`} Place: ${context[0].label}`
                    },
                    label: function(context: any) {
                        return `Subscribers: ${context.parsed.x.toLocaleString()}`
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    callback: function(value: any) {
                        return value.toLocaleString()
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.9)',
                    font: {
                        weight: 'bold' as const
                    }
                }
            }
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                let response: AxiosResponse<Community[]>
                
                if (time === undefined) {
                    response = await apiClient.get('stats/most_subscribed_communities/')
                } else {
                    response = await apiClient.get(`stats/most_subscribed_communities?time=${time}`)
                }
                
                setDataFromResponse(response)
            } catch (error) {
                console.error('Error fetching subscribed communities:', error)
                setLabels([])
                setData([])
            }
        }
        fetchData()
    }, [time])

    // Get dynamic colors based on subscriber counts
    const dynamicColors = getSubscriberBasedColors()

    return (
        <Card sx={{ 
            maxWidth: 800, 
            margin: 'auto', 
            mt: 10,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '1px solid #404040'
        }}>
            <CardContent>
                <Typography variant='h6' gutterBottom sx={{ color: '#fff', textAlign: 'center' }}>
                    {message || 'Most Subscribed Communities'}
                </Typography>
                <Bar 
                    data={{
                        labels: labels,
                        datasets: [
                            {
                                label: 'Subscribers',
                                data: data,
                                backgroundColor: dynamicColors.background,
                                borderColor: dynamicColors.border,
                                borderWidth: 2,
                                borderRadius: 8,
                                borderSkipped: false,
                            },
                        ]
                    }} 
                    options={options}
                />
            </CardContent>
        </Card>
    )
}

export default MostSubedCommunityChart