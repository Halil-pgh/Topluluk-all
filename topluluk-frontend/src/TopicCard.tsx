import React from 'react'
import { Avatar, Box, Card, CardActionArea, CardActions, CardMedia, Grid, IconButton, ToggleButton, ToggleButtonGroup, Typography, Menu, MenuItem } from "@mui/material"
import { ArrowDownward, ArrowUpward, Comment, Delete, Block } from "@mui/icons-material"
import { formatDate } from "./responseTypes"
import { calcualteCommentCount, type Topic } from './Topic'
import ProfileTooltip from './ProfileTooltip'

interface TopicCardProps {
    topic: Topic
    onTopicClick: (e: React.MouseEvent, topicSlug: string, communitySlug?: string) => void
    onVote: (topicSlug: string, newVote: number) => void
    onBan?: (topicSlug: string, days: number | null) => void
    onRemove?: (topicSlug: string) => void
    amIBanned: boolean
    amIMod?: boolean
    showCommunityBadge?: boolean
    communitySlug?: string
}

const TopicCard = ({ 
    topic, 
    onTopicClick, 
    onVote, 
    onBan, 
    onRemove, 
    amIBanned, 
    amIMod = false, 
    showCommunityBadge = false,
    communitySlug 
}: TopicCardProps) => {
    const [banMenuAnchor, setBanMenuAnchor] = React.useState<HTMLElement | null>(null)

    const banOptions = [
        { label: 'Permanent Ban', days: null },
        { label: '1 Year Ban', days: 365 },
        { label: '1 Month Ban', days: 30 },
        { label: '1 Day Ban', days: 1 }
    ]

    const handleBanMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        setBanMenuAnchor(event.currentTarget)
    }

    const handleBanMenuClose = () => {
        setBanMenuAnchor(null)
    }

    const handleBanClick = (days: number | null) => {
        if (onBan) onBan(topic.slug, days)
        handleBanMenuClose()
    }

    const handleRemoveClick = (event: React.MouseEvent) => {
        event.stopPropagation()
        if (onRemove) onRemove(topic.slug)
    }

    const handleVoteClick = (event: React.MouseEvent, newVote: number) => {
        event.stopPropagation()
        if (!amIBanned) {
            onVote(topic.slug, newVote)
        }
    }

    return (
        <Grid size={{ xs: 12 }}>
            <Card sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
                border: '1px solid #3a3a3a',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                    borderColor: '#4a4a4a',
                    background: 'linear-gradient(135deg, #202020 0%, #353535 50%, #252525 100%)'
                },
                position: 'relative'
            }}>
                <CardActionArea 
                    onClick={(e) => onTopicClick(e, topic.slug, communitySlug)} 
                    sx={{ 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch'
                    }}
                >
                    {/* Header with User Info */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 3,
                        pb: 2,
                        background: 'rgba(0,0,0,0.3)',
                        borderBottom: '1px solid #3a3a3a'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ProfileTooltip profile={topic.profile}>
                                <Avatar 
                                    src={topic.profile.image} 
                                    alt={topic.profile.username}
                                    sx={{ 
                                        width: 48,
                                        height: 48,
                                        border: '2px solid #4a4a4a',
                                        cursor: 'pointer'
                                    }}
                                />
                            </ProfileTooltip>
                            <Box sx={{ ml: 2 }}>
                                <ProfileTooltip profile={topic.profile}>
                                    <Typography 
                                        variant="subtitle1" 
                                        sx={{ 
                                            fontWeight: 600,
                                            color: '#e0e0e0',
                                            cursor: 'pointer',
                                            display: 'inline-block',
                                            '&:hover': {
                                                color: '#f5f5f5'
                                            }
                                        }}
                                    >
                                        {topic.profile.username}
                                    </Typography>
                                </ProfileTooltip>
                                {showCommunityBadge && communitySlug && (
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            color: '#ff6b35',
                                            fontWeight: 'bold',
                                            background: 'rgba(255, 107, 53, 0.1)',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 2,
                                            border: '1px solid rgba(255, 107, 53, 0.3)',
                                            ml: 1,
                                            display: 'inline-block'
                                        }}
                                    >
                                        /{communitySlug}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: '#9e9e9e',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            {formatDate(topic.createdDate)}
                        </Typography>
                    </Box>

                    {/* Title */}
                    <Box sx={{ px: 3, pb: 2, pt: 2 }}>
                        <Typography 
                            variant="h5" 
                            component="h3"
                            sx={{ 
                                fontWeight: 700,
                                color: '#f5f5f5',
                                lineHeight: 1.3,
                                mb: 1
                            }}
                        >
                            {topic.title}
                        </Typography>
                        {topic.text && !topic.image && (
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: '#b0b0b0',
                                    lineHeight: 1.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                            >
                                {topic.text}
                            </Typography>
                        )}
                    </Box>

                    {/* Image */}
                    {topic.image && (
                        <CardMedia
                            component="img"
                            image={topic.image}
                            alt={`${topic.title} picture`}
                            sx={{ 
                                height: 300,
                                objectFit: 'contain',
                                borderRadius: '12px',
                                mb: 2
                            }}
                        />
                    )}
                </CardActionArea>

                {/* Actions Bar */}
                <CardActions sx={{ 
                    p: 3,
                    pt: 2,
                    background: 'rgba(0,0,0,0.4)',
                    borderTop: '1px solid #3a3a3a',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ToggleButtonGroup
                            value={topic.vote}
                            exclusive
                            onChange={(e, newVote) => handleVoteClick(e, newVote)}
                            disabled={amIBanned}
                            size="small"
                            sx={{
                                '& .MuiToggleButton-root': {
                                    border: '1px solid #3a3a3a',
                                    borderRadius: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    mx: 0.25,
                                    backgroundColor: '#2a2a2a',
                                    color: '#e0e0e0',
                                    minWidth: 32,
                                    '&:hover': {
                                        bgcolor: '#404040',
                                        borderColor: '#4a4a4a'
                                    },
                                    '&.Mui-selected': {
                                        bgcolor: '#4a4a4a',
                                        color: '#ffffff',
                                        borderColor: '#5a5a5a',
                                        '&:hover': {
                                            bgcolor: '#505050'
                                        }
                                    }
                                }
                            }}
                        >
                            <ToggleButton value={1} aria-label="upvote">
                                <ArrowUpward fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value={-1} aria-label="downvote">
                                <ArrowDownward fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                        
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                fontWeight: 600,
                                minWidth: 24,
                                textAlign: 'center',
                                color: topic.voteCount > 0 ? '#66bb6a' : 
                                       topic.voteCount < 0 ? '#ef5350' : '#9e9e9e',
                                fontSize: '0.875rem'
                            }}
                        >
                            {topic.voteCount > 0 ? '+' : ''}{topic.voteCount}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}>
                            <IconButton 
                                aria-label="comment"
                                disabled={amIBanned}
                                size="small"
                                sx={{
                                    color: '#9e9e9e',
                                    '&:hover': {
                                        color: '#e0e0e0',
                                        bgcolor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                <Comment fontSize="small" />
                            </IconButton>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: '#9e9e9e',
                                    fontWeight: 500,
                                    fontSize: '0.875rem'
                                }}
                            >
                                {calcualteCommentCount(topic.comments)}
                            </Typography>
                        </Box>
                    </Box>

                    {amIMod && onBan && onRemove && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton 
                                onClick={handleBanMenuOpen} 
                                aria-label="ban user"
                                size="small"
                                sx={{
                                    color: '#ff9800',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 152, 0, 0.1)',
                                        color: '#ffb74d'
                                    }
                                }}
                            >
                                <Block fontSize="small" />
                            </IconButton>
                            <Menu
                                anchorEl={banMenuAnchor}
                                open={Boolean(banMenuAnchor)}
                                onClose={handleBanMenuClose}
                                PaperProps={{
                                    sx: {
                                        borderRadius: 2,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #3a3a3a'
                                    }
                                }}
                            >
                                {banOptions.map((option, index) => (
                                    <MenuItem 
                                        key={index} 
                                        onClick={() => handleBanClick(option.days)}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 152, 0, 0.1)'
                                            }
                                        }}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Menu>
                            <IconButton 
                                onClick={handleRemoveClick} 
                                aria-label="remove topic"
                                size="small"
                                sx={{
                                    color: '#f44336',
                                    '&:hover': {
                                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                                        color: '#ef5350'
                                    }
                                }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>
                    )}
                </CardActions>
            </Card>
        </Grid>
    )
}

export default TopicCard
