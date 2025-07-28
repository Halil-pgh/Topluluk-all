import React from 'react'
import { Avatar, Box, Typography, Tooltip, Chip, Link } from "@mui/material"
import { EmojiEvents, DateRange, Link as LinkIcon, Info, ReportProblem } from "@mui/icons-material"
import { type Profile } from './Topic'

interface ProfileTooltipProps {
    profile: Profile
    children: React.ReactElement
}

const ProfileTooltip = ({ profile, children }: ProfileTooltipProps) => {
    const formatKarma = (karma: number) => {
        if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`
        if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`
        return karma.toString()
    }

    const formatSubscriptionDate = (dateString: string) => {
        if (!dateString) return null
        return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    const formatBanDate = (dateString: string) => {
        if (!dateString) return null
        const banDate = new Date(dateString)
        const now = new Date()
        if (banDate <= now) return "Ban expired"
        return `Banned until ${banDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })}`
    }

    const tooltipContent = (
        <Box sx={{ 
            maxWidth: 320,
            p: 0,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: '#1e1e1e'
        }}>
            {/* Header */}
            <Box sx={{ 
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
                p: 3,
                borderBottom: '1px solid #3a3a3a'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                        src={profile.image} 
                        alt={profile.username}
                        sx={{ 
                            width: 56,
                            height: 56,
                            border: '2px solid #4a4a4a',
                            mr: 2
                        }}
                    />
                    <Box>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                fontWeight: 700,
                                color: '#f5f5f5',
                                mb: 0.5
                            }}
                        >
                            {profile.username}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmojiEvents sx={{ color: '#ffd700', fontSize: 16 }} />
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: '#ffd700',
                                    fontWeight: 600
                                }}
                            >
                                {formatKarma(profile.karma)} karma
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                
                {profile.description && (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: '#d0d0d0',
                            lineHeight: 1.4,
                            fontStyle: 'italic'
                        }}
                    >
                        "{profile.description}"
                    </Typography>
                )}
            </Box>

            {/* Details */}
            <Box sx={{ 
                p: 3, 
                pt: 2,
                backgroundColor: '#1e1e1e'
            }}>
                {profile.links && (
                    <Box sx={{ mb: 2 }}>
                        <Chip
                            icon={<LinkIcon sx={{ fontSize: 16 }} />}
                            label="Visit Profile"
                            component={Link}
                            href={profile.links}
                            target="_blank"
                            clickable
                            sx={{
                                backgroundColor: '#2a2a2a',
                                color: '#e0e0e0',
                                border: '1px solid #3a3a3a',
                                '&:hover': {
                                    backgroundColor: '#3a3a3a',
                                    borderColor: '#4a4a4a'
                                },
                                '& .MuiChip-icon': {
                                    color: '#66bb6a'
                                }
                            }}
                        />
                    </Box>
                )}

                {profile.subscribedDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <DateRange sx={{ color: '#66bb6a', fontSize: 18, mr: 1 }} />
                        <Typography 
                            variant="body2" 
                            sx={{ color: '#d0d0d0' }}
                        >
                            <strong>Joined:</strong> {formatSubscriptionDate(profile.subscribedDate)}
                        </Typography>
                    </Box>
                )}

                {profile.banExpriationDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <ReportProblem sx={{ color: '#ff6b6b', fontSize: 18, mr: 1 }} />
                        <Typography 
                            variant="body2" 
                            sx={{ color: '#ff6b6b', fontWeight: 600 }}
                        >
                            {formatBanDate(profile.banExpriationDate)}
                        </Typography>
                    </Box>
                )}

                {!profile.subscribedDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Info sx={{ color: '#9e9e9e', fontSize: 18, mr: 1 }} />
                        <Typography 
                            variant="body2" 
                            sx={{ color: '#9e9e9e' }}
                        >
                            Not subscribed to this community
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    )

    return (
        <Tooltip
            title={tooltipContent}
            placement="bottom-start"
            arrow
            slotProps={{
                popper: {
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 8],
                            },
                        },
                    ],
                },
                tooltip: {
                    sx: {
                        bgcolor: 'transparent',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
                        borderRadius: 4,
                        border: '1px solid #3a3a3a',
                        p: 0,
                        maxWidth: 'none',
                        overflow: 'hidden',
                        '& .MuiTooltip-arrow': {
                            color: '#1a1a1a',
                            '&::before': {
                                border: '1px solid #3a3a3a'
                            }
                        }
                    }
                }
            }}
        >
            {children}
        </Tooltip>
    )
}

export default ProfileTooltip
