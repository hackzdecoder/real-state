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
    Stack,
    TablePagination,
} from '@mui/material';
import { darken } from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

import useEndpoint from '../../api';
import type { EndpointResponse } from '../../api';


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
    display: 'flex',
    flexDirection: 'column',
};

const Index = ({
    primaryColor = '#09d646',
    secondaryColor = '#ff5722',
    mode = 'light',
}: IndexProps) => {
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
    const [userRole, setUserRole] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // --- Filters ---
    const [filterMinPrice, setFilterMinPrice] = useState<number | ''>('');
    const [filterMaxPrice, setFilterMaxPrice] = useState<number | ''>('');
    const [filterPropertyType, setFilterPropertyType] = useState<ListingInterface['property_type'] | ''>('');
    const [filterStatus, setFilterStatus] = useState<ListingInterface['status'] | ''>('');

    // --- View-only modal ---
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewListing, setViewListing] = useState<ListingInterface | null>(null);

    const isSmallScreen = useMediaQuery(`(max-width:600px)`);
    const primaryDark = useMemo(() => darken(primaryColor, 0.2), [primaryColor]);

    // --- Initialize user role ---
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

    // --- Image preview for add/edit ---
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

    // --- Hook for listings ---
    const {
        data: listingsData,
        error: listingsError,
        isLoading: listingsLoading,
        execute: fetchListings,
    }: EndpointResponse<{ listings: ListingInterface[] }> = useEndpoint({
        url: '/api/listings',
        method: 'GET',
    });

    const saveListingEndpoint = useEndpoint<ListingInterface, FormData>({
        url: '/api/listings/create',
        method: 'POST',
    });

    const deleteListingEndpoint = useEndpoint<{ message: string }, unknown>({
        url: '/api/listings',
        method: 'DELETE',
    });

    useEffect(() => {
        const fetchData = async () => {
            await fetchListings();
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        setCurrentListing({ ...listing, images: parsedImages });
        setSelectedImageFile(null);
        setModalOpen(true);
    };

    const handleModalClose = () => setModalOpen(false);

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

    const filteredListings = useMemo(() => {
        if (!listingsData?.listings) return [];

        return listingsData.listings.filter((listing) => {
            // Text search
            const matchesSearch =
                listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.location_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.property_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.price.toString().includes(searchQuery);

            // Price filter
            const matchesMinPrice = filterMinPrice === '' || listing.price >= filterMinPrice;
            const matchesMaxPrice = filterMaxPrice === '' || listing.price <= filterMaxPrice;

            // Property type filter
            const matchesPropertyType = filterPropertyType === '' || listing.property_type === filterPropertyType;

            // Status filter
            const matchesStatus = filterStatus === '' || listing.status === filterStatus;

            return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesPropertyType && matchesStatus;
        });
    }, [listingsData, searchQuery, filterMinPrice, filterMaxPrice, filterPropertyType, filterStatus]);

    const paginatedListings = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredListings.slice(start, start + rowsPerPage);
    }, [filteredListings, page, rowsPerPage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentListing.title.trim() || !currentListing.location_address.trim() || currentListing.price < 0) {
            alert('Please fill all required fields correctly.');
            return;
        }

        const formData = new FormData();
        formData.append('title', currentListing.title);
        formData.append('description', currentListing.description || '');
        formData.append('location_address', currentListing.location_address);
        formData.append('price', currentListing.price.toString());
        formData.append('property_type', currentListing.property_type);
        formData.append('status', currentListing.status);

        if (selectedImageFile) formData.append('images', selectedImageFile);

        try {
            const url = editMode ? `/api/listings/${currentListing.id}` : '/api/listings/create';
            const method = editMode ? 'PUT' : 'POST';
            await saveListingEndpoint.execute(url, formData, method);
            fetchListings();
            setModalOpen(false);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save listing');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        try {
            await deleteListingEndpoint.execute(`/api/listings/${id}`, undefined, 'DELETE');
            fetchListings();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete listing');
        }
    };

    // --- View modal functions ---
    const openViewModal = (listing: ListingInterface) => {
        setViewListing(listing);
        setViewModalOpen(true);
    };
    const handleViewModalClose = () => setViewModalOpen(false);

    const viewImages = useMemo(() => {
        if (!viewListing?.images) return [];
        if (Array.isArray(viewListing.images)) return viewListing.images;
        if (typeof viewListing.images === 'string') {
            try {
                const parsed = JSON.parse(viewListing.images);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    }, [viewListing]);

    return (
        <AppLayout primaryColor={primaryColor} secondaryColor={secondaryColor} mode={mode}>
            <Box sx={{ p: 2, width: '100%' }}>
                <Typography variant="h5" mb={2}>Listings Table</Typography>

                {userRole === 'admin' && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openAddModal}
                        sx={{ mb: 2, backgroundColor: primaryColor, color: '#fff', '&:hover': { backgroundColor: primaryDark } }}
                    >
                        Add Listing
                    </Button>
                )}

                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        label="Search Listings"
                        variant="outlined"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(0);
                        }}
                    />
                </Box>

                {/* --- Filters --- */}
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                        label="Min Price"
                        type="number"
                        value={filterMinPrice}
                        onChange={(e) => setFilterMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{ minWidth: 120 }}
                    />
                    <TextField
                        label="Max Price"
                        type="number"
                        value={filterMaxPrice}
                        onChange={(e) => setFilterMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{ minWidth: 120 }}
                    />
                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Property Type</InputLabel>
                        <Select
                            value={filterPropertyType}
                            onChange={(e) => setFilterPropertyType(e.target.value as ListingInterface['property_type'] | '')}
                        >
                            <MenuItem value="">All</MenuItem>  {/* <-- default displayed as All */}
                            <MenuItem value="Apartment">Apartment</MenuItem>
                            <MenuItem value="House">House</MenuItem>
                            <MenuItem value="Commercial">Commercial</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as ListingInterface['status'] | '')}
                        >
                            <MenuItem value="">All</MenuItem>  {/* <-- default displayed as All */}
                            <MenuItem value="For Sale">For Sale</MenuItem>
                            <MenuItem value="For Rent">For Rent</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {(listingsError || saveListingEndpoint.error || deleteListingEndpoint.error) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {listingsError || saveListingEndpoint.error || deleteListingEndpoint.error}
                    </Alert>
                )}

                {(listingsLoading || saveListingEndpoint.isLoading || deleteListingEndpoint.isLoading) && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                        <CircularProgress />
                    </Box>
                )}

                {listingsData && (
                    <>
                        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                            <Table sx={{ width: '100%', tableLayout: 'fixed' }} size={isSmallScreen ? 'small' : 'medium'}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: primaryColor }}>
                                        <TableCell sx={{ color: '#fff' }}>ID</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Title</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Address</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Price</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Property Type</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                                        <TableCell sx={{ color: '#fff' }} align="center">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedListings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">No listings found.</TableCell>
                                        </TableRow>
                                    )}
                                    {paginatedListings.map((listing) => (
                                        <TableRow key={listing.id} hover onClick={() => userRole !== 'admin' && openViewModal(listing)} sx={{ cursor: userRole !== 'admin' ? 'pointer' : 'default' }}>
                                            <TableCell>{listing.id}</TableCell>
                                            <TableCell>{listing.title}</TableCell>
                                            <TableCell>{listing.location_address}</TableCell>
                                            <TableCell>{listing.price.toLocaleString()}</TableCell>
                                            <TableCell>{listing.property_type}</TableCell>
                                            <TableCell>{listing.status}</TableCell>
                                            <TableCell align="center">
                                                {userRole === 'admin' ? (
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <Button
                                                            size="small"
                                                            startIcon={<EditIcon />}
                                                            onClick={() => openEditModal(listing)}
                                                            sx={{ backgroundColor: primaryColor, color: '#fff', '&:hover': { backgroundColor: primaryDark } }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            startIcon={<DeleteIcon />}
                                                            color="error"
                                                            onClick={() => handleDelete(listing.id!)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </Stack>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => openViewModal(listing)}
                                                    >
                                                        View
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={filteredListings.length}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        />
                    </>
                )}
            </Box>

            {/* --- Admin Add/Edit Modal --- */}
            <Modal open={modalOpen} onClose={handleModalClose}>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        ...styleModal,
                        p: 0,
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    noValidate
                    autoComplete="off"
                >
                    {/* Header */}
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6">{editMode ? 'Edit Listing' : 'Add Listing'}</Typography>
                    </Box>

                    {/* Body */}
                    <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            required
                            value={currentListing.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            minRows={2}
                            value={currentListing.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                        <TextField
                            label="Address"
                            fullWidth
                            required
                            value={currentListing.location_address}
                            onChange={(e) => handleChange('location_address', e.target.value)}
                        />
                        <TextField
                            label="Price"
                            fullWidth
                            required
                            type="number"
                            inputProps={{ min: 0 }}
                            value={currentListing.price}
                            onChange={(e) => handleChange('price', Number(e.target.value))}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Property Type</InputLabel>
                            <Select
                                value={currentListing.property_type}
                                onChange={(e) => handleChange('property_type', e.target.value as ListingInterface['property_type'])}
                            >
                                <MenuItem value="Apartment">Apartment</MenuItem>
                                <MenuItem value="House">House</MenuItem>
                                <MenuItem value="Commercial">Commercial</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={currentListing.status}
                                onChange={(e) => handleChange('status', e.target.value as ListingInterface['status'])}
                            >
                                <MenuItem value="For Sale">For Sale</MenuItem>
                                <MenuItem value="For Rent">For Rent</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Image Upload Section */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2">
                                {selectedImageFile
                                    ? `New selected file: ${selectedImageFile.name}`
                                    : imagesArray.length > 0
                                        ? 'Current Image:'
                                        : 'No image uploaded'}
                            </Typography>

                            {/* Preview Image - full width */}
                            {previewUrl ? (
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{ width: '100%', height: 'auto', borderRadius: 4, marginBottom: 8 }}
                                    />
                                </a>
                            ) : imagesArray.length > 0 ? (
                                <a href={imagesArray[0]} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={imagesArray[0]}
                                        alt="Current"
                                        style={{ width: '100%', height: 'auto', borderRadius: 4, marginBottom: 8 }}
                                    />
                                </a>
                            ) : null}

                            {/* Upload Button */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                                <Button
                                    variant="contained"
                                    component="label"
                                    sx={{ color: '#fff', backgroundColor: primaryColor, '&:hover': { backgroundColor: primaryDark } }}
                                >
                                    Upload Image
                                    <input
                                        type="file"
                                        hidden
                                        onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
                                    />
                                </Button>
                            </Box>
                        </Box>
                    </Box>

                    {/* Footer */}
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
                        <Button
                            type="submit"
                            startIcon={<SaveIcon />}
                            variant="contained"
                            sx={{ backgroundColor: primaryColor, color: '#fff', '&:hover': { backgroundColor: primaryDark } }}
                        >
                            {editMode ? 'Update' : 'Save'}
                        </Button>
                        <Button
                            type="button"
                            startIcon={<CancelIcon />}
                            onClick={handleModalClose}
                            sx={{ color: '#fff', backgroundColor: '#888', '&:hover': { backgroundColor: '#666' } }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* --- View-only Modal --- */}
            <Modal open={viewModalOpen} onClose={handleViewModalClose}>
                <Box sx={styleModal}>
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6">Listing Details</Typography>
                    </Box>
                    <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {viewListing && (
                            <>
                                <Typography variant="subtitle1"><strong>Title:</strong> {viewListing.title}</Typography>
                                <Typography variant="subtitle2"><strong>Description:</strong> {viewListing.description}</Typography>
                                <Typography variant="subtitle2"><strong>Address:</strong> {viewListing.location_address}</Typography>
                                <Typography variant="subtitle2"><strong>Price:</strong> {viewListing.price.toLocaleString()}</Typography>
                                <Typography variant="subtitle2"><strong>Property Type:</strong> {viewListing.property_type}</Typography>
                                <Typography variant="subtitle2"><strong>Status:</strong> {viewListing.status}</Typography>

                                {/* Images */}
                                {viewImages.length > 0 && (
                                    <Box mt={1} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {viewImages.map((img, idx) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={img}
                                                    alt={`Listing ${idx}`}
                                                    style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                                                />
                                            </a>
                                        ))}
                                    </Box>
                                )}
                            </>
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
                        <Button
                            type="button"
                            startIcon={<CancelIcon />}
                            onClick={handleViewModalClose}
                            sx={{ color: '#fff', backgroundColor: '#888', '&:hover': { backgroundColor: '#666' } }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </AppLayout>
    );
};

export default Index;
