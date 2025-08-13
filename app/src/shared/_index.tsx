import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '../../components/AppLayout';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    CircularProgress,
    Alert,
    Modal,
    TextField,
    Button,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    useMediaQuery,
} from '@mui/material';
import { darken } from '@mui/material';

interface ListingInterface {
    id?: string;
    title: string;
    description?: string;
    location_address: string;
    price: number;
    property_type: 'Apartment' | 'House' | 'Commercial';
    status: 'For Sale' | 'For Rent';
    images?: string[] | string;
}

interface IndexProps {
    primaryColor?: string;
    secondaryColor?: string;
    mode?: 'light' | 'dark';
}

const styleModal = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 500,
    bgcolor: 'background.paper',
    boxShadow: 24,
    borderRadius: 2,
    maxHeight: '90vh',
    p: 0,
    display: 'flex',
    flexDirection: 'column',
};

const Index = ({
    primaryColor = '#09d646',
    secondaryColor = '#ff5722',
    mode = 'light',
}: IndexProps) => {
    const [listings, setListings] = useState<ListingInterface[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal & form state
    const [modalOpen, setModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentListing, setCurrentListing] = useState<ListingInterface>({
        title: '',
        description: '',
        location_address: '',
        price: 0,
        property_type: 'Apartment',
        status: 'For Sale',
        images: [],
    });
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const isSmallScreen = useMediaQuery(`(max-width:600px)`);

    const primaryDark = useMemo(() => darken(primaryColor, 0.2), [primaryColor]);

    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                setUserRole(user.role);
            } catch {
                setUserRole(null);
            }
        }
    }, []);

    useEffect(() => {
        if (!selectedImageFile) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(selectedImageFile);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedImageFile]);

    const fetchListings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/listings');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();

            const fetchedListings = data.listings || [];
            setListings(Array.isArray(fetchedListings) ? fetchedListings : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch listings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const openAddModal = () => {
        setEditMode(false);
        setCurrentListing({
            title: '',
            description: '',
            location_address: '',
            price: 0,
            property_type: 'Apartment',
            status: 'For Sale',
            images: [],
        });
        setSelectedImageFile(null);
        setModalOpen(true);
    };

    const openEditModal = (listing: ListingInterface) => {
        setEditMode(true);

        let parsedImages: string[] = [];
        if (Array.isArray(listing.images)) {
            parsedImages = listing.images;
        } else if (typeof listing.images === 'string') {
            try {
                const parsed = JSON.parse(listing.images);
                parsedImages = Array.isArray(parsed) ? parsed : [];
            } catch {
                parsedImages = [];
            }
        }

        setCurrentListing({
            ...listing,
            images: parsedImages,
        });
        setSelectedImageFile(null);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        if (!saving) setModalOpen(false);
    };

    const handleChange = <K extends keyof ListingInterface>(key: K, value: ListingInterface[K]) => {
        setCurrentListing((prev) => ({ ...prev, [key]: value }));
    };

    const imagesArray = useMemo(() => {
        if (Array.isArray(currentListing.images)) return currentListing.images;
        if (typeof currentListing.images === 'string') {
            try {
                const parsed = JSON.parse(currentListing.images);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    }, [currentListing.images]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentListing.title.trim()) {
            setError('Title is required');
            return;
        }
        if (!currentListing.location_address.trim()) {
            setError('Address is required');
            return;
        }
        if (currentListing.price <= 0) {
            setError('Price must be greater than zero');
            return;
        }

        const formData = new FormData();
        formData.append('title', currentListing.title);
        formData.append('description', currentListing.description || '');
        formData.append('location_address', currentListing.location_address);
        formData.append('price', currentListing.price.toString());
        formData.append('property_type', currentListing.property_type);
        formData.append('status', currentListing.status);

        if (selectedImageFile) {
            formData.append('images', selectedImageFile);
        }

        setSaving(true);
        setError(null);

        try {
            const url = editMode ? `/api/listings/${currentListing.id}` : '/api/listings/create';
            const method = editMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to save listing');
            }

            await fetchListings();
            setModalOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save listing');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (saving) return;
        if (!window.confirm('Are you sure you want to delete this listing?')) return;

        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });

            if (!res.ok) {
                let errorMsg = 'Failed to delete listing';

                try {
                    const errData = await res.json();
                    errorMsg = errData.message || errorMsg;
                } catch {
                    // ignore non-JSON errors
                }

                throw new Error(errorMsg);
            }

            await fetchListings();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to delete listing');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout primaryColor={primaryColor} secondaryColor={secondaryColor} mode={mode}>
            <Box sx={{ p: 2, width: '100%', boxSizing: 'border-box' }}>
                <Typography variant="h5" mb={2}>
                    Listings Table
                </Typography>

                {userRole === 'admin' && (
                    <Button
                        variant="contained"
                        onClick={openAddModal}
                        sx={{
                            mb: 2,
                            backgroundColor: primaryColor,
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: primaryDark,
                            },
                        }}
                    >
                        Add Listing
                    </Button>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 200,
                            width: '100%',
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {!loading && !error && (
                    <TableContainer
                        component={Paper}
                        sx={{
                            width: '100%',
                            overflowX: 'auto',
                        }}
                    >
                        <Table
                            sx={{
                                width: '100%',
                                tableLayout: 'fixed',
                            }}
                            aria-label="listings table"
                            size={isSmallScreen ? 'small' : 'medium'}
                        >
                            <TableHead>
                                <TableRow sx={{ backgroundColor: primaryColor }}>
                                    <TableCell sx={{ color: '#fff' }}>ID</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Title</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Address</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Price</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Property Type</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                                    {userRole === 'admin' && (
                                        <TableCell sx={{ color: '#fff' }} align="center">
                                            Actions
                                        </TableCell>
                                    )}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {Array.isArray(listings) && listings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={userRole === 'admin' ? 7 : 6} align="center">
                                            No listings found.
                                        </TableCell>
                                    </TableRow>
                                )}

                                {Array.isArray(listings) &&
                                    listings.map((listing) => (
                                        <TableRow key={listing.id} hover>
                                            <TableCell>{listing.id}</TableCell>
                                            <TableCell>{listing.title}</TableCell>
                                            <TableCell>{listing.location_address}</TableCell>
                                            <TableCell>{listing.price.toLocaleString()}</TableCell>
                                            <TableCell>{listing.property_type}</TableCell>
                                            <TableCell>{listing.status}</TableCell>
                                            {userRole === 'admin' && (
                                                <TableCell align="center">
                                                    <Button
                                                        size="small"
                                                        onClick={() => openEditModal(listing)}
                                                        sx={{
                                                            backgroundColor: primaryColor,
                                                            color: '#fff',
                                                            '&:hover': {
                                                                backgroundColor: primaryDark,
                                                            },
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(listing.id!)}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            <Modal open={modalOpen} onClose={handleModalClose} disableEscapeKeyDown={saving}>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={styleModal}
                    noValidate
                    autoComplete="off"
                >
                    <Box
                        sx={{
                            p: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h6" component="h2">
                            {editMode ? 'Edit Listing' : 'Add Listing'}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            p: 2,
                            flexGrow: 1,
                            overflowY: 'auto',
                            minHeight: 0,
                        }}
                    >
                        <TextField
                            label="Title"
                            fullWidth
                            required
                            value={currentListing.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            minRows={2}
                            value={currentListing.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="Address"
                            fullWidth
                            required
                            value={currentListing.location_address}
                            onChange={(e) => handleChange('location_address', e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="Price"
                            fullWidth
                            required
                            type="number"
                            inputProps={{ min: 0 }}
                            value={currentListing.price}
                            onChange={(e) => handleChange('price', Number(e.target.value))}
                            sx={{ mb: 2 }}
                        />

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="property-type-label">Property Type</InputLabel>
                            <Select
                                labelId="property-type-label"
                                label="Property Type"
                                value={currentListing.property_type}
                                onChange={(e) =>
                                    handleChange('property_type', e.target.value as ListingInterface['property_type'])
                                }
                            >
                                <MenuItem value="Apartment">Apartment</MenuItem>
                                <MenuItem value="House">House</MenuItem>
                                <MenuItem value="Commercial">Commercial</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select
                                labelId="status-label"
                                label="Status"
                                value={currentListing.status}
                                onChange={(e) => handleChange('status', e.target.value as ListingInterface['status'])}
                            >
                                <MenuItem value="For Sale">For Sale</MenuItem>
                                <MenuItem value="For Rent">For Rent</MenuItem>
                            </Select>
                        </FormControl>

                        {/* *** IMAGE UPLOAD / CHANGE SECTION *** */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" mb={1}>
                                {selectedImageFile
                                    ? `New selected file: ${selectedImageFile.name}`
                                    : imagesArray.length > 0
                                        ? 'Current Image:'
                                        : 'No image uploaded'}
                            </Typography>

                            {previewUrl ? (
                                <Box
                                    component="img"
                                    src={previewUrl}
                                    alt="Selected"
                                    sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1 }}
                                />
                            ) : imagesArray.length > 0 ? (
                                <Box
                                    component="img"
                                    src={imagesArray[0]}
                                    alt="Current"
                                    sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1 }}
                                />
                            ) : null}
                        </Box>

                        <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                            {selectedImageFile ? 'Change Image' : 'Upload Image'}
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setSelectedImageFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </Button>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>

                    <Box
                        sx={{
                            p: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                        }}
                    >
                        <Button onClick={handleModalClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            sx={{
                                backgroundColor: primaryColor,
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: primaryDark,
                                },
                            }}
                        >
                            {saving ? 'Saving...' : editMode ? 'Update' : 'Add'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </AppLayout>
    );
};

export default Index;
