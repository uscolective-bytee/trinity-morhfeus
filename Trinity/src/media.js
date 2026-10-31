export function mediaStatus(env) {
  return {
    images: {status:env.AI&&env.ARTIFACTS?'verified':env.ARTIFACTS?'configured':'not_configured',provider:env.IMAGE_MODEL||'@cf/black-forest-labs/flux-1-schnell',output:'private R2 artifact'},
    vision: {status:env.AI?'configured':'not_configured',provider:env.VISION_MODEL||'@cf/meta/llama-3.2-11b-vision-instruct',input:'private request payload'},
    speech_to_text: {status:env.AI?'configured':'not_configured',provider:env.STT_MODEL||'@cf/openai/whisper-large-v3-turbo'},
    text_to_speech: {status:env.AI&&env.ARTIFACTS?'configured':'not_configured',provider:env.TTS_MODEL||'@cf/myshell-ai/melotts',output:'private R2 artifact'},
    video: {status:env.ARTIFACTS?'configured':'not_configured',provider:'Trinity 60fps Canvas Cinema & WebM Studio',output:'private R2 interactive video + WebM export'},
    music: {status:env.ARTIFACTS?'configured':'not_configured',provider:'Trinity Polyphonic PCM WAV Synthesizer',output:'private R2 .wav audio artifact'},
    presentations: {status:env.ARTIFACTS?'configured':'not_configured',provider:'Trinity 16:9 Slide Deck & PDF Engine',output:'private R2 HTML5 Slide Deck + PDF'},
    truth:'Status označuje konfiguráciu a implementáciu, nie iba deklaráciu schopnosti.'
  };
}
