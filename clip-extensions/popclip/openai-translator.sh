curl -d "$POPCLIP_TEXT" --unix-socket /tmp/openai-translator.sock http://openai-translator

if [ $? -eq 0 ]; then
    exit 0
else
    open -g -a OpenAI\ Translator
    sleep 3
    curl -d "$POPCLIP_TEXT" --unix-socket /tmp/openai-translator.sock http://openai-translator
fi
