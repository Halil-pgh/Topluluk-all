import AsyncSelect from 'react-select/async'
import apiClient from './api'
import type { TopicResponse } from './responseTypes'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@emotion/react'
import { Search } from '@mui/icons-material'

const fetchOptions = async (inputValue: string): Promise<TopicResponse[]> => {
    const response = await apiClient.get(`search?q=${inputValue}`)
    return response.data
}

function loadOptions(inputValue: string, callback: (options: TopicResponse[]) => void) {
    if (!inputValue) {
        return callback([])
    }

    setTimeout(async () => {
        callback(await fetchOptions(inputValue))
    }, 500)
}

function SearchBox() {
    const navigate = useNavigate()
    const theme = useTheme()

    const customStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: state.isFocused ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.23)',
        borderRadius: theme.shape.borderRadius,
        minHeight: '40px',
        boxShadow: 'none',
        paddingLeft: '40px', // Make space for search icon
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderColor: 'rgba(255, 255, 255, 0.5)',
        },
    }),
    input: (provided: any) => ({
        ...provided,
        color: 'white',
    }),
    placeholder: (provided: any) => ({
        ...provided,
        color: 'rgba(255, 255, 255, 0.7)',
    }),
    singleValue: (provided: any) => ({
        ...provided,
        color: 'white',
    }),
    indicatorSeparator: () => ({
        display: 'none', // Hide separator
    }),
    dropdownIndicator: () => ({
        display: 'none', // Hide dropdown indicator
    }),
    clearIndicator: (provided: any) => ({
        ...provided,
        color: 'rgba(255, 255, 255, 0.7)',
        '&:hover': {
            color: 'white',
        },
    }),
    menu: (provided: any) => ({
        ...provided,
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[8],
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected 
            ? theme.palette.primary.main 
            : state.isFocused 
                ? theme.palette.action.hover 
                : 'transparent',
        color: state.isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary,
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    }),
    }

    function onChange(selectedValue: TopicResponse | null) {
        if (selectedValue === null) {
            return
        }
        const raw = selectedValue.community.split('/')
        const communitySlug = raw[raw.length - 2]
        const topicSlug = selectedValue.slug
        navigate(`/communities/${communitySlug}/${topicSlug}`)
    }


    return (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <Search 
                style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 1,
                    pointerEvents: 'none',
                    fontSize: '20px'
                }}
            />
            <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadOptions}
                placeholder='Search...'
                onChange={onChange}
                styles={customStyles}
                getOptionLabel={(option: TopicResponse) => option.title}
                getOptionValue={(option: TopicResponse) => option.slug}
            />
        </div>
    )
}

export default SearchBox