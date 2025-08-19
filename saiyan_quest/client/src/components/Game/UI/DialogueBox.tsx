interface DialogueBoxProps {
  text: string;
  character?: string;
}

export default function DialogueBox({ text, character }: DialogueBoxProps) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      maxWidth: '600px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '3px solid #ffffff',
      borderRadius: '8px',
      padding: '20px',
      pointerEvents: 'auto'
    }}>
      {character && (
        <div style={{
          color: '#ffff00',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          {character}:
        </div>
      )}
      
      <div style={{
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.4'
      }}>
        {text}
      </div>
      
      <div style={{
        textAlign: 'right',
        marginTop: '10px',
        color: '#cccccc',
        fontFamily: 'monospace',
        fontSize: '10px'
      }}>
        Press Z to continue...
      </div>
    </div>
  );
}
