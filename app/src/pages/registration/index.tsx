import {
    Box,
    Button,
    TextField,
    Typography,
    Link,
    Paper,
    Avatar,
    CssBaseline,
    Alert,
    CircularProgress,
} from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEndpoint from '../../api';

interface RegisterProps {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
}

interface User {
    id: string;
    email: string;
    role: string;
    full_name?: string;
    avatar?: string | null;
}

interface RegisterResponse {
    access_token?: string;
    user?: User;
    error?: string;
    message?: string;
}

interface RegisterPayload {
    username: string;
    password: string;
    full_name: string;
}

const Register = ({
    primaryColor = '#09d646',
    backgroundColor = 'background.default',
    textColor = 'text.primary',
}: RegisterProps) => {
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const { data: response, error: apiError, isLoading, execute } = useEndpoint<RegisterResponse, RegisterPayload>({
        url: '/api/register',
        method: 'POST',
        body: { username: username.trim(), password, full_name: fullName.trim() },
    });

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!username.trim()) newErrors.username = 'Username is required';
        if (!fullName.trim()) newErrors.full_name = 'Full name is required';
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

    useEffect(() => {
        if (response?.user) {
            if (response.access_token) localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            navigate('/dashboard', { replace: true });
        }
        if (apiError) setErrors({ api: apiError });
    }, [response, apiError, navigate]);

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
                            <PersonAddAltIcon />
                        </Avatar>
                        <Typography variant="h5" component="h1" fontWeight="bold" color={textColor}>
                            Sign Up
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Create an account to get started.
                        </Typography>
                    </Box>

                    {errors.api && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errors.api}
                        </Alert>
                    )}

                    {/* Username */}
                    <TextField
                        fullWidth
                        required
                        margin="normal"
                        label="Username"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        error={!!errors.username}
                        helperText={errors.username}
                        disabled={isLoading}
                        sx={{
                            '& label.Mui-focused': { color: primaryColor },
                            '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: primaryColor },
                        }}
                    />

                    {/* Full Name */}
                    <TextField
                        fullWidth
                        required
                        margin="normal"
                        label="Full Name"
                        variant="outlined"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        error={!!errors.full_name}
                        helperText={errors.full_name}
                        disabled={isLoading}
                        sx={{
                            '& label.Mui-focused': { color: primaryColor },
                            '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: primaryColor },
                        }}
                    />

                    {/* Password */}
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
                        sx={{
                            '& label.Mui-focused': { color: primaryColor },
                            '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: primaryColor },
                        }}
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
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'SIGN UP'}
                    </Button>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 2,
                        }}
                    >
                        <Link href="/login" variant="body2" color={textColor}>
                            Return to login
                        </Link>
                    </Box>
                </Paper>
            </Box>
        </>
    );
};

export default Register;
