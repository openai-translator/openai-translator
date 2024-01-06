import React, { useState, useEffect, useCallback } from 'react'
import YG from './widget.js'

const YouGlishComponent = ({ query, triggerYouGlish, language, accent }) => {
    const [widget, setWidget] = useState(null)
    const [currentTrack, setCurrentTrack] = useState(0)
    const [totalTracks, setTotalTracks] = useState(0)
    const [views, setViews] = useState(0)

    const onFetchDone = (event) => {
        if (event.totalResult !== 0) setTotalTracks(event.totalResult)
    }

    const onVideoChange = (event) => {
        setCurrentTrack(event.trackNumber)
        setViews(0)
    }

    const onCaptionConsumed = useCallback(() => {
        setViews((v) => {
            const newViews = v + 1
            if (newViews < 3) {
                widget.replay()
            } else if (currentTrack < totalTracks) {
                widget.next()
            }
            return newViews
        })
    }, [widget, currentTrack, totalTracks])

    const updateWidget = useCallback(
        (newQuery, newLanguage, newAccent) => {
            if (widget) {
                widget.fetch(newQuery, newLanguage, newAccent)
            }
        },
        [widget]
    )

    useEffect(() => {
        if (query && language) {
            if (widget && triggerYouGlish) {
                widget.fetch(query, language, accent)
            } else {
                const newWidget = new YG.Widget('youglish-widget', {
                    width: 640,
                    components: 255,
                    events: {
                        onFetchDone: onFetchDone,
                        onVideoChange: onVideoChange,
                        onCaptionConsumed: onCaptionConsumed,
                    },
                })
                setWidget(newWidget)
            }
        }
    }, [widget, query, language, accent, triggerYouGlish, onCaptionConsumed])



    return <div id='youglish-widget' style={{ width: '640px', height: '360px' }}></div>
}

export default YouGlishComponent
