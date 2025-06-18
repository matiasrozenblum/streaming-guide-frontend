import { SxProps } from '@mui/material';

export const programStyleOverrides: Record<string, {
  boxStyle?: React.CSSProperties;
  sx?: SxProps;
  render?: (props: { name: string }) => React.ReactNode;
}> = {
  boca: {
    boxStyle: {
      background: 'linear-gradient(to bottom, #1565c0 33%, #ffe082 33%, #ffe082 66%, #1565c0 66%)',
      borderRadius: 16,
      color: '#222',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '1.1rem',
      fontFamily: 'inherit',
    },
    render: ({ name }) => (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1.1rem',
        color: '#222',
        fontFamily: 'inherit',
      }}>{name}</div>
    ),
  },
  river: {
    boxStyle: {
      background: '#fff',
      borderRadius: 16,
      color: '#222',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '1.1rem',
      fontFamily: 'inherit',
    },
    render: ({ name }) => (
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1.1rem',
        color: '#222',
        fontFamily: 'inherit',
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '-20%',
          width: '140%',
          height: '40%',
          background: '#e53935',
          transform: 'rotate(-20deg)',
          zIndex: 1,
        }} />
        <span style={{ position: 'relative', zIndex: 2 }}>{name}</span>
      </div>
    ),
  },
}; 