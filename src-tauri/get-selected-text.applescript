use AppleScript version "2.4"
use scripting additions
use framework "Foundation"
use framework "AppKit"

on fetchStorableClipboard()
    set aMutableArray to current application's NSMutableArray's array() -- used to store contents
    -- get the pasteboard and then its pasteboard items
    set thePasteboard to current application's NSPasteboard's generalPasteboard()
    -- loop through pasteboard items
    repeat with anItem in thePasteboard's pasteboardItems()
        -- make a new pasteboard item to store existing item's stuff
        set newPBItem to current application's NSPasteboardItem's alloc()'s init()
        -- get the types of data stored on the pasteboard item
        set theTypes to anItem's types()
        -- for each type, get the corresponding data and store it all in the new pasteboard item
        repeat with aType in theTypes
            set theData to (anItem's dataForType:aType)'s mutableCopy()
            if theData is not missing value then
                (newPBItem's setData:theData forType:aType)
            end if
        end repeat
        -- add new pasteboard item to array
        (aMutableArray's addObject:newPBItem)
    end repeat
    return aMutableArray
end fetchStorableClipboard

on putOnClipboard:theArray
    -- get pasteboard
    set thePasteboard to current application's NSPasteboard's generalPasteboard()
    -- clear it, then write new contents
    thePasteboard's clearContents()
    thePasteboard's writeObjects:theArray
end putOnClipboard:

set savedClipboard to my fetchStorableClipboard()

set thePasteboard to current application's NSPasteboard's generalPasteboard()
set theCount to thePasteboard's changeCount()
-- Copy selected text to clipboard:
tell application "System Events" to keystroke "c" using {command down}
-- Check for changed clipboard:
repeat 20 times
    if thePasteboard's changeCount() is not theCount then exit repeat
    delay 0.1
end repeat

set theSelectedText to the clipboard

my putOnClipboard:savedClipboard

theSelectedText
