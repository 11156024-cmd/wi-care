// Simple oscillator based alarm to avoid external file dependencies
class AudioService {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  public initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public playAlarm() {
    this.initialize();
    if (this.isPlaying || !this.audioContext) return;

    this.isPlaying = true;
    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    this.oscillator.type = 'sawtooth';
    this.oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
    
    // Siren effect
    this.oscillator.frequency.linearRampToValueAtTime(440, this.audioContext.currentTime + 0.5);
    this.oscillator.frequency.linearRampToValueAtTime(880, this.audioContext.currentTime + 1.0);

    this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    this.oscillator.start();
    
    // Loop the siren effect
    const sirenInterval = setInterval(() => {
        if (!this.isPlaying || !this.oscillator || !this.audioContext) {
            clearInterval(sirenInterval);
            return;
        }
        const now = this.audioContext.currentTime;
        this.oscillator.frequency.cancelScheduledValues(now);
        this.oscillator.frequency.setValueAtTime(880, now);
        this.oscillator.frequency.linearRampToValueAtTime(440, now + 0.5);
        this.oscillator.frequency.linearRampToValueAtTime(880, now + 1.0);
    }, 1000);
  }

  public stopAlarm() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    this.isPlaying = false;
  }
}

export const audioService = new AudioService();