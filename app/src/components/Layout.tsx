// Layout.tsx
import type { ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface LayoutProps {
  children: ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  mode?: 'light' | 'dark';
}

const Layout = ({
  children,
  primaryColor = '#1976d2', // MUI default blue
  secondaryColor = '#dc004e', // MUI default pink/red
  mode = 'light',
}: LayoutProps) => {
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: primaryColor,
      },
      secondary: {
        main: secondaryColor,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            '&:hover': {
              color: mode === 'light' ? primaryColor : secondaryColor,
              textDecoration: 'underline',
              textDecorationColor: mode === 'light' ? primaryColor : secondaryColor,
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default Layout;
