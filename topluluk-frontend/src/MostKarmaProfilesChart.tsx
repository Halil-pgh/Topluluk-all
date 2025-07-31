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

interface Profile {
    url: string,
    user: string,
    karma: number,
    karma_after: number,
}

interface MostKarmaProfilesChartProps {
    message?: string,
    time?: number
}

function MostKarmaProfilesChart({ message, time }: MostKarmaProfilesChartProps) {
    const [labels, setLabels] = useState<string[]>([])
    const [data, setData] = useState<number[]>([])

    // Fixed function - no longer async since it doesn't need to be
    function setDataFromResponse(response: AxiosResponse<Profile[]>) {
        const newLabels: string[] = []
        const newData: number[] = []

        response.data.forEach((profile: Profile) => {
            const raw = profile.url.split('/')
            const username = raw[raw.length - 2]
            newLabels.push(username)
            if (profile.karma_after !== null) {
                newData.push(profile.karma_after)
            }
            else {
                newData.push(profile.karma)
            }
        })

        setLabels(newLabels)
        setData(newData)
    }

    // Smooth gradient colors based on karma levels
    const getKarmaBasedColors = () => {
        const colors = {
            background: [] as string[],
            border: [] as string[]
        }

        if (data.length === 0) return colors
        
        const maxKarma = Math.max(...data)
        const minKarma = Math.min(...data)
        
        data.forEach((karma) => {
            // Normalize karma to 0-1 range
            const normalized = (karma - minKarma) / (maxKarma - minKarma) || 0
            
            // Create smooth gradient from red (high) to blue (low)
            // Using HSL for smoother transitions
            const hue = (1 - normalized) * 240 // 240 = blue, 0 = red
            const saturation = 70 + (normalized * 30) // 70-100% saturation
            const lightness = 45 + (normalized * 15) // 45-60% lightness
            
            colors.background.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`)
            colors.border.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 1)`)
        })
        
        return colors
    }

    // Alternative: Position + Karma hybrid approach
    const getHybridColors = () => {
        const colors = {
            background: [] as string[],
            border: [] as string[]
        }
        
        if (data.length === 0) return colors
        
        const maxKarma = Math.max(...data)
        
        data.forEach((karma, index) => {
            // Base color by position
            let baseHue: number
            switch (index) {
                case 0: baseHue = 350; break // Red-pink for 1st
                case 1: baseHue = 220; break // Blue for 2nd  
                case 2: baseHue = 45; break  // Gold for 3rd
                default: baseHue = 160; break // Green for others
            }
            
            // Adjust intensity based on karma
            const karmaRatio = karma / maxKarma
            const saturation = 60 + (karmaRatio * 40) // 60-100%
            const lightness = 40 + (karmaRatio * 20)  // 40-60%
            
            colors.background.push(`hsla(${baseHue}, ${saturation}%, ${lightness}%, 0.8)`)
            colors.border.push(`hsla(${baseHue}, ${saturation}%, ${lightness}%, 1)`)
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
                        return `${ranks[context[0].dataIndex] || `${position}th`} Place: @${context[0].label}`
                    },
                    label: function(context: any) {
                        return `Karma: ${context.parsed.x.toLocaleString()}`
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
                        weight: 'bold'
                    }
                }
            }
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                let response: AxiosResponse<Profile[]>
                
                if (time === undefined) {
                    response = await apiClient.get('stats/most_karma_profiles/')
                } else {
                    response = await apiClient.get(`stats/most_karma_profiles?time=${time}`)
                }
                
                setDataFromResponse(response)
            } catch (error) {
                console.error('Error fetching karma profiles:', error)
                setLabels([])
                setData([])
            }
        }
        fetchData()
    }, [time])

    // Choose which color method to use:
    const dynamicColors = getKarmaBasedColors() // Pure karma-based gradient
    // const dynamicColors = getHybridColors()   // Position + karma hybrid

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
                    {message}
                </Typography>
                <Bar 
                    data={{
                        labels: labels,
                        datasets: [
                            {
                                label: 'Karma',
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

export default MostKarmaProfilesChart