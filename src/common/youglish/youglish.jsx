import React, { useState, useEffect } from 'react'
import YG from './widget.js'

const YouGlishComponent = ({ query, triggerYouGlish, language }) => {
    const [widget, setWidget] = useState(null)
    const [currentTrack, setCurrentTrack] = useState(0)
    const [totalTracks, setTotalTracks] = useState(0)
    const [views, setViews] = useState(0)


    const onYouglishAPIReady = (query) => {
        const newWidget = new YG.Widget('widget-1', {
            width: 640,
            components: 255,
            events: {
                onFetchDone: onFetchDone,
                onVideoChange: onVideoChange,
                onCaptionConsumed: onCaptionConsumed,
            },
        })
        newWidget.fetch(query, language)
        setWidget(newWidget)
    }

    const onFetchDone = (event) => {
        if (event.totalResult !== 0) setTotalTracks(event.totalResult)
    }

    const onVideoChange = (event) => {
        setCurrentTrack(event.trackNumber)
        setViews(0)
    }

    const onCaptionConsumed = () => {
        setViews(views + 1)
        if (views < 3) {
            widget.replay()
        } else if (currentTrack < totalTracks) {
            widget.next()
        }
    }

    useEffect(() => {
        if (triggerYouGlish && query) {
            const newWidget = new YG.Widget('youglish-widget', {
                width: 640,
                components: 255,
                events: {
                    onFetchDone: onFetchDone,
                    onVideoChange: onVideoChange,
                },
            })
            newWidget.fetch(query, language)
            setWidget(newWidget)
        }
    }, [query, language, triggerYouGlish])

    return <div id='youglish-widget' style={{ width: '640px', height: '360px' }}></div>
}

export default YouGlishComponent
