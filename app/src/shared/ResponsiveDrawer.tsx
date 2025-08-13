import * as React from 'react';
import {
    AppBar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    useTheme,
    Avatar,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import WidgetsIcon from '@mui/icons-material/Widgets';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

interface ResponsiveDrawerProps {
    window?: () => Window;
    children?: React.ReactNode;
}

interface User {
    id: string;
    email: string;
    role: string; // e.g. "admin" or "user"
    phone?: string;
    full_name?: string;
    avatar?: string | null;
}

export default function ResponsiveDrawer({ window, children }: ResponsiveDrawerProps) {
    const theme = useTheme();
    const navigate = useNavigate();

    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [isClosing, setIsClosing] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    // User state
    const [user, setUser] = React.useState<User | null>(null);

    React.useEffect(() => {
        try {
            const userDataStr = localStorage.getItem('user');
            if (userDataStr) {
                const userObj: User = JSON.parse(userDataStr);
                setUser(userObj);
            }
        } catch {
            setUser(null);
        }
    }, []);

    const handleDrawerClose = () => {
        setIsClosing(true);
        setMobileOpen(false);
    };

    const handleDrawerTransitionEnd = () => {
        setIsClosing(false);
    };

    const handleDrawerToggle = () => {
        if (!isClosing) {
            setMobileOpen(!mobileOpen);
        }
    };

    const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        setAnchorEl(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        try {
            const token = localStorage.getItem('auth_token') || '';
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                console.warn('Logout API returned an error');
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        }

        navigate('/login', { replace: true });
    };

    // Role display mapping function
    const roleDisplayName = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'Admin';
            case 'user':
                return 'User';
            default:
                return role;
        }
    };

    const drawer = (
        <Box
            sx={{
                height: '100%',
                bgcolor: theme.palette.mode === 'light' ? '#ffffff' : theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                borderRight: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Toolbar
                sx={{
                    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: theme.palette.primary.main,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    userSelect: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                Real State Management
            </Toolbar>
            <Divider />
            <List sx={{ flexGrow: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton
                        sx={{
                            borderRadius: 1,
                            mx: 1,
                            my: 0.5,
                            color: theme.palette.primary.main,
                            transition: 'background-color 0.3s ease, color 0.3s ease',
                            '& .MuiListItemIcon-root': {
                                color: theme.palette.primary.main,
                                minWidth: 36,
                                transition: 'color 0.3s ease',
                            },
                            '&:hover': {
                                bgcolor: theme.palette.primary.main,
                                color: '#fff',
                                '& .MuiListItemIcon-root': {
                                    color: '#fff',
                                },
                            },
                        }}
                    >
                        <ListItemIcon>
                            <WidgetsIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="Dashboard"
                            primaryTypographyProps={{
                                fontWeight: 600,
                                fontSize: '1rem',
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <AppBar
                position="fixed"
                elevation={3}
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    boxShadow:
                        theme.palette.mode === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.7)',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' }, color: theme.palette.primary.main }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 700,
                            fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
                            color: theme.palette.primary.main,
                        }}
                    >
                        {/* Optional title */}
                    </Typography>

                    {/* Display full_name and role next to avatar */}
                    <Typography
                        variant="body1"
                        sx={{
                            ml: 1,
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            userSelect: 'none',
                            display: { xs: 'none', sm: 'block' },
                            alignSelf: 'center',
                        }}
                    >
                        {user ? `${user.full_name || ''} (${roleDisplayName(user.role)})` : ''}
                    </Typography>

                    {/* Profile avatar with menu */}
                    <Tooltip title="Account settings">
                        <IconButton
                            onClick={handleProfileClick}
                            size="small"
                            sx={{ ml: 2 }}
                            aria-controls={open ? 'account-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                        >
                            <Avatar src={user?.avatar || '/broken-image.jpg'} />
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={anchorEl}
                        id="account-menu"
                        open={open}
                        onClose={handleProfileClose}
                        onClick={handleProfileClose}
                        PaperProps={{
                            elevation: 4,
                            sx: {
                                mt: 0.5,
                                minWidth: 140,
                                '& .MuiMenuItem-root': {
                                    typography: 'body1',
                                    color: theme.palette.mode === 'light' ? '#3f3f3f' : '#ddd',
                                    transition: 'background-color 0.3s ease, color 0.3s ease',
                                    '&:hover': {
                                        bgcolor: theme.palette.primary.main,
                                        color: '#fff',
                                    },
                                    '&:focus-visible': {
                                        bgcolor: theme.palette.primary.light,
                                        color: '#fff',
                                        boxShadow: `0 0 10px ${theme.palette.primary.light}`,
                                    },
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                {/* Mobile drawer */}
                <Drawer
                    container={container}
                    variant="temporary"
                    open={mobileOpen}
                    onTransitionEnd={handleDrawerTransitionEnd}
                    onClose={handleDrawerClose}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            backgroundColor: theme.palette.mode === 'light' ? '#fafafa' : theme.palette.background.paper,
                        },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            backgroundColor: theme.palette.mode === 'light' ? '#fafafa' : theme.palette.background.paper,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 2,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    bgcolor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    overflow: 'auto',
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
