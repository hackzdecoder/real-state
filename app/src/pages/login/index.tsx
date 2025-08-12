import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
    Typography,
    Link,
    Paper,
    Avatar,
    CssBaseline,
    Alert,
    CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEndpoint from '../../api';

interface LoginProps {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
}

interface User {
    id: string;
    username: string;
    full_name: string;
    role: string;
    avatar?: string | null;
}

interface LoginResponse {
    access_token?: string;
    user?: User;
    error?: string;
    message?: string;
}

interface LoginPayload {
    username: string;
    password: string;
    rememberMe: boolean;
}

const Login = ({
    primaryColor = '#09d646',
    backgroundColor = 'background.default',
    textColor = 'text.primary',
}: LoginProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const { data: response, error: apiError, isLoading, execute } = useEndpoint<LoginResponse, LoginPayload>({
        url: '/api/login',
        method: 'POST',
        body: { username: username.trim(), password, rememberMe },
    });

    useEffect(() => {
        if (response) {
            if (response.access_token) {
                localStorage.setItem('auth_token', response.access_token);
            }
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
                navigate('/dashboard', { replace: true });
            }
        }
        if (apiError) {
            setErrors({ api: apiError });
        }
    }, [response, apiError, navigate]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!username.trim()) newErrors.username = 'Username is required';
        if (!password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setErrors({});
        await execute();
    };

    return (
        <>
            <CssBaseline />
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    width: '100vw',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bgcolor: backgroundColor,
                }}
            >
                <Paper
                    elevation={3}
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        width: '100%',
                        maxWidth: 400,
                        p: 4,
                        m: 2,
                        boxSizing: 'border-box',
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Avatar
                            sx={{
                                bgcolor: primaryColor,
                                width: 40,
                                height: 40,
                                mx: 'auto',
                                mb: 1,
                            }}
                        >
                            <LockOutlinedIcon />
                        </Avatar>
                        <Typography variant="h5" component="h1" fontWeight="bold" color={textColor}>
                            Sign in
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Welcome back! Please enter your details.
                        </Typography>
                    </Box>

                    {errors.api && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errors.api}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        required
                        margin="normal"
                        label="Username / Email"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        error={!!errors.username}
                        helperText={errors.username}
                        disabled={isLoading}
                        autoComplete="username"
                        sx={{
                            '& label.Mui-focused': {
                                color: primaryColor,
                            },
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: primaryColor,
                                },
                            },
                        }}
                    />
                    <TextField
                        fullWidth
                        required
                        margin="normal"
                        label="Password"
                        type="password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!errors.password}
                        helperText={errors.password}
                        disabled={isLoading}
                        autoComplete="current-password"
                        sx={{
                            '& label.Mui-focused': {
                                color: primaryColor,
                            },
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: primaryColor,
                                },
                            },
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                color="primary"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                            />
                        }
                        label="Remember me"
                        sx={{ mt: 1, color: textColor }}
                    />
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={isLoading}
                        sx={{
                            mt: 3,
                            mb: 2,
                            backgroundColor: primaryColor,
                            '&:hover': {
                                backgroundColor: primaryColor,
                                opacity: 0.9,
                            },
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'SIGN IN'}
                    </Button>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 2,
                        }}
                    >
                        <Link href="/register" variant="body2" color={textColor}>
                            Don't have an account? Sign Up
                        </Link>
                    </Box>
                </Paper>
            </Box>
        </>
    );
};

export default Login;
