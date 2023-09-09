on run argv
    set n to item 1 of argv as integer
    tell application "System Events"
        repeat with i from 1 to n
            key code 123
        end repeat
    end tell
end run

