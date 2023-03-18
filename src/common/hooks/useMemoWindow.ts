import { listen, TauriEvent } from "@tauri-apps/api/event";
import { appWindow, PhysicalPosition, PhysicalSize } from "@tauri-apps/api/window";
import { useEffect, useLayoutEffect } from "react";

export type WindowMemoProps = {
    size: boolean,
    position: boolean
}

/**
 * memorized window props
 */
export const useMemoWindow = (props: WindowMemoProps) => {

    useLayoutEffect(() => {
        if (props.position) {
            const storagePosition = localStorage.getItem('_position');
            if (storagePosition) {
                const { x, y } = JSON.parse(storagePosition);
                appWindow.setPosition(new PhysicalPosition(x, y))
            }
        } else {
            localStorage.removeItem('_position')
        }
        if (props.size) {
            const storageSize = localStorage.getItem('_size');
            if (storageSize) {
                const { height, width } = JSON.parse(storageSize);
                appWindow.setSize(new PhysicalSize(width, height));
            }
        } else {
            localStorage.removeItem('_size')
        }
        appWindow.show();
    }, [])

    useEffect(() => {
        const unListenMove = listen(TauriEvent.WINDOW_MOVED, (event: { payload: any }) => {
            localStorage.setItem('_position', JSON.stringify(event.payload));
        })
        const unListenResize = listen(TauriEvent.WINDOW_RESIZED, (event: { payload: any }) => {
            localStorage.setItem('_size', JSON.stringify(event.payload));
        })
        return () => {
            unListenMove.then;
            unListenResize.then;
        };
    }, [])
}