tell application "System Events"
    set frontmostProcess to first process whose frontmost is true
    set appName to name of frontmostProcess
end tell

if appName is equal to "OpenAI Translator" then
    return
end if

-- Copy selected text to clipboard:
tell application "System Events" to keystroke "c" using {command down}
