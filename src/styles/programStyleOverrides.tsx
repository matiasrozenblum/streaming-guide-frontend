import { tokens } from '@/design-system/tokens';
import { SxProps } from '@mui/material';

export const programStyleOverrides: Record<string, {
  boxStyle?: React.CSSProperties;
  sx?: SxProps;
  render?: (props: { name: string; backgroundOpacity?: number }) => React.ReactNode;
}> = {
  boca: {
    boxStyle: {
      borderRadius: tokens.borderRadius.sm,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '1.1rem',
      fontFamily: 'inherit',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
    },
    render: ({ name, backgroundOpacity }) => (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1.1rem',
          fontFamily: 'inherit',
          margin: 0,
          padding: 0,
          borderRadius: tokens.borderRadius.sm,
          position: 'relative',
          zIndex: 1,
          background: `rgba(21,101,192,${backgroundOpacity})`,
          border: `1px solid ${backgroundOpacity === 0.05 ? 'rgba(21,101,192, 0.4)' : 'rgb(21,101,192)'}`,
        }}
      >
        {/* Centered yellow band */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            width: '120%',
            height: '44%',
            background: `rgba(253,206,3,${backgroundOpacity})`,
            borderRadius: tokens.borderRadius.sm,
            border: '1px solid rgb(253,206,3)',
            transform: 'translateY(-50%)',
            zIndex: 1,
            overflow: 'hidden',
          }}
        />
        {/* Program name on top */}
        <span
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            textAlign: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.75rem',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name.toUpperCase()}
        </span>
      </div>
    ),
  },
  river: {
    boxStyle: {
      borderRadius: tokens.borderRadius.sm,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '1.1rem',
      fontFamily: 'inherit',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
    },
    render: ({ name, backgroundOpacity }) => (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1.1rem',
        fontFamily: 'inherit',
        margin: 0,
        padding: 0,
        borderRadius: tokens.borderRadius.sm,
        position: 'relative',
        zIndex: 1,
        background: `rgba(255,255,255,${backgroundOpacity})`,
        border: `1px solid ${backgroundOpacity === 0.05 ? 'rgba(255,255,255, 0.4)' : 'rgb(255,255,255)'}`,
      }}>
        {/* Centered red diagonal band */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '-20%',
          width: '140%',
          height: '40%',
          background: `rgba(238,19,41,${backgroundOpacity})`,
          transform: 'translateY(-50%) rotate(-20deg)',
          zIndex: 1,
          borderRadius: tokens.borderRadius.sm,
          border: `1px solid rgb(238,19,41)`,
        }} />
        {/* Program name on top */}
        <span style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          textAlign: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.75rem',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {name.toUpperCase()}
        </span>
      </div>
    ),
  },
}; 