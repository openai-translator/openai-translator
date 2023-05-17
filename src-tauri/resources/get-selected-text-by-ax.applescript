use sys : application "System Events"

-- Use the following delay to choose an application window
-- and highlight some text.  Then ensure that the window remains
-- in focus until the script terminates.
-- delay 5

set P to the first application process whose frontmost is true

set appName to name of P

if appName is equal to "Mail" then
	error "not support " & appName
end

if appName is equal to "Safari" then
	try
		tell application "Safari"
			set theText to (do JavaScript "getSelection().toString()" in document 1)
		end tell
		return theText
	end try
	error "not support Safari"
end

set _W to a reference to the first window of P

set _U to a reference to ¬
	(UI elements of P whose ¬
		name of attributes contains "AXSelectedText" and ¬
		value of attribute "AXSelectedText" is not "" and ¬
		class of value of attribute "AXSelectedText" is not class)

tell sys to if (count _U) ≠ 0 then ¬
	return the value of ¬
		attribute "AXSelectedText" of ¬
		_U's contents's first item

set _U to a reference to UI elements of _W

with timeout of 1 seconds
	tell sys to repeat while (_U exists)
		tell (a reference to ¬
			(_U whose ¬
				name of attributes contains "AXSelectedText" and ¬
				value of attribute "AXSelectedText" is not "" and ¬
				class of value of attribute "AXSelectedText" is not class)) ¬
			to if (count) ≠ 0 then return the value of ¬
			attribute "AXSelectedText" of its contents's first item
		
		set _U to a reference to (UI elements of _U)
	end repeat
end timeout

error "not found AXSelectedText"
